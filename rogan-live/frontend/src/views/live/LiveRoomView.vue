<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useFeedStore } from '@/stores/feed';
import { useResponsive } from '@/composables/useResponsive';
import * as giftService from '@/services/gifts';
import * as moderationService from '@/services/moderation';
import PlayerHLS from '@/components/live/PlayerHLS.vue';
import ChatPanel from '@/components/live/ChatPanel.vue';
import GiftPanel from '@/components/live/GiftPanel.vue';
import GiftOverlay from '@/components/live/GiftOverlay.vue';
import type { Stream, GiftType } from '@/types';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const authStore = useAuthStore();
const feedStore = useFeedStore();
const { isMobile } = useResponsive();

const streamId = computed(() => route.params.id as string);
const stream = ref<Stream | null>(null);
const showGiftPanel = ref(false);
const loading = ref(true);
const showReportDialog = ref(false);
const reportReason = ref<'harassment' | 'spam' | 'nudity' | 'violence' | 'hate_speech' | 'other'>('other');
const reportDescription = ref('');

const viewerCount = computed(() => {
  if (chatStore.viewerCount > 0) return chatStore.viewerCount;
  return stream.value?.viewer_count ?? 0;
});

const hlsUrl = computed(() => {
  if (!stream.value) return '';
  return `/live/${stream.value.stream_key}/index.m3u8`;
});

async function loadStream(): Promise<void> {
  loading.value = true;
  const found = feedStore.streams.find((s) => s.id === streamId.value);
  if (found) {
    stream.value = found;
  } else {
    try {
      const { getStream } = await import('@/services/streams');
      stream.value = await getStream(streamId.value);
    } catch {
      // Stream not found
    }
  }
  loading.value = false;

  if (stream.value) {
    await nextTick();
    chatStore.connectToStream(stream.value.id);
  }
}

async function handleSendGift(giftType: GiftType, quantity: number): Promise<void> {
  if (!stream.value) return;
  try {
    await giftService.sendGift(stream.value.id, giftType, '');
    chatStore.addGiftAnimation(giftType, authStore.user?.username || 'You');
    showGiftPanel.value = false;
  } catch {
    // Handle error
  }
}

async function submitReport(): Promise<void> {
  if (!stream.value || !authStore.user) return;
  try {
    await moderationService.createReport({
      target_user_id: stream.value.creator_id,
      target_type: 'stream',
      target_id: stream.value.id,
      reason: reportReason.value,
      description: reportDescription.value,
    });
    showReportDialog.value = false;
    reportDescription.value = '';
  } catch {
    // Handle error
  }
}

function goBack(): void {
  router.back();
}

onMounted(() => {
  loadStream();
});

