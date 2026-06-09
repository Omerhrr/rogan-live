<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFeedStore } from '@/stores/feed';
import { useChatStore } from '@/stores/chat';
import { useResponsive } from '@/composables/useResponsive';
import StreamCard from '@/components/feed/StreamCard.vue';
import StreamOverlay from '@/components/feed/StreamOverlay.vue';
import GiftAnimation from '@/components/common/GiftAnimation.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const feedStore = useFeedStore();
const chatStore = useChatStore();
const { isMobile } = useResponsive();

// ── Mobile: swipe state ─────────────────────────────────────────
const touchStartY = ref(0);
const touchStartX = ref(0);
const touchDeltaY = ref(0);
const isSwiping = ref(false);
const containerEl = ref<HTMLDivElement | null>(null);

const currentStream = computed(() => feedStore.currentStream);
const giftAnimations = computed(() => chatStore.giftAnimations);

// ── Desktop: category tabs ──────────────────────────────────────
const selectedCategory = ref('all');
const categories = ['all', 'gaming', 'music', 'talk', 'creative', 'irl'];

onMounted(async () => {
  if (feedStore.streams.length === 0) {
    await feedStore.fetchLiveStreams();
  }
  if (isMobile.value && currentStream.value) {
    chatStore.connectToStream(currentStream.value.id);
  }
});

onUnmounted(() => {
  if (currentStream.value) {
    chatStore.disconnectFromStream(currentStream.value.id);
  }
});

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

// ── Mobile touch handlers ───────────────────────────────────────
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

  if (deltaX > 100) {
    touchDeltaY.value = 0;
    return;
  }

  if (touchDeltaY.value < -threshold) {
    feedStore.nextStream();
    onStreamChanged();
  } else if (touchDeltaY.value > threshold) {
    feedStore.prevStream();
    onStreamChanged();
  }
  touchDeltaY.value = 0;
}

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

