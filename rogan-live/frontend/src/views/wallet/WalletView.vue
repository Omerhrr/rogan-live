<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import DepositDialog from '@/components/wallet/DepositDialog.vue';
import WithdrawDialog from '@/components/wallet/WithdrawDialog.vue';
import TransactionList from '@/components/wallet/TransactionList.vue';

const walletStore = useWalletStore();
const walletAddress = ref('');
const showLinkDialog = ref(false);

onMounted(() => {
  walletStore.fetchWallet();
  walletStore.fetchTransactions();
});

async function handleDeposit(amount: number): Promise<void> {
  await walletStore.deposit(amount);
}

async function handleWithdraw(tkAmount: number): Promise<void> {
  await walletStore.withdraw(tkAmount);
}

async function linkWalletAddress(): Promise<void> {
  if (!walletAddress.value.trim()) return;
  try {
    await walletStore.linkWallet(walletAddress.value.trim());
    showLinkDialog.value = false;
  } catch {
    // Handle error
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] px-4 py-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Wallet</h1>

    <!-- Balance Card -->
    <v-card class="bg-gradient-to-br from-[#1E1E1E] to-[#2D2D2D] rounded-2xl mb-6 overflow-hidden" elevation="4">
      <div class="p-6">
        <p class="text-sm text-gray-400 mb-1">TK Balance</p>
        <p class="text-4xl font-bold text-amber-400 flex items-center gap-2">
          <v-icon size="32" color="amber">mdi-diamond-stone</v-icon>
          {{ walletStore.tkBalance.toLocaleString() }}
        </p>
        <p class="text-sm text-gray-500 mt-2">
          ≈ {{ walletStore.tkBalance.toFixed(2) }} ROGAN
        </p>
      </div>

      <div class="px-6 pb-6 grid grid-cols-2 gap-3">
        <DepositDialog @confirm="handleDeposit" />
        <WithdrawDialog @confirm="handleWithdraw" />
      </div>
    </v-card>

    <!-- Wallet Linking Section -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 p-5" v-if="walletStore.wallet && !walletStore.wallet.wallet_address">
      <div class="flex items-center gap-3 mb-3">
        <v-icon color="rogan-secondary" size="24">mdi-link-variant</v-icon>
        <div>
          <p class="text-white font-semibold text-sm">Link Web3 Wallet</p>
          <p class="text-gray-500 text-xs">Connect your wallet to withdraw ROGAN tokens</p>
        </div>
      </div>
      <v-btn
        variant="outlined"
        color="rogan-secondary"
        size="small"
        block
        rounded="lg"
        @click="showLinkDialog = true"
      >
        <v-icon start size="16">mdi-wallet</v-icon>
        Link Wallet Address
      </v-btn>
    </v-card>

    <v-card v-else-if="walletStore.wallet?.wallet_address" class="bg-[#1E1E1E] rounded-2xl mb-6 p-5">
      <div class="flex items-center gap-3">
        <v-icon color="green" size="24">mdi-check-circle</v-icon>
        <div class="flex-1 min-w-0">
          <p class="text-white font-semibold text-sm">Wallet Linked</p>
          <p class="text-gray-500 text-xs truncate">{{ walletStore.wallet.wallet_address }}</p>
        </div>
      </div>
    </v-card>

    <!-- Transaction History -->
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-white mb-3">Transaction History</h2>
      <TransactionList />
    </div>

    <!-- Link Wallet Dialog -->
    <v-dialog v-model="showLinkDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Link Wallet Address</span>
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="walletAddress"
            label="Wallet Address"
            placeholder="0x..."
            prepend-inner-icon="mdi-wallet"
            variant="solo-filled"
            bg-color="#2D2D2D"
            class="mb-4"
          />
          <p class="text-xs text-gray-500">
            Enter your Web3 wallet address (MetaMask, Trust Wallet, etc.) to receive ROGAN token withdrawals.
          </p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn block color="rogan-secondary" rounded="lg" @click="linkWalletAddress" :disabled="!walletAddress.trim()">
            Link Wallet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
