<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import api from '@/services/api';
import type { Task, TaskBid } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();

const taskId = computed(() => route.params.id as string);
const task = ref<Task | null>(null);
const loading = ref(true);
const bidAmount = ref(0);
const bidMessage = ref('');
const submittingBid = ref(false);

const isOwner = computed(() => task.value?.creator_id === authStore.user?.id);
const hasBidded = computed(() =>
  task.value?.bids.some((b) => b.bidder_id === authStore.user?.id) ?? false
);

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

async function loadTask(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.get<Task>(`/tasks/${taskId.value}`);
    task.value = data;
  } catch {
    // Task not found
  } finally {
    loading.value = false;
  }
}

async function placeBid(): Promise<void> {
  if (!task.value || bidAmount.value <= 0) return;
  submittingBid.value = true;
  try {
    const { data } = await api.post<TaskBid>(`/tasks/${taskId.value}/bids`, {
      amount_tk: bidAmount.value,
      message: bidMessage.value,
    });
    task.value.bids.push(data);
    bidAmount.value = 0;
    bidMessage.value = '';
  } catch {
    // Bid failed
  } finally {
    submittingBid.value = false;
  }
}

async function acceptBid(bidId: string): Promise<void> {
  if (!task.value) return;
  try {
    await api.post(`/tasks/${taskId.value}/bids/${bidId}/accept`);
    await loadTask();
  } catch {
    // Accept failed
  }
}

async function completeTask(): Promise<void> {
  if (!task.value) return;
  try {
    await api.post(`/tasks/${taskId.value}/complete`);
    await loadTask();
  } catch {
    // Complete failed
  }
}

async function disputeTask(): Promise<void> {
  if (!task.value) return;
  try {
    await api.post(`/tasks/${taskId.value}/dispute`);
    await loadTask();
  } catch {
    // Dispute failed
  }
}

onMounted(() => {
  loadTask();
  walletStore.fetchWallet();
});
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-3xl mx-auto">
    <v-btn icon variant="text" size="small" class="mb-4" @click="router.back()">
      <v-icon color="white">mdi-arrow-left</v-icon>
    </v-btn>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <template v-else-if="task">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-start justify-between mb-2">
          <h1 class="text-xl font-bold text-white flex-1">{{ task.title }}</h1>
          <v-chip :color="statusColor(task.status)" size="small" variant="flat" class="ml-2 flex-shrink-0">
            {{ task.status.replace('_', ' ') }}
          </v-chip>
        </div>
        <div class="flex items-center gap-3 text-gray-400 text-xs">
          <span class="flex items-center gap-1">
            <v-icon size="14">mdi-diamond-stone</v-icon>
            {{ task.price_tk }} TK
          </span>
          <span class="flex items-center gap-1">
            <v-icon size="14">mdi-tag</v-icon>
            {{ task.category }}
          </span>
          <span class="flex items-center gap-1">
            <v-icon size="14">mdi-clock-outline</v-icon>
            Due {{ new Date(task.deadline).toLocaleDateString() }}
          </span>
        </div>
      </div>

      <!-- Creator Info -->
      <v-card class="bg-[#1E1E1E] rounded-xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <v-avatar size="40">
            <v-img v-if="task.creator.avatar" :src="task.creator.avatar" />
            <v-icon v-else size="24">mdi-account</v-icon>
          </v-avatar>
          <div>
            <span class="text-white text-sm font-medium">{{ task.creator.display_name }}</span>
            <p class="text-gray-500 text-xs">Task Creator</p>
          </div>
        </div>
      </v-card>

      <!-- Description -->
      <v-card class="bg-[#1E1E1E] rounded-xl p-4 mb-6">
        <h3 class="text-white font-semibold text-sm mb-2">Description</h3>
        <p class="text-gray-300 text-sm whitespace-pre-wrap">{{ task.description }}</p>
      </v-card>

      <!-- Bids Section -->
      <v-card class="bg-[#1E1E1E] rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold text-sm">Bids ({{ task.bids.length }})</h3>
        </div>

        <div v-if="task.bids.length === 0" class="text-center py-6">
          <v-icon size="36" color="#3D3D3D">mdi-gavel</v-icon>
          <p class="text-gray-500 text-sm mt-2">No bids yet</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="bid in task.bids"
            :key="bid.id"
            class="bg-[#2D2D2D] rounded-lg p-3"
            :class="bid.is_accepted ? 'border border-green-500/30' : ''"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <v-avatar size="24">
                  <v-icon size="16">mdi-account</v-icon>
                </v-avatar>
                <span class="text-white text-xs font-medium">{{ bid.bidder.display_name }}</span>
                <v-chip v-if="bid.is_accepted" size="x-small" color="green" variant="flat">Accepted</v-chip>
              </div>
              <span class="text-amber-400 text-sm font-bold">{{ bid.amount_tk }} TK</span>
            </div>
            <p v-if="bid.message" class="text-gray-400 text-xs mt-1">{{ bid.message }}</p>

            <div v-if="isOwner && !bid.is_accepted && (task.status === 'open' || task.status === 'bidding')" class="mt-2">
              <v-btn size="x-small" color="green" variant="outlined" rounded="lg" @click="acceptBid(bid.id)">
                Accept Bid
              </v-btn>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Place Bid Form -->
      <v-card
        v-if="!isOwner && !hasBidded && (task.status === 'open' || task.status === 'bidding')"
        class="bg-[#1E1E1E] rounded-xl p-4 mb-6"
      >
        <h3 class="text-white font-semibold text-sm mb-3">Place a Bid</h3>
        <div class="space-y-3">
          <v-text-field
            v-model.number="bidAmount"
            type="number"
            label="Bid Amount (TK)"
            variant="solo-filled"
            bg-color="#2D2D2D"
            suffix="TK"
          />
          <v-textarea
            v-model="bidMessage"
            label="Message (optional)"
            placeholder="Why are you the right person for this task?"
            variant="solo-filled"
            bg-color="#2D2D2D"
            rows="2"
          />
          <v-btn
            color="rogan-primary"
            block
            rounded="lg"
            :loading="submittingBid"
            :disabled="bidAmount <= 0"
            @click="placeBid"
          >
            Submit Bid
          </v-btn>
        </div>
      </v-card>

      <!-- Owner Actions -->
      <div v-if="isOwner" class="flex gap-3">
        <v-btn
          v-if="task.status === 'in_progress'"
          color="green"
          rounded="lg"
          variant="outlined"
          @click="completeTask"
        >
          <v-icon start>mdi-check</v-icon>
          Mark Complete
        </v-btn>
        <v-btn
          v-if="task.status === 'in_progress'"
          color="red"
          rounded="lg"
          variant="outlined"
          @click="disputeTask"
        >
          <v-icon start>mdi-alert</v-icon>
          Dispute
        </v-btn>
      </div>
    </template>
  </div>
</template>
