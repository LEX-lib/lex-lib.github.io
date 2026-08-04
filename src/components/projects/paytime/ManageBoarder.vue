<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import {
  mapToCreateBoarder,
  mapToUpdateBoarder,
} from "@/lib/pocketbase/paytimeBoarderMapper";
import { boarderSchema, collectFieldErrors } from "@/lib/paytime/boarderSchema";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

const visible = defineModel<boolean>("visible", { required: true });
/** null opens the dialog in create mode. */
const record = defineModel<PaytimeBoarder | null>("record", { default: null });

const emit = defineEmits<{ saved: [] }>();

const name = ref("");
const isSaving = ref(false);
const fieldErrors = ref<Record<string, string>>({});

const isEditing = computed(() => record.value !== null);

/**
 * Seeds the form whenever the dialog opens, from the record in edit mode or
 * from defaults in create mode. Keyed on `visible` too so reopening the same
 * record re-seeds rather than showing whatever was left behind.
 */
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, current]) => {
    if (!isVisible) {
      return;
    }
    name.value = current?.name ?? "";
    fieldErrors.value = {};
  },
  { immediate: true },
);

/**
 * PocketBase returns per-field validation detail under response.data; the
 * top-level message is only "Failed to create record", which hides which
 * field was rejected.
 */
const describeSaveError = (error: unknown): string => {
  const data = (error as { response?: { data?: Record<string, unknown> } })
    ?.response?.data;
  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .map(([field, detail]) => {
        const message = (detail as { message?: string })?.message;
        return message ? `${field}: ${message}` : null;
      })
      .filter(Boolean);
    if (messages.length) {
      return messages.join("; ");
    }
  }
  return (error as Error)?.message ?? "unknown error";
};

const saveBoarder = async () => {
  const editing = record.value;

  // tags/user/is_active have no UI on this path yet (Plan 02/03) — seed them
  // from the record being edited, or schema defaults on create.
  const parsed = boarderSchema.safeParse({
    name: name.value,
    tags: editing?.tags ?? [],
    user: editing?.user ?? "",
    is_active: editing?.is_active ?? true,
  });

  if (!parsed.success) {
    fieldErrors.value = collectFieldErrors(parsed.error);
    toast.error("Please fix the highlighted fields.");
    return;
  }
  fieldErrors.value = {};

  isSaving.value = true;
  try {
    if (editing) {
      await pb
        .collection("paytime_boarders")
        .update(editing.id, mapToUpdateBoarder(parsed.data));
      toast.success("Boarder updated");
    } else {
      await pb
        .collection("paytime_boarders")
        .create(mapToCreateBoarder(parsed.data));
      toast.success("Boarder added");
    }
    emit("saved");
    visible.value = false;
  } catch (error) {
    toast.error(
      `Failed to ${editing ? "update" : "save"} boarder: ${describeSaveError(error)}`,
    );
    console.error("ManageBoarder: save failed", error);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Edit Boarder' : 'Add Boarder'"
    modal
    :draggable="false"
    :style="{ width: '34rem' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for="pt-boarder-name"
        >Display name</label
      >
      <InputText
        id="pt-boarder-name"
        v-model="name"
        :invalid="!!fieldErrors.name"
        fluid
      />
      <Message
        v-if="fieldErrors.name"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ fieldErrors.name }}
      </Message>
    </div>

    <template #footer>
      <div class="flex w-full gap-2 sm:w-auto sm:justify-end">
        <Button
          label="Cancel"
          icon="pi pi-times"
          severity="secondary"
          outlined
          :disabled="isSaving"
          class="flex-1 sm:flex-none"
          @click="visible = false"
        />
        <Button
          :label="isEditing ? 'Update Boarder' : 'Save Boarder'"
          icon="pi pi-check"
          :loading="isSaving"
          class="flex-1 sm:flex-none"
          @click="saveBoarder"
        />
      </div>
    </template>
  </Dialog>
</template>
