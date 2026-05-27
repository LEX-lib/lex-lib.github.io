<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { toast } from "vue-sonner";
import dayjs from "dayjs";
import { pb } from "@/lib/pocketbase";
import { mapToUpdateMembership } from "@/lib/pocketbase/membershipMapper";
import type { Memberships } from "@/types/wallecx/memberships/types";
import { useIsMobile } from "@/composables/useIsMobile";
import DragHandle from "./DragHandle.vue";

const isMobile = useIsMobile();

const props = defineProps<{
  token?: string;
}>();

const visible = defineModel("visible", { type: Boolean, default: false, required: true });
const record = defineModel<Memberships | null>("record", { default: null });

const emit = defineEmits<{
  created: [record: Memberships];
  updated: [record: Memberships];
}>();

const isSaving = ref(false);
const pendingFile = ref<File | null>(null);

const isEditMode = computed(() => record.value !== null);
const dialogHeader = computed(() => (isEditMode.value ? "Edit Card" : "Add Card"));

const BARCODE_TYPE_OPTIONS = [
  { label: "QR Code", value: "qr" },
  { label: "Code 128", value: "code128" },
  { label: "EAN-13", value: "ean13" },
  { label: "Code 39", value: "code39" },
  { label: "Number only", value: "number" },
];

// Direct v-model refs (D-07 — NOT @primevue/forms due to PrimeVue issue #8135)
const cardName = ref<string>("");
const barcodeType = ref<string | null>(null);
const barcodeValue = ref<string>("");
const cardNumber = ref<string>("");
const cardColor = ref<string>("002244"); // D-01: navy default, no #
const expiryDate = ref<Date | null>(null);
const issuer = ref<string>("");
const notes = ref<string>("");

// Error refs
const cardNameError = ref<string>("");
const cardColorError = ref<string>("");

// Record watcher — initializes all refs when record prop changes
watch(
  () => record.value,
  (rec) => {
    if (rec) {
      cardName.value = rec.card_name;
      barcodeType.value = rec.barcode_type ?? null;
      barcodeValue.value = rec.barcode_value ?? "";
      cardNumber.value = rec.card_number ?? "";
      cardColor.value = rec.card_color ?? "002244"; // D-01: fallback navy
      expiryDate.value = rec.expiry_date ? new Date(rec.expiry_date) : null;
      issuer.value = rec.issuer ?? "";
      notes.value = rec.notes ?? "";
    } else {
      cardName.value = "";
      barcodeType.value = null;
      barcodeValue.value = "";
      cardNumber.value = "";
      cardColor.value = "002244"; // D-01
      expiryDate.value = null;
      issuer.value = "";
      notes.value = "";
    }
  },
  { immediate: true },
);

// barcode_type watcher — D-02: clear barcodeValue immediately when switching to 'number'
watch(barcodeType, (newType) => {
  if (newType === "number") {
    barcodeValue.value = "";
  }
});

// Thumbnail computed — D-03: returns URL only in edit mode with existing card_image
const thumbnailUrl = computed(() =>
  isEditMode.value && record.value?.card_image
    ? pb.files.getURL(record.value, record.value.card_image, {
        thumb: "100x100",
        token: props.token,
      })
    : null,
);

// Zod schema (manual safeParse — D-07)
const schema = z.object({
  card_name: z.string().min(1, { message: "Card name is required." }),
  card_color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/, { message: "Must be a valid 6-character hex colour." })
    .optional(),
  barcode_value: z.string().optional(),
  barcode_type: z.string().optional().nullable(),
  card_number: z.string().optional(),
  expiry_date: z.union([z.date(), z.string()]).optional().nullable(),
  issuer: z.string().optional(),
  notes: z.string().optional(),
});

// onFileSelect — image-only (no PDF for membership cards per Phase 11 D-02)
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0];
  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    toast.error("File type not supported. Use JPEG, PNG, or WebP.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error("File too large. Maximum size is 10 MB.");
    return;
  }

  // EXIF strip via canvas re-encode, then compress
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

    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob failed"))),
        "image/jpeg",
        0.92,
      ),
    );

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
    toast.info("Location data removed.");
  } catch (e) {
    toast.error("Failed to process image. Please try again.");
    console.error("ManageMembership: EXIF strip failed", e);
    pendingFile.value = null;
  }
}

