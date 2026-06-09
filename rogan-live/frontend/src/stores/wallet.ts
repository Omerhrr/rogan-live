import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Wallet, Transaction, PaginatedResponse } from '@/types';
import * as walletService from '@/services/wallet';

export const useWalletStore = defineStore('wallet', () => {
  const wallet = ref<Wallet | null>(null);
  const tkBalance = ref(0);
  const transactions = ref<Transaction[]>([]);
  const loading = ref(false);
  const transactionPage = ref(1);
  const hasMoreTransactions = ref(true);

  async function fetchWallet(): Promise<void> {
    loading.value = true;
    try {
      const w = await walletService.getWallet();
      wallet.value = w;
      tkBalance.value = w.tk_balance;
    } finally {
      loading.value = false;
    }
  }

  async function deposit(amount: number): Promise<void> {
    loading.value = true;
    try {
      const w = await walletService.depositRogan(amount);
      wallet.value = w;
      tkBalance.value = w.tk_balance;
    } finally {
      loading.value = false;
    }
  }

  async function withdraw(tkAmount: number): Promise<void> {
    loading.value = true;
    try {
      const w = await walletService.withdrawRogan(tkAmount);
      wallet.value = w;
      tkBalance.value = w.tk_balance;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTransactions(append: boolean = false): Promise<void> {
    loading.value = true;
    try {
      const res: PaginatedResponse<Transaction> = await walletService.getTransactions(
        transactionPage.value,
        20
      );
      const items = res.streams ?? res.items ?? [];
      if (append) {
        transactions.value.push(...items);
      } else {
        transactions.value = items;
      }
      hasMoreTransactions.value = transactionPage.value < res.pages;
      transactionPage.value++;
    } finally {
      loading.value = false;
    }
  }

  async function linkWallet(address: string): Promise<void> {
    loading.value = true;
    try {
      const w = await walletService.linkWallet(address);
      wallet.value = w;
    } finally {
      loading.value = false;
    }
  }

  return {
    wallet,
    tkBalance,
    transactions,
    loading,
    hasMoreTransactions,
    fetchWallet,
    deposit,
    withdraw,
    fetchTransactions,
    linkWallet,
  };
});
