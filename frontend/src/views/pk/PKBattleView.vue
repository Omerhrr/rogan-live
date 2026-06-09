<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePKStore } from '@/stores/pk';
import { useAuthStore } from '@/stores/auth';
import PlayerHLS from '@/components/live/PlayerHLS.vue';
import PKScoreBar from '@/components/pk/PKScoreBar.vue';
import GiftPanel from '@/components/live/GiftPanel.vue';
import type { GiftType } from '@/types';

const route = useRoute();
const router = useRouter();
const pkStore = usePKStore();
const authStore = useAuthStore();

const battleId = computed(() => route.params.id as string);
const showGiftPanel = ref(false);
const giftTarget = ref<'a' | 'b'>('a');
const remainingSeconds = ref(0);
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const battle = computed(() => pkStore.currentBattle);

const hlsUrlA = computed(() => {
  if (!battle.value) return '';
  return `/live/rl_${battle.value.stream_a_id}/index.m3u8`;
});

const hlsUrlB = computed(() => {
  if (!battle.value) return '';
  return `/live/rl_${battle.value.stream_b_id}/index.m3u8`;
});

const formattedTime = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60);
  const secs = remainingSeconds.value % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const isWinner = computed(() => {
  if (!battle.value || battle.value.status !== 'completed') return null;
  if (battle.value.score_a > battle.value.score_b) return 'a';
  if (battle.value.score_b > battle.value.score_a) return 'b';
  return 'tie';
});

onMounted(async () => {
  await pkStore.fetchBattle(battleId.value);
  if (battle.value?.ends_at) startCountdown();
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

function startCountdown(): void {
  if (!battle.value?.ends_at) return;
  const endTime = new Date(battle.value.ends_at).getTime();

  const update = () => {
    const now = Date.now();
    remainingSeconds.value = Math.max(0, Math.floor((endTime - now) / 1000));
    if (remainingSeconds.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval);
    }
  };

  update();
  countdownInterval = setInterval(update, 1000);
}

function openGiftPanel(target: 'a' | 'b'): void {
  giftTarget.value = target;
  showGiftPanel.value = true;
}

async function handleSendGift(giftType: GiftType, _quantity: number): Promise<void> {
  if (!battle.value) return;
  const targetId = giftTarget.value === 'a' ? battle.value.creator_a_id : battle.value.creator_b_id;
  await pkStore.sendBattleGift(battle.value.id, targetId, giftType, 1);
  showGiftPanel.value = false;
}

function goBack(): void {
  router.back();
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 bg-[#1E1E1E] border-b border-[#3D3D3D]">
      <div class="flex items-center justify-between">
        <v-btn icon variant="text" size="small" @click="goBack">
          <v-icon color="white">mdi-arrow-left</v-icon>
        </v-btn>

        <div class="text-center">
          <span class="text-rogan-primary text-lg font-black">PK BATTLE</span>
          <div v-if="battle?.status === 'live'" class="flex items-center justify-center gap-1">
            <div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span class="text-red-400 text-xs font-bold">LIVE</span>
          </div>
        </div>

        <div class="text-right">
          <span class="text-white text-sm font-mono">{{ formattedTime }}</span>
        </div>
      </div>
    </div>

    <!-- Score Bar -->
    <div v-if="battle" class="px-4 py-2 bg-[#1E1E1E]">
      <PKScoreBar
        :score-a="battle.score_a"
        :score-b="battle.score_b"
        :label-a="battle.creator_a.display_name"
        :label-b="battle.creator_b.display_name"
      />
    </div>

    <!-- Split Screen Players -->
    <div v-if="battle" class="flex-1 flex flex-col lg:flex-row min-h-0">
      <!-- Creator A -->
      <div class="flex-1 relative">
        <PlayerHLS
          v-if="hlsUrlA"
          :src="hlsUrlA"
          :autoplay="true"
          :muted="true"
          class="w-full h-full"
        />
        <!-- Creator A info -->
        <div class="absolute bottom-2 left-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          <v-avatar size="24">
            <v-img v-if="battle.creator_a.avatar" :src="battle.creator_a.avatar" />
            <v-icon v-else size="16">mdi-account</v-icon>
          </v-avatar>
          <span class="text-white text-xs font-medium">{{ battle.creator_a.display_name }}</span>
        </div>

        <!-- Gift button for A -->
        <v-btn
          icon
          size="small"
          color="cyan"
          class="absolute bottom-2 right-2 z-20"
          @click="openGiftPanel('a')"
        >
          <v-icon size="16">mdi-gift</v-icon>
        </v-btn>

        <!-- Winner overlay A -->
        <div
          v-if="isWinner === 'a'"
          class="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
        >
          <div class="text-center animate-bounce-in">
            <v-icon size="48" color="amber">mdi-crown</v-icon>
            <p class="text-white text-lg font-bold mt-2">WINNER!</p>
          </div>
        </div>
      </div>

      <!-- VS Divider -->
      <div class="flex items-center justify-center lg:w-12 bg-[#121212]">
        <span class="text-rogan-primary text-2xl font-black lg:writing-mode-vertical" style="writing-mode: vertical-rl;">VS</span>
      </div>

      <!-- Creator B -->
      <div class="flex-1 relative">
        <PlayerHLS
          v-if="hlsUrlB"
          :src="hlsUrlB"
          :autoplay="true"
          :muted="true"
          class="w-full h-full"
        />
        <!-- Creator B info -->
        <div class="absolute bottom-2 left-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          <v-avatar size="24">
            <v-img v-if="battle.creator_b.avatar" :src="battle.creator_b.avatar" />
            <v-icon v-else size="16">mdi-account</v-icon>
          </v-avatar>
          <span class="text-white text-xs font-medium">{{ battle.creator_b.display_name }}</span>
        </div>

        <!-- Gift button for B -->
        <v-btn
          icon
          size="small"
          color="amber"
          class="absolute bottom-2 right-2 z-20"
          @click="openGiftPanel('b')"
        >
          <v-icon size="16">mdi-gift</v-icon>
        </v-btn>

        <!-- Winner overlay B -->
        <div
          v-if="isWinner === 'b'"
          class="absolute inset-0 flex items-center justify-center bg-black/60 z-30"
        >
          <div class="text-center animate-bounce-in">
            <v-icon size="48" color="amber">mdi-crown</v-icon>
            <p class="text-white text-lg font-bold mt-2">WINNER!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tie overlay -->
    <div
      v-if="isWinner === 'tie'"
      class="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
    >
      <div class="text-center animate-bounce-in">
        <v-icon size="48" color="rogan-primary">mdi-handshake</v-icon>
        <p class="text-white text-lg font-bold mt-2">IT'S A TIE!</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="flex-1 flex items-center justify-center">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <!-- Gift Panel -->
    <v-dialog v-model="showGiftPanel" location="bottom" :scrim="true" max-width="500">
      <GiftPanel
        v-if="battle"
        :stream-id="giftTarget === 'a' ? battle.stream_a_id : battle.stream_b_id"
        @send="handleSendGift"
      />
    </v-dialog>
  </div>
</template>
