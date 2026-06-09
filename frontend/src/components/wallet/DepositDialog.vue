<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

const emit = defineEmits<{
  confirm: [amount: number];
}>();

const amount = ref(10);
const quickAmounts = [5, 10, 25, 50, 100, 500];
const dialog = ref(false);

// TK conversion rate: 1 ROGAN = 100 TK
const tkEquivalent = computed(() => amount.value * 100);

function selectAmount(val: number): void {
  amount.value = val;
}

function handleConfirm(): void {
  if (amount.value <= 0) return;
  emit('confirm', amount.value);
  dialog.value = false;
}

defineExpose({ dialog });
</script>

<template>
  <v-dialog v-model="dialog" max-width="420">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="rogan-primary"
        size="large"
        block
        rounded="lg"
        class="font-semibold"
      >
        <v-icon start>mdi-plus-circle</v-icon>
        Deposit ROGAN
      </v-btn>
    </template>

    <v-card class="bg-[#1E1E1E] rounded-2xl">
      <v-card-title class="flex items-center justify-between pt-5 px-6">
        <span class="text-lg font-bold text-white">Deposit ROGAN</span>
        <v-btn icon variant="text" size="small" @click="dialog = false">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Amount input -->
        <v-text-field
          v-model.number="amount"
          label="Amount (ROGAN)"
          type="number"
          min="1"
          prepend-inner-icon="mdi-currency-usd"
          variant="solo-filled"
          bg-color="#2D2D2D"
          class="mb-4"
        />

        <!-- Quick select buttons -->
        <div class="grid grid-cols-3 gap-2 mb-5">
          <v-btn
            v-for="qa in quickAmounts"
            :key="qa"
            :variant="amount === qa ? 'flat' : 'outlined'"
            :color="amount === qa ? 'rogan-primary' : '#3D3D3D'"
            size="small"
            rounded="lg"
            @click="selectAmount(qa)"
          >
            {{ qa }}
          </v-btn>
        </div>

        <!-- TK Equivalent -->
        <div class="bg-[#2D2D2D] rounded-xl p-4 text-center">
          <p class="text-sm text-gray-400">You will receive</p>
          <p class="text-2xl font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
            <v-icon size="20" color="amber">mdi-diamond-stone</v-icon>
            {{ tkEquivalent.toLocaleString() }} TK
          </p>
          <p class="text-xs text-gray-500 mt-1">1 ROGAN = 100 TK</p>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-btn
          block
          size="large"
          color="rogan-primary"
          rounded="lg"
          :disabled="amount <= 0"
          @click="handleConfirm"
        >
          Confirm Deposit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
