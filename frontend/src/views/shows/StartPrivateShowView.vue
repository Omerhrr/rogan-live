<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import type { PrivateShow, User } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const price = ref(100);
const duration = ref(30);
const maxViewers = ref(50);
const title = ref('');
const loading = ref(false);
const currentShow = ref<PrivateShow | null>(null);
const viewers = ref<User[]>([]);

const totalPossibleRevenue = computed(() => price.value * maxViewers.value);

async function startShow(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.post<PrivateShow>('/private-shows/', {
      title: title.value || `${authStore.user?.display_name}'s Private Show`,
      price_tk: price.value,
      duration_minutes: duration.value,
      max_viewers: maxViewers.value,
    });
    currentShow.value = data;
  } catch {
    // Error
  } finally {
    loading.value = false;
  }
}

async function endShow(): Promise<void> {
  if (!currentShow.value) return;
  loading.value = true;
  try {
    const { data } = await api.post<PrivateShow>(`/private-shows/${currentShow.value.id}/end`);
    currentShow.value = data;
  } catch {
    // Error
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Start Private Show</h1>
        <p class="text-gray-400 text-sm mt-0.5">Set up a paid private broadcast</p>
      </div>
      <v-btn
        v-if="currentShow?.is_active"
        color="red"
        rounded="lg"
        :loading="loading"
        @click="endShow"
      >
        <v-icon start>mdi-stop</v-icon>
        End Show
      </v-btn>
    </div>

    <!-- Active Show Status -->
    <v-card v-if="currentShow?.is_active" class="bg-[#1E1E1E] rounded-2xl mb-6 p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span class="text-white font-semibold">Private Show Active</span>
      </div>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-amber-400">{{ currentShow.current_viewers }}</p>
          <p class="text-xs text-gray-400">Viewers</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-green-400">{{ currentShow.total_revenue_tk }}</p>
          <p class="text-xs text-gray-400">Revenue (TK)</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-rogan-primary">{{ currentShow.max_viewers }}</p>
          <p class="text-xs text-gray-400">Max Viewers</p>
        </div>
      </div>
    </v-card>

    <!-- Setup Form -->
    <v-card v-else class="bg-[#1E1E1E] rounded-2xl p-5">
      <h3 class="text-white font-semibold mb-4">Show Settings</h3>

      <div class="space-y-4">
        <v-text-field
          v-model="title"
          label="Show Title"
          placeholder="Give your private show a title..."
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <div>
          <label class="text-gray-400 text-sm mb-1 block">Entry Price (TK)</label>
          <v-slider
            v-model="price"
            :min="10"
            :max="10000"
            :step="10"
            thumb-label
            color="rogan-primary"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>10 TK</span>
            <span class="text-amber-400 font-bold">{{ price }} TK</span>
            <span>10,000 TK</span>
          </div>
        </div>

        <div>
          <label class="text-gray-400 text-sm mb-1 block">Duration (minutes)</label>
          <v-slider
            v-model="duration"
            :min="5"
            :max="120"
            :step="5"
            thumb-label
            color="rogan-secondary"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>5 min</span>
            <span class="text-rogan-secondary font-bold">{{ duration }} min</span>
            <span>120 min</span>
          </div>
        </div>

        <div>
          <label class="text-gray-400 text-sm mb-1 block">Max Viewers</label>
          <v-slider
            v-model="maxViewers"
            :min="1"
            :max="500"
            :step="1"
            thumb-label
            color="info"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span class="text-info font-bold">{{ maxViewers }}</span>
            <span>500</span>
          </div>
        </div>

        <div class="bg-[#2D2D2D] rounded-xl p-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-400 text-sm">Potential Revenue</span>
            <span class="text-amber-400 font-bold">{{ totalPossibleRevenue.toLocaleString() }} TK</span>
          </div>
        </div>

        <v-btn
          color="rogan-primary"
          block
          rounded="lg"
          size="large"
          :loading="loading"
          @click="startShow"
        >
          <v-icon start>mdi-lock-outline</v-icon>
          Start Private Show
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
