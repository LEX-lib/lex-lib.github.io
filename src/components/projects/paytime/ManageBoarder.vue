<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import {
  mapToCreateBoarder,
  mapToUpdateBoarder,
} from "@/lib/pocketbase/paytimeBoarderMapper";
import {
  boarderSchema,
  collectFieldErrors,
  normalizeTag,
  titleCaseTag,
} from "@/lib/paytime/boarderSchema";
import { useBoarderRoster } from "@/composables/useBoarderRoster";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

interface TagSuggestion {
  label: string;
  value: string;
  isCreate: boolean;
}

interface AccountOption {
  id: string;
  label: string;
}

/** Past this many characters, the create-entry label truncates the typed value. */
const MaxCreateLabelChars = 30;

const visible = defineModel<boolean>("visible", { required: true });
/** null opens the dialog in create mode. */
const record = defineModel<PaytimeBoarder | null>("record", { default: null });

const emit = defineEmits<{ saved: [] }>();

const { boarders } = useBoarderRoster();

const name = ref("");
const tags = ref<string[]>([]);
const tagQuery = ref("");
const tagSuggestions = ref<TagSuggestion[]>([]);
/** Empty string is the "No account" value — matches PocketBase's representation of an unset single relation. */
const linkedUser = ref("");
const accounts = ref<AccountOption[]>([]);
const isLoadingAccounts = ref(false);
const isSaving = ref(false);
const fieldErrors = ref<Record<string, string>>({});

const isEditing = computed(() => record.value !== null);

/**
 * The whole tag vocabulary mechanism (D-38-01/D-38-02): the de-duplicated,
 * sorted union of tags already assigned across the roster. No seeded list —
 * a seeded list would reintroduce the code-change-to-add-a-tag problem this
 * decision exists to avoid. Starts empty and grows only from admin usage.
 */
const tagVocabulary = computed(() => {
  const set = new Set<string>();
  for (const boarder of boarders.value) {
    for (const tag of boarder.tags) {
      set.add(tag);
    }
  }
  return [...set].sort();
});

/**
 * "No account" first and always present, then one option per fetched user
 * whose account isn't already held by another boarder — the record under
 * edit is excluded from that check so re-opening a linked boarder still
 * shows its own account (D-38-12). The unique index on
 * `paytime_boarders.user` remains the real guard; this only stops the admin
 * tripping it by accident.
 */
const accountOptions = computed<AccountOption[]>(() => {
  const editingId = record.value?.id;
  const heldByOther = new Set(
    boarders.value
      .filter((boarder) => boarder.user !== "" && boarder.id !== editingId)
      .map((boarder) => boarder.user),
  );
  const available = accounts.value.filter(
    (account) => !heldByOther.has(account.id),
  );
  return [{ id: "", label: "No account" }, ...available];
});

/**
 * Lazy, on the dialog-open rising edge — not on component mount, since the
 * dialog mounts alongside the roster view and a mount-time fetch would pull
 * the whole `users` list for an admin who never opens it. Degrades to
 * "No account" only on failure; the boarder still saves unlinked.
 */
const loadAccounts = async () => {
  isLoadingAccounts.value = true;
  try {
    const users = await pb
      .collection("users")
      .getFullList<{ id: string; name?: string; email: string }>({
        sort: "name",
        requestKey: "paytime-users-list",
      });
    accounts.value = users.map((user) => ({
      id: user.id,
      label: user.name || user.email,
    }));
  } catch (error) {
    toast.error("Failed to load accounts.");
    console.warn("ManageBoarder: users getFullList failed", error);
    accounts.value = [];
  } finally {
    isLoadingAccounts.value = false;
  }
};

