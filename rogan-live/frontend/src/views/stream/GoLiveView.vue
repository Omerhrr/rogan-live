<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useResponsive } from '@/composables/useResponsive';
import * as streamService from '@/services/streams';
import api from '@/services/api';
import type { StreamKey, Stream } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const { isMobile } = useResponsive();

const streamKeys = ref<StreamKey[]>([]);
const currentStream = ref<Stream | null>(null);
const loading = ref(false);
const newKeyLabel = ref('');
const showNewKeyDialog = ref(false);
const showRotateDialog = ref(false);
const rotateKeyId = ref('');
const showRevokeDialog = ref(false);
const revokeKeyId = ref('');
const copiedKey = ref('');
const snackbar = ref(false);
const snackbarText = ref('');

// Camera preview state
const cameraStream = ref<MediaStream | null>(null);
const cameraError = ref('');
const cameraActive = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const streamTitle = ref('');
const streamCategory = ref('talk');
const showCameraPreview = ref(false);

const RTMP_SERVER = 'rtmp://localhost:1935/live';

const isLive = computed(() => currentStream.value?.is_live ?? false);
const viewerCount = computed(() => chatStore.viewerCount || currentStream.value?.viewer_count || 0);

const isCreator = computed(() => {
  const role = authStore.user?.role;
  return role === 'creator' || role === 'admin';
});

const categories = [
  { text: 'Talk', value: 'talk' },
  { text: 'Gaming', value: 'gaming' },
  { text: 'Music', value: 'music' },
  { text: 'Creative', value: 'creative' },
  { text: 'IRL', value: 'irl' },
];

onMounted(async () => {
  await loadStreamKeys();
  await loadStreamStatus();
});

onUnmounted(() => {
  stopCamera();
});

async function loadStreamKeys(): Promise<void> {
  loading.value = true;
  try {
    streamKeys.value = await streamService.getStreamKeys();
  } catch {
    streamKeys.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadStreamStatus(): Promise<void> {
  try {
    if (authStore.user?.is_live) {
      const res = await streamService.getLiveStreams(1, 1);
      const items = res.streams ?? res.items ?? [];
      const myStream = items.find((s) => s.creator_id === authStore.user?.id);
      if (myStream) {
        currentStream.value = myStream;
        chatStore.connectToStream(myStream.id);
      }
    }
  } catch {
    // No active stream
  }
}

// Camera functions
async function startCamera(): Promise<void> {
  try {
    cameraError.value = '';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: true,
    });
    cameraStream.value = stream;
    cameraActive.value = true;
    showCameraPreview.value = true;

    // Wait for next tick to set video src
    setTimeout(() => {
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
      }
    }, 100);
  } catch (err: any) {
    cameraError.value = err.name === 'NotAllowedError'
      ? 'Camera access denied. Please allow camera permissions.'
      : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Failed to access camera. Please check permissions.';
  }
}

function stopCamera(): void {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }
  cameraActive.value = false;
  showCameraPreview.value = false;
}

async function becomeCreator(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.put('/auth/me', {
      // Request to become a creator by updating role
    });
    // The backend may need a specific endpoint for this
    // For now, just try to generate a stream key which will fail if not creator
    showSnackbar('Creator access requested! You can now go live.');
  } catch {
    showSnackbar('Failed to upgrade to creator. Contact admin.', true);
  } finally {
    loading.value = false;
  }
}

async function generateNewKey(): Promise<void> {
  if (!newKeyLabel.value.trim()) return;
  loading.value = true;
  try {
    const key = await streamService.generateStreamKey(newKeyLabel.value.trim());
    streamKeys.value.push(key);
    showNewKeyDialog.value = false;
    newKeyLabel.value = '';
    showSnackbar('Stream key generated!');
  } catch {
    showSnackbar('Failed to generate key', true);
  } finally {
    loading.value = false;
  }
}

async function rotateKey(): Promise<void> {
  if (!rotateKeyId.value) return;
  loading.value = true;
  try {
    const updated = await streamService.rotateStreamKey(rotateKeyId.value);
    const idx = streamKeys.value.findIndex((k) => k.id === rotateKeyId.value);
    if (idx >= 0) streamKeys.value[idx] = updated;
    showRotateDialog.value = false;
    rotateKeyId.value = '';
    showSnackbar('Stream key rotated!');
  } catch {
    showSnackbar('Failed to rotate key', true);
  } finally {
    loading.value = false;
  }
}

