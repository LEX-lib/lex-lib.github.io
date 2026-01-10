<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { pb } from '@/lib/pocketbase';
import { toast } from 'vue-sonner';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isSuperUser = computed(() => authStore.isLoggedIn);

const loading = ref(false);
const participants = ref<any[]>([]);
const participantsCount = ref(0);
const lobbies = ref<any[]>([]);
const selectedLobby = ref<any>(null);
const showCreateLobby = ref(false);
const newLobbyName = ref('');
const newLobbyCode = ref('');
const newLobbyDeadline = ref('');

const baseUrl = computed(() => window.location.origin);

const fetchLobbies = async () => {
  if (!isSuperUser.value) return;
  try {
    lobbies.value = await pb.collection('lobbies').getFullList({
      sort: '-created'
    });
  } catch (e) {
    console.error("Error fetching lobbies", e);
  }
};

const selectLobby = async (lobby: any) => {
  loading.value = true;
  selectedLobby.value = lobby;
  await fetchParticipants();
  await fetchStats();
  loading.value = false;
  
  // Scroll to participants section
  setTimeout(() => {
    const participantsSection = document.getElementById('participants-section');
    if (participantsSection) {
      participantsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const fetchStats = async () => {
  if (!selectedLobby.value) return;
  
  try {
    const result = await pb.collection('gift_exchange_participants').getList(1, 1, {
      filter: `lobby="${selectedLobby.value.id}"`,
      '$autoCancel': false
    });
    participantsCount.value = result.totalItems;
  } catch (e) {
    console.error("Error fetching stats", e);
  }
};

const fetchParticipants = async () => {
    if (!isSuperUser.value || !selectedLobby.value) return;
    try {
        participants.value = await pb.collection('gift_exchange_participants').getFullList({
            filter: `lobby="${selectedLobby.value.id}"`,
            sort: '-created'
        });
    } catch (e) {
        console.error("Error fetching participants", e);
    }
}

const generateLobbyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const length = Math.floor(Math.random() * 5) + 6; // Random length between 6-10
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const createLobby = async () => {
  if (!newLobbyName.value) {
    toast.error("Please enter a lobby name");
    return;
  }
  
  loading.value = true;
  try {
    // Use custom code if provided, otherwise generate one
    const lobbyCode = newLobbyCode.value.trim() 
      ? newLobbyCode.value.toUpperCase() 
      : generateLobbyCode();
    
    const lobby = await pb.collection('lobbies').create({
      lobby_name: newLobbyName.value,
      lobby_code: lobbyCode,
      enrollment_deadline: newLobbyDeadline.value || null,
      drawing_started: false
    });
    
    toast.success(`Lobby created! Code: ${lobbyCode}`);
    newLobbyName.value = '';
    newLobbyCode.value = '';
    newLobbyDeadline.value = '';
    showCreateLobby.value = false;
    
    await fetchLobbies();
    selectedLobby.value = lobby;
    await fetchParticipants();
  } catch (e: any) {
    toast.error("Error creating lobby: " + e.message);
  } finally {
    loading.value = false;
  }
};

const generatePairs = async () => {
  if (!selectedLobby.value) {
    toast.error("Please select a lobby first");
    return;
  }
  
  loading.value = true;
  try {
    const records = await pb.collection('gift_exchange_participants').getFullList({
      filter: `lobby="${selectedLobby.value.id}"`
    });
    
    if (records.length < 2) {
      toast.error("Not enough participants to generate pairs.");
      return;
    }

    let shuffled = [...records];
    let isValid = false;
    
    // Simple derangement shuffle
    for(let i=0; i<100; i++) {
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
        toast.error("Failed to generate valid pairs (Derangement failed). Try again.");
        return;
    }

    // Update records
    const promises = records.map((record, index) => {
        return pb.collection('gift_exchange_participants').update(record.id, {
            drawn_name: shuffled[index].name
        });
    });

    await Promise.all(promises);
    
    // Set drawing_started flag for this lobby
    await pb.collection('lobbies').update(selectedLobby.value.id, {
      drawing_started: true
    });
    
    // Refresh lobby data
    selectedLobby.value.drawing_started = true;
    
    toast.success("Drawing Event Started! Users can now draw.");
    
    await fetchParticipants();

  } catch (e: any) {
    toast.error("Error generating pairs: " + e.message);
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  } catch (e) {
    toast.error("Failed to copy link");
  }
};

const deleteLobby = async (lobby: any) => {
  if (!confirm(`Are you sure you want to delete "${lobby.lobby_name}"? This will also delete all participants in this lobby.`)) {
    return;
  }
  
  loading.value = true;
  try {
    // First, delete all participants in this lobby
    const participantsToDelete = await pb.collection('gift_exchange_participants').getFullList({
      filter: `lobby="${lobby.id}"`
    });
    
    const deletePromises = participantsToDelete.map(p => 
      pb.collection('gift_exchange_participants').delete(p.id)
    );
    
    await Promise.all(deletePromises);
    
    // Then delete the lobby itself
    await pb.collection('lobbies').delete(lobby.id);
    
    toast.success(`Lobby "${lobby.lobby_name}" deleted successfully`);
    
    // Clear selection if deleted lobby was selected
    if (selectedLobby.value?.id === lobby.id) {
      selectedLobby.value = null;
      participants.value = [];
      participantsCount.value = 0;
    }
    
    // Refresh lobby list
    await fetchLobbies();
  } catch (e: any) {
    toast.error("Error deleting lobby: " + e.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isSuperUser.value) {
      fetchLobbies();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
    <div class="max-w-6xl w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
      <div class="p-8">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-2 tracking-tight">MonitoX</h1>
          <h2 class="text-xl font-semibold text-gray-600">Admin Management</h2>
        </div>

        <div v-if="!isSuperUser" class="py-12 text-center">
            <div class="text-red-500 text-5xl mb-4">
                <i class="pi pi-lock"></i>
            </div>
            <h3 class="text-2xl font-bold mb-2">Access Denied</h3>
            <p class="text-gray-600">You must be logged in as a superuser to access this page.</p>
            <RouterLink to="/login" class="mt-4 inline-block text-blue-600 underline">Go to Login</RouterLink>
        </div>

        <div v-else class="space-y-6">
            <!-- Lobby Selection -->
            <div class="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold">Select Lobby</h3>
                    <button @click="showCreateLobby = !showCreateLobby" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        {{ showCreateLobby ? 'Cancel' : '+ Create New Lobby' }}
                    </button>
                </div>
                
                <!-- Create Lobby Form -->
                <div v-if="showCreateLobby" class="mb-4 p-4 bg-white rounded-lg border border-blue-200">
                    <h4 class="font-bold mb-3">Create New Lobby</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Lobby Name</label>
                            <input v-model="newLobbyName" type="text" placeholder="Engineering Team 2024" class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Lobby Code (Optional)</label>
                            <input v-model="newLobbyCode" type="text" placeholder="Leave blank to auto-generate" maxlength="10" class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono" />
                            <p class="text-xs text-gray-500 mt-1">Leave blank to auto-generate a random code</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Enrollment Deadline (Optional)</label>
                            <input v-model="newLobbyDeadline" type="datetime-local" class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <button @click="createLobby" :disabled="loading" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            {{ loading ? 'Creating...' : 'Create Lobby' }}
                        </button>
                    </div>
                </div>
                
                <!-- Lobby List -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div v-for="lobby in lobbies" :key="lobby.id" 
                         class="p-4 rounded-lg border-2 transition-all hover:shadow-md relative group"
                         :class="selectedLobby?.id === lobby.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
                        <div @click="selectLobby(lobby)" class="cursor-pointer">
                            <div class="font-bold text-gray-800">{{ lobby.lobby_name }}</div>
                            <div class="text-sm text-gray-500 font-mono mt-1">Code: {{ lobby.lobby_code }}</div>
                            <div class="text-xs text-gray-400 mt-2">
                                <span v-if="lobby.drawing_started" class="text-green-600">✓ Drawing Started</span>
                                <span v-else class="text-yellow-600">⏳ Enrollment Open</span>
                            </div>
                        </div>
                        
                        <!-- Delete Button -->
                        <button 
                            @click.stop="deleteLobby(lobby)"
                            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg"
                            title="Delete lobby">
                            <i class="pi pi-trash text-xs"></i>
                        </button>
                        
                        <div v-if="loading && selectedLobby?.id === lobby.id" class="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded-lg">
                            <i class="pi pi-spin pi-spinner text-blue-600 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div v-if="lobbies.length === 0" class="col-span-full text-center text-gray-500 py-8">
                        No lobbies yet. Create one to get started!
                    </div>
                </div>
            </div>

            <!-- Lobby Management -->
            <div v-if="selectedLobby" id="participants-section" class="scroll-mt-4">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-lg font-bold">{{ selectedLobby.lobby_name }}</h3>
                        <p class="text-sm text-gray-500">{{ participantsCount }} participants enrolled</p>
                    </div>
                    <button @click="generatePairs" :disabled="loading || selectedLobby.drawing_started" class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ loading ? 'Shuffling...' : selectedLobby.drawing_started ? 'Drawing Started' : 'Start Drawing Event' }}
                    </button>
                </div>

                <!-- Shareable Links -->
                <div class="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
                    <h4 class="font-bold text-sm text-blue-900 mb-2">📤 Share These Links</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2">
                            <span class="text-blue-700 font-medium w-20">Join:</span>
                            <code class="flex-1 bg-white px-2 py-1 rounded border border-blue-200 text-xs">{{ baseUrl }}/projects/gift-exchange/join?lobby={{ selectedLobby.lobby_code }}</code>
                            <button @click="copyToClipboard(`${baseUrl}/projects/gift-exchange/join?lobby=${selectedLobby.lobby_code}`)" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">Copy</button>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-blue-700 font-medium w-20">Draw:</span>
                            <code class="flex-1 bg-white px-2 py-1 rounded border border-blue-200 text-xs">{{ baseUrl }}/projects/gift-exchange/draw?lobby={{ selectedLobby.lobby_code }}</code>
                            <button @click="copyToClipboard(`${baseUrl}/projects/gift-exchange/draw?lobby=${selectedLobby.lobby_code}`)" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <table class="w-full text-left">
                        <thead class="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th class="p-4 font-bold text-gray-600">Name</th>
                                <th class="p-4 font-bold text-gray-600">Code</th>
                                <th class="p-4 font-bold text-gray-600">Target (Gift Receiver)</th>
                                <th class="p-4 font-bold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in participants" :key="p.id" class="border-b border-gray-100 hover:bg-white transition-colors">
                                <td class="p-4 font-medium">{{ p.name }}</td>
                                <td class="p-4 font-mono text-gray-500">{{ p.code }}</td>
                                <td class="p-4">
                                    <span v-if="p.drawn_name" class="text-green-600 font-medium">{{ p.drawn_name }}</span>
                                    <span v-else class="text-gray-400 italic">Not assigned</span>
                                </td>
                                <td class="p-4">
                                    <span v-if="p.drawn_name" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Ready
                                    </span>
                                    <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Waiting
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="participants.length === 0">
                                <td colspan="4" class="p-8 text-center text-gray-500">No participants yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>
