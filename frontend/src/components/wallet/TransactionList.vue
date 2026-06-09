<script setup lang="ts">
import { onMounted } from 'vue';
import type { Transaction, TransactionType } from '@/types';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

const typeConfig: Record<TransactionType, { icon: string; color: string; label: string; prefix: string }> = {
  deposit: { icon: 'mdi-arrow-down-circle', color: 'text-green-400', label: 'Deposit', prefix: '+' },
  withdraw: { icon: 'mdi-arrow-up-circle', color: 'text-red-400', label: 'Withdrawal', prefix: '-' },
  gift_sent: { icon: 'mdi-gift', color: 'text-red-400', label: 'Gift Sent', prefix: '-' },
  gift_received: { icon: 'mdi-gift-open', color: 'text-green-400', label: 'Gift Received', prefix: '+' },
  purchase: { icon: 'mdi-cart', color: 'text-red-400', label: 'Purchase', prefix: '-' },
};

function getTypeConfig(type: TransactionType) {
  return typeConfig[type] || typeConfig.deposit;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

onMounted(() => {
  if (walletStore.transactions.length === 0) {
    walletStore.fetchTransactions();
  }
});
</script>

<template>
  <div>
    <div v-if="walletStore.transactions.length === 0" class="text-center py-8">
      <v-icon size="48" color="#3D3D3D">mdi-receipt-text-outline</v-icon>
      <p class="text-gray-500 mt-2 text-sm">No transactions yet</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="tx in walletStore.transactions"
        :key="tx.id"
        class="flex items-center gap-3 p-3 rounded-xl bg-[#2D2D2D] hover:bg-[#333] transition-colors"
      >
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="getTypeConfig(tx.type).color.replace('text-', 'bg-') + '/15'"
        >
          <v-icon
            size="20"
            :color="getTypeConfig(tx.type).color.replace('text-', '')"
          >
            {{ getTypeConfig(tx.type).icon }}
          </v-icon>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium">
            {{ getTypeConfig(tx.type).label }}
          </p>
          <p class="text-gray-500 text-xs truncate">
            {{ tx.description }}
          </p>
        </div>

        <div class="text-right flex-shrink-0">
          <p
            class="text-sm font-semibold"
            :class="getTypeConfig(tx.type).color"
          >
            {{ getTypeConfig(tx.type).prefix }}{{ tx.tk_amount.toLocaleString() }} TK
          </p>
          <p class="text-gray-500 text-xs">{{ formatDate(tx.created_at) }}</p>
        </div>
      </div>

      <!-- Load more -->
      <v-btn
        v-if="walletStore.hasMoreTransactions"
        variant="text"
        block
        color="rogan-primary"
        size="small"
        :loading="walletStore.loading"
        @click="walletStore.fetchTransactions(true)"
      >
        Load More
      </v-btn>
    </div>
  </div>
</template>
