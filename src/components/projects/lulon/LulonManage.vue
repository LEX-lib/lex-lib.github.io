<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { useAuthStore } from "@/stores/auth";
import { useIsMobile } from "@/composables/useIsMobile";
import type { Lobby, Participant } from "@/types/lulon/types";

const authStore = useAuthStore();
const confirm = useConfirm();
const isMobile = useIsMobile();

const isAdmin = computed(() => authStore.isAdmin);

const lobbies = ref<Lobby[]>([]);
const participants = ref<Participant[]>([]);
const participantsCount = ref(0);
const selectedLobby = ref<Lobby | null>(null);

const loadingLobbies = ref(false);
const selectingLobby = ref(false);
const shuffling = ref(false);
const creating = ref(false);
const deletingLobbyId = ref<string | null>(null);
const deletingParticipantId = ref<string | null>(null);

const showCreateLobby = ref(false);
const newLobbyName = ref("");
const newLobbyCode = ref("");
const newLobbyDeadline = ref("");

const baseUrl = computed(() => window.location.origin);
const shareLink = computed(() =>
  selectedLobby.value
    ? `${baseUrl.value}/projects/lulon/play?lobby=${selectedLobby.value.lobby_code}`
    : "",
);

const personalLink = (p: Participant) =>
  `${baseUrl.value}/projects/lulon/play?lobby=${selectedLobby.value?.lobby_code}&code=${p.code}`;

const fetchLobbies = async () => {
  if (!isAdmin.value) return;
  loadingLobbies.value = true;
  try {
    lobbies.value = await pb
      .collection("lobbies")
      .getFullList<Lobby>({ sort: "-created" });
  } catch (e) {
    toast.error("Error fetching lobbies: " + (e as Error).message);
  } finally {
    loadingLobbies.value = false;
  }
};

const fetchParticipants = async () => {
  if (!isAdmin.value || !selectedLobby.value) return;
  try {
    // `getFullList` pages through every record, so its length is the count —
    // no separate stats request (which would trip auto-cancellation).
    participants.value = await pb
      .collection("gift_exchange_participants")
      .getFullList<Participant>({
        filter: `lobby="${selectedLobby.value.id}"`,
        sort: "-created",
      });
    participantsCount.value = participants.value.length;
  } catch (e) {
    toast.error("Error fetching participants: " + (e as Error).message);
  }
};

const selectLobby = async (lobby: Lobby) => {
  selectingLobby.value = true;
  selectedLobby.value = lobby;
  try {
    await fetchParticipants();
  } finally {
    selectingLobby.value = false;
  }
};

const generateLobbyCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const length = Math.floor(Math.random() * 5) + 6;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createLobby = async () => {
  if (!newLobbyName.value.trim()) {
    toast.error("Please enter a lobby name");
    return;
  }

  creating.value = true;
  try {
    const lobbyCode = newLobbyCode.value.trim()
      ? newLobbyCode.value.toUpperCase()
      : generateLobbyCode();

    const lobby = await pb.collection("lobbies").create<Lobby>({
      lobby_name: newLobbyName.value.trim(),
      lobby_code: lobbyCode,
      enrollment_deadline: newLobbyDeadline.value || null,
      drawing_started: false,
    });

    toast.success(`Lobby created! Code: ${lobbyCode}`);
    newLobbyName.value = "";
    newLobbyCode.value = "";
    newLobbyDeadline.value = "";
    showCreateLobby.value = false;

    await fetchLobbies();
    await selectLobby(lobby);
  } catch (e) {
    toast.error("Error creating lobby: " + (e as Error).message);
  } finally {
    creating.value = false;
  }
};

