<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { useResponsive } from '@/composables/useResponsive';
import EarningsChart from '@/components/creator/EarningsChart.vue';
import GiftBreakdown from '@/components/creator/GiftBreakdown.vue';
import type { DailyEarning, CreatorGiftStats, TaskRequest, ServiceListing } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();
const { isMobile } = useResponsive();

const activeTab = ref('overview');

// Mock data for dashboard — in production these would come from API
const dailyEarnings = ref<DailyEarning[]>([
  { date: '2026-03-01', tk_amount: 450 },
  { date: '2026-03-02', tk_amount: 820 },
  { date: '2026-03-03', tk_amount: 340 },
  { date: '2026-03-04', tk_amount: 1250 },
  { date: '2026-03-05', tk_amount: 670 },
  { date: '2026-03-06', tk_amount: 980 },
  { date: '2026-03-07', tk_amount: 1100 },
]);

const giftStats = ref<CreatorGiftStats[]>([
  { gift_type: 'rose', count: 150, total_tk: 150 },
  { gift_type: 'heart', count: 45, total_tk: 225 },
  { gift_type: 'diamond', count: 20, total_tk: 200 },
  { gift_type: 'rocket', count: 5, total_tk: 250 },
  { gift_type: 'crown', count: 2, total_tk: 200 },
]);

const tasks = ref<TaskRequest[]>([]);

const totalEarnings = ref(5610);
const todayGifts = ref(1100);
const subscriberCount = ref(234);
const avgRating = ref(4.8);

onMounted(() => {
  walletStore.fetchWallet();
});

