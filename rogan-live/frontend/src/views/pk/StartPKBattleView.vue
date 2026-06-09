<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePKStore } from '@/stores/pk';
import type { PKBattle, GiftType } from '@/types';

const router = useRouter();
const pkStore = usePKStore();

const opponentSearch = ref('');
const selectedDuration = ref(10);
const entryGiftType = ref<GiftType>('rose');
const entryGiftAmount = ref(1);
const loading = ref(false);
const pendingChallenges = ref<PKBattle[]>([]);

const durations = [5, 10, 15, 30];
const giftTypes: { type: GiftType; label: string; icon: string }[] = [
  { type: 'rose', label: 'Rose', icon: 'mdi-flower' },
  { type: 'heart', label: 'Heart', icon: 'mdi-heart' },
  { type: 'diamond', label: 'Diamond', icon: 'mdi-diamond-stone' },
  { type: 'rocket', label: 'Rocket', icon: 'mdi-rocket' },
  { type: 'crown', label: 'Crown', icon: 'mdi-crown' },
];

onMounted(() => {
  loadPendingChallenges();
});

async function loadPendingChallenges(): Promise<void> {
  await pkStore.fetchBattles();
  pendingChallenges.value = pkStore.pendingBattles;
}

async function sendChallenge(): Promise<void> {
  if (!opponentSearch.value.trim()) return;
  loading.value = true;
  try {
    const battle = await pkStore.createBattle({
      opponent_id: opponentSearch.value.trim(),
      duration_minutes: selectedDuration.value,
      entry_gift_type: entryGiftType.value,
      entry_gift_amount: entryGiftAmount.value,
    });
    router.push(`/pk/${battle.id}`);
  } catch {
    // Challenge failed
  } finally {
    loading.value = false;
  }
}

async function acceptChallenge(battleId: string): Promise<void> {
  loading.value = true;
  try {
    await pkStore.acceptChallenge(battleId);
    router.push(`/pk/${battleId}`);
  } finally {
    loading.value = false;
  }
}

async function declineChallenge(battleId: string): Promise<void> {
  await pkStore.declineChallenge(battleId);
  pendingChallenges.value = pendingChallenges.value.filter((b) => b.id !== battleId);
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Start PK Battle</h1>

    <!-- Challenge Form -->
    <v-card class="bg-[#1E1E1E] rounded-2xl p-5 mb-6">
      <h3 class="text-white font-semibold mb-4">Challenge a Creator</h3>

      <div class="space-y-4">
        <v-text-field
          v-model="opponentSearch"
          label="Opponent Username"
          placeholder="Enter creator's username"
          variant="solo-filled"
          bg-color="#2D2D2D"
          prepend-inner-icon="mdi-account-search"
        />

        <div>
          <label class="text-gray-400 text-sm mb-2 block">Duration</label>
          <div class="flex gap-2">
            <v-btn
              v-for="d in durations"
              :key="d"
              :variant="selectedDuration === d ? 'flat' : 'outlined'"
              :color="selectedDuration === d ? 'rogan-primary' : 'gray'"
              size="small"
              rounded="lg"
              @click="selectedDuration = d"
            >
              {{ d }} min
            </v-btn>
          </div>
        </div>

        <div>
          <label class="text-gray-400 text-sm mb-2 block">Entry Gift</label>
          <div class="flex gap-2 flex-wrap">
            <v-btn
              v-for="g in giftTypes"
              :key="g.type"
              :variant="entryGiftType === g.type ? 'flat' : 'outlined'"
              :color="entryGiftType === g.type ? 'rogan-primary' : 'gray'"
              size="small"
              rounded="lg"
              @click="entryGiftType = g.type"
            >
              <v-icon start size="16">{{ g.icon }}</v-icon>
              {{ g.label }}
            </v-btn>
          </div>
        </div>

        <v-text-field
          v-model.number="entryGiftAmount"
          type="number"
          label="Gift Amount"
          variant="solo-filled"
          bg-color="#2D2D2D"
          :min="1"
        />

        <v-btn
          color="rogan-primary"
          block
          rounded="lg"
          size="large"
          :loading="loading"
          :disabled="!opponentSearch.trim()"
          @click="sendChallenge"
        >
          <v-icon start>mdi-sword-cross</v-icon>
          Send Challenge
        </v-btn>
      </div>
    </v-card>

    <!-- Pending Challenges -->
    <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
      <h3 class="text-white font-semibold mb-4">Pending Challenges</h3>

      <div v-if="pendingChallenges.length === 0" class="text-center py-6">
        <v-icon size="36" color="#3D3D3D">mdi-sword-cross</v-icon>
        <p class="text-gray-500 text-sm mt-2">No pending challenges</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="b in pendingChallenges"
          :key="b.id"
          class="bg-[#2D2D2D] rounded-lg p-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <v-avatar size="32">
                <v-img v-if="b.creator_a.avatar" :src="b.creator_a.avatar" />
                <v-icon v-else size="20">mdi-account</v-icon>
              </v-avatar>
              <span class="text-white text-sm">{{ b.creator_a.display_name }}</span>
              <span class="text-rogan-primary text-xs font-bold mx-2">VS</span>
              <v-avatar size="32">
                <v-img v-if="b.creator_b.avatar" :src="b.creator_b.avatar" />
                <v-icon v-else size="20">mdi-account</v-icon>
              </v-avatar>
              <span class="text-white text-sm">{{ b.creator_b.display_name }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between mt-2">
            <span class="text-gray-500 text-xs">{{ b.duration_minutes }} min · {{ b.entry_gift_type }}</span>
            <div class="flex gap-2">
              <v-btn size="x-small" color="green" variant="flat" rounded="lg" @click="acceptChallenge(b.id)">
                Accept
              </v-btn>
              <v-btn size="x-small" color="red" variant="outlined" rounded="lg" @click="declineChallenge(b.id)">
                Decline
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>
