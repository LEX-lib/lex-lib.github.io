<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useIntervalFn, useDocumentVisibility } from "@vueuse/core";
import { pb } from "@/lib/pocketbase";
import { toast } from "vue-sonner";
import {
  clearSavedLobbyCode,
  normalizeLobbyCode,
  resolveLobbyCode,
  saveLobbyCode,
} from "@/lib/lulon/lobbySession";
import type { Lobby, Participant } from "@/types/lulon/types";

const route = useRoute();
const router = useRouter();

const lobbyCode = ref("");
const userCode = ref("");
const name = ref("");
const lobby = ref<Lobby | null>(null);
const lobbyValidated = ref(false);
const enrollmentClosed = ref(false);
const isLoggedIn = ref(false);
const drawnName = ref<string | null>(null);
const isFlipped = ref(false);
const justEnrolled = ref(false);
const enrollTab = ref("register");
const loading = ref(false);
const enrolling = ref(false);
const participantsCount = ref(0);

const screen = computed(() => {
  if (!lobbyValidated.value) return "lobby";
  if (justEnrolled.value && isLoggedIn.value) return "enrolled";
  if (isLoggedIn.value) return drawnName.value ? "reveal" : "waiting";
  return "enroll";
});

const generateUniqueCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const fetchStats = async () => {
  if (!lobby.value) return;
  try {
    const result = await pb
      .collection("gift_exchange_participants")
      .getList(1, 1, {
        filter: `lobby="${lobby.value.id}"`,
        $autoCancel: false,
      });
    participantsCount.value = result.totalItems;
  } catch (e) {
    console.error("Error fetching stats", e);
  }
};

