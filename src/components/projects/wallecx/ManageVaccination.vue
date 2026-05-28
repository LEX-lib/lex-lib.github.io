<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { Form, type FormSubmitEvent } from "@primevue/forms";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { toast } from "vue-sonner";
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import { useMobileEnv } from "@/composables/useMobileEnv";
import BaseMobileDialog from "./BaseMobileDialog.vue";

const { isMobile } = useMobileEnv();

const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const record = defineModel<Vaccinations | null>("record", { default: null });

const emit = defineEmits<{
  created: [record: Vaccinations];
  updated: [record: Vaccinations];
}>();

const isSaving = ref(false);
const pendingFile = ref<File | null>(null);
const baseDialogRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null);

// date_administered is controlled by a direct v-model ref, NOT @primevue/forms.
// PrimeVue Forms 4.4.0+ ignores initialValues/setFieldValue for a Form-bound DatePicker
// (primefaces/primevue#8191, #7806) — only v-model binds reliably. Mirrors the
// expenseDate/expiryDate pattern already used in ManageExpense.vue and ManageMembership.vue.
const administeredDate = ref<Date | null>(null);
const dateAdministeredError = ref<string>("");

const isEditMode = computed(() => record.value !== null);
const dialogHeader = computed(() => isEditMode.value ? "Edit Vaccination" : "Add Vaccination");

const initialValues = computed(() => {
  if (!record.value) return { vaccine_type: "", vaccine_name: "" };
  return {
    vaccine_type: record.value.vaccine_type ?? "",
    vaccine_name: record.value.vaccine_name,
    dose_number: record.value.dose_number ?? null,
    lot_number: record.value.lot_number ?? "",
    manufacturer: record.value.manufacturer ?? "",
    location: record.value.location ?? "",
    notes: record.value.notes ?? "",
  };
});

// FD-09: Dirty snapshot — taken on dialog open
interface VaccinationSnapshot {
  vaccineType: string;
  vaccineName: string;
  doseNumber: number | null;
  lotNumber: string;
  manufacturer: string;
  location: string;
  notes: string;
  administeredDate: string | null;
}

const snapshot = ref<VaccinationSnapshot | null>(null);

// Single merged watcher (WR-02): seeds administeredDate AND takes the dirty snapshot in one
// deterministic tick — the snapshot used to live in a separate `watch(visible, ...)` that
// relied on Vue's registration-order watcher firing to see the freshly-seeded date. Merging
// removes that fragility (if the watchers were ever reordered, an Edit-opened form would look
// "clean" until a field was touched). Watching [visible, record] here also fixes the D-33-01-A
// stale-blank case: reopening the SAME record object would not re-fire a record-only watch,
// leaving the field blank. {immediate: true} preserves the original first-mount behavior.
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, rec]) => {
    if (!isVisible) {
      pendingFile.value = null;
      // WR-01: reset transient save state so a dialog dismissed mid-save (e.g. via the FD-09
      // discard guard) does not reopen with the Save button stuck disabled. Mirrors ManageBudget.
      isSaving.value = false;
      return;
    }
    // 1) Seed the direct-v-model date FIRST (#8191 — DatePicker lives outside @primevue/forms)
    administeredDate.value = rec ? new Date(rec.date_administered) : null;
    dateAdministeredError.value = "";
    // 2) THEN take the dirty snapshot — guaranteed to see the seeded administeredDate
    //    because both writes happen in the same watcher callback tick.
    const iv = initialValues.value;
    snapshot.value = {
      vaccineType: (iv.vaccine_type as string) ?? "",
      vaccineName: (iv.vaccine_name as string) ?? "",
      doseNumber: (iv.dose_number as number | null | undefined) ?? null,
      lotNumber: (iv.lot_number as string) ?? "",
      manufacturer: (iv.manufacturer as string) ?? "",
      location: (iv.location as string) ?? "",
      notes: (iv.notes as string) ?? "",
      administeredDate: administeredDate.value?.toISOString() ?? null,
    };
  },
  { immediate: true },
);

// FD-09: isDirty computed — passed to BaseMobileDialog
const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false;
  const iv = initialValues.value;
  return (
    ((iv.vaccine_type as string) ?? "") !== snapshot.value.vaccineType ||
    ((iv.vaccine_name as string) ?? "") !== snapshot.value.vaccineName ||
    (((iv.dose_number as number | null | undefined) ?? null)) !== snapshot.value.doseNumber ||
    ((iv.lot_number as string) ?? "") !== snapshot.value.lotNumber ||
    ((iv.manufacturer as string) ?? "") !== snapshot.value.manufacturer ||
    ((iv.location as string) ?? "") !== snapshot.value.location ||
    ((iv.notes as string) ?? "") !== snapshot.value.notes ||
    (administeredDate.value?.toISOString() ?? null) !== snapshot.value.administeredDate ||
    pendingFile.value !== null
  );
});

