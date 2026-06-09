<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFeedStore } from '@/stores/feed';
import { useChatStore } from '@/stores/chat';
import StreamCard from '@/components/feed/StreamCard.vue';
import StreamOverlay from '@/components/feed/StreamOverlay.vue';
import GiftAnimation from '@/components/common/GiftAnimation.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const feedStore = useFeedStore();
const chatStore = useChatStore();

const touchStartY = ref(0);
const touchStartX = ref(0);
const touchDeltaY = ref(0);
const isSwiping = ref(false);
const containerEl = ref<HTMLDivElement | null>(null);

const currentStream = computed(() => feedStore.currentStream);
const giftAnimations = computed(() => chatStore.giftAnimations);

onMounted(async () => {
  if (feedStore.streams.length === 0) {
    await feedStore.fetchLiveStreams();
  }
  if (currentStream.value) {
    chatStore.connectToStream(currentStream.value.id);
  }
});

onUnmounted(() => {
  if (currentStream.value) {
    chatStore.disconnectFromStream(currentStream.value.id);
  }
});

// Watch for stream index changes to connect/disconnect websocket
let previousStreamId: string | null = null;

function onStreamChanged(): void {
  const stream = currentStream.value;
  if (!stream) return;

  if (previousStreamId && previousStreamId !== stream.id) {
    chatStore.disconnectFromStream(previousStreamId);
  }

  chatStore.connectToStream(stream.id);
  previousStreamId = stream.id;
}

// Touch handling for vertical swipe
function handleTouchStart(e: TouchEvent): void {
  touchStartY.value = e.touches[0].clientY;
  touchStartX.value = e.touches[0].clientX;
  isSwiping.value = true;
}

function handleTouchMove(e: TouchEvent): void {
  if (!isSwiping.value) return;
  touchDeltaY.value = e.touches[0].clientY - touchStartY.value;
}

function handleTouchEnd(e: TouchEvent): void {
  if (!isSwiping.value) return;
  isSwiping.value = false;

  const threshold = 80;
  const endX = e.changedTouches?.[0]?.clientX ?? 0;
  const deltaX = Math.abs(endX - touchStartX.value);

  // Only handle vertical swipes (not horizontal)
  if (deltaX > 100) {
    touchDeltaY.value = 0;
    return;
  }

  if (touchDeltaY.value < -threshold) {
    // Swipe up -> next stream
    feedStore.nextStream();
    onStreamChanged();
  } else if (touchDeltaY.value > threshold) {
    // Swipe down -> prev stream
    feedStore.prevStream();
    onStreamChanged();
  }

  touchDeltaY.value = 0;
}

// Mouse wheel for desktop
function handleWheel(e: WheelEvent): void {
  e.preventDefault();
  if (e.deltaY > 30) {
    feedStore.nextStream();
    onStreamChanged();
  } else if (e.deltaY < -30) {
    feedStore.prevStream();
    onStreamChanged();
  }
}

function goToLiveRoom(): void {
  if (currentStream.value) {
    router.push(`/live/${currentStream.value.id}`);
  }
}
</script>

<template>
  <div
    ref="containerEl"
    class="feed-swipe-area fixed inset-0 bg-black overflow-hidden"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @wheel.prevent="handleWheel"
    @dblclick="goToLiveRoom"
  >
    <!-- Loading state -->
    <LoadingSpinner v-if="feedStore.loading && feedStore.streams.length === 0" text="Loading live streams..." />

    <!-- Empty state -->
    <div
      v-else-if="feedStore.streams.length === 0"
      class="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div class="w-24 h-24 rounded-full bg-rogan-primary/10 flex items-center justify-center mb-6">
        <v-icon size="48" color="rogan-primary">mdi-broadcast-off</v-icon>
      </div>
      <h2 class="text-2xl font-bold text-white mt-2">No Live Streams</h2>
      <p class="text-gray-400 mt-3 text-sm max-w-md leading-relaxed">
        Check back soon! Creators are going live all the time.
        Follow your favorite creators to get notified when they go live.
      </p>
      <v-btn
        color="rogan-primary"
        variant="flat"
        class="mt-6 font-semibold"
        @click="feedStore.fetchLiveStreams()"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Stream Cards -->
    <template v-else>
      <transition :name="touchDeltaY < 0 ? 'slide-down' : 'slide-up'">
        <div
          v-if="currentStream"
          :key="currentStream.id"
          class="absolute inset-0"
          :style="{
            transform: isSwiping ? `translateY(${touchDeltaY * 0.3}px)` : 'translateY(0)',
            transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }"
        >
          <StreamCard
            :stream="currentStream"
            :is-active="true"
            @tap-gift="goToLiveRoom"
            @tap-share="goToLiveRoom"
            @tap-follow="goToLiveRoom"
          />
          <StreamOverlay :stream="currentStream" />
        </div>
      </transition>
    </template>

    <!-- Gift Animations Overlay -->
    <div class="absolute inset-0 pointer-events-none z-30">
      <GiftAnimation
        v-for="anim in giftAnimations"
        :key="anim.id"
        :gift-type="anim.giftType"
        :position="{ x: anim.x, y: anim.y }"
        :sender-name="anim.senderName"
        @done="chatStore.giftAnimations = chatStore.giftAnimations.filter(a => a.id !== anim.id)"
      />
    </div>

    <!-- Stream indicator dots -->
    <div
      v-if="feedStore.streams.length > 1"
      class="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5"
    >
      <div
        v-for="(_, idx) in feedStore.streams.slice(0, 10)"
        :key="idx"
        class="w-1.5 h-1.5 rounded-full transition-all duration-300"
        :class="idx === feedStore.currentStreamIndex ? 'bg-rogan-primary h-4' : 'bg-white/30'"
      />
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-up-enter-from {
  transform: translateY(100%);
}
.slide-up-leave-to {
  transform: translateY(-30%);
  opacity: 0.5;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-down-enter-from {
  transform: translateY(-100%);
}
.slide-down-leave-to {
  transform: translateY(30%);
  opacity: 0.5;
}
</style>
