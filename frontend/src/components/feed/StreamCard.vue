<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Hls from 'hls.js';
import type { Stream } from '@/types';

const props = defineProps<{
  stream: Stream;
  isActive: boolean;
}>();

const emit = defineEmits<{
  'tap-gift': [];
  'tap-share': [];
  'tap-follow': [];
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const hls = ref<Hls | null>(null);
const showPlayButton = ref(true);

function initPlayer(): void {
  if (!videoEl.value || !props.stream.stream_key) return;

  destroyPlayer();

  if (Hls.isSupported()) {
    hls.value = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });
    hls.value.loadSource(`/live/${props.stream.stream_key}/index.m3u8`);
    hls.value.attachMedia(videoEl.value);
    hls.value.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.isActive) {
        videoEl.value?.play().catch(() => {
          showPlayButton.value = true;
        });
      }
    });
    hls.value.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.value?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.value?.recoverMediaError();
            break;
          default:
            destroyPlayer();
            break;
        }
      }
    });
  } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    videoEl.value.src = `/live/${props.stream.stream_key}/index.m3u8`;
    if (props.isActive) {
      videoEl.value.play().catch(() => {
        showPlayButton.value = true;
      });
    }
  }
}

function destroyPlayer(): void {
  if (hls.value) {
    hls.value.destroy();
    hls.value = null;
  }
  if (videoEl.value) {
    videoEl.value.pause();
    videoEl.value.removeAttribute('src');
    videoEl.value.load();
  }
}

function handlePlay(): void {
  showPlayButton.value = false;
  videoEl.value?.play();
}

watch(
  () => props.isActive,
  async (active) => {
    await nextTick();
    if (active) {
      initPlayer();
    } else {
      videoEl.value?.pause();
    }
  }
);

onMounted(() => {
  if (props.isActive) {
    initPlayer();
  }
});

onUnmounted(() => {
  destroyPlayer();
});
</script>

<template>
  <div class="relative w-full h-full bg-black">
    <video
      ref="videoEl"
      class="video-player"
      playsinline
      muted
      loop
      @click="handlePlay"
    />

    <!-- Play button overlay -->
    <transition name="fade">
      <div
        v-if="showPlayButton && isActive"
        class="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
        @click="handlePlay"
      >
        <v-icon size="72" color="white" class="opacity-80">mdi-play-circle</v-icon>
      </div>
    </transition>

    <!-- LIVE badge -->
    <div
      v-if="stream.is_live"
      class="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-md"
    >
      <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
      <span class="text-white text-xs font-bold tracking-wide">LIVE</span>
    </div>

    <!-- Right-side action buttons -->
    <div class="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-4">
      <button
        class="flex flex-col items-center gap-0.5 group"
        @click.stop="emit('tap-gift')"
      >
        <div class="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-rogan-primary/60 transition-colors">
          <v-icon size="22" color="white">mdi-gift</v-icon>
        </div>
        <span class="text-[10px] text-white/80">Gift</span>
      </button>

      <button
        class="flex flex-col items-center gap-0.5 group"
        @click.stop="emit('tap-share')"
      >
        <div class="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
          <v-icon size="22" color="white">mdi-share</v-icon>
        </div>
        <span class="text-[10px] text-white/80">Share</span>
      </button>

      <button
        class="flex flex-col items-center gap-0.5 group"
        @click.stop="emit('tap-follow')"
      >
        <div class="w-11 h-11 rounded-full bg-rogan-primary/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-rogan-primary transition-colors">
          <v-icon size="22" color="white">mdi-plus</v-icon>
        </div>
        <span class="text-[10px] text-white/80">Follow</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
