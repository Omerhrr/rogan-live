<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as streamService from '@/services/streams';
import type { StreamKey } from '@/types';

const streamKeys = ref<StreamKey[]>([]);
const loading = ref(false);
const newKeyLabel = ref('');
const showNewKeyDialog = ref(false);
const showRotateDialog = ref(false);
const rotateKeyId = ref('');
const showRevokeDialog = ref(false);
const revokeKeyId = ref('');
const copiedId = ref('');
const snackbar = ref(false);
const snackbarText = ref('');

onMounted(loadKeys);

async function loadKeys(): Promise<void> {
  loading.value = true;
  try {
    streamKeys.value = await streamService.getStreamKeys();
  } catch {
    streamKeys.value = [];
  } finally {
    loading.value = false;
  }
}

async function generateKey(): Promise<void> {
  if (!newKeyLabel.value.trim()) return;
  loading.value = true;
  try {
    const key = await streamService.generateStreamKey(newKeyLabel.value.trim());
    streamKeys.value.push(key);
    showNewKeyDialog.value = false;
    newKeyLabel.value = '';
    toast('Stream key generated!');
  } catch {
    toast('Failed to generate key');
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
    toast('Key rotated!');
  } catch {
    toast('Failed to rotate key');
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
    toast('Key revoked!');
  } catch {
    toast('Failed to revoke key');
  } finally {
    loading.value = false;
  }
}

function copyKey(key: string): void {
  navigator.clipboard.writeText(key).then(() => {
    copiedId.value = key;
    toast('Copied!');
    setTimeout(() => { copiedId.value = ''; }, 2000);
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function toast(msg: string): void {
  snackbarText.value = msg;
  snackbar.value = true;
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white">Stream Keys</h1>
      <v-btn size="small" color="rogan-primary" rounded="lg" @click="showNewKeyDialog = true">
        <v-icon start size="16">mdi-plus</v-icon>
        Generate Key
      </v-btn>
    </div>

    <div v-if="loading && streamKeys.length === 0" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="streamKeys.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-key-outline</v-icon>
      <p class="text-gray-500 mt-3">No stream keys</p>
      <p class="text-gray-600 text-sm">Generate one to start streaming</p>
    </div>

    <div v-else class="space-y-3">
      <v-card
        v-for="key in streamKeys"
        :key="key.id"
        class="bg-[#1E1E1E] rounded-xl p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <v-icon size="20" :color="key.is_active && !key.is_revoked ? 'green' : 'gray'">
              mdi-key-variant
            </v-icon>
            <span class="text-white font-medium">{{ key.label }}</span>
            <v-chip v-if="key.is_revoked" size="x-small" color="red" variant="flat">Revoked</v-chip>
            <v-chip v-else-if="key.is_active" size="x-small" color="green" variant="flat">Active</v-chip>
            <v-chip v-else size="x-small" color="gray" variant="flat">Inactive</v-chip>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-2">
          <code class="flex-1 text-xs text-rogan-accent bg-black/30 px-3 py-2 rounded select-all break-all">
            {{ key.key }}
          </code>
          <v-btn icon size="small" variant="text" @click="copyKey(key.key)">
            <v-icon size="18" :color="copiedId === key.key ? 'green' : 'gray'">mdi-content-copy</v-icon>
          </v-btn>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-gray-500 text-xs">Last used: {{ formatTime(key.last_used_at) }}</span>
          <div class="flex items-center gap-1">
            <v-btn
              size="x-small"
              variant="outlined"
              color="warning"
              rounded="lg"
              @click="rotateKeyId = key.id; showRotateDialog = true"
            >
              Rotate
            </v-btn>
            <v-btn
              size="x-small"
              variant="outlined"
              color="red"
              rounded="lg"
              @click="revokeKeyId = key.id; showRevokeDialog = true"
            >
              Revoke
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Dialogs -->
    <v-dialog v-model="showNewKeyDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">New Stream Key</span></v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="newKeyLabel" label="Label" placeholder="e.g., OBS Main" variant="solo-filled" bg-color="#2D2D2D" />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showNewKeyDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" :disabled="!newKeyLabel.trim()" @click="generateKey">Generate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRotateDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Rotate Key?</span></v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm">The old key will stop working immediately. Update your streaming software afterward.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showRotateDialog = false">Cancel</v-btn>
          <v-btn color="warning" rounded="lg" @click="rotateKey">Rotate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRevokeDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6"><span class="text-lg font-bold text-white">Revoke Key?</span></v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm">This permanently disables the key. Streams using it will be disconnected. This cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showRevokeDialog = false">Cancel</v-btn>
          <v-btn color="red" rounded="lg" @click="revokeKey">Revoke</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top">{{ snackbarText }}</v-snackbar>
  </div>
</template>
