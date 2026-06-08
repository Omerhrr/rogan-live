<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Hls from 'hls.js';

const props = withDefaults(defineProps<{
  src: string;
  autoplay?: boolean;
  muted?: boolean;
}>(), {
  autoplay: true,
  muted: true,
});

const emit = defineEmits<{
  (e: 'playing'): void;
  (e: 'error', error: Error): void;
  (e: 'latency', latencyMs: number): void;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const hlsInstance = ref<Hls | null>(null);
const isPlaying = ref(false);
const currentLatency = ref(0);
const isFullscreen = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const containerEl = ref<HTMLDivElement | null>(null);
let latencyInterval: ReturnType<typeof setInterval> | null = null;

const latencyDisplay = computed(() => {
  if (currentLatency.value <= 0) return '';
  if (currentLatency.value < 1000) return `${Math.round(currentLatency.value)}ms`;
  return `${(currentLatency.value / 1000).toFixed(1)}s`;
});

const latencyColor = computed(() => {
  if (currentLatency.value <= 3000) return 'green';
  if (currentLatency.value <= 6000) return 'yellow';
  return 'red';
});

function initPlayer(): void {
  if (!videoEl.value || !props.src) return;

  if (Hls.isSupported()) {
    hlsInstance.value = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 6,
      liveDurationInfinity: true,
      backBufferLength: 90,
    });

    hlsInstance.value.loadSource(props.src);
    hlsInstance.value.attachMedia(videoEl.value);

    hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.autoplay) {
        videoEl.value?.play().catch(() => {});
      }
    });

    hlsInstance.value.on(Hls.Events.FRAG_LOADED, () => {
      updateLatency();
    });

    hlsInstance.value.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hlsInstance.value?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hlsInstance.value?.recoverMediaError();
            break;
          default:
            hasError.value = true;
            errorMessage.value = 'Stream playback error';
            emit('error', new Error(data.details));
            hlsInstance.value?.destroy();
            break;
        }
      }
    });
  } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS support
    videoEl.value.src = props.src;
    if (props.autoplay) {
      videoEl.value.play().catch(() => {});
    }
  } else {
    hasError.value = true;
    errorMessage.value = 'HLS not supported in this browser';
    emit('error', new Error('HLS not supported'));
  }

  // Start latency monitoring
  latencyInterval = setInterval(updateLatency, 1000);
}

function updateLatency(): void {
  if (!videoEl.value) return;
  const video = videoEl.value as HTMLVideoElement & { getVideoPlaybackQuality?: () => { creationTime: number } };
  if (video.readyState >= 2 && video.duration !== Infinity) {
    const latency = (video.duration - video.currentTime) * 1000;
    currentLatency.value = latency;
    emit('latency', latency);
  }
}

function destroyPlayer(): void {
  if (latencyInterval) {
    clearInterval(latencyInterval);
    latencyInterval = null;
  }
  if (hlsInstance.value) {
    hlsInstance.value.destroy();
    hlsInstance.value = null;
  }
  if (videoEl.value) {
    videoEl.value.pause();
    videoEl.value.removeAttribute('src');
    videoEl.value.load();
  }
}

async function toggleFullscreen(): Promise<void> {
  if (!containerEl.value) return;

  try {
    if (!document.fullscreenElement) {
      await containerEl.value.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch {
    // Fullscreen not supported
  }
}

function handlePlaying(): void {
  isPlaying.value = true;
  emit('playing');
}

function handlePause(): void {
  isPlaying.value = false;
}

watch(() => props.src, () => {
  destroyPlayer();
  hasError.value = false;
  errorMessage.value = '';
  initPlayer();
});

onMounted(() => {
  initPlayer();

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  destroyPlayer();
});
</script>

<template>
  <div
    ref="containerEl"
    class="player-container relative bg-black overflow-hidden"
    :class="$attrs.class"
  >
    <!-- Video Element -->
    <video
      ref="videoEl"
      class="w-full h-full object-contain"
      :class="isFullscreen ? 'object-contain' : 'object-cover lg:object-contain'"
      playsinline
      :muted="muted"
      @playing="handlePlaying"
      @pause="handlePause"
    />

    <!-- Latency Indicator Overlay -->
    <div
      v-if="isPlaying && currentLatency > 0"
      class="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md"
    >
      <div
        class="w-1.5 h-1.5 rounded-full"
        :class="latencyColor === 'green' ? 'bg-green-400' : latencyColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'"
      />
      <span class="text-white text-[10px] font-mono">{{ latencyDisplay }}</span>
    </div>

    <!-- Live Badge -->
    <div
      v-if="isPlaying"
      class="absolute top-2 left-2 z-20 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded"
    >
      <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      <span class="text-white text-[10px] font-bold">LIVE</span>
    </div>

    <!-- Fullscreen Toggle -->
    <v-btn
      icon
      variant="text"
      size="small"
      class="absolute bottom-2 right-2 z-20 bg-black/40"
      @click="toggleFullscreen"
    >
      <v-icon color="white" size="20">
        {{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}
      </v-icon>
    </v-btn>

    <!-- Error State -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30"
    >
      <v-icon size="48" color="red">mdi-alert-circle</v-icon>
      <p class="text-white text-sm mt-2">{{ errorMessage }}</p>
      <v-btn size="small" color="rogan-primary" class="mt-3" @click="destroyPlayer(); hasError = false; initPlayer()">
        Retry
      </v-btn>
    </div>

    <!-- Loading State -->
    <div
      v-if="!isPlaying && !hasError"
      class="absolute inset-0 flex items-center justify-center z-10"
    >
      <v-progress-circular indeterminate color="rogan-primary" size="40" />
    </div>
  </div>
</template>

<style scoped>
.player-container {
  aspect-ratio: 16 / 9;
}

@media (max-width: 640px) {
  .player-container {
    aspect-ratio: auto;
    width: 100%;
    height: 100%;
  }
}
</style>
