<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import type { Task, PaginatedResponse } from '@/types';

const router = useRouter();
const tasks = ref<Task[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const categoryFilter = ref('');
const priceRange = ref<[number, number]>([0, 10000]);
const page = ref(1);
const hasMore = ref(true);

const categories = [
  'All',
  'Design',
  'Development',
  'Writing',
  'Music',
  'Video',
  'Consulting',
  'Other',
];

const filteredTasks = computed(() => {
  let result = tasks.value;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }
  if (categoryFilter.value && categoryFilter.value !== 'All') {
    result = result.filter((t) => t.category === categoryFilter.value);
  }
  result = result.filter(
    (t) => t.price_tk >= priceRange.value[0] && t.price_tk <= priceRange.value[1]
  );
  return result;
});

onMounted(fetchTasks);

async function fetchTasks(append: boolean = false): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  try {
    if (!append) page.value = 1;
    const { data } = await api.get<PaginatedResponse<Task>>('/tasks/', {
      params: { page: page.value, limit: 20 },
    });
    const items = data.streams ?? data.items ?? [];
    if (append) {
      tasks.value.push(...items);
    } else {
      tasks.value = items;
    }
    hasMore.value = page.value < data.pages;
    page.value++;
  } catch {
    tasks.value = [];
  } finally {
    loading.value = false;
  }
}

function goToTask(taskId: string): void {
  router.push(`/tasks/${taskId}`);
}

function goToCreateTask(): void {
  router.push('/tasks/create');
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'green',
    bidding: 'blue',
    in_progress: 'orange',
    completed: 'gray',
    disputed: 'red',
  };
  return colors[status] || 'gray';
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Tasks</h1>
        <p class="text-gray-400 text-sm mt-0.5">Browse and bid on creator tasks</p>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="space-y-3 mb-6">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search tasks..."
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        density="compact"
        hide-details
        flat
        bg-color="#2D2D2D"
        rounded="lg"
      />

      <div class="flex gap-2 flex-wrap">
        <v-select
          v-model="categoryFilter"
          :items="categories"
          label="Category"
          density="compact"
          variant="solo-filled"
          hide-details
          flat
          bg-color="#2D2D2D"
          class="max-w-[160px]"
          rounded="lg"
        />

        <div class="flex-1 min-w-[200px]">
          <v-range-slider
            v-model="priceRange"
            :min="0"
            :max="10000"
            :step="100"
            thumb-label
            color="rogan-primary"
          >
            <template #thumb-label="{ modelValue }">
              {{ modelValue }} TK
            </template>
          </v-range-slider>
        </div>
      </div>
    </div>

    <!-- Task List -->
    <div v-if="loading && tasks.length === 0" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="filteredTasks.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-clipboard-text-outline</v-icon>
      <p class="text-gray-500 mt-3">No tasks found</p>
    </div>

    <div v-else class="space-y-3">
      <v-card
        v-for="task in filteredTasks"
        :key="task.id"
        class="bg-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:bg-[#252525] transition-colors"
        @click="goToTask(task.id)"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-white font-medium text-sm truncate">{{ task.title }}</h3>
            <p class="text-gray-500 text-xs mt-0.5">{{ task.category }}</p>
          </div>
          <v-chip :color="statusColor(task.status)" size="x-small" variant="flat" class="ml-2 flex-shrink-0">
            {{ task.status.replace('_', ' ') }}
          </v-chip>
        </div>

        <p class="text-gray-400 text-xs line-clamp-2 mb-3">{{ task.description }}</p>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <v-avatar size="24">
              <v-img v-if="task.creator.avatar" :src="task.creator.avatar" />
              <v-icon v-else size="16">mdi-account</v-icon>
            </v-avatar>
            <span class="text-gray-400 text-xs">{{ task.creator.display_name }}</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-amber-400 text-sm font-bold flex items-center gap-1">
              <v-icon size="14">mdi-diamond-stone</v-icon>
              {{ task.price_tk }} TK
            </span>
            <span class="text-gray-500 text-xs flex items-center gap-1">
              <v-icon size="12">mdi-clock-outline</v-icon>
              {{ new Date(task.deadline).toLocaleDateString() }}
            </span>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="text-center mt-6">
      <v-btn variant="outlined" rounded="lg" @click="fetchTasks(true)" :loading="loading">
        Load More
      </v-btn>
    </div>

    <!-- FAB: Create Task -->
    <v-btn
      icon
      size="large"
      color="rogan-primary"
      class="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-30"
      @click="goToCreateTask"
    >
      <v-icon size="28">mdi-plus</v-icon>
    </v-btn>
  </div>
</template>