const validateLobby = async () => {
  const code = normalizeLobbyCode(lobbyCode.value);
  if (!code) {
    toast.error("Please enter a lobby code");
    return;
  }

  loading.value = true;
  try {
    const records = await pb
      .collection("lobbies")
      .getFullList<Lobby>({ filter: `lobby_code="${code}"` });

    if (records.length === 0) {
      toast.error("Invalid lobby code");
      lobby.value = null;
      lobbyValidated.value = false;
      clearSavedLobbyCode();
      return;
    }

    lobby.value = records[0];
    lobbyCode.value = lobby.value.lobby_code;
    lobbyValidated.value = true;
    saveLobbyCode(lobby.value.lobby_code);

    const now = new Date();
    const deadline = lobby.value.enrollment_deadline
      ? new Date(lobby.value.enrollment_deadline)
      : null;
    enrollmentClosed.value = Boolean(
      lobby.value.drawing_started || (deadline && now > deadline),
    );
    // Returning participants land on the Draw tab when registration is shut.
    enrollTab.value = enrollmentClosed.value ? "draw" : "register";

    await fetchStats();
  } catch (e) {
    toast.error("Error validating lobby: " + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

const enroll = async () => {
  if (enrollmentClosed.value) {
    toast.error(
      "Enrollment is closed. The drawing has already started or the deadline has passed.",
    );
    return;
  }
  if (!name.value.trim()) {
    toast.error("Please enter your name");
    return;
  }
  if (!lobby.value) return;

  enrolling.value = true;
  try {
    const newCode = generateUniqueCode();
    await pb.collection("gift_exchange_participants").create({
      name: name.value.trim(),
      code: newCode,
      lobby: lobby.value.id,
    });

    saveLobbyCode(lobby.value.lobby_code);
    userCode.value = newCode;
    isLoggedIn.value = true;
    drawnName.value = null;
    isFlipped.value = false;
    justEnrolled.value = true;

    // Turn the URL into the participant's personal identity link, in place.
    await router.replace({
      path: "/projects/lulon/play",
      query: { lobby: lobby.value.lobby_code, code: newCode },
    });

    toast.success("You're in! Save your code below.");
    await fetchStats();
  } catch (e) {
    toast.error("Enrollment failed: " + (e as Error).message);
  } finally {
    enrolling.value = false;
  }
};

const checkStatus = async () => {
  if (!lobbyCode.value) {
    toast.error("Please enter lobby code");
    return;
  }
  if (!userCode.value) {
    toast.error("Please enter your code");
    return;
  }

  loading.value = true;
  try {
    const code = normalizeLobbyCode(lobbyCode.value);
    const lobbies = await pb
      .collection("lobbies")
      .getFullList<Lobby>({ filter: `lobby_code="${code}"` });

    if (lobbies.length === 0) {
      toast.error("Invalid lobby code");
      return;
    }

    lobby.value = lobbies[0];
    lobbyCode.value = lobby.value.lobby_code;
    lobbyValidated.value = true;
    saveLobbyCode(lobby.value.lobby_code);

    const record = await pb
      .collection("gift_exchange_participants")
      .getFirstListItem<Participant>(
        `code="${normalizeLobbyCode(userCode.value)}" && lobby="${lobby.value.id}"`,
        { $autoCancel: false },
      );

    userCode.value = record.code;
    isLoggedIn.value = true;
    name.value = record.name;
    isFlipped.value = false;
    drawnName.value = record.drawn_name ?? null;

    if (!record.drawn_name) {
      toast.info("Welcome back! Waiting for the drawing event to start.");
    }
  } catch {
    isLoggedIn.value = false;
    drawnName.value = null;
    toast.error("Invalid lobby or participant code. Please try again.");
  } finally {
    loading.value = false;
  }
};

const resetParticipant = () => {
  isLoggedIn.value = false;
  drawnName.value = null;
  isFlipped.value = false;
  justEnrolled.value = false;
  userCode.value = "";
  router.replace({
    path: "/projects/lulon/play",
    query: lobbyCode.value ? { lobby: lobbyCode.value } : {},
  });
};

const continueToReveal = () => {
  justEnrolled.value = false;
};

// Let the next person on the same device register without leaving the lobby.
const registerAnother = () => {
  isLoggedIn.value = false;
  drawnName.value = null;
  isFlipped.value = false;
  justEnrolled.value = false;
  name.value = "";
  userCode.value = "";
  enrollTab.value = "register";
  router.replace({
    path: "/projects/lulon/play",
    query: lobbyCode.value ? { lobby: lobbyCode.value } : {},
  });
};

// Silent status refresh — used by polling so the waiting screen advances to
// the reveal on its own. Never toasts on failure.
const refreshParticipant = async () => {
  if (!lobby.value || !userCode.value) return;
  try {
    const record = await pb
      .collection("gift_exchange_participants")
      .getFirstListItem<Participant>(
        `code="${normalizeLobbyCode(userCode.value)}" && lobby="${lobby.value.id}"`,
        { $autoCancel: false },
      );
    if (record.drawn_name && !drawnName.value) {
      drawnName.value = record.drawn_name;
      isFlipped.value = false;
      toast.success("The drawing has started! Tap to reveal your partner.");
    }
  } catch {
    // Transient failure — stay on the waiting screen and retry next tick.
  }
};

// Poll only while the drawing hasn't started, and only while the tab is
// visible. `useIntervalFn` owns the timer lifecycle (auto-clears on unmount).
const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
  refreshParticipant,
  30000,
  { immediate: false, immediateCallback: false },
);

const visibility = useDocumentVisibility();

watch([screen, visibility], ([current, state]) => {
  if (current === "waiting" && state === "visible") {
    resumePolling();
  } else {
    pausePolling();
  }
});

// A quiet check the moment the tab regains focus, so returning users don't
// wait a full interval.
watch(visibility, (state) => {
  if (state === "visible" && screen.value === "waiting") refreshParticipant();
});

onMounted(async () => {
  // `?lobby=` from the URL wins and is remembered for the session; `?code=` is
  // the participant's identity. Both together = one-tap reveal, zero typing.
  lobbyCode.value = resolveLobbyCode();
  const urlCode = route.query.code;
  userCode.value = normalizeLobbyCode(
    Array.isArray(urlCode) ? urlCode[0] : urlCode,
  );

  if (lobbyCode.value) {
    await validateLobby();
    if (lobby.value && userCode.value) {
      await checkStatus();
    }
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-surface-page flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-typo-heading perspective-1000"
  >
    <div class="max-w-md w-full relative z-10">
      <Card>
        <template #content>
          <div class="text-center p-2">
            <h1 class="text-4xl font-bold mb-1 tracking-tight">Lulon</h1>
            <p class="text-sm text-gray-500 dark:text-typo-muted mb-6">
              Unroll your secret partner.
            </p>

            <Transition name="lulon-swap" mode="out-in">
              <!-- No lobby known yet -->
              <div v-if="screen === 'lobby'" key="lobby">
                <div
                  class="bg-gray-50 dark:bg-surface-page p-4 rounded-xl border border-gray-200 dark:border-surface-divider text-left"
                >
                  <h3 class="font-bold text-lg mb-2">Enter Lobby Code</h3>
                  <p class="text-sm text-gray-600 dark:text-typo-body mb-3">
                    Ask your organizer for the lobby code.
                  </p>
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-typo-body mb-1"
                    >Lobby Code</label
                  >
                  <InputText
                    v-model="lobbyCode"
                    placeholder="LOBBY2024"
                    maxlength="10"
                    class="w-full uppercase text-center font-mono"
                    @keyup.enter="validateLobby"
                  />
                  <Button
                    label="Continue"
                    :loading="loading"
                    class="w-full mt-4"
                    @click="validateLobby"
                  />
                </div>
              </div>

              <!-- Register / Draw (pre-login) -->
              <div v-else-if="screen === 'enroll'" key="enroll">
                <div
                  class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-left"
                >
                  <p class="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Lobby:</strong> {{ lobby?.lobby_name }}
                  </p>
                  <button
                    class="text-xs text-blue-600 dark:text-blue-400 underline mt-1"
                    @click="
                      lobbyValidated = false;
                      lobbyCode = '';
                    "
                  >
                    Change lobby
                  </button>
                </div>

                <Tabs v-model:value="enrollTab" class="lulon-tabs">
                  <TabList>
                    <Tab value="register" :disabled="enrollmentClosed"
                      >Register</Tab
                    >
                    <Tab value="draw">Draw</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel value="register">
                      <div v-if="enrollmentClosed" class="py-4">
                        <i
                          class="pi pi-lock text-red-500 dark:text-red-300 text-4xl"
                        ></i>
                        <h3 class="font-bold text-lg mt-3 mb-1">
                          Enrollment closed
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-typo-body">
                          The drawing has already started or the deadline has
                          passed.
                        </p>
                      </div>

                      <div
                        v-else
                        class="bg-gray-50 dark:bg-surface-page p-4 rounded-xl border border-gray-200 dark:border-surface-divider text-left"
                      >
                        <h3 class="font-bold text-lg mb-2">New participant?</h3>
                        <label
                          class="block text-sm font-medium text-gray-700 dark:text-typo-body mb-1"
                          >Your Name</label
                        >
                        <InputText
                          v-model="name"
                          placeholder="Juan dela Cruz"
                          class="w-full"
                          @keyup.enter="enroll"
                        />
                        <Button
                          label="Enroll & get code"
                          :loading="enrolling"
                          class="w-full mt-4"
                          @click="enroll"
                        />
                      </div>
                    </TabPanel>

                    <TabPanel value="draw">
                      <div class="text-left">
                        <h3 class="font-bold text-lg mb-2">
                          Already have a code?
                        </h3>
                        <p
                          class="text-sm text-gray-600 dark:text-typo-body mb-3"
                        >
                          Enter the 4-character code you got when you
                          registered.
                        </p>
                        <InputText
                          v-model="userCode"
                          placeholder="WXYZ"
                          maxlength="4"
                          class="w-full uppercase tracking-widest text-center font-mono"
                          @keyup.enter="checkStatus"
                        />
                        <Button
                          label="Reveal my partner"
                          :loading="loading"
                          outlined
                          class="w-full mt-3"
                          @click="checkStatus"
                        />
                      </div>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </div>

              <!-- Just enrolled: show the code to save -->
              <div
                v-else-if="screen === 'enrolled'"
                key="enrolled"
                class="py-4"
              >
                <i
                  class="pi pi-check-circle text-green-600 dark:text-green-300 text-5xl"
                ></i>
                <h3 class="text-2xl font-bold mt-4 mb-2">You're in!</h3>
                <p class="text-gray-600 dark:text-typo-body mb-4">
                  Save this code — you'll need it to reveal your partner.
                </p>

                <div
                  class="text-5xl font-mono font-bold tracking-widest bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 mb-6 select-all"
                >
                  {{ userCode }}
                </div>

                <Button
                  label="Register another participant"
                  icon="pi pi-user-plus"
                  outlined
                  class="w-full mb-2"
                  @click="registerAnother"
                />
                <Button
                  label="Reveal my partner"
                  icon="pi pi-gift"
                  class="w-full"
                  @click="continueToReveal"
                />
                <p class="text-xs text-gray-400 dark:text-typo-muted mt-4">
                  Reveal works once the organizer starts the drawing.
                </p>
              </div>

              <!-- Waiting for the drawing -->
              <div v-else-if="screen === 'waiting'" key="waiting" class="py-6">
                <i
                  class="pi pi-clock text-yellow-500 dark:text-yellow-300 text-5xl"
                ></i>
                <h3 class="text-2xl font-bold mt-4 mb-2">Hello, {{ name }}!</h3>
                <p class="text-gray-600 dark:text-typo-body mb-2">
                  We are waiting for the organizer to start the drawing.
                </p>
                <p class="text-xs text-gray-500 dark:text-typo-muted mb-6">
                  Your code:
                  <span class="font-mono font-semibold">{{ userCode }}</span>
                </p>
                <p class="text-sm text-gray-500 dark:text-typo-muted mb-6">
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Checking for updates…
                </p>
                <button
                  class="text-sm text-gray-500 dark:text-typo-muted underline"
                  @click="resetParticipant"
                >
                  Log out
                </button>
              </div>

              <!-- Reveal -->
              <div v-else key="reveal" class="py-8">
                <div
                  class="flip-card w-full h-64 cursor-pointer"
                  :class="{ flipped: isFlipped }"
                  @click="isFlipped = !isFlipped"
                >
                  <div
                    class="flip-card-inner relative w-full h-full text-center"
                  >
                    <div
                      class="flip-card-front absolute w-full h-full bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6"
                    >
                      <i class="pi pi-gift text-6xl mb-4 animate-bounce"></i>
                      <h3 class="text-2xl font-bold">
                        Tap to know who you picked
                      </h3>
                    </div>
                    <div
                      class="flip-card-back absolute w-full h-full bg-white dark:bg-surface-card text-black dark:text-typo-heading rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-4 border-gold"
                    >
                      <h3
                        class="text-xl text-gray-500 dark:text-typo-muted mb-2"
                      >
                        Hello {{ name }}, you picked:
                      </h3>
                      <div
                        class="text-3xl font-bold mb-4 p-4 bg-gray-100 dark:bg-surface-page rounded-xl w-full"
                      >
                        {{ drawnName }}
                      </div>
                      <p class="text-xs text-gray-400 dark:text-typo-muted">
                        Shh! Keep it a secret!
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  class="mt-8 text-sm text-gray-500 dark:text-typo-muted underline"
                  @click="resetParticipant"
                >
                  Log out / enter a different code
                </button>
              </div>
            </Transition>

            <p
              v-if="lobbyValidated && screen !== 'reveal'"
              class="mt-6 pt-4 border-t border-gray-100 dark:border-surface-divider text-sm text-gray-500 dark:text-typo-muted"
            >
              {{ participantsCount }} participants enrolled in this lobby
            </p>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.lulon-swap-enter-active,
.lulon-swap-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.lulon-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.lulon-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Even 50/50 tab buttons that fill the width and centre their labels. */
.lulon-tabs :deep(.p-tablist) {
  display: flex;
}
.lulon-tabs :deep(.p-tab) {
  flex: 1 1 0%;
  justify-content: center;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}

.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.border-gold {
  border-color: #ffd700;
}
</style>
