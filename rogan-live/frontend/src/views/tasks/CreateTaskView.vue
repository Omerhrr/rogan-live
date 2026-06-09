<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import type { Task } from '@/types';

const router = useRouter();

const title = ref('');
const description = ref('');
const category = ref('Other');
const price = ref(100);
const deadline = ref('');
const loading = ref(false);

const categories = [
  'Design',
  'Development',
  'Writing',
  'Music',
  'Video',
  'Consulting',
  'Other',
];

async function submitTask(): Promise<void> {
  if (!title.value.trim() || !description.value.trim() || !deadline.value) return;
  loading.value = true;
  try {
    const { data } = await api.post<Task>('/tasks/', {
      title: title.value,
      description: description.value,
      category: category.value,
      price_tk: price.value,
      deadline: deadline.value,
    });
    router.push(`/tasks/${data.id}`);
  } catch {
    // Error
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-2xl mx-auto">
    <v-btn icon variant="text" size="small" class="mb-4" @click="router.back()">
      <v-icon color="white">mdi-arrow-left</v-icon>
    </v-btn>

    <h1 class="text-2xl font-bold text-white mb-6">Create Task</h1>

    <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
      <div class="space-y-4">
        <v-text-field
          v-model="title"
          label="Task Title"
          placeholder="What do you need done?"
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <v-textarea
          v-model="description"
          label="Description"
          placeholder="Describe the task in detail..."
          variant="solo-filled"
          bg-color="#2D2D2D"
          rows="4"
        />

        <v-select
          v-model="category"
          :items="categories"
          label="Category"
          variant="solo-filled"
          bg-color="#2D2D2D"
        />

        <div>
          <label class="text-gray-400 text-sm mb-1 block">Price (TK)</label>
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

        <v-text-field
          v-model="deadline"
          label="Deadline"
          type="date"
          variant="solo-filled"
          bg-color="#2D2D2D"
          :min="new Date().toISOString().split('T')[0]"
        />

        <v-btn
          color="rogan-primary"
          block
          rounded="lg"
          size="large"
          :loading="loading"
          :disabled="!title.trim() || !description.trim() || !deadline"
          @click="submitTask"
        >
          <v-icon start>mdi-clipboard-check</v-icon>
          Create Task
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