const tabs = [
  { label: 'Overview', value: 'overview', icon: 'mdi-chart-box' },
  { label: 'Earnings', value: 'earnings', icon: 'mdi-cash' },
  { label: 'Services', value: 'services', icon: 'mdi-briefcase' },
  { label: 'Subscribers', value: 'subscribers', icon: 'mdi-account-group' },
];
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <div class="max-w-6xl mx-auto px-8 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white">Creator Dashboard</h1>
          <p class="text-gray-400 text-sm mt-1">Welcome back, {{ authStore.user?.display_name || 'Creator' }}</p>
        </div>
        <v-btn color="rogan-primary" rounded="lg" size="large" @click="router.push('/stream/go-live')">
          <v-icon start>mdi-broadcast</v-icon>
          Go Live
        </v-btn>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-4 mb-8">
        <v-card class="bg-[#1E1E1E] rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <v-icon size="22" color="amber">mdi-diamond-stone</v-icon>
            <span class="text-xs text-gray-400">Total Earnings</span>
          </div>
          <p class="text-2xl font-bold text-amber-400">{{ totalEarnings.toLocaleString() }} TK</p>
          <p class="text-xs text-green-400 mt-1">≈ {{ (totalEarnings / 100).toFixed(2) }} ROGAN</p>
        </v-card>

        <v-card class="bg-[#1E1E1E] rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <v-icon size="22" color="rogan-primary">mdi-gift</v-icon>
            <span class="text-xs text-gray-400">Today's Gifts</span>
          </div>
          <p class="text-2xl font-bold text-rogan-primary">{{ todayGifts.toLocaleString() }} TK</p>
          <p class="text-xs text-gray-500 mt-1">From {{ giftStats.reduce((s, g) => s + g.count, 0) }} gifts</p>
        </v-card>

        <v-card class="bg-[#1E1E1E] rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <v-icon size="22" color="rogan-secondary">mdi-account-group</v-icon>
            <span class="text-xs text-gray-400">Subscribers</span>
          </div>
          <p class="text-2xl font-bold text-rogan-secondary">{{ subscriberCount.toLocaleString() }}</p>
          <p class="text-xs text-green-400 mt-1">+12 this week</p>
        </v-card>

        <v-card class="bg-[#1E1E1E] rounded-xl p-5">
          <div class="flex items-center gap-2 mb-2">
            <v-icon size="22" color="warning">mdi-star</v-icon>
            <span class="text-xs text-gray-400">Avg Rating</span>
          </div>
          <p class="text-2xl font-bold text-warning">{{ avgRating.toFixed(1) }}</p>
          <p class="text-xs text-gray-500 mt-1">Based on 189 reviews</p>
        </v-card>
      </div>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="rogan-primary" bg-color="transparent" class="mb-6">
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          <v-icon start size="18">{{ tab.icon }}</v-icon>
          {{ tab.label }}
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-2 gap-6">
        <EarningsChart :earnings="dailyEarnings" />
        <GiftBreakdown :stats="giftStats" />
      </div>

      <div v-else-if="activeTab === 'earnings'" class="space-y-6">
        <EarningsChart :earnings="dailyEarnings" />
        <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
          <h3 class="text-white font-semibold mb-4">Withdrawal Summary</h3>
          <div class="grid grid-cols-3 gap-6 text-center">
            <div>
              <p class="text-3xl font-bold text-amber-400">{{ walletStore.tkBalance.toLocaleString() }}</p>
              <p class="text-sm text-gray-400">Available (TK)</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-white">{{ totalEarnings.toLocaleString() }}</p>
              <p class="text-sm text-gray-400">Lifetime (TK)</p>
            </div>
            <div>
              <p class="text-3xl font-bold text-green-400">{{ ((totalEarnings - walletStore.tkBalance) / 100).toFixed(2) }}</p>
              <p class="text-sm text-gray-400">Withdrawn (ROGAN)</p>
            </div>
          </div>
        </v-card>
      </div>

      <div v-else-if="activeTab === 'services'" class="space-y-6">
        <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold">My Services</h3>
            <v-btn size="small" color="rogan-primary" variant="outlined" rounded="lg">
              <v-icon start size="16">mdi-plus</v-icon>
              Add Service
            </v-btn>
          </div>
          <div class="text-center py-10">
            <v-icon size="48" color="#3D3D3D">mdi-briefcase-outline</v-icon>
            <p class="text-gray-500 text-sm mt-2">No services listed yet</p>
            <p class="text-gray-600 text-xs mt-1">Add services like private shows, custom content, or shoutouts</p>
          </div>
        </v-card>
        <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
          <h3 class="text-white font-semibold mb-4">Incoming Requests</h3>
          <div class="text-center py-10">
            <v-icon size="48" color="#3D3D3D">mdi-inbox-outline</v-icon>
            <p class="text-gray-500 text-sm mt-2">No pending requests</p>
          </div>
        </v-card>
      </div>

      <div v-else-if="activeTab === 'subscribers'">
        <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
          <h3 class="text-white font-semibold mb-4">Subscribers ({{ subscriberCount }})</h3>
          <div class="text-center py-10">
            <v-icon size="48" color="#3D3D3D">mdi-account-group</v-icon>
            <p class="text-gray-500 text-sm mt-2">Subscriber details will appear here</p>
          </div>
        </v-card>
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212] p-4 max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Creator Dashboard</h1>
        <p class="text-gray-400 text-sm mt-0.5">Welcome back, {{ authStore.user?.display_name || 'Creator' }}</p>
      </div>
      <v-btn color="rogan-primary" rounded="lg" @click="router.push('/stream/go-live')">
        <v-icon start>mdi-broadcast</v-icon>
        Go Live
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="20" color="amber">mdi-diamond-stone</v-icon>
          <span class="text-xs text-gray-400">Total Earnings</span>
        </div>
        <p class="text-xl font-bold text-amber-400">{{ totalEarnings.toLocaleString() }} TK</p>
        <p class="text-xs text-green-400 mt-1">≈ {{ (totalEarnings / 100).toFixed(2) }} ROGAN</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="20" color="rogan-primary">mdi-gift</v-icon>
          <span class="text-xs text-gray-400">Today's Gifts</span>
        </div>
        <p class="text-xl font-bold text-rogan-primary">{{ todayGifts.toLocaleString() }} TK</p>
        <p class="text-xs text-gray-500 mt-1">From {{ giftStats.reduce((s, g) => s + g.count, 0) }} gifts</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="20" color="rogan-secondary">mdi-account-group</v-icon>
          <span class="text-xs text-gray-400">Subscribers</span>
        </div>
        <p class="text-xl font-bold text-rogan-secondary">{{ subscriberCount.toLocaleString() }}</p>
        <p class="text-xs text-green-400 mt-1">+12 this week</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="20" color="warning">mdi-star</v-icon>
          <span class="text-xs text-gray-400">Avg Rating</span>
        </div>
        <p class="text-xl font-bold text-warning">{{ avgRating.toFixed(1) }}</p>
        <p class="text-xs text-gray-500 mt-1">Based on 189 reviews</p>
      </v-card>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="rogan-primary" bg-color="transparent" class="mb-6">
      <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
        <v-icon start size="18">{{ tab.icon }}</v-icon>
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <div v-if="activeTab === 'overview'" class="grid lg:grid-cols-2 gap-4">
      <EarningsChart :earnings="dailyEarnings" />
      <GiftBreakdown :stats="giftStats" />
    </div>

    <div v-else-if="activeTab === 'earnings'" class="space-y-4">
      <EarningsChart :earnings="dailyEarnings" />
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <h3 class="text-white font-semibold text-sm mb-4">Withdrawal Summary</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-amber-400">{{ walletStore.tkBalance.toLocaleString() }}</p>
            <p class="text-xs text-gray-400">Available (TK)</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ totalEarnings.toLocaleString() }}</p>
            <p class="text-xs text-gray-400">Lifetime (TK)</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-400">{{ ((totalEarnings - walletStore.tkBalance) / 100).toFixed(2) }}</p>
            <p class="text-xs text-gray-400">Withdrawn (ROGAN)</p>
          </div>
        </div>
      </v-card>
    </div>

    <div v-else-if="activeTab === 'services'" class="space-y-4">
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold text-sm">My Services</h3>
          <v-btn size="small" color="rogan-primary" variant="outlined" rounded="lg">
            <v-icon start size="16">mdi-plus</v-icon>
            Add Service
          </v-btn>
        </div>
        <div class="text-center py-8">
          <v-icon size="48" color="#3D3D3D">mdi-briefcase-outline</v-icon>
          <p class="text-gray-500 text-sm mt-2">No services listed yet</p>
        </div>
      </v-card>
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <h3 class="text-white font-semibold text-sm mb-4">Incoming Requests</h3>
        <div class="text-center py-8">
          <v-icon size="48" color="#3D3D3D">mdi-inbox-outline</v-icon>
          <p class="text-gray-500 text-sm mt-2">No pending requests</p>
        </div>
      </v-card>
    </div>

    <div v-else-if="activeTab === 'subscribers'">
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <h3 class="text-white font-semibold text-sm mb-4">Subscribers ({{ subscriberCount }})</h3>
        <div class="text-center py-8">
          <v-icon size="48" color="#3D3D3D">mdi-account-group</v-icon>
          <p class="text-gray-500 text-sm mt-2">Subscriber details will appear here</p>
        </div>
      </v-card>
    </div>
  </div>
</template>
