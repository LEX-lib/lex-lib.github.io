<script setup lang="ts">
import { ref, computed } from "vue";
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

const isEditMode = computed(() => record.value !== null);
const dialogHeader = computed(() => isEditMode.value ? "Edit Vaccination" : "Add Vaccination");

const initialValues = computed(() => {
  if (!record.value) return {};
  return {
    vaccine_name: record.value.vaccine_name,
    date_administered: new Date(record.value.date_administered),
    dose_number: record.value.dose_number ?? null,
    lot_number: record.value.lot_number ?? "",
    manufacturer: record.value.manufacturer ?? "",
    location: record.value.location ?? "",
    notes: record.value.notes ?? "",
  };
});

const schema = z.object({
  vaccine_name: z.string().min(1, { message: "Vaccine name is required." }),
  date_administered: z.union([
    z.date(),
    z.string().min(1, { message: "Date administered is required." }),
  ]).refine((v) => v !== null && v !== undefined && v !== "", {
    message: "Date administered is required.",
  }),
  dose_number: z.number().int().min(1, { message: "Dose number must be between 1 and 20." }).max(20, { message: "Dose number must be between 1 and 20." }).optional().nullable(),
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

  // Image EXIF strip + compression — implemented in Plan 03
  // Placeholder: store raw file for now (Plan 03 replaces this with the canvas pipeline)
  pendingFile.value = file;
}

async function onSubmit({ valid }: FormSubmitEvent): Promise<void> {
  if (!valid) return;
  // Full create/update implementation added in Plan 03
}

function onHide(): void {
  pendingFile.value = null;
}

// Suppress unused import warnings — used in Plan 03 submit handler
void imageCompression;
void dayjs;
void pb;
void mapToUpdateVaccination;
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
        <DatePicker name="date_administered" fluid dateFormat="dd M yy" :disabled="isSaving" />
        <Message v-if="$form.date_administered?.invalid" severity="error" size="small" variant="simple">
          {{ $form.date_administered.error?.message }}
        </Message>
      </div>

      <!-- dose_number (optional, InputNumber per discretion decision in RESEARCH.md) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Dose Number</label>
        <InputNumber name="dose_number" fluid :min="1" :max="20" :show-buttons="false" :disabled="isSaving" />
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