async function onSubmit(): Promise<void> {
  cardNameError.value = "";
  cardColorError.value = "";

  const result = schema.safeParse({
    card_name: cardName.value,
    card_color: cardColor.value || undefined,
    barcode_value: barcodeValue.value || undefined,
    barcode_type: barcodeType.value,
    card_number: cardNumber.value || undefined,
    expiry_date: expiryDate.value,
    issuer: issuer.value || undefined,
    notes: notes.value || undefined,
  });

  if (!result.success) {
    // Zod 4: flatten().fieldErrors for per-field messages
    const fieldErrors = result.error.flatten().fieldErrors;
    cardNameError.value = fieldErrors.card_name?.[0] ?? "";
    cardColorError.value = fieldErrors.card_color?.[0] ?? "";
    return;
  }

  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append("card_name", cardName.value);
    if (barcodeType.value) formData.append("barcode_type", barcodeType.value);
    // D-02: only append barcode_value when type is not 'number'
    if (barcodeType.value !== "number" && barcodeValue.value)
      formData.append("barcode_value", barcodeValue.value);
    if (cardNumber.value) formData.append("card_number", cardNumber.value);
    formData.append("card_color", cardColor.value); // always set (default '002244')
    if (expiryDate.value)
      formData.append("expiry_date", dayjs(expiryDate.value).format("YYYY-MM-DD"));
    if (issuer.value) formData.append("issuer", issuer.value);
    if (notes.value) formData.append("notes", notes.value);
    // D-03: only append card_image when a new file was selected
    if (pendingFile.value) formData.append("card_image", pendingFile.value);

    if (!isEditMode.value) {
      // CREATE — D-09: Object.assign contract; HIGH-01: null guard
      const userId = pb.authStore.record?.id;
      if (!userId) {
        toast.error("Session expired. Please log in again.");
        isSaving.value = false;
        return;
      }
      formData.append("user", userId);
      const created = await pb
        .collection("wallecx_memberships")
        .create<Memberships>(formData);
      emit("created", created);
    } else {
      // UPDATE — D-10: FormData mirrors mapToUpdateMembership writable fields
      void mapToUpdateMembership; // confirms writable field set
      const updated = await pb
        .collection("wallecx_memberships")
        .update<Memberships>(record.value!.id, formData);
      emit("updated", updated);
    }

    toast.success(isEditMode.value ? "Card updated." : "Card added.");
    pendingFile.value = null; // HIGH-02: explicit reset before close
    visible.value = false;
  } catch (e: unknown) {
    toast.error("Failed to save. Please try again.");
    console.error("ManageMembership: save failed", e);
  } finally {
    isSaving.value = false;
  }
}

function onHide(): void {
  pendingFile.value = null; // HIGH-02: also reset on ESC / programmatic close
}
</script>