const generatePairs = async () => {
  if (!selectedLobby.value) {
    toast.error("Please select a lobby first");
    return;
  }

  shuffling.value = true;
  try {
    const records = await pb
      .collection("gift_exchange_participants")
      .getFullList<Participant>({
        filter: `lobby="${selectedLobby.value.id}"`,
      });

    if (records.length < 2) {
      toast.error("Not enough participants to generate pairs.");
      return;
    }

    const shuffled = [...records];
    let isValid = false;

    // Simple derangement shuffle — nobody may draw themselves.
    for (let i = 0; i < 100; i++) {
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }

      isValid = true;
      for (let j = 0; j < records.length; j++) {
        if (records[j].id === shuffled[j].id) {
          isValid = false;
          break;
        }
      }
      if (isValid) break;
    }

    if (!isValid) {
      toast.error(
        "Failed to generate valid pairs (derangement failed). Try again.",
      );
      return;
    }

    await Promise.all(
      records.map((record, index) =>
        pb.collection("gift_exchange_participants").update(record.id, {
          drawn_name: shuffled[index].name,
        }),
      ),
    );

    await pb
      .collection("lobbies")
      .update(selectedLobby.value.id, { drawing_started: true });
    selectedLobby.value.drawing_started = true;

    // Mirror the flag onto the list tile so it reflects the new state.
    const tile = lobbies.value.find((l) => l.id === selectedLobby.value?.id);
    if (tile) tile.drawing_started = true;

    toast.success("Drawing started! Participants can reveal their partner.");
    await fetchParticipants();
  } catch (e) {
    toast.error("Error generating pairs: " + (e as Error).message);
  } finally {
    shuffling.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  } catch {
    toast.error("Failed to copy link");
  }
};

const deleteLobby = (lobby: Lobby) => {
  confirm.require({
    message: `Delete "${lobby.lobby_name}"? This also removes every participant in it.`,
    header: "Delete lobby",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Keep lobby", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: async () => {
      deletingLobbyId.value = lobby.id;
      try {
        const toDelete = await pb
          .collection("gift_exchange_participants")
          .getFullList<Participant>({ filter: `lobby="${lobby.id}"` });

        await Promise.all(
          toDelete.map((p) =>
            pb.collection("gift_exchange_participants").delete(p.id),
          ),
        );
        await pb.collection("lobbies").delete(lobby.id);

        toast.success(`Lobby "${lobby.lobby_name}" deleted.`);

        if (selectedLobby.value?.id === lobby.id) {
          selectedLobby.value = null;
          participants.value = [];
          participantsCount.value = 0;
        }
        await fetchLobbies();
      } catch (e) {
        toast.error("Error deleting lobby: " + (e as Error).message);
      } finally {
        deletingLobbyId.value = null;
      }
    },
  });
};

const deleteParticipant = (p: Participant) => {
  if (selectedLobby.value?.drawing_started) return;
  confirm.require({
    message: `Remove ${p.name} from this lobby?`,
    header: "Remove participant",
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Keep", severity: "secondary", outlined: true },
    acceptProps: { label: "Remove", severity: "danger" },
    accept: async () => {
      deletingParticipantId.value = p.id;
      try {
        await pb.collection("gift_exchange_participants").delete(p.id);
        toast.success(`${p.name} removed.`);
        await fetchParticipants();
      } catch (e) {
        toast.error("Error removing participant: " + (e as Error).message);
      } finally {
        deletingParticipantId.value = null;
      }
    },
  });
};