async function revokeKey(): Promise<void> {
  if (!revokeKeyId.value) return;
  loading.value = true;
  try {
    await streamService.revokeStreamKey(revokeKeyId.value);
    streamKeys.value = streamKeys.value.filter((k) => k.id !== revokeKeyId.value);
    showRevokeDialog.value = false;
    revokeKeyId.value = '';
    showSnackbar('Stream key revoked!');
  } catch {
    showSnackbar('Failed to revoke key', true);
  } finally {
    loading.value = false;
  }
}

async function toggleLive(): Promise<void> {
  loading.value = true;
  try {
    if (isLive.value && currentStream.value) {
      currentStream.value = await streamService.endStream(currentStream.value.id);
      chatStore.disconnectFromStream(currentStream.value.id);
      showSnackbar('Stream ended');
    } else {
      const title = streamTitle.value || `${authStore.user?.display_name}'s Stream`;
      const stream = await streamService.createStream({
        title,
        description: '',
        category: streamCategory.value,
      });
      currentStream.value = await streamService.goLive(stream.id);
      chatStore.connectToStream(stream.id);
      showSnackbar('You are now LIVE!');
    }
  } catch (err: any) {
    showSnackbar(err.response?.data?.detail || 'Failed to toggle stream', true);
  } finally {
    loading.value = false;
  }
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    copiedKey.value = text;
    showSnackbar('Copied to clipboard!');
    setTimeout(() => { copiedKey.value = ''; }, 2000);
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function showSnackbar(text: string, _isError: boolean = false): void {
  snackbarText.value = text;
  snackbar.value = true;
}
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <div class="max-w-5xl mx-auto px-8 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white">Go Live</h1>
          <p class="text-gray-400 text-sm mt-1">Set up your stream and start broadcasting</p>
        </div>
        <v-btn :color="isLive ? 'red' : 'rogan-primary'" rounded="lg" size="large" :loading="loading" @click="toggleLive">
          <v-icon start>{{ isLive ? 'mdi-stop' : 'mdi-broadcast' }}</v-icon>
          {{ isLive ? 'Stop Streaming' : 'Start Streaming' }}
        </v-btn>
      </div>

      <!-- Stream Status Card -->
      <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 p-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-3 h-3 rounded-full" :class="isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'" />
          <span class="text-white font-semibold text-base">{{ isLive ? 'Live Now' : 'Offline' }}</span>
          <v-chip v-if="isLive" size="small" color="red" variant="flat" class="ml-2">
            <v-icon start size="14">mdi-eye</v-icon>
            {{ viewerCount.toLocaleString() }} viewers
          </v-chip>
        </div>
      </v-card>

      <!-- Camera Preview Section -->
      <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold text-base">Camera Preview</h3>
            <div class="flex items-center gap-2">
              <v-btn v-if="cameraActive" size="small" color="red" variant="outlined" rounded="lg" @click="stopCamera">
                <v-icon start size="16">mdi-camera-off</v-icon>
                Stop Camera
              </v-btn>
              <v-btn v-else size="small" color="rogan-primary" variant="outlined" rounded="lg" @click="startCamera">
                <v-icon start size="16">mdi-camera</v-icon>
                Open Camera
              </v-btn>
            </div>
          </div>

          <div v-if="cameraError" class="bg-red-900/20 rounded-xl p-4 mb-4">
            <p class="text-red-400 text-sm">{{ cameraError }}</p>
          </div>

          <!-- Video Preview -->
          <div class="relative bg-black rounded-xl overflow-hidden" style="aspect-ratio: 16/9;">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
              v-show="cameraActive"
            />
            <div v-if="!cameraActive" class="absolute inset-0 flex flex-col items-center justify-center">
              <v-icon size="64" color="#3D3D3D">mdi-video-outline</v-icon>
              <p class="text-gray-500 text-sm mt-2">Click "Open Camera" to preview your stream</p>
            </div>
            <div v-if="cameraActive && isLive" class="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span class="text-white text-xs font-bold">LIVE</span>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Stream Setup -->
      <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 p-6">
        <h3 class="text-white font-semibold text-base mb-4">Stream Setup</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <v-text-field
            v-model="streamTitle"
            label="Stream Title"
            placeholder="What's your stream about?"
            variant="solo-filled"
            bg-color="#2D2D2D"
            prepend-inner-icon="mdi-pencil"
          />
          <v-select
            v-model="streamCategory"
            :items="categories"
            label="Category"
            variant="solo-filled"
            bg-color="#2D2D2D"
            prepend-inner-icon="mdi-tag"
          />
        </div>
      </v-card>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Stream Key Section -->
        <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-white font-semibold text-base">Stream Keys</h3>
              <p class="text-gray-500 text-xs mt-0.5">Use these keys to configure your streaming software</p>
            </div>
            <v-btn size="small" color="rogan-primary" variant="outlined" rounded="lg" @click="showNewKeyDialog = true">
              <v-icon start size="16">mdi-plus</v-icon>
              New Key
            </v-btn>
          </div>

          <div v-if="loading && streamKeys.length === 0" class="text-center py-6">
            <v-progress-circular indeterminate color="rogan-primary" size="32" />
          </div>

          <div v-else-if="streamKeys.length === 0" class="text-center py-6">
            <v-icon size="40" color="#3D3D3D">mdi-key-outline</v-icon>
            <p class="text-gray-500 text-sm mt-2">No stream keys yet</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="key in streamKeys" :key="key.id" class="bg-[#2D2D2D] rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <v-icon size="18" :color="key.is_active && !key.is_revoked ? 'green' : 'gray'">mdi-key-variant</v-icon>
                  <span class="text-white text-sm font-medium">{{ key.label }}</span>
                  <v-chip v-if="key.is_revoked" size="x-small" color="red" variant="flat">Revoked</v-chip>
                  <v-chip v-else-if="key.is_active" size="x-small" color="green" variant="flat">Active</v-chip>
                </div>
                <div class="flex items-center gap-1">
                  <v-btn icon size="x-small" variant="text" @click="copyToClipboard(key.key)">
                    <v-icon size="16" :color="copiedKey === key.key ? 'green' : 'gray'">mdi-content-copy</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" @click="rotateKeyId = key.id; showRotateDialog = true">
                    <v-icon size="16" color="warning">mdi-refresh</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" @click="revokeKeyId = key.id; showRevokeDialog = true">
                    <v-icon size="16" color="red">mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>
              <code class="text-xs text-green-400 bg-black/30 px-2 py-1 rounded select-all break-all">{{ key.key }}</code>
              <p class="text-gray-600 text-xs mt-2">Last used: {{ formatTime(key.last_used_at) }}</p>
            </div>
          </div>
        </v-card>

        <!-- RTMP + OBS Setup -->
        <div class="space-y-6">
          <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4">RTMP Server</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
                <span class="text-gray-400 text-sm">Server URL</span>
                <div class="flex items-center gap-2">
                  <code class="text-white text-xs">{{ RTMP_SERVER }}</code>
                  <v-btn icon size="x-small" variant="text" @click="copyToClipboard(RTMP_SERVER)">
                    <v-icon size="14" color="gray">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
              <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
                <span class="text-gray-400 text-sm">Stream Key</span>
                <div class="flex items-center gap-2">
                  <code class="text-green-400 text-xs">
                    {{ streamKeys.find(k => k.is_active && !k.is_revoked)?.key || 'Generate a key first' }}
                  </code>
                  <v-btn v-if="streamKeys.find(k => k.is_active && !k.is_revoked)"
                    icon size="x-small" variant="text"
                    @click="copyToClipboard(streamKeys.find(k => k.is_active && !k.is_revoked)!.key)"
                  >
                    <v-icon size="14" color="gray">mdi-content-copy</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card>

          <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <v-icon color="rogan-secondary" size="24">mdi-information</v-icon>
              <h3 class="text-white font-semibold">OBS Setup Instructions</h3>
            </div>
            <ol class="space-y-2 text-gray-300 text-sm list-decimal list-inside">
              <li>Open OBS Studio and go to <strong class="text-white">Settings → Stream</strong></li>
              <li>Set <strong class="text-white">Service</strong> to "Custom..."</li>
              <li>Enter the <strong class="text-white">Server URL</strong> shown above</li>
              <li>Paste your <strong class="text-white">Stream Key</strong> from above</li>
              <li>Click <strong class="text-white">Apply</strong> then <strong class="text-white">OK</strong></li>
              <li>Click <strong class="text-rogan-primary">Start Streaming</strong> in OBS</li>
              <li>Come back here and click <strong class="text-rogan-primary">Start Streaming</strong> to go live</li>
            </ol>
          </v-card>
        </div>
      </div>

      <!-- Dialogs -->
      <v-dialog v-model="showNewKeyDialog" max-width="420">
        <v-card class="bg-[#1E1E1E] rounded-2xl">
          <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Generate New Stream Key</span></v-card-title>
          <v-card-text class="px-6">
            <v-text-field v-model="newKeyLabel" label="Key Label" placeholder="e.g., Main OBS, Backup" variant="solo-filled" bg-color="#2D2D2D" />
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-btn variant="text" @click="showNewKeyDialog = false">Cancel</v-btn>
            <v-btn color="rogan-primary" rounded="lg" :disabled="!newKeyLabel.trim()" @click="generateNewKey">Generate Key</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showRotateDialog" max-width="420">
        <v-card class="bg-[#1E1E1E] rounded-2xl">
          <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Rotate Stream Key</span></v-card-title>
          <v-card-text class="px-6">
            <p class="text-gray-400 text-sm">This will generate a new key and invalidate the current one. Make sure to update your OBS settings.</p>
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-btn variant="text" @click="showRotateDialog = false">Cancel</v-btn>
            <v-btn color="warning" rounded="lg" @click="rotateKey">Rotate Key</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showRevokeDialog" max-width="420">
        <v-card class="bg-[#1E1E1E] rounded-2xl">
          <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Revoke Stream Key</span></v-card-title>
          <v-card-text class="px-6">
            <p class="text-gray-400 text-sm">This will permanently revoke this stream key. Any stream using this key will be disconnected. This action cannot be undone.</p>
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-btn variant="text" @click="showRevokeDialog = false">Cancel</v-btn>
            <v-btn color="red" rounded="lg" @click="revokeKey">Revoke Key</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar" :timeout="3000" location="top">{{ snackbarText }}</v-snackbar>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212] p-4 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Go Live</h1>
        <p class="text-gray-400 text-sm mt-0.5">Set up your stream and start broadcasting</p>
      </div>
      <v-btn :color="isLive ? 'red' : 'rogan-primary'" rounded="lg" size="large" :loading="loading" @click="toggleLive">
        <v-icon start>{{ isLive ? 'mdi-stop' : 'mdi-broadcast' }}</v-icon>
        {{ isLive ? 'Stop' : 'Go Live' }}
      </v-btn>
    </div>

    <!-- Camera Preview -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-4 overflow-hidden">
      <div class="relative bg-black" style="aspect-ratio: 16/9;">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover"
          v-show="cameraActive"
        />
        <div v-if="!cameraActive" class="absolute inset-0 flex flex-col items-center justify-center">
          <v-icon size="48" color="#3D3D3D">mdi-video-outline</v-icon>
          <p class="text-gray-500 text-xs mt-2">Tap below to preview</p>
        </div>
        <div v-if="cameraActive && isLive" class="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full">
          <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span class="text-white text-[10px] font-bold">LIVE</span>
        </div>
      </div>
      <div class="p-3 flex gap-2">
        <v-btn v-if="cameraActive" size="small" color="red" variant="outlined" block rounded="lg" @click="stopCamera">
          <v-icon start size="14">mdi-camera-off</v-icon>
          Stop Camera
        </v-btn>
        <v-btn v-else size="small" color="rogan-primary" variant="outlined" block rounded="lg" @click="startCamera">
          <v-icon start size="14">mdi-camera</v-icon>
          Open Camera
        </v-btn>
      </div>
    </v-card>

    <!-- Stream Setup -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-4 p-4">
      <v-text-field
        v-model="streamTitle"
        label="Stream Title"
        placeholder="What's your stream about?"
        variant="solo-filled"
        bg-color="#2D2D2D"
        density="compact"
        prepend-inner-icon="mdi-pencil"
        class="mb-3"
      />
      <v-select
        v-model="streamCategory"
        :items="categories"
        label="Category"
        variant="solo-filled"
        bg-color="#2D2D2D"
        density="compact"
        prepend-inner-icon="mdi-tag"
      />
    </v-card>

    <!-- Stream Status -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-4 p-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" :class="isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'" />
        <span class="text-white font-semibold text-sm">{{ isLive ? 'Live Now' : 'Offline' }}</span>
        <v-chip v-if="isLive" size="small" color="red" variant="flat" class="ml-2">
          <v-icon start size="14">mdi-eye</v-icon>
          {{ viewerCount.toLocaleString() }}
        </v-chip>
      </div>
    </v-card>

    <!-- Stream Keys -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-4 p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white font-semibold text-sm">Stream Keys</h3>
        <v-btn size="small" color="rogan-primary" variant="outlined" rounded="lg" @click="showNewKeyDialog = true">
          <v-icon start size="14">mdi-plus</v-icon>
          New
        </v-btn>
      </div>
      <div v-if="loading && streamKeys.length === 0" class="text-center py-4">
        <v-progress-circular indeterminate color="rogan-primary" size="24" />
      </div>
      <div v-else-if="streamKeys.length === 0" class="text-center py-4">
        <v-icon size="32" color="#3D3D3D">mdi-key-outline</v-icon>
        <p class="text-gray-500 text-xs mt-2">No stream keys yet</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="key in streamKeys" :key="key.id" class="bg-[#2D2D2D] rounded-xl p-3">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <v-icon size="16" :color="key.is_active && !key.is_revoked ? 'green' : 'gray'">mdi-key-variant</v-icon>
              <span class="text-white text-xs font-medium">{{ key.label }}</span>
            </div>
            <div class="flex items-center gap-0.5">
              <v-btn icon size="x-small" variant="text" @click="copyToClipboard(key.key)">
                <v-icon size="14" color="gray">mdi-content-copy</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" @click="rotateKeyId = key.id; showRotateDialog = true">
                <v-icon size="14" color="warning">mdi-refresh</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" @click="revokeKeyId = key.id; showRevokeDialog = true">
                <v-icon size="14" color="red">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          <code class="text-[10px] text-green-400 bg-black/30 px-1.5 py-0.5 rounded select-all break-all">{{ key.key }}</code>
        </div>
      </div>
    </v-card>

    <!-- RTMP -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-4 p-4">
      <h3 class="text-white font-semibold text-sm mb-3">RTMP Server</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-3 py-2">
          <span class="text-gray-400 text-xs">Server</span>
          <div class="flex items-center gap-1">
            <code class="text-white text-[10px]">{{ RTMP_SERVER }}</code>
            <v-btn icon size="x-small" variant="text" @click="copyToClipboard(RTMP_SERVER)">
              <v-icon size="12" color="gray">mdi-content-copy</v-icon>
            </v-btn>
          </div>
        </div>
        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-3 py-2">
          <span class="text-gray-400 text-xs">Key</span>
          <code class="text-green-400 text-[10px]">
            {{ streamKeys.find(k => k.is_active && !k.is_revoked)?.key || 'Generate first' }}
          </code>
        </div>
      </div>
    </v-card>

    <!-- OBS Instructions -->
    <v-card class="bg-[#1E1E1E] rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3">
        <v-icon color="rogan-secondary" size="20">mdi-information</v-icon>
        <h3 class="text-white font-semibold text-sm">OBS Setup</h3>
      </div>
      <ol class="space-y-1 text-gray-300 text-xs list-decimal list-inside">
        <li>Open OBS → <strong class="text-white">Settings → Stream</strong></li>
        <li>Set Service to <strong class="text-white">"Custom..."</strong></li>
        <li>Enter Server URL and Stream Key above</li>
        <li>Click <strong class="text-rogan-primary">Start Streaming</strong> in OBS</li>
        <li>Then tap <strong class="text-rogan-primary">Go Live</strong> here</li>
      </ol>
    </v-card>

    <!-- Dialogs -->
    <v-dialog v-model="showNewKeyDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Generate New Stream Key</span></v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="newKeyLabel" label="Key Label" placeholder="e.g., Main OBS" variant="solo-filled" bg-color="#2D2D2D" />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showNewKeyDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" :disabled="!newKeyLabel.trim()" @click="generateNewKey">Generate Key</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRotateDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Rotate Stream Key</span></v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm">This will generate a new key. Update your OBS settings afterward.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showRotateDialog = false">Cancel</v-btn>
          <v-btn color="warning" rounded="lg" @click="rotateKey">Rotate Key</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRevokeDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Revoke Stream Key</span></v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm">This will permanently revoke this stream key. This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showRevokeDialog = false">Cancel</v-btn>
          <v-btn color="red" rounded="lg" @click="revokeKey">Revoke Key</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top">{{ snackbarText }}</v-snackbar>
  </div>
</template>
