<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import * as web3Service from '@/services/web3';
import SIWEButton from '@/components/web3/SIWEButton.vue';
import DepositWithdrawForm from '@/components/web3/DepositWithdrawForm.vue';
import type { Web3Transaction } from '@/types';

const authStore = useAuthStore();
const walletStore = useWalletStore();

const ethAddress = ref<string | null>(null);
const isWalletConnected = ref(false);
const connecting = ref(false);
const transactions = ref<Web3Transaction[]>([]);
const loadingTx = ref(false);

const formattedAddress = computed(() => {
  if (!ethAddress.value) return '';
  return `${ethAddress.value.slice(0, 6)}...${ethAddress.value.slice(-4)}`;
});

async function connectMetaMask(): Promise<void> {
  connecting.value = true;
  try {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not detected. Please install MetaMask.');
      return;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts && accounts.length > 0) {
      ethAddress.value = accounts[0];
      isWalletConnected.value = true;
      await web3Service.connectWallet(accounts[0]);
      await walletStore.fetchWallet();
    }
  } catch (err) {
    console.error('Wallet connect error:', err);
  } finally {
    connecting.value = false;
  }
}

async function disconnectWallet(): Promise<void> {
  try {
    await web3Service.disconnectWallet();
    ethAddress.value = null;
    isWalletConnected.value = false;
  } catch {
    // Error
  }
}

async function handleDeposit(amount: number): Promise<void> {
  try {
    const result = await web3Service.depositRoganToTK(amount);
    await walletStore.fetchWallet();
    await loadTransactions();
  } catch {
    // Deposit failed
  }
}

async function handleWithdraw(tkAmount: number): Promise<void> {
  try {
    const result = await web3Service.withdrawTKToRogan(tkAmount);
    await walletStore.fetchWallet();
    await loadTransactions();
  } catch {
    // Withdraw failed
  }
}

async function loadTransactions(): Promise<void> {
  loadingTx.value = true;
  try {
    const res = await web3Service.getWeb3Transactions();
    transactions.value = res.items ?? [];
  } catch {
    transactions.value = [];
  } finally {
    loadingTx.value = false;
  }
}

async function handleSIWESuccess(): Promise<void> {
  await walletStore.fetchWallet();
}

// Initialize
loadTransactions();
walletStore.fetchWallet();

// Check if already connected
if (typeof window.ethereum !== 'undefined') {
  window.ethereum
    .request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      if (accounts.length > 0) {
        ethAddress.value = accounts[0];
        isWalletConnected.value = true;
      }
    })
    .catch(() => {});
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Web3 Wallet</h1>

    <!-- Balance Display -->
    <v-card class="bg-gradient-to-br from-[#1E1E1E] to-[#2D2D2D] rounded-2xl mb-6 overflow-hidden" elevation="4">
      <div class="p-6">
        <p class="text-sm text-gray-400 mb-1">Your Balance</p>
        <div class="flex items-baseline gap-3">
          <div>
            <p class="text-3xl font-bold text-amber-400">{{ walletStore.tkBalance.toLocaleString() }}</p>
            <p class="text-xs text-gray-500">TK</p>
          </div>
          <div>
            <p class="text-xl font-bold text-green-400">{{ (walletStore.tkBalance / 100).toFixed(2) }}</p>
            <p class="text-xs text-gray-500">ROGAN</p>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Wallet Connection -->
    <v-card class="bg-[#1E1E1E] rounded-2xl mb-6 p-5">
      <div class="flex items-center gap-2 mb-4">
        <v-icon color="rogan-secondary" size="24">mdi-wallet</v-icon>
        <h3 class="text-white font-semibold">Wallet Connection</h3>
      </div>

      <!-- Not Connected -->
      <div v-if="!isWalletConnected" class="space-y-3">
        <v-btn
          block
          color="rogan-secondary"
          rounded="lg"
          size="large"
          :loading="connecting"
          @click="connectMetaMask"
        >
          <v-icon start>mdi-wallet</v-icon>
          Connect MetaMask
        </v-btn>

        <SIWEButton @success="handleSIWESuccess" />
      </div>

      <!-- Connected -->
      <div v-else class="space-y-3">
        <div class="flex items-center gap-3 bg-[#2D2D2D] rounded-lg px-4 py-3">
          <v-icon color="green">mdi-check-circle</v-icon>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium">Wallet Connected</p>
            <p class="text-gray-400 text-xs font-mono truncate">{{ ethAddress }}</p>
          </div>
          <v-btn size="x-small" variant="outlined" color="red" rounded="lg" @click="disconnectWallet">
            Disconnect
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Deposit / Withdraw -->
    <v-card v-if="isWalletConnected" class="bg-[#1E1E1E] rounded-2xl mb-6 p-5">
      <h3 class="text-white font-semibold mb-4">Deposit & Withdraw</h3>
      <DepositWithdrawForm
        :tk-balance="walletStore.tkBalance"
        @deposit="handleDeposit"
        @withdraw="handleWithdraw"
      />
    </v-card>

    <!-- Transaction History -->
    <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
      <h3 class="text-white font-semibold mb-4">Transaction History</h3>

      <div v-if="loadingTx" class="text-center py-6">
        <v-progress-circular indeterminate color="rogan-primary" size="32" />
      </div>

      <div v-else-if="transactions.length === 0" class="text-center py-6">
        <v-icon size="36" color="#3D3D3D">mdi-swap-horizontal</v-icon>
        <p class="text-gray-500 text-sm mt-2">No transactions yet</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <v-icon
              :color="tx.type === 'deposit' ? 'green' : 'red'"
              size="20"
            >
              {{ tx.type === 'deposit' ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
            </v-icon>
            <div>
              <p class="text-white text-sm font-medium capitalize">{{ tx.type }}</p>
              <p class="text-gray-500 text-xs font-mono truncate max-w-[200px]">{{ tx.tx_hash }}</p>
            </div>
          </div>

          <div class="text-right">
            <p :class="tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'" class="text-sm font-bold">
              {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount_tk }} TK
            </p>
            <v-chip
              :color="tx.status === 'confirmed' ? 'green' : tx.status === 'pending' ? 'yellow' : 'red'"
              size="x-small"
              variant="flat"
            >
              {{ tx.status }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>
