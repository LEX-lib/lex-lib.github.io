<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { pb } from "@/lib/pocketbase";
import { toast } from "vue-sonner";

const lobbyCode = ref("");
const name = ref("");
const isEnrolled = ref(false);
const generatedCode = ref("");
const loading = ref(false);
const participantsCount = ref(0);
const enrollmentClosed = ref(false);
const lobby = ref<any>(null);
const lobbyValidated = ref(false);

const validateLobby = async () => {
  if (!lobbyCode.value) {
    toast.error("Please enter a lobby code");
    return;
  }

  loading.value = true;
  try {
    const records = await pb.collection("lobbies").getFullList({
      filter: `lobby_code="${lobbyCode.value.toUpperCase()}"`,
    });

    if (records.length === 0) {
      toast.error("Invalid lobby code");
      lobby.value = null;
      lobbyValidated.value = false;
      return;
    }

    lobby.value = records[0];
    lobbyValidated.value = true;

    // Check if enrollment is closed
    const now = new Date();
    const deadline = lobby.value.enrollment_deadline
      ? new Date(lobby.value.enrollment_deadline)
      : null;
    const drawingStarted = lobby.value.drawing_started || false;

    enrollmentClosed.value = drawingStarted || (deadline && now > deadline);

    // Fetch stats for this lobby
    await fetchStats();

    toast.success(`Joined lobby: ${lobby.value.lobby_name}`);
  } catch (e: any) {
    toast.error("Error validating lobby: " + e.message);
  } finally {
    loading.value = false;
  }
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

const generateUniqueCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const enroll = async () => {
  if (enrollmentClosed.value) {
    toast.error(
      "Enrollment is closed. The drawing has already started or the deadline has passed.",
    );
    return;
  }

  if (!name.value) {
    toast.error("Please enter your name");
    return;
  }

  loading.value = true;
  try {
    const newCode = generateUniqueCode();

    await pb.collection("gift_exchange_participants").create({
      name: name.value,
      code: newCode,
      lobby: lobby.value.id,
    });

    generatedCode.value = newCode;
    isEnrolled.value = true;
    toast.success("Successfully enrolled!");
    await fetchStats();
  } catch (e: any) {
    toast.error("Enrollment failed: " + e.message);
  } finally {
    loading.value = false;
  }
};

// Watch lobby code changes to reset validation
watch(lobbyCode, () => {
  if (lobbyValidated.value) {
    lobbyValidated.value = false;
    lobby.value = null;
  }
});

onMounted(async () => {
  // Check for lobby code in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyParam = urlParams.get("lobby");

  if (lobbyParam) {
    lobbyCode.value = lobbyParam.toUpperCase();
    await validateLobby();
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900"
  >
    <div
      class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10"
    >
      <div class="p-8 text-center">
        <h1 class="text-4xl font-bold mb-2 tracking-tight">MonitoX</h1>
        <h2 class="text-xl font-semibold text-gray-600 mb-6">
          Join the Exchange
        </h2>
        <p class="text-gray-500 mb-8">
          Sign up to participate in the gift giving!
        </p>

        <!-- Step 1: Enter Lobby Code -->
        <div
          v-if="!lobbyValidated"
          class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left"
        >
          <h3 class="font-bold text-lg mb-2">Enter Lobby Code</h3>
          <p class="text-sm text-gray-600 mb-3">
            Ask your organizer for the lobby code
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Lobby Code</label
            >
            <input
              v-model="lobbyCode"
              type="text"
              placeholder="LOBBY2024"
              maxlength="10"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all uppercase text-center font-mono"
            />
          </div>
          <button
            @click="validateLobby"
            :disabled="loading"
            class="mt-4 w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? "Validating..." : "Continue" }}
          </button>
        </div>

        <!-- Step 2: Enrollment Closed -->
        <div v-else-if="enrollmentClosed" class="py-6">
          <div class="text-red-500 text-5xl mb-4">
            <i class="pi pi-lock"></i>
          </div>
          <h3 class="text-2xl font-bold mb-2">Enrollment Closed</h3>
          <p class="text-gray-600 mb-2">
            Sorry, enrollment has ended for
            <strong>{{ lobby.lobby_name }}</strong
            >.
          </p>
          <p class="text-sm text-gray-500 mb-6">
            The drawing has already started or the deadline has passed.
          </p>

          <div class="flex gap-2">
            <button
              @click="
                lobbyValidated = false;
                lobbyCode = '';
              "
              class="flex-1 text-sm text-gray-500 underline"
            >
              Try Different Lobby
            </button>
            <RouterLink
              to="/projects/gift-exchange/draw"
              class="flex-1 text-sm text-black font-semibold underline"
            >
              Draw Here
            </RouterLink>
          </div>
        </div>

        <!-- Step 3: Enrollment Form -->
        <div v-else-if="!isEnrolled">
          <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-blue-800">
              <strong>Lobby:</strong> {{ lobby.lobby_name }}
            </p>
            <button
              @click="
                lobbyValidated = false;
                lobbyCode = '';
              "
              class="text-xs text-blue-600 underline mt-1"
            >
              Change Lobby
            </button>
          </div>

          <div
            class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left"
          >
            <h3 class="font-bold text-lg mb-2">New Participant?</h3>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Your Name</label
              >
              <input
                v-model="name"
                type="text"
                placeholder="Juan dela Cruz"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              @click="enroll"
              :disabled="loading"
              class="mt-4 w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? "Processing..." : "Enroll & Get Code" }}
            </button>
          </div>

          <div class="mt-6 text-sm text-gray-500">
            Already have a code?
            <RouterLink
              to="/projects/gift-exchange/draw"
              class="underline text-black font-semibold"
              >Draw here</RouterLink
            >
          </div>
        </div>

        <!-- Step 4: Success -->
        <div v-else class="py-6">
          <div class="text-green-600 text-5xl mb-4">
            <i class="pi pi-check-circle"></i>
          </div>
          <h3 class="text-2xl font-bold mb-2">You are enrolled!</h3>
          <p class="text-gray-600 mb-4">
            Save this code. You will need it to draw your gift.
          </p>

          <div
            class="text-5xl font-mono font-bold tracking-widest text-black bg-yellow-100 p-4 rounded-xl border-2 border-yellow-300 mb-6 select-all"
          >
            {{ generatedCode }}
          </div>

          <p class="text-sm text-gray-400 mb-6">
            Waiting for the drawing event to start...
          </p>

          <RouterLink
            to="/projects/gift-exchange/draw"
            class="block w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Go to Draw Page
          </RouterLink>
        </div>

        <div v-if="lobbyValidated" class="mt-8 border-t pt-6">
          <p class="text-sm text-gray-500">
            {{ participantsCount }} participants enrolled in this lobby
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
