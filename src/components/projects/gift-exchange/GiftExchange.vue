<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { pb } from "@/lib/pocketbase";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const isSuperUser = computed(() => authStore.isLoggedIn);

const name = ref("");
const userCode = ref(""); // For inputting code to login
const isEnrolled = ref(false);
const drawnName = ref<string | null>(null);
const participantsCount = ref(0);
const isAdminOpen = ref(false);
const loading = ref(false);
const currentUser = ref<any>(null);
const generatedCode = ref(""); // To show the user their new code
const participants = ref<any[]>([]); // For admin view

// Drawing State
const isFlipped = ref(false);

const fetchStats = async () => {
  try {
    const result = await pb
      .collection("gift_exchange_participants")
      .getList(1, 1, {
        $autoCancel: false,
      });
    participantsCount.value = result.totalItems;
  } catch (e) {
    console.error("Error fetching stats", e);
  }
};

const fetchParticipants = async () => {
  if (!isSuperUser.value) return;
  try {
    participants.value = await pb
      .collection("gift_exchange_participants")
      .getFullList({
        sort: "-created",
      });
  } catch (e) {
    console.error("Error fetching participants", e);
  }
};

const generateUniqueCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed I, O, 1, 0 to avoid confusion
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const enroll = async () => {
  if (!name.value) {
    toast.error("Please enter your name");
    return;
  }
  loading.value = true;
  try {
    const newCode = generateUniqueCode();

    const record = await pb.collection("gift_exchange_participants").create({
      name: name.value,
      code: newCode,
    });

    currentUser.value = record;
    generatedCode.value = newCode;
    drawnName.value = null; // Ensure drawnName is null for new enrollments
    isEnrolled.value = true;
    toast.success("Successfully enrolled!");
    await fetchStats();
    if (isSuperUser.value) await fetchParticipants();
  } catch (e: any) {
    toast.error("Enrollment failed: " + e.message);
  } finally {
    loading.value = false;
  }
};

const checkStatus = async () => {
  if (!userCode.value) {
    toast.error("Please enter your code");
    return;
  }
  loading.value = true;
  try {
    const record = await pb
      .collection("gift_exchange_participants")
      .getFirstListItem(`code="${userCode.value.toUpperCase()}"`);
    if (record) {
      currentUser.value = record;
      isEnrolled.value = true;
      name.value = record.name;
      generatedCode.value = record.code;

      // Reset drawing state
      isFlipped.value = false;

      if (record.drawn_name) {
        drawnName.value = record.drawn_name;
      } else {
        drawnName.value = null;
        toast.info("Welcome back! Waiting for the drawing event to start.");
      }
    }
  } catch {
    toast.error("Invalid code. Please try again.");
  } finally {
    loading.value = false;
  }
};

const startDrawing = async () => {
  isFlipped.value = true;
};

