<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSubscriptionStore } from '@/stores/subscriptions';
import type { SubscriptionTier } from '@/types';

const authStore = useAuthStore();
const subStore = useSubscriptionStore();

const editingTier = ref<SubscriptionTier | null>(null);
const showTierDialog = ref(false);
const tierForm = ref({
  name: '',
  price_tk: 100,
  perks: '',
  max_subscribers: 100,
  color: '#9C27B0',
});

onMounted(async () => {
  if (authStore.user) {
    await subStore.fetchCreatorTiers(authStore.user.id);
  }
  await subStore.fetchRevenue();
});

function openEditTier(tier?: SubscriptionTier): void {
  if (tier) {
    editingTier.value = tier;
    tierForm.value = {
      name: tier.name,
      price_tk: tier.price_tk,
      perks: tier.perks.join(', '),
      max_subscribers: tier.max_subscribers,
      color: tier.color,
    };
  } else {
    editingTier.value = null;
    tierForm.value = {
      name: '',
      price_tk: 100,
      perks: '',
      max_subscribers: 100,
      color: '#9C27B0',
    };
  }
  showTierDialog.value = true;
}

async function saveTier(): Promise<void> {
  const payload = {
    name: tierForm.value.name,
    price_tk: tierForm.value.price_tk,
    perks: tierForm.value.perks.split(',').map((p) => p.trim()).filter(Boolean),
    max_subscribers: tierForm.value.max_subscribers,
    color: tierForm.value.color,
  };

  if (editingTier.value) {
    await subStore.updateTier(editingTier.value.id, payload);
  } else {
    if (subStore.tiers.length >= 3) return; // Max 3 tiers
    await subStore.createTier(payload);
  }
  showTierDialog.value = false;
}

async function deleteTier(tierId: string): Promise<void> {
  await subStore.deleteTier(tierId);
}

const tierColors = ['#9C27B0', '#E91E63', '#FFD700', '#2196F3', '#4CAF50'];
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Subscription Tiers</h1>
        <p class="text-gray-400 text-sm mt-0.5">Manage your subscription offerings (up to 3 tiers)</p>
      </div>
      <v-btn
        v-if="subStore.tiers.length < 3"
        color="rogan-primary"
        rounded="lg"
        @click="openEditTier()"
      >
        <v-icon start>mdi-plus</v-icon>
        Add Tier
      </v-btn>
    </div>

    <!-- Revenue Summary -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 p-5">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-amber-400">{{ subStore.revenue.total_tk.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">Total Revenue (TK)</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-green-400">{{ subStore.revenue.monthly_tk.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">Monthly (TK)</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-rogan-primary">{{ subStore.revenue.active_subscribers }}</p>
          <p class="text-xs text-gray-400">Active Subscribers</p>
        </div>
      </div>
    </v-card>

    <!-- Tiers -->
    <div v-if="subStore.loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="subStore.tiers.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-account-group</v-icon>
      <h2 class="text-xl font-bold text-white mt-4">No Tiers Yet</h2>
      <p class="text-gray-400 mt-2 text-sm">Create subscription tiers to start earning recurring revenue</p>
      <v-btn color="rogan-primary" rounded="lg" class="mt-4" @click="openEditTier()">
        Create First Tier
      </v-btn>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <v-card
        v-for="tier in subStore.tiers"
        :key="tier.id"
        class="bg-[#1E1E1E] rounded-xl overflow-hidden"
      >
        <div class="h-1.5" :style="{ backgroundColor: tier.color }" />
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-white font-bold">{{ tier.name }}</h3>
            <div class="flex gap-1">
              <v-btn icon size="x-small" variant="text" @click="openEditTier(tier)">
                <v-icon size="14" color="gray">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" @click="deleteTier(tier.id)">
                <v-icon size="14" color="red">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>

          <p class="text-amber-400 text-2xl font-bold mb-2">{{ tier.price_tk }} <span class="text-sm text-gray-400">TK/mo</span></p>

          <ul class="space-y-1 mb-3">
            <li v-for="(perk, idx) in tier.perks" :key="idx" class="flex items-center gap-1">
              <v-icon size="12" color="green">mdi-check</v-icon>
              <span class="text-gray-300 text-xs">{{ perk }}</span>
            </li>
          </ul>

          <p class="text-gray-500 text-xs">{{ tier.current_subscribers }}/{{ tier.max_subscribers }} subscribers</p>
        </div>
      </v-card>
    </div>

    <!-- Tier Edit/Create Dialog -->
    <v-dialog v-model="showTierDialog" max-width="480">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">{{ editingTier ? 'Edit Tier' : 'Create Tier' }}</span>
        </v-card-title>
        <v-card-text class="px-6 space-y-3">
          <v-text-field
            v-model="tierForm.name"
            label="Tier Name"
            placeholder="e.g., Basic, Premium, VIP"
            variant="solo-filled"
            bg-color="#2D2D2D"
          />

          <v-text-field
            v-model.number="tierForm.price_tk"
            type="number"
            label="Monthly Price (TK)"
            variant="solo-filled"
            bg-color="#2D2D2D"
            suffix="TK"
          />

          <v-textarea
            v-model="tierForm.perks"
            label="Perks (comma separated)"
            placeholder="e.g., Exclusive content, DM access, Custom shoutout"
            variant="solo-filled"
            bg-color="#2D2D2D"
            rows="2"
          />

          <v-text-field
            v-model.number="tierForm.max_subscribers"
            type="number"
            label="Max Subscribers"
            variant="solo-filled"
            bg-color="#2D2D2D"
          />

          <div>
            <label class="text-gray-400 text-sm mb-1 block">Color</label>
            <div class="flex gap-2">
              <div
                v-for="c in tierColors"
                :key="c"
                class="w-8 h-8 rounded-lg cursor-pointer border-2 transition-all"
                :class="tierForm.color === c ? 'border-white scale-110' : 'border-transparent'"
                :style="{ backgroundColor: c }"
                @click="tierForm.color = c"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showTierDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" @click="saveTier">
            {{ editingTier ? 'Save' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
