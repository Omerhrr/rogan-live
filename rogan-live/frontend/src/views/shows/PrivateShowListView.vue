<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import PrivateShowCard from '@/components/shows/PrivateShowCard.vue';
import type { PrivateShow } from '@/types';

const router = useRouter();
const shows = ref<PrivateShow[]>([]);
const loading = ref(false);

onMounted(fetchShows);

async function fetchShows(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.get<PrivateShow[]>('/private-shows/active');
    shows.value = data;
  } catch {
    shows.value = [];
  } finally {
    loading.value = false;
  }
}

function joinShow(showId: string): void {
  router.push(`/shows/${showId}`);
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Private Shows</h1>
        <p class="text-gray-400 text-sm mt-0.5">Exclusive paid live shows from top creators</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" size="48" />
    </div>

    <div v-else-if="shows.length === 0" class="text-center py-12">
      <v-icon size="72" color="#3D3D3D">mdi-lock-outline</v-icon>
      <h2 class="text-xl font-bold text-white mt-4">No Active Private Shows</h2>
      <p class="text-gray-400 mt-2 text-sm">Check back soon for exclusive content</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <PrivateShowCard
        v-for="show in shows"
        :key="show.id"
        :show="show"
        @join="joinShow"
      />
    </div>
  </div>
</template>
