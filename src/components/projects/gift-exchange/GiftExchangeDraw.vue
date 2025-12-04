<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { pb } from '@/lib/pocketbase';
import { toast } from 'vue-sonner';

const lobbyCode = ref('');
const userCode = ref('');
const name = ref('');
const drawnName = ref<string | null>(null);
const loading = ref(false);
const isFlipped = ref(false);
const isLoggedIn = ref(false);
const lobby = ref<any>(null);

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
        // Validate lobby first
        const lobbies = await pb.collection('lobbies').getFullList({
            filter: `lobby_code="${lobbyCode.value.toUpperCase()}"`
        });
        
        if (lobbies.length === 0) {
            toast.error("Invalid lobby code");
            return;
        }
        
        lobby.value = lobbies[0];
        
        // Find participant in this lobby
        const record = await pb.collection('gift_exchange_participants').getFirstListItem(
            `code="${userCode.value.toUpperCase()}" && lobby="${lobby.value.id}"`
        );
        
        if (record) {
            isLoggedIn.value = true;
            name.value = record.name;
            
            // Reset drawing state
            isFlipped.value = false;
            
            if (record.drawn_name) {
                drawnName.value = record.drawn_name;
            } else {
                drawnName.value = null;
                toast.info("Welcome back! Waiting for the drawing event to start.");
            }
        }
    } catch (e) {
        toast.error("Invalid lobby or participant code. Please try again.");
    } finally {
        loading.value = false;
    }
}

const startDrawing = async () => {
    isFlipped.value = true;
}

// Reset login state when codes change
watch([lobbyCode, userCode], () => {
    if (isLoggedIn.value) {
        isLoggedIn.value = false;
        drawnName.value = null;
    }
});

onMounted(() => {
  // Check for lobby code in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyParam = urlParams.get('lobby');
  
  if (lobbyParam) {
    lobbyCode.value = lobbyParam.toUpperCase();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900 perspective-1000">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
      <div class="p-8 text-center">
        <h1 class="text-4xl font-bold mb-2 tracking-tight">MonitoX</h1>
        <h2 class="text-xl font-semibold text-gray-600 mb-6">Draw Your Gift</h2>
        
        <div v-if="!isLoggedIn">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left space-y-4">
                <h3 class="font-bold text-lg mb-2">Already Enrolled?</h3>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Lobby Code</label>
                  <input v-model="lobbyCode" type="text" placeholder="LOBBY2024" maxlength="10" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all uppercase text-center font-mono" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Your Code</label>
                  <input v-model="userCode" type="text" placeholder="WXYZ" maxlength="4" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all uppercase tracking-widest text-center font-mono" />
                </div>
                
                <button @click="checkStatus" :disabled="loading" class="mt-4 w-full bg-white border-2 border-black text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ loading ? 'Checking...' : 'Check Status / Draw' }}
                </button>
            </div>
            
            <div class="mt-6 text-sm text-gray-500">
                Don't have a code? <RouterLink to="/projects/gift-exchange/join" class="underline text-black font-semibold">Join here</RouterLink>
            </div>
        </div>

        <div v-else>
            <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800"><strong>Lobby:</strong> {{ lobby.lobby_name }}</p>
            </div>
            
            <div v-if="!drawnName" class="py-6">
                <div class="text-yellow-500 text-5xl mb-4">
                    <i class="pi pi-clock"></i>
                </div>
                <h3 class="text-2xl font-bold mb-2">Hello, {{ name }}!</h3>
                <p class="text-gray-600 mb-6">We are still waiting for the admin to start the drawing.</p>
                
                <button @click="checkStatus" :disabled="loading" class="bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                    {{ loading ? 'Checking...' : 'Refresh Status' }}
                </button>
            </div>

            <div v-else class="py-8">
                <div class="flip-card w-full h-64 cursor-pointer" :class="{ 'flipped': isFlipped }" @click="startDrawing">
                    <div class="flip-card-inner relative w-full h-full text-center transition-transform duration-700 transform-style-3d">
                        
                        <!-- Front -->
                        <div class="flip-card-front absolute w-full h-full backface-hidden bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-6">
                            <i class="pi pi-gift text-6xl mb-4 animate-bounce"></i>
                            <h3 class="text-2xl font-bold">Tap to Open Gift</h3>
                            <p class="text-sm opacity-80 mt-2">Discover who you picked!</p>
                        </div>

                        <!-- Back -->
                        <div class="flip-card-back absolute w-full h-full backface-hidden bg-white text-black rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border-4 border-gold transform-rotate-y-180">
                            <h3 class="text-xl text-gray-500 mb-2">Hello {{ name }}, you picked:</h3>
                            <div class="text-3xl font-bold text-black mb-4 p-4 bg-gray-100 rounded-xl w-full">
                                {{ drawnName }}
                            </div>
                            <p class="text-xs text-gray-400">Shh! Keep it a secret!</p>
                        </div>
                    </div>
                </div>
                
                <button @click="isLoggedIn = false; userCode = ''; lobbyCode = ''" class="mt-8 text-sm text-gray-500 underline">
                    Logout / Enter Different Code
                </button>
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
    border-color: #FFD700;
}
</style>
