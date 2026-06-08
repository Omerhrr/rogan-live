<script setup lang="ts">
import { ref } from 'vue';
import * as web3Service from '@/services/web3';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'error', error: Error): void;
}>();

const loading = ref(false);

async function signInWithEthereum(): Promise<void> {
  loading.value = true;
  try {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not detected. Please install MetaMask.');
      return;
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];

    // Get SIWE nonce from backend
    const { message, nonce } = await web3Service.getSIWENonce();

    // Construct SIWE message with the nonce
    const siweMessage = message;

    // Request signature from MetaMask
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [siweMessage, address],
    });

    // Verify signature with backend
    const result = await web3Service.signInWithEthereum(siweMessage, signature);

    // Store the new auth token
    localStorage.setItem('rogan_token', result.token);
    localStorage.setItem('rogan_user', JSON.stringify(result.user));

    emit('success');
  } catch (err: any) {
    emit('error', err instanceof Error ? err : new Error(err?.message || 'SIWE failed'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-btn
    block
    color="primary"
    rounded="lg"
    size="large"
    variant="outlined"
    :loading="loading"
    @click="signInWithEthereum"
  >
    <v-icon start>mdi-ethereum</v-icon>
    Sign In with Ethereum
  </v-btn>
</template>