function openStream(streamId: string): void {
  router.push(`/live/${streamId}`);
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- MOBILE: TikTok-style vertical swipe feed                     -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div v-if="isMobile" ref="containerEl" class="feed-swipe-area fixed inset-0 bg-black overflow-hidden"
    @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd"
    @wheel.prevent="handleWheel" @dblclick="goToLiveRoom"
  >
    <!-- Loading state -->
    <LoadingSpinner v-if="feedStore.loading && feedStore.streams.length === 0" text="Loading live streams..." />

    <!-- Empty state -->
    <div v-else-if="feedStore.streams.length === 0" class="flex flex-col items-center justify-center h-full text-center px-8">
      <div class="w-24 h-24 rounded-full bg-rogan-primary/10 flex items-center justify-center mb-6">
        <v-icon size="48" color="rogan-primary">mdi-broadcast-off</v-icon>
      </div>
      <h2 class="text-2xl font-bold text-white mt-2">No Live Streams</h2>
      <p class="text-gray-400 mt-3 text-sm max-w-md leading-relaxed">
        Check back soon! Creators are going live all the time.
      </p>
      <v-btn color="rogan-primary" variant="flat" class="mt-6 font-semibold" @click="feedStore.fetchLiveStreams()">
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Stream Cards (swipe) -->
    <template v-else>
      <transition :name="touchDeltaY < 0 ? 'slide-down' : 'slide-up'">
        <div v-if="currentStream" :key="currentStream.id" class="absolute inset-0"
          :style="{
            transform: isSwiping ? `translateY(${touchDeltaY * 0.3}px)` : 'translateY(0)',
            transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }"
        >
          <StreamCard :stream="currentStream" :is-active="true" @tap-gift="goToLiveRoom" @tap-share="goToLiveRoom" @tap-follow="goToLiveRoom" />
          <StreamOverlay :stream="currentStream" />
        </div>
      </transition>
    </template>

    <!-- Gift Animations Overlay -->
    <div class="absolute inset-0 pointer-events-none z-30">
      <GiftAnimation v-for="anim in giftAnimations" :key="anim.id" :gift-type="anim.giftType"
        :position="{ x: anim.x, y: anim.y }" :sender-name="anim.senderName"
        @done="chatStore.giftAnimations = chatStore.giftAnimations.filter(a => a.id !== anim.id)" />
    </div>

    <!-- Stream indicator dots -->
    <div v-if="feedStore.streams.length > 1" class="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
      <div v-for="(_, idx) in feedStore.streams.slice(0, 10)" :key="idx"
        class="w-1.5 h-1.5 rounded-full transition-all duration-300"
        :class="idx === feedStore.currentStreamIndex ? 'bg-rogan-primary h-4' : 'bg-white/30'" />
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- DESKTOP: Grid-based live stream browser (Twitch-style)       -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div v-else class="h-full overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-white">Live Now</h1>
          <p class="text-gray-400 text-sm mt-0.5">
            {{ feedStore.streams.length }} streams online
          </p>
        </div>
        <v-btn color="rogan-primary" rounded="lg" @click="router.push('/stream/go-live')">
          <v-icon start>mdi-broadcast</v-icon>
          Go Live
        </v-btn>
      </div>

      <!-- Category filters -->
      <div class="flex items-center gap-2 mb-2">
        <v-btn
          v-for="cat in categories"
          :key="cat"
          size="small"
          :variant="selectedCategory === cat ? 'flat' : 'outlined'"
          :color="selectedCategory === cat ? 'rogan-primary' : '#3D3D3D'"
          rounded="lg"
          class="capitalize"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </v-btn>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="feedStore.loading && feedStore.streams.length === 0" class="flex justify-center py-24">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <!-- Empty -->
    <div v-else-if="feedStore.streams.length === 0" class="flex flex-col items-center justify-center py-24 text-center px-8">
      <div class="w-20 h-20 rounded-full bg-rogan-primary/10 flex items-center justify-center mb-5">
        <v-icon size="44" color="rogan-primary">mdi-broadcast-off</v-icon>
      </div>
      <h2 class="text-xl font-bold text-white">No Live Streams</h2>
      <p class="text-gray-400 mt-2 text-sm max-w-md">Check back soon! Creators are going live all the time.</p>
      <v-btn color="rogan-primary" variant="flat" class="mt-5" @click="feedStore.fetchLiveStreams()">
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Stream Grid -->
    <div v-else class="px-8 pb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div
          v-for="stream in feedStore.streams"
          :key="stream.id"
          class="group cursor-pointer"
          @click="openStream(stream.id)"
        >
          <!-- Thumbnail / Preview -->
          <div class="relative aspect-video rounded-xl overflow-hidden bg-[#1E1E1E] mb-3">
            <!-- Video preview (attempt HLS) or placeholder -->
            <div class="absolute inset-0 bg-gradient-to-br from-[#1E1E1E] to-[#2D2D2D] flex items-center justify-center">
              <v-icon size="48" color="#3D3D3D">mdi-broadcast</v-icon>
            </div>

            <!-- LIVE badge -->
            <div v-if="stream.is_live" class="absolute top-2.5 left-2.5 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-md z-10">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span class="text-white text-[11px] font-bold tracking-wide">LIVE</span>
            </div>

            <!-- Viewer count -->
            <div class="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md z-10">
              <v-icon size="12" color="white">mdi-eye</v-icon>
              <span class="text-white text-[11px] font-medium">{{ formatViewers(stream.viewer_count) }}</span>
            </div>

            <!-- Hover overlay -->
            <div class="absolute inset-0 bg-rogan-primary/0 group-hover:bg-rogan-primary/10 transition-colors duration-200 flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <v-icon size="56" color="white" class="drop-shadow-lg">mdi-play-circle</v-icon>
              </div>
            </div>
          </div>

          <!-- Stream Info -->
          <div class="flex gap-3">
            <v-avatar size="36" class="flex-shrink-0 ring-1 ring-white/10">
              <v-img v-if="stream.creator.avatar" :src="stream.creator.avatar" :alt="stream.creator.display_name" />
              <v-icon v-else size="20" color="white">mdi-account</v-icon>
            </v-avatar>
            <div class="min-w-0 flex-1">
              <h3 class="text-white text-sm font-semibold truncate group-hover:text-rogan-primary transition-colors">
                {{ stream.title || stream.creator.display_name + "'s Stream" }}
              </h3>
              <p class="text-gray-400 text-xs mt-0.5 truncate">
                {{ stream.creator.display_name }}
                <v-icon v-if="stream.creator.role === 'creator'" size="12" color="rogan-primary">mdi-star</v-icon>
              </p>
              <p v-if="stream.category" class="text-rogan-accent text-xs mt-0.5 truncate">
                #{{ stream.category }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="feedStore.hasMore" class="flex justify-center mt-8">
        <v-btn variant="outlined" rounded="lg" @click="feedStore.fetchLiveStreams(true)" :loading="feedStore.loading">
          Load More
        </v-btn>
      </div>
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