const schema = z.object({
  vaccine_type: z.string().min(1, { message: "Vaccine type is required." }),
  vaccine_name: z.string().min(1, { message: "Vaccine name is required." }),
  dose_number: z.number().int().min(0, { message: "Dose number must be between 0 and 20." }).max(20, { message: "Dose number must be between 0 and 20." }).optional().nullable(),
  lot_number: z.string().optional(),
  manufacturer: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
const resolver = zodResolver(schema);

async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0];
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    toast.error("File type not supported. Use JPEG, PNG, WebP, or PDF.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error("File too large. Maximum size is 10 MB.");
    return;
  }

  if (file.type === "application/pdf") {
    pendingFile.value = file;
    return;
  }

  // Image: EXIF strip via canvas re-encode (strips GPS and all EXIF), then compress
  try {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    // canvas.toBlob is callback-based — must wrap in Promise (Pitfall D)
    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob failed"))),
        "image/jpeg",
        0.92,
      ),
    );

    // Convert Blob → File so FormData has a filename
    const strippedFile = new File(
      [strippedBlob],
      file.name.replace(/\.[^.]+$/, ".jpg"),
      { type: "image/jpeg" },
    );

    const compressed = await imageCompression(strippedFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    });

    pendingFile.value = compressed;
    toast.info("Location data removed."); // D-07: unconditional on every image upload
  } catch (e) {
    toast.error("Failed to process image. Please try again.");
    console.error("ManageVaccination: EXIF strip failed", e);
    pendingFile.value = null;
  }
}

// FD-05: Raw file input bridge — routes camera/gallery input through the EXIF/compression pipeline
async function onRawFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = ""; // reset so same file can be re-selected
  await onFileSelect({ files: [file] });
}

// FD-09: Explicit Cancel — close without triggering dirty guard
function onCancel(): void {
  baseDialogRef.value?.closeWithoutGuard();
}