onMounted(() => {
  if (isAdmin.value) fetchLobbies();
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-surface-page flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-typo-heading"
  >
    <div class="max-w-6xl w-full">
      <Card>
        <template #title>
          <div class="text-center">
            <h1 class="text-4xl font-bold tracking-tight">Lulon</h1>
            <p class="text-lg text-gray-600 dark:text-typo-body">
              Admin dashboard
            </p>
          </div>
        </template>
        <template #content>
          <Message v-if="!isAdmin" severity="error" :closable="false">
            You must be logged in as an admin to access this page.
            <RouterLink to="/login" class="underline ml-1"
              >Go to login</RouterLink
            >
          </Message>

          <div v-else class="space-y-6">
            <!-- Lobby selection -->
            <div
              class="bg-gray-50 dark:bg-surface-page rounded-xl border border-gray-200 dark:border-surface-divider p-6"
            >
              <div class="flex justify-between items-center mb-4 gap-3">
                <h3 class="text-lg font-bold">Lobbies</h3>
                <Button
                  :label="showCreateLobby ? 'Cancel' : 'New lobby'"
                  :icon="showCreateLobby ? 'pi pi-times' : 'pi pi-plus'"
                  size="small"
                  @click="showCreateLobby = !showCreateLobby"
                />
              </div>

              <div
                v-if="showCreateLobby"
                class="mb-4 p-4 bg-white dark:bg-surface-card rounded-lg border border-blue-200 dark:border-blue-800 space-y-3"
              >
                <h4 class="font-bold">Create lobby</h4>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-typo-body mb-1"
                    >Lobby name</label
                  >
                  <InputText
                    v-model="newLobbyName"
                    placeholder="Engineering Team 2024"
                    class="w-full"
                  />
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-typo-body mb-1"
                    >Lobby code (optional)</label
                  >
                  <InputText
                    v-model="newLobbyCode"
                    placeholder="Leave blank to auto-generate"
                    maxlength="10"
                    class="w-full uppercase font-mono"
                  />
                </div>
                <div>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-typo-body mb-1"
                    >Enrollment deadline (optional)</label
                  >
                  <input
                    v-model="newLobbyDeadline"
                    type="datetime-local"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-surface-divider bg-transparent focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <Button
                  label="Create lobby"
                  :loading="creating"
                  class="w-full"
                  @click="createLobby"
                />
              </div>

              <div
                v-if="loadingLobbies"
                class="flex justify-center py-8 text-gray-400"
              >
                <i class="pi pi-spin pi-spinner text-2xl"></i>
              </div>

              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <div
                  v-for="lobby in lobbies"
                  :key="lobby.id"
                  class="p-4 rounded-lg border-2 transition-all hover:shadow-md relative group"
                  :class="
                    selectedLobby?.id === lobby.id
                      ? 'border-primary bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-surface-divider'
                  "
                >
                  <div
                    class="cursor-pointer"
                    role="button"
                    tabindex="0"
                    @click="selectLobby(lobby)"
                    @keyup.enter="selectLobby(lobby)"
                  >
                    <div class="font-bold text-gray-800 dark:text-typo-heading">
                      {{ lobby.lobby_name }}
                    </div>
                    <div
                      class="text-sm text-gray-500 dark:text-typo-muted font-mono mt-1"
                    >
                      Code: {{ lobby.lobby_code }}
                    </div>
                    <Tag
                      class="mt-2"
                      :severity="lobby.drawing_started ? 'success' : 'warn'"
                      :value="
                        lobby.drawing_started
                          ? 'Drawing started'
                          : 'Enrollment open'
                      "
                    />
                  </div>

                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    aria-label="Delete lobby"
                    class="!absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    :loading="deletingLobbyId === lobby.id"
                    @click.stop="deleteLobby(lobby)"
                  />

                  <div
                    v-if="selectingLobby && selectedLobby?.id === lobby.id"
                    class="absolute inset-0 bg-blue-50/70 dark:bg-blue-900/40 flex items-center justify-center rounded-lg"
                  >
                    <i
                      class="pi pi-spin pi-spinner text-blue-600 dark:text-blue-400 text-2xl"
                    ></i>
                  </div>
                </div>

                <div
                  v-if="lobbies.length === 0"
                  class="col-span-full text-center text-gray-500 dark:text-typo-muted py-8"
                >
                  No lobbies yet. Create one to get started!
                </div>
              </div>
            </div>

            <!-- Selected lobby -->
            <div v-if="selectedLobby" class="space-y-4">
              <div class="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h3 class="text-lg font-bold">
                    {{ selectedLobby.lobby_name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-typo-muted">
                    {{ participantsCount }} participants enrolled
                  </p>
                </div>
                <Button
                  :label="
                    selectedLobby.drawing_started
                      ? 'Drawing started'
                      : 'Start drawing event'
                  "
                  icon="pi pi-shuffle"
                  severity="danger"
                  :loading="shuffling"
                  :disabled="
                    shuffling || selectingLobby || selectedLobby.drawing_started
                  "
                  @click="generatePairs"
                />
              </div>

              <!-- Share link -->
              <div
                class="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-900 dark:text-blue-300"
              >
                <div
                  class="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-center"
                >
                  <span class="font-medium shrink-0">Share link:</span>
                  <code
                    class="min-w-0 flex-1 truncate bg-white dark:bg-surface-card px-2 py-1 rounded border border-blue-200 dark:border-blue-800 text-xs text-gray-900 dark:text-typo-heading"
                    >{{ shareLink }}</code
                  >
                  <Button
                    label="Copy"
                    size="small"
                    icon="pi pi-copy"
                    class="shrink-0"
                    @click="copyToClipboard(shareLink)"
                  />
                </div>
              </div>

              <!-- Desktop table -->
              <div
                v-if="!isMobile"
                class="bg-gray-50 dark:bg-surface-page rounded-xl border border-gray-200 dark:border-surface-divider overflow-hidden"
              >
                <DataTable
                  :value="participants"
                  dataKey="id"
                  responsiveLayout="scroll"
                >
                  <Column field="name" header="Name" />
                  <Column field="code" header="Code">
                    <template #body="{ data }">
                      <span
                        class="font-mono text-gray-500 dark:text-typo-muted"
                        >{{ data.code }}</span
                      >
                    </template>
                  </Column>
                  <Column header="Target (gift receiver)">
                    <template #body="{ data }">
                      <span
                        v-if="data.drawn_name"
                        class="text-green-600 dark:text-green-300 font-medium"
                        >{{ data.drawn_name }}</span
                      >
                      <span
                        v-else
                        class="text-gray-400 dark:text-typo-muted italic"
                        >Not assigned</span
                      >
                    </template>
                  </Column>
                  <Column header="Status">
                    <template #body="{ data }">
                      <Tag
                        :severity="data.drawn_name ? 'success' : 'warn'"
                        :value="data.drawn_name ? 'Ready' : 'Waiting'"
                      />
                    </template>
                  </Column>
                  <Column header="">
                    <template #body="{ data }">
                      <div class="flex gap-1 justify-end">
                        <Button
                          icon="pi pi-link"
                          text
                          rounded
                          size="small"
                          aria-label="Copy personal link"
                          @click="copyToClipboard(personalLink(data))"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          size="small"
                          aria-label="Remove participant"
                          :disabled="selectedLobby.drawing_started"
                          :loading="deletingParticipantId === data.id"
                          @click="deleteParticipant(data)"
                        />
                      </div>
                    </template>
                  </Column>
                  <template #empty>No participants yet.</template>
                </DataTable>
              </div>

              <!-- Mobile stacked cards -->
              <div v-else class="space-y-3">
                <div
                  v-for="p in participants"
                  :key="p.id"
                  class="bg-gray-50 dark:bg-surface-page rounded-xl border border-gray-200 dark:border-surface-divider p-4"
                >
                  <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                      <div class="font-bold truncate">{{ p.name }}</div>
                      <div
                        class="font-mono text-sm text-gray-500 dark:text-typo-muted"
                      >
                        {{ p.code }}
                      </div>
                    </div>
                    <Tag
                      :severity="p.drawn_name ? 'success' : 'warn'"
                      :value="p.drawn_name ? 'Ready' : 'Waiting'"
                    />
                  </div>
                  <div class="mt-3 text-sm">
                    <span class="text-gray-500 dark:text-typo-muted"
                      >Target:</span
                    >
                    <span
                      v-if="p.drawn_name"
                      class="font-medium text-green-600 dark:text-green-300"
                      >{{ p.drawn_name }}</span
                    >
                    <span
                      v-else
                      class="italic text-gray-400 dark:text-typo-muted"
                      >Not assigned</span
                    >
                  </div>
                  <div class="mt-3 flex gap-2">
                    <Button
                      label="Copy link"
                      icon="pi pi-link"
                      size="small"
                      outlined
                      @click="copyToClipboard(personalLink(p))"
                    />
                    <Button
                      label="Remove"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      outlined
                      :disabled="selectedLobby.drawing_started"
                      :loading="deletingParticipantId === p.id"
                      @click="deleteParticipant(p)"
                    />
                  </div>
                </div>
                <div
                  v-if="participants.length === 0"
                  class="text-center text-gray-500 dark:text-typo-muted py-8"
                >
                  No participants yet.
                </div>
              </div>

              <p
                v-if="selectedLobby.drawing_started"
                class="text-xs text-gray-500 dark:text-typo-muted"
              >
                Participants can no longer be removed once the drawing has
                started.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <ConfirmDialog />
  </div>
</template>