onUnmounted(() => {
  if (stream.value) {
    chatStore.disconnectFromStream(stream.value.id);
  }
});
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- DESKTOP: Full-width video with side chat panel               -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div v-if="!isMobile" class="h-full bg-[#121212] flex">
    <!-- Video Section -->
    <div class="relative flex-1 min-h-0 flex flex-col">
      <!-- Top bar with creator info -->
      <div class="flex items-center justify-between px-5 py-3 bg-[#0A0A0A] border-b border-white/5 flex-shrink-0">
        <div class="flex items-center gap-3">
          <v-btn icon variant="text" size="small" @click="goBack">
            <v-icon color="white" size="20">mdi-arrow-left</v-icon>
          </v-btn>

          <v-avatar size="40" class="border-2 border-rogan-primary">
            <v-img v-if="stream?.creator.avatar" :src="stream.creator.avatar" />
            <v-icon v-else size="24">mdi-account</v-icon>
          </v-avatar>

          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-white text-base font-semibold">
                {{ stream?.creator.display_name || 'Loading...' }}
              </span>
              <v-icon v-if="stream?.creator.role === 'creator'" size="16" color="rogan-primary">mdi-star</v-icon>
              <div v-if="stream?.is_live" class="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded ml-1">
                <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span class="text-white text-[10px] font-bold">LIVE</span>
              </div>
            </div>
            <span class="text-white/50 text-xs flex items-center gap-1">
              <v-icon size="12">mdi-eye</v-icon>
              {{ viewerCount.toLocaleString() }} watching
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <v-btn color="rogan-primary" size="small" rounded="lg" variant="flat">
            <v-icon start size="16">mdi-plus</v-icon>
            Follow
          </v-btn>
          <v-btn icon variant="text" size="small" @click="showReportDialog = true">
            <v-icon color="white/40" size="18">mdi-flag-outline</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Video Player -->
      <div class="flex-1 relative bg-black min-h-0">
        <PlayerHLS v-if="hlsUrl" :src="hlsUrl" :autoplay="true" :muted="true" class="w-full h-full" />

        <div v-else-if="loading" class="flex items-center justify-center h-full">
          <v-progress-circular indeterminate color="rogan-primary" size="48" />
        </div>

        <!-- Stream offline overlay -->
        <div v-else class="flex flex-col items-center justify-center h-full text-center px-8">
          <v-icon size="72" color="#3D3D3D">mdi-broadcast-off</v-icon>
          <p class="text-gray-400 mt-4 text-lg font-medium">Stream Offline</p>
          <p class="text-gray-500 mt-1 text-sm">This stream has ended or is not currently live.</p>
        </div>

        <!-- Gift overlay -->
        <GiftOverlay />
      </div>

      <!-- Bottom action bar (gift button) -->
      <div class="flex items-center justify-between px-5 py-2 bg-[#0A0A0A] border-t border-white/5 flex-shrink-0">
        <div class="flex items-center gap-2">
          <span v-if="stream?.title" class="text-white/70 text-sm truncate">{{ stream.title }}</span>
        </div>
        <v-btn color="rogan-primary" variant="outlined" size="small" rounded="lg" @click="showGiftPanel = true">
          <v-icon start size="16">mdi-gift</v-icon>
          Send Gift
        </v-btn>
      </div>
    </div>

    <!-- Chat Panel (side) -->
    <div class="w-[380px] flex-shrink-0 border-l border-white/5 flex flex-col">
      <ChatPanel :stream-id="streamId" />
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- MOBILE: Full-screen video with overlay chat and bottom bar   -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div v-else class="h-full bg-[#121212] flex flex-col">
    <!-- Video Section -->
    <div class="relative flex-1 min-h-0">
      <!-- Creator info bar -->
      <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div class="flex items-center gap-3">
          <v-btn icon variant="text" size="small" @click="goBack">
            <v-icon color="white">mdi-arrow-left</v-icon>
          </v-btn>

          <v-avatar size="36" class="border-2 border-rogan-primary">
            <v-img v-if="stream?.creator.avatar" :src="stream.creator.avatar" />
            <v-icon v-else size="20">mdi-account</v-icon>
          </v-avatar>

          <div>
            <div class="flex items-center gap-1">
              <span class="text-white text-sm font-semibold">
                {{ stream?.creator.display_name || 'Loading...' }}
              </span>
              <v-icon v-if="stream?.creator.role === 'creator'" size="14" color="rogan-primary">mdi-star</v-icon>
            </div>
            <span class="text-white/60 text-xs flex items-center gap-1">
              <v-icon size="12">mdi-eye</v-icon>
              {{ viewerCount.toLocaleString() }} watching
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <v-btn color="rogan-primary" size="small" rounded="lg" variant="flat">
            <v-icon start size="16">mdi-plus</v-icon>
            Follow
          </v-btn>
          <v-btn icon variant="text" size="small" @click="showReportDialog = true">
            <v-icon color="white/60" size="18">mdi-flag-outline</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- HLS Player -->
      <PlayerHLS v-if="hlsUrl" :src="hlsUrl" :autoplay="true" :muted="true" class="w-full h-full" />

      <!-- Loading -->
      <div v-else-if="loading" class="flex items-center justify-center h-full">
        <v-progress-circular indeterminate color="rogan-primary" size="48" />
      </div>

      <!-- Gift overlay -->
      <GiftOverlay />

      <!-- Mobile chat overlay -->
      <div class="absolute bottom-4 left-4 right-4 z-10">
        <div class="flex flex-col gap-1">
          <div v-for="msg in chatStore.messages.slice(-3)" :key="msg.id"
            class="px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded"
          >
            <span class="text-rogan-accent text-[11px] font-semibold">{{ msg.username }}</span>
            <span class="text-white/80 text-[11px] ml-1">{{ msg.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile bottom bar -->
    <div class="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] border-t border-[#3D3D3D]">
      <v-text-field
        placeholder="Say something..."
        density="compact" variant="solo-filled" hide-details flat bg-color="#2D2D2D"
        class="flex-1" rounded="lg"
        @keydown.enter="(_e: KeyboardEvent) => {
          const target = _e.target as HTMLInputElement;
          if (target.value.trim()) {
            chatStore.sendMessage(streamId, target.value.trim());
            target.value = '';
          }
        }"
      />
      <v-btn icon size="small" color="rogan-primary" @click="showGiftPanel = !showGiftPanel">
        <v-icon size="18">mdi-gift</v-icon>
      </v-btn>
    </div>
  </div>

  <!-- Gift Panel (shared) -->
  <v-dialog v-model="showGiftPanel" location="bottom" :scrim="true" max-width="500">
    <GiftPanel :stream-id="streamId" @send="handleSendGift" />
  </v-dialog>

  <!-- Report Dialog (shared) -->
  <v-dialog v-model="showReportDialog" max-width="420">
    <v-card class="bg-[#1E1E1E] rounded-2xl">
      <v-card-title class="pt-5 px-6">
        <span class="text-lg font-bold text-white">Report Stream</span>
      </v-card-title>
      <v-card-text class="px-6 space-y-3">
        <v-select v-model="reportReason" label="Reason"
          :items="[
            { title: 'Harassment', value: 'harassment' },
            { title: 'Spam', value: 'spam' },
            { title: 'Nudity', value: 'nudity' },
            { title: 'Violence', value: 'violence' },
            { title: 'Hate Speech', value: 'hate_speech' },
            { title: 'Other', value: 'other' },
          ]"
          variant="solo-filled" bg-color="#2D2D2D"
        />
        <v-textarea v-model="reportDescription" label="Description" placeholder="Describe the issue..."
          variant="solo-filled" bg-color="#2D2D2D" rows="3"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-btn variant="text" @click="showReportDialog = false">Cancel</v-btn>
        <v-btn color="red" rounded="lg" @click="submitReport">Submit Report</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