const generatePairs = async () => {
  loading.value = true;
  try {
    const records = await pb
      .collection("gift_exchange_participants")
      .getFullList();
    if (records.length < 2) {
      toast.error("Not enough participants to generate pairs.");
      return;
    }

    const shuffled = [...records];
    let isValid = false;

    // Simple derangement shuffle
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
        "Failed to generate valid pairs (Derangement failed). Try again.",
      );
      return;
    }

    // Update records
    const promises = records.map((record, index) => {
      return pb.collection("gift_exchange_participants").update(record.id, {
        drawn_name: shuffled[index].name,
      });
    });

    await Promise.all(promises);
    toast.success("Drawing Event Started! Users can now draw.");

    // Refresh current user if logged in
    if (currentUser.value) {
      const updated = await pb
        .collection("gift_exchange_participants")
        .getOne(currentUser.value.id);
      if (updated.drawn_name) {
        drawnName.value = updated.drawn_name;
      }
    }

    if (isSuperUser.value) await fetchParticipants();
  } catch (e: any) {
    toast.error("Error generating pairs: " + e.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
  if (isSuperUser.value) {
    fetchParticipants();
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900 perspective-1000"
  >
    <div
      class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10"
    >
      <div class="p-8 text-center">
        <h1 class="text-4xl font-bold mb-2 tracking-tight">MonitoX</h1>
        <h2 class="text-xl font-semibold text-gray-600 mb-6">Gift Exchange</h2>
        <p class="text-gray-500 mb-8">
          Join the celebration and exchange gifts with your friends!
        </p>

        <!-- Enrollment View -->
        <div v-if="!isEnrolled">
          <div class="space-y-6 text-left">
            <!-- Enroll Tab -->
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
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

            <div class="relative flex py-2 items-center">
              <div class="flex-grow border-t border-gray-300"></div>
              <span class="flex-shrink-0 mx-4 text-gray-400">OR</span>
              <div class="flex-grow border-t border-gray-300"></div>
            </div>

            <!-- Login Tab -->
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 class="font-bold text-lg mb-2">Already Enrolled?</h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Enter Your Code</label
                >
                <input
                  v-model="userCode"
                  type="text"
                  placeholder="ABCD"
                  maxlength="4"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all uppercase tracking-widest text-center font-mono"
                />
              </div>
              <button
                @click="checkStatus"
                :disabled="loading"
                class="mt-4 w-full bg-white border-2 border-black text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? "Checking..." : "Check Status / Draw" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Enrolled / Status View -->
        <div v-else>
          <!-- 1. Just Enrolled (Show Code) -->
          <div v-if="generatedCode && !drawnName" class="py-6">
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

            <p class="text-sm text-gray-400">
              Waiting for the drawing event to start...
            </p>

            <div class="flex flex-col gap-2 mt-6">
              <button
                @click="checkStatus"
                :disabled="loading"
                class="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                {{ loading ? "Checking..." : "Check for Drawing" }}
              </button>
              <button
                @click="
                  isEnrolled = false;
                  name = '';
                  generatedCode = '';
                  userCode = '';
                "
                class="text-sm text-gray-500 underline"
              >
                Back to Home
              </button>
            </div>
          </div>

          <!-- 2. Ready to Draw (Card Flip) -->
          <div v-else-if="drawnName" class="py-8">
            <div
              class="flip-card w-full h-64 cursor-pointer"
              :class="{ flipped: isFlipped }"
              @click="startDrawing"
            >
              <div
                class="flip-card-inner relative w-full h-full text-center transition-transform duration-700 transform-style-3d"
              >
                <!-- Front -->
                <div
                  class="flip-card-front absolute w-full h-full backface-hidden bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6"
                >
                  <i class="pi pi-gift text-6xl mb-4 animate-bounce"></i>
                  <h3 class="text-2xl font-bold">Tap to Open Gift</h3>
                  <p class="text-sm opacity-80 mt-2">
                    Discover who you picked!
                  </p>
                </div>

                <!-- Back -->
                <div
                  class="flip-card-back absolute w-full h-full backface-hidden bg-white text-black rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-4 border-gold transform-rotate-y-180"
                >
                  <h3 class="text-xl text-gray-500 mb-2">
                    Hello {{ name }}, you picked:
                  </h3>
                  <div
                    class="text-3xl font-bold text-black mb-4 p-4 bg-gray-100 rounded-xl w-full"
                  >
                    {{ drawnName }}
                  </div>
                  <p class="text-xs text-gray-400">Shh! Keep it a secret!</p>
                </div>
              </div>
            </div>

            <button
              @click="
                isEnrolled = false;
                name = '';
                generatedCode = '';
                userCode = '';
              "
              class="mt-8 text-sm text-gray-500 underline"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div class="mt-8 border-t pt-6">
          <p class="text-sm text-gray-500">
            {{ participantsCount }} participants enrolled
          </p>

          <div v-if="isSuperUser">
            <button
              @click="
                isAdminOpen = !isAdminOpen;
                if (isAdminOpen) fetchParticipants();
              "
              class="mt-4 text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              {{ isAdminOpen ? "Hide Admin" : "Show Admin" }}
            </button>

            <div
              v-if="isAdminOpen"
              class="mt-4 p-4 bg-gray-100 rounded-lg text-left"
            >
              <button
                @click="generatePairs"
                :disabled="loading"
                class="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm mb-4"
              >
                Start Drawing Event (Shuffle & Assign)
              </button>

              <h4 class="font-bold text-sm mb-2">Participants</h4>
              <div class="max-h-64 overflow-y-auto text-xs">
                <table class="w-full">
                  <thead>
                    <tr class="text-gray-500 border-b">
                      <th class="pb-1">Name</th>
                      <th class="pb-1">Code</th>
                      <th class="pb-1">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="p in participants"
                      :key="p.id"
                      class="border-b last:border-0"
                    >
                      <td class="py-1">{{ p.name }}</td>
                      <td class="py-1 font-mono">{{ p.code }}</td>
                      <td class="py-1 text-gray-600">
                        {{ p.drawn_name || "-" }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.transform-rotate-y-180 {
  transform: rotateY(180deg);
}

.flip-card-inner {
  transition: transform 0.8s;
}

.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.border-gold {
  border-color: #ffd700;
}
</style>
