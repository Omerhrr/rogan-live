import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Stream } from '@/types';
import * as streamService from '@/services/streams';

export const useFeedStore = defineStore('feed', () => {
  const streams = ref<Stream[]>([]);
  const currentStreamIndex = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const hasMore = ref(true);

  const currentStream = computed(() => streams.value[currentStreamIndex.value] ?? null);

  /**
   * Helper to extract items from a PaginatedResponse regardless of whether
   * the backend returns them under `streams` or `items`.
   */
  function extractItems(res: { streams?: Stream[]; items?: Stream[] }): Stream[] {
    return res.streams ?? res.items ?? [];
  }

  async function fetchLiveStreams(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
      const res = await streamService.getLiveStreams(page.value, 10);
      const items = extractItems(res);
      if (page.value === 1) {
        streams.value = items;
      } else {
        streams.value.push(...items);
      }
      hasMore.value = page.value < res.pages;
      page.value++;
    } finally {
      loading.value = false;
    }
  }

  function nextStream(): void {
    if (currentStreamIndex.value < streams.value.length - 1) {
      currentStreamIndex.value++;
    }
    // Preload more streams when near the end
    if (currentStreamIndex.value >= streams.value.length - 3 && hasMore.value) {
      fetchLiveStreams();
    }
  }

  function prevStream(): void {
    if (currentStreamIndex.value > 0) {
      currentStreamIndex.value--;
    }
  }

  function reset(): void {
    streams.value = [];
    currentStreamIndex.value = 0;
    page.value = 1;
    hasMore.value = true;
  }

  return {
    streams,
    currentStreamIndex,
    loading,
    hasMore,
    currentStream,
    fetchLiveStreams,
    nextStream,
    prevStream,
    reset,
  };
});