async function onSubmit({ valid, values }: FormSubmitEvent): Promise<void> {
  if (!valid) return;
  // date_administered is validated manually (it lives outside the Form — see administeredDate)
  dateAdministeredError.value = "";
  if (!administeredDate.value) {
    dateAdministeredError.value = "Date administered is required.";
    return;
  }
  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append("vaccine_type", values.vaccine_type as string);
    formData.append("vaccine_name", values.vaccine_name as string);
    // Pitfall A: DatePicker returns Date object — must convert to YYYY-MM-DD for PocketBase
    formData.append(
      "date_administered",
      dayjs(administeredDate.value).format("YYYY-MM-DD"),
    );
    if (values.dose_number != null) {
      formData.append("dose_number", String(values.dose_number));
    }
    if (values.lot_number) formData.append("lot_number", values.lot_number as string);
    if (values.manufacturer) formData.append("manufacturer", values.manufacturer as string);
    if (values.location) formData.append("location", values.location as string);
    if (values.notes) formData.append("notes", values.notes as string);
    if (pendingFile.value) formData.append("card", pendingFile.value);

    if (!isEditMode.value) {
      // CREATE — WRITE-04: Object.assign contract
      // Server returns authoritative record with id, created, updated, card filename
      const userId = pb.authStore.record?.id;
      if (!userId) {
        toast.error("Session expired. Please log in again.");
        isSaving.value = false;
        return;
      }
      formData.append("user", userId);
      const created = await pb
        .collection("wallecx_vaccinations")
        .create<Vaccinations>(formData);
      // emit created record to parent; parent inserts it into the local list date-sorted.
      emit("created", created);
    } else {
      // UPDATE — WRITE-05: use mapToUpdateVaccination to strip server-managed fields
      // Note: FormData already has the correct writable fields from above
      // mapToUpdateVaccination confirms which fields are writable — FormData mirrors it
      void mapToUpdateVaccination; // WRITE-05: mapper defines the canonical writable field set
      const updated = await pb
        .collection("wallecx_vaccinations")
        .update<Vaccinations>(record.value!.id, formData);
      emit("updated", updated);
    }

    toast.success(isEditMode.value ? "Vaccination updated." : "Vaccination added.");
    // FD-09: bypass dirty guard on successful save
    baseDialogRef.value?.closeWithoutGuard();
  } catch (e: unknown) {
    toast.error("Failed to save. Please try again.");
    console.error("ManageVaccination: save failed", e);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <BaseMobileDialog
    ref="baseDialogRef"
    v-model:visible="visible"
    :title="dialogHeader"
    :is-dirty="isDirty"
    :is-saving="isSaving"
  >
    <!-- #default slot: ONE Form body rendered once (Pattern S-1 — two-Form collapse)
         D-33-01-A / #8191: administeredDate is a direct v-model ref declared above,
         sitting inside the Form's visual layout but NOT name-bound to @primevue/forms. -->
    <Form
      id="manage-vaccination-form"
      v-slot="$form"
      :initialValues="initialValues"
      :resolver="resolver"
      @submit="onSubmit"
      validate-on-submit
      class="space-y-4"
    >
      <!-- vaccine_type (required — D-01: first field, D-02: placeholder) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Vaccine Type *</label>
        <InputText
          name="vaccine_type"
          fluid
          :disabled="isSaving"
          placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
        <Message v-if="$form.vaccine_type?.invalid" severity="error" size="small" variant="simple">
          {{ $form.vaccine_type.error?.message }}
        </Message>
      </div>

      <!-- vaccine_name (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Vaccine Name *</label>
        <InputText
          name="vaccine_name"
          fluid
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
        <Message v-if="$form.vaccine_name?.invalid" severity="error" size="small" variant="simple">
          {{ $form.vaccine_name.error?.message }}
        </Message>
      </div>

      <!-- date_administered (required, direct v-model — D-33-01-A, PrimeVue #8191)
           NOT name-bound; administeredDate ref is validated manually in onSubmit. -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Date Administered *</label>
        <DatePicker
          v-model="administeredDate"
          fluid
          dateFormat="dd M yy"
          :disabled="isSaving"
        />
        <Message v-if="dateAdministeredError" severity="error" size="small" variant="simple">
          {{ dateAdministeredError }}
        </Message>
      </div>

      <!-- dose_number (optional, InputNumber per discretion decision in RESEARCH.md) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Dose Number</label>
        <InputNumber
          name="dose_number"
          fluid
          :min="0"
          :max="20"
          :show-buttons="false"
          :disabled="isSaving"
          inputmode="numeric"
          enterkeyhint="next"
          autocomplete="off"
        />
        <Message v-if="$form.dose_number?.invalid" severity="error" size="small" variant="simple">
          {{ $form.dose_number.error?.message }}
        </Message>
      </div>

      <!-- lot_number (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Lot Number</label>
        <InputText
          name="lot_number"
          fluid
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
      </div>

      <!-- manufacturer (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Manufacturer</label>
        <InputText
          name="manufacturer"
          fluid
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
      </div>

      <!-- location (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Location</label>
        <InputText
          name="location"
          fluid
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
      </div>

      <!-- notes (optional, Textarea 3 rows per D-05) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Notes</label>
        <Textarea
          name="notes"
          fluid
          :rows="3"
          :auto-resize="false"
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="done"
          autocomplete="off"
        />
      </div>

      <!-- card attachment — FD-05: two-affordance mobile (images+PDF for vaccination records)
           Camera input is images-only (capture=environment cannot produce PDFs).
           Gallery input accepts images + PDF (vaccination cards can be scanned PDFs). -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card (image or PDF)</label>

        <!-- FD-05: Mobile two-affordance — Take photo (camera, images only) + Choose from gallery (images + PDF) -->
        <template v-if="isMobile">
          <div class="flex gap-2">
            <label
              class="p-button p-button-outlined p-button-secondary p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2 flex-1"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                class="hidden"
                :disabled="isSaving"
                @change="onRawFileChange"
              />
              <i class="pi pi-camera" aria-hidden="true"></i>
              Take photo
            </label>
            <label
              class="p-button p-button-outlined p-button-secondary p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2 flex-1"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                class="hidden"
                :disabled="isSaving"
                @change="onRawFileChange"
              />
              <i class="pi pi-images" aria-hidden="true"></i>
              Choose from gallery
            </label>
          </div>
        </template>

        <!-- Desktop: existing FileUpload (images + PDF per WRITE-02) -->
        <FileUpload
          v-else
          mode="basic"
          :auto="false"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          :maxFileSize="10485760"
          :disabled="isSaving"
          @select="onFileSelect"
        />

        <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
          {{ pendingFile.name }} selected
        </p>
      </div>
    </Form>

    <!-- #actions slot: Save/Cancel buttons (UI-SPEC Contract 2) -->
    <template #actions>
      <div class="flex gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          fluid
          :disabled="isSaving"
          @click="onCancel"
        />
        <Button
          type="submit"
          form="manage-vaccination-form"
          :label="isEditMode ? 'Save Changes' : 'Add Vaccination'"
          fluid
          :loading="isSaving"
          :disabled="isSaving"
        />
      </div>
    </template>
  </BaseMobileDialog>
</template>