/**
 * Seeds the form whenever the dialog opens, from the record in edit mode or
 * from defaults in create mode. Keyed on `visible` too so reopening the same
 * record re-seeds rather than showing whatever was left behind.
 */
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, current], previous) => {
    if (!isVisible) {
      return;
    }
    name.value = current?.name ?? "";
    // Spread — never bind the cached roster row's own array by reference, or
    // editing then cancelling would mutate it.
    tags.value = [...(current?.tags ?? [])];
    tagQuery.value = "";
    tagSuggestions.value = [];
    linkedUser.value = current?.user ?? "";
    fieldErrors.value = {};

    const wasVisible = previous?.[0] ?? false;
    if (!wasVisible) {
      void loadAccounts();
    }
  },
  { immediate: true },
);

/**
 * Matching vocabulary entries first (in vocabulary order), then — only when
 * the normalized query is non-empty, matches no vocabulary entry exactly,
 * and isn't already assigned — one final "Create tag" sentinel. The
 * sentinel is always last and never merged into a match row (D-38-03).
 */
const onTagComplete = (event: { query: string }) => {
  const normalized = normalizeTag(event.query);
  const suggestions: TagSuggestion[] = tagVocabulary.value
    .filter((tag) => tag.includes(normalized) && !tags.value.includes(tag))
    .map((tag) => ({ label: titleCaseTag(tag), value: tag, isCreate: false }));

  const alreadyExists = tagVocabulary.value.includes(normalized);
  if (normalized && !alreadyExists && !tags.value.includes(normalized)) {
    const typedDisplay =
      event.query.length > MaxCreateLabelChars
        ? `${event.query.slice(0, MaxCreateLabelChars)}…`
        : event.query;
    suggestions.push({
      label: `Create tag: "${typedDisplay}"`,
      value: normalized,
      isCreate: true,
    });
  }
  tagSuggestions.value = suggestions;
};

/**
 * Inventing a tag is a deliberate click on the create entry only — Enter,
 * blur and comma are never add triggers (D-38-03).
 */
const onTagSelect = (event: { value: TagSuggestion }) => {
  const selected = event.value.value;
  if (!tags.value.includes(selected)) {
    tags.value.push(selected);
  }
  tagQuery.value = "";
  tagSuggestions.value = [];
};

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((existing) => existing !== tag);
};

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

  // Active status is not editable here — its only write path is the row
  // action menu on BoarderRosterView (D-38-18). Omitted entirely; the
  // schema default carries create, and mapToUpdateBoarder excludes it.
  const parsed = boarderSchema.safeParse({
    name: name.value,
    tags: tags.value,
    user: linkedUser.value,
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

    <div class="flex flex-col gap-1 mt-4">
      <div v-if="tags.length" class="flex flex-wrap gap-2">
        <div
          v-for="tag in tags"
          :key="tag"
          class="inline-flex items-center gap-1"
        >
          <Tag
            severity="info"
            :value="titleCaseTag(tag)"
            :pt="{ label: { class: 'max-w-40 truncate' } }"
          />
          <Button
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            :aria-label="`Remove tag ${titleCaseTag(tag)}`"
            class="!h-6 !w-6"
            @click="removeTag(tag)"
          />
        </div>
      </div>
      <label class="text-sm font-medium" for="pt-boarder-tags">Tags</label>
      <AutoComplete
        v-model="tagQuery"
        inputId="pt-boarder-tags"
        :suggestions="tagSuggestions"
        optionLabel="label"
        placeholder="e.g. second floor"
        emptySearchMessage="No tags yet — type to create one."
        fluid
        @complete="onTagComplete"
        @option-select="onTagSelect"
      />
      <Message
        v-if="fieldErrors.tags"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ fieldErrors.tags }}
      </Message>
    </div>

    <div class="flex flex-col gap-1 mt-4">
      <label class="text-sm font-medium" for="pt-boarder-account"
        >Linked account</label
      >
      <Select
        v-model="linkedUser"
        inputId="pt-boarder-account"
        :options="accountOptions"
        optionLabel="label"
        optionValue="id"
        filter
        filterPlaceholder="Search by name or email"
        :loading="isLoadingAccounts"
        :invalid="!!fieldErrors.user"
        fluid
      />
      <Message
        v-if="fieldErrors.user"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ fieldErrors.user }}
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
