<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWalletStore } from '@/stores/wallet';

const walletStore = useWalletStore();

const emit = defineEmits<{
  confirm: [tkAmount: number];
}>();

const tkAmount = ref(100);
const dialog = ref(false);

// Conversion: 100 TK = 0.98 ROGAN (2% fee)
const roganEquivalent = computed(() => {
  const gross = tkAmount.value / 100;
  const fee = gross * 0.02;
  return (gross - fee).toFixed(4);
});

const fee = computed(() => {
  return ((tkAmount.value / 100) * 0.02).toFixed(4);
});

const exceedsBalance = computed(() => tkAmount.value > walletStore.tkBalance);

function handleConfirm(): void {
  if (tkAmount.value <= 0 || exceedsBalance.value) return;
  emit('confirm', tkAmount.value);
  dialog.value = false;
}

defineExpose({ dialog });
</script>

<template>
  <v-dialog v-model="dialog" max-width="420">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        variant="outlined"
        color="rogan-accent"
        size="large"
        block
        rounded="lg"
        class="font-semibold"
      >
        <v-icon start>mdi-arrow-up-circle</v-icon>
        Withdraw ROGAN
      </v-btn>
    </template>

    <v-card class="bg-[#1E1E1E] rounded-2xl">
      <v-card-title class="flex items-center justify-between pt-5 px-6">
        <span class="text-lg font-bold text-white">Withdraw ROGAN</span>
        <v-btn icon variant="text" size="small" @click="dialog = false">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Balance display -->
        <div class="bg-[#2D2D2D] rounded-xl p-3 mb-4 text-center">
          <p class="text-xs text-gray-400">Available Balance</p>
          <p class="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
            <v-icon size="16" color="amber">mdi-diamond-stone</v-icon>
            {{ walletStore.tkBalance.toLocaleString() }} TK
          </p>
        </div>

        <!-- TK Amount input -->
        <v-text-field
          v-model.number="tkAmount"
          label="Amount (TK)"
          type="number"
          min="100"
          prepend-inner-icon="mdi-diamond-stone"
          variant="solo-filled"
          bg-color="#2D2D2D"
          :error-messages="exceedsBalance ? 'Insufficient balance' : ''"
          class="mb-4"
        />

        <!-- Withdrawal summary -->
        <div class="bg-[#2D2D2D] rounded-xl p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Amount</span>
            <span class="text-white">{{ tkAmount }} TK</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Fee (2%)</span>
            <span class="text-red-400">- {{ fee }} ROGAN</span>
          </div>
          <v-divider color="#3D3D3D" />
          <div class="flex justify-between text-sm font-semibold">
            <span class="text-gray-300">You receive</span>
            <span class="text-green-400 flex items-center gap-1">
              <v-icon size="14" color="green">mdi-currency-usd</v-icon>
              {{ roganEquivalent }} ROGAN
            </span>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-btn
          block
          size="large"
          color="rogan-accent"
          rounded="lg"
          :disabled="tkAmount < 100 || exceedsBalance"
          @click="handleConfirm"
        >
          Confirm Withdrawal
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