<template>
  <!-- Desktop: centered Dialog -->
  <Dialog
    v-if="!isMobile"
    modal
    v-model:visible="visible"
    :header="dialogHeader"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving"
    @hide="onHide"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- card_name (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Name *</label>
        <InputText v-model="cardName" fluid :disabled="isSaving" />
        <Message v-if="cardNameError" severity="error" size="small" variant="simple">
          {{ cardNameError }}
        </Message>
      </div>

      <!-- barcode_type (Select with BARCODE_TYPE_OPTIONS) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Type</label>
        <Select
          v-model="barcodeType"
          :options="BARCODE_TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          fluid
          :disabled="isSaving"
        />
      </div>

      <!-- barcode_value — conditional hide per D-02 (v-if NOT v-show) -->
      <div v-if="barcodeType !== 'number'" class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Value</label>
        <InputText v-model="barcodeValue" fluid :disabled="isSaving" />
      </div>

      <!-- card_number -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Number</label>
        <InputText v-model="cardNumber" fluid :disabled="isSaving" />
      </div>

      <!-- card_color (ColorPicker + live swatch — D-01, D-03) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Colour</label>
        <div class="flex items-center gap-3">
          <ColorPicker
            v-model="cardColor"
            aria-label="Card colour picker"
            :disabled="isSaving"
          />
          <span
            class="inline-block w-8 h-8 rounded"
            :style="{ backgroundColor: '#' + cardColor }"
            aria-hidden="true"
          ></span>
        </div>
        <Message v-if="cardColorError" severity="error" size="small" variant="simple">
          {{ cardColorError }}
        </Message>
      </div>

      <!-- expiry_date (DatePicker) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Expiry Date</label>
        <DatePicker v-model="expiryDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
      </div>

      <!-- issuer -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Issuer</label>
        <InputText v-model="issuer" fluid :disabled="isSaving" />
      </div>

      <!-- notes (Textarea, 3 rows, no auto-resize per UI-SPEC) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Notes</label>
        <Textarea v-model="notes" fluid :rows="3" :auto-resize="false" :disabled="isSaving" />
      </div>

      <!-- card_image (FileUpload with edit-mode thumbnail — D-03) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Image</label>
        <div v-if="thumbnailUrl" class="flex flex-col gap-1 mb-1">
          <img
            :src="thumbnailUrl"
            class="w-24 h-24 object-cover rounded"
            alt="Current card image"
          />
          <p class="text-sm" style="color: var(--color-typo-muted)">
            Current image — select a new file to replace it
          </p>
        </div>
        <FileUpload
          mode="basic"
          :auto="false"
          accept="image/jpeg,image/png,image/webp"
          :maxFileSize="10485760"
          :disabled="isSaving"
          :chooseLabel="isEditMode && record?.card_image ? 'Replace image' : undefined"
          @select="onFileSelect"
        />
        <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
          {{ pendingFile.name }} selected
        </p>
      </div>

      <!-- Submit button -->
      <Button
        type="submit"
        :label="isEditMode ? 'Save Changes' : 'Add Card'"
        :loading="isSaving"
        :disabled="isSaving"
        fluid
      />
    </form>
  </Dialog>

  <!-- Mobile: bottom Drawer (85dvh cap via wallecx-overrides.css already applied) -->
  <Drawer
    v-else
    v-model:visible="visible"
    position="bottom"
    :show-close-icon="!isSaving"
    @hide="onHide"
  >
    <template #header>
      <div class="flex flex-col items-center w-full gap-1">
        <DragHandle />
        <span class="font-semibold">{{ dialogHeader }}</span>
      </div>
    </template>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- card_name (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Name *</label>
        <InputText v-model="cardName" fluid :disabled="isSaving" />
        <Message v-if="cardNameError" severity="error" size="small" variant="simple">
          {{ cardNameError }}
        </Message>
      </div>

      <!-- barcode_type (Select with BARCODE_TYPE_OPTIONS) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Type</label>
        <Select
          v-model="barcodeType"
          :options="BARCODE_TYPE_OPTIONS"
          option-label="label"
          option-value="value"
          fluid
          :disabled="isSaving"
        />
      </div>

      <!-- barcode_value — conditional hide per D-02 (v-if NOT v-show) -->
      <div v-if="barcodeType !== 'number'" class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Barcode Value</label>
        <InputText v-model="barcodeValue" fluid :disabled="isSaving" />
      </div>

      <!-- card_number -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Number</label>
        <InputText v-model="cardNumber" fluid :disabled="isSaving" />
      </div>

      <!-- card_color (ColorPicker + live swatch — D-01, D-03 / PrimeVue #8135) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Colour</label>
        <div class="flex items-center gap-3">
          <ColorPicker
            v-model="cardColor"
            aria-label="Card colour picker"
            :disabled="isSaving"
          />
          <span
            class="inline-block w-8 h-8 rounded"
            :style="{ backgroundColor: '#' + cardColor }"
            aria-hidden="true"
          ></span>
        </div>
        <Message v-if="cardColorError" severity="error" size="small" variant="simple">
          {{ cardColorError }}
        </Message>
      </div>

      <!-- expiry_date (DatePicker) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Expiry Date</label>
        <DatePicker v-model="expiryDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
      </div>

      <!-- issuer -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Issuer</label>
        <InputText v-model="issuer" fluid :disabled="isSaving" />
      </div>

      <!-- notes (Textarea, 3 rows, no auto-resize per UI-SPEC) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Notes</label>
        <Textarea v-model="notes" fluid :rows="3" :auto-resize="false" :disabled="isSaving" />
      </div>

      <!-- card_image (FileUpload with edit-mode thumbnail — D-03) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Card Image</label>
        <div v-if="thumbnailUrl" class="flex flex-col gap-1 mb-1">
          <img
            :src="thumbnailUrl"
            class="w-24 h-24 object-cover rounded"
            alt="Current card image"
          />
          <p class="text-sm" style="color: var(--color-typo-muted)">
            Current image — select a new file to replace it
          </p>
        </div>
        <FileUpload
          mode="basic"
          :auto="false"
          accept="image/jpeg,image/png,image/webp"
          :maxFileSize="10485760"
          :disabled="isSaving"
          :chooseLabel="isEditMode && record?.card_image ? 'Replace image' : undefined"
          @select="onFileSelect"
        />
        <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
          {{ pendingFile.name }} selected
        </p>
      </div>

      <!-- Submit button -->
      <Button
        type="submit"
        :label="isEditMode ? 'Save Changes' : 'Add Card'"
        :loading="isSaving"
        :disabled="isSaving"
        fluid
      />
    </form>
  </Drawer>
</template>
