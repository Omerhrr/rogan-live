<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useFeedStore } from '@/stores/feed';
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
  <div class="h-full bg-[#121212] flex flex-col lg:flex-row">
    <!-- Video Section -->
    <div class="relative flex-1 min-h-0">
      <!-- Creator info bar -->
      <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div class="flex items-center gap-3">
          <v-btn icon variant="text" size="small" @click="router.back()">
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
      <PlayerHLS
        v-if="hlsUrl"
        :src="hlsUrl"
        :autoplay="true"
        :muted="true"
        class="w-full h-full"
      />

      <!-- Loading -->
      <div v-else-if="loading" class="flex items-center justify-center h-full">
        <v-progress-circular indeterminate color="rogan-primary" size="48" />
      </div>

      <!-- Gift overlay -->
      <GiftOverlay />

      <!-- Mobile chat overlay -->
      <div class="absolute bottom-4 left-4 right-4 lg:hidden z-10">
        <div class="flex flex-col gap-1">
          <div
            v-for="msg in chatStore.messages.slice(-3)"
            :key="msg.id"
            class="px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded"
          >
            <span class="text-rogan-accent text-[11px] font-semibold">{{ msg.username }}</span>
            <span class="text-white/80 text-[11px] ml-1">{{ msg.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Panel (side on desktop) -->
    <div class="hidden lg:flex w-[360px] flex-shrink-0 border-l border-[#3D3D3D]">
      <ChatPanel :stream-id="streamId" />
    </div>

    <!-- Mobile bottom bar -->
    <div class="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] border-t border-[#3D3D3D]">
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

    <!-- Gift Panel -->
    <v-dialog v-model="showGiftPanel" location="bottom" :scrim="true" max-width="500">
      <GiftPanel :stream-id="streamId" @send="handleSendGift" />
    </v-dialog>

    <!-- Report Dialog -->
    <v-dialog v-model="showReportDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Report Stream</span></v-card-title>
        <v-card-text class="px-6 space-y-3">
          <v-select
            v-model="reportReason"
            label="Reason"
            :items="[
              { title: 'Harassment', value: 'harassment' },
              { title: 'Spam', value: 'spam' },
              { title: 'Nudity', value: 'nudity' },
              { title: 'Violence', value: 'violence' },
              { title: 'Hate Speech', value: 'hate_speech' },
              { title: 'Other', value: 'other' },
            ]"
            variant="solo-filled"
            bg-color="#2D2D2D"
          />
          <v-textarea
            v-model="reportDescription"
            label="Description"
            placeholder="Describe the issue..."
            variant="solo-filled"
            bg-color="#2D2D2D"
            rows="3"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showReportDialog = false">Cancel</v-btn>
          <v-btn color="red" rounded="lg" @click="submitReport">Submit Report</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
