<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useChatStore } from '@/stores/chat';
import api from '@/services/api';
import PlayerHLS from '@/components/live/PlayerHLS.vue';
import ChatPanel from '@/components/live/ChatPanel.vue';
import GiftPanel from '@/components/live/GiftPanel.vue';
import GiftOverlay from '@/components/live/GiftOverlay.vue';
import type { PrivateShow, GiftType } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const chatStore = useChatStore();

const showId = computed(() => route.params.id as string);
const show = ref<PrivateShow | null>(null);
const loading = ref(true);
const hasJoined = ref(false);
const showGiftPanel = ref(false);
const remainingSeconds = ref(0);
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const hlsUrl = computed(() => {
  if (!show.value) return '';
  return `/live/rl_show_${show.value.id}/index.m3u8`;
});

const canAfford = computed(() => {
  return walletStore.tkBalance >= (show.value?.price_tk ?? 0);
});

const formattedTime = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60);
  const secs = remainingSeconds.value % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

onMounted(async () => {
  await walletStore.fetchWallet();
  await loadShow();
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
  if (show.value) chatStore.disconnectFromStream(show.value.stream_id);
});

async function loadShow(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.get<PrivateShow>(`/private-shows/${showId.value}`);
    show.value = data;
    startCountdown();
  } catch {
    // Show not found
  } finally {
    loading.value = false;
  }
}

async function joinShow(): Promise<void> {
  if (!show.value || !canAfford.value) return;
  try {
    await api.post(`/private-shows/${showId.value}/join`);
    hasJoined.value = true;
    chatStore.connectToStream(show.value.stream_id);
    await walletStore.fetchWallet();
  } catch {
    // Join failed
  }
}

function startCountdown(): void {
  if (!show.value?.ends_at) return;
  const endTime = new Date(show.value.ends_at).getTime();

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

async function handleSendGift(giftType: GiftType, _quantity: number): Promise<void> {
  if (!show.value) return;
  try {
    const { sendGift } = await import('@/services/gifts');
    await sendGift(show.value.stream_id, giftType, '');
    chatStore.addGiftAnimation(giftType, authStore.user?.username || 'You');
    showGiftPanel.value = false;
  } catch {
    // Handle error
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] flex flex-col">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-[60vh]">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <template v-else-if="show">
      <!-- Video Section -->
      <div class="relative flex-1 min-h-0">
        <!-- Creator info bar -->
        <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <div class="flex items-center gap-3">
            <v-btn icon variant="text" size="small" @click="router.back()">
              <v-icon color="white">mdi-arrow-left</v-icon>
            </v-btn>

            <v-avatar size="36" class="border-2 border-rogan-primary">
              <v-img v-if="show.creator.avatar" :src="show.creator.avatar" />
              <v-icon v-else size="20">mdi-account</v-icon>
            </v-avatar>

            <div>
              <span class="text-white text-sm font-semibold">{{ show.creator.display_name }}</span>
              <div class="flex items-center gap-2 text-white/60 text-xs">
                <span class="flex items-center gap-1"><v-icon size="12">mdi-eye</v-icon> {{ show.current_viewers }}/{{ show.max_viewers }}</span>
                <span class="flex items-center gap-1"><v-icon size="12">mdi-clock-outline</v-icon> {{ formattedTime }}</span>
              </div>
            </div>
          </div>

          <!-- Private badge -->
          <v-chip color="rogan-secondary" variant="flat" size="small">
            <v-icon start size="14">mdi-lock</v-icon>
            Private Show
          </v-chip>
        </div>

        <!-- HLS Player -->
        <PlayerHLS
          v-if="hasJoined && hlsUrl"
          :src="hlsUrl"
          :autoplay="true"
          :muted="true"
          class="w-full h-full"
        />

        <!-- Paywall Overlay -->
        <div
          v-if="!hasJoined"
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30"
        >
          <v-icon size="64" color="rogan-secondary">mdi-lock-outline</v-icon>
          <h2 class="text-white text-xl font-bold mt-4">Private Show</h2>
          <p class="text-gray-400 text-sm mt-1">by {{ show.creator.display_name }}</p>

          <div class="flex items-center gap-1 mt-4">
            <v-icon size="20" color="amber">mdi-diamond-stone</v-icon>
            <span class="text-amber-400 text-2xl font-bold">{{ show.price_tk }}</span>
            <span class="text-gray-400 text-sm">TK to join</span>
          </div>

          <v-btn
            color="rogan-primary"
            rounded="lg"
            size="large"
            class="mt-6"
            :disabled="!canAfford"
            @click="joinShow"
          >
            <v-icon start>mdi-lock-open</v-icon>
            {{ canAfford ? 'Join Now' : 'Insufficient Balance' }}
          </v-btn>

          <p v-if="!canAfford" class="text-red-400 text-xs mt-2">
            You need {{ show.price_tk - walletStore.tkBalance }} more TK
          </p>
        </div>

        <!-- Gift overlay -->
        <GiftOverlay v-if="hasJoined" />
      </div>

      <!-- Chat + Gift (desktop) -->
      <div v-if="hasJoined" class="hidden lg:flex">
        <div class="w-[360px] flex-shrink-0 border-l border-[#3D3D3D]">
          <ChatPanel :stream-id="show.stream_id" />
        </div>
      </div>

      <!-- Mobile bottom bar -->
      <div v-if="hasJoined" class="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] border-t border-[#3D3D3D]">
        <v-text-field
          placeholder="Say something..."
          density="compact"
          variant="solo-filled"
          hide-details
          flat
          bg-color="#2D2D2D"
          class="flex-1"
          rounded="lg"
          @keydown.enter="(_e: KeyboardEvent) => {
            const target = _e.target as HTMLInputElement;
            if (target.value.trim() && show) {
              chatStore.sendMessage(show.stream_id, target.value.trim());
              target.value = '';
            }
          }"
        />
        <v-btn icon size="small" color="rogan-primary" @click="showGiftPanel = !showGiftPanel">
          <v-icon size="18">mdi-gift</v-icon>
        </v-btn>
      </div>

      <!-- Gift Panel -->
      <v-dialog v-model="showGiftPanel" location="bottom" :scrim="true" max-width="500">
        <GiftPanel v-if="show" :stream-id="show.stream_id" @send="handleSendGift" />
      </v-dialog>
    </template>
  </div>
</template>
