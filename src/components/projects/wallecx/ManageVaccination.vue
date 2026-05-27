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

const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const record = defineModel<Vaccinations | null>("record", { default: null });

const emit = defineEmits<{
  created: [record: Vaccinations];
  updated: [record: Vaccinations];
}>();

const isSaving = ref(false);
const pendingFile = ref<File | null>(null);

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

// Seed the date on every dialog open (visible rising edge), not just on record change —
// reopening the same record object would not re-fire a record-only watch, leaving the
// field stale-blank. Reading record here keeps add (null → empty) and edit in sync.
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, rec]) => {
    if (!isVisible) return;
    administeredDate.value = rec ? new Date(rec.date_administered) : null;
    dateAdministeredError.value = "";
  },
  { immediate: true },
);

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
    pendingFile.value = null; // HIGH-02: explicit reset — do not rely solely on @hide timing
    visible.value = false;
  } catch (e: unknown) {
    toast.error("Failed to save. Please try again.");
    console.error("ManageVaccination: save failed", e);
  } finally {
    isSaving.value = false;
  }
}

function onHide(): void {
  pendingFile.value = null;
  dateAdministeredError.value = "";
}
</script>

<template>
  <Dialog
    modal
    v-model:visible="visible"
    :header="dialogHeader"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving"
    @hide="onHide"
  >
    <Form
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
        />
        <Message v-if="$form.vaccine_type?.invalid" severity="error" size="small" variant="simple">
          {{ $form.vaccine_type.error?.message }}
        </Message>
      </div>

      <!-- vaccine_name (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Vaccine Name *</label>
        <InputText name="vaccine_name" fluid :disabled="isSaving" />
        <Message v-if="$form.vaccine_name?.invalid" severity="error" size="small" variant="simple">
          {{ $form.vaccine_name.error?.message }}
        </Message>
      </div>

      <!-- date_administered (required, DatePicker per D-04) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Date Administered *</label>
        <DatePicker v-model="administeredDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
        <Message v-if="dateAdministeredError" severity="error" size="small" variant="simple">
          {{ dateAdministeredError }}
        </Message>
      </div>

      <!-- dose_number (optional, InputNumber per discretion decision in RESEARCH.md) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Dose Number</label>
        <InputNumber name="dose_number" fluid :min="0" :max="20" :show-buttons="false" :disabled="isSaving" />
        <Message v-if="$form.dose_number?.invalid" severity="error" size="small" variant="simple">
          {{ $form.dose_number.error?.message }}
        </Message>
      </div>

      <!-- lot_number (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Lot Number</label>
        <InputText name="lot_number" fluid :disabled="isSaving" />
      </div>

      <!-- manufacturer (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Manufacturer</label>
        <InputText name="manufacturer" fluid :disabled="isSaving" />
      </div>

      <!-- location (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Location</label>
        <InputText name="location" fluid :disabled="isSaving" />
      </div>

      <!-- notes (optional, Textarea 3 rows per D-05) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Notes</label>
        <Textarea name="notes" fluid :rows="3" :auto-resize="false" :disabled="isSaving" />
      </div>

      <!-- card attachment (FileUpload per WRITE-02 — mode="basic" :auto="false" @select ONLY) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card (image or PDF)</label>
        <FileUpload
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

      <!-- Submit button (WRITE-07: disabled + loading spinner while isSaving) -->
      <Button
        type="submit"
        :label="isEditMode ? 'Save Changes' : 'Add Vaccination'"
        :loading="isSaving"
        :disabled="isSaving"
        fluid
      />
    </Form>
  </Dialog>
</template>
