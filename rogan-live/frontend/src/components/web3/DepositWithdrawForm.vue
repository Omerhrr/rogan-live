<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  tkBalance: number;
}>();

const emit = defineEmits<{
  (e: 'deposit', amount: number): void;
  (e: 'withdraw', tkAmount: number): void;
}>();

const activeTab = ref<'deposit' | 'withdraw'>('deposit');
const depositAmount = ref(0);
const withdrawAmount = ref(0);
const loading = ref(false);

const WITHDRAW_FEE_PERCENT = 2;

const withdrawFee = computed(() => Math.round(withdrawAmount.value * WITHDRAW_FEE_PERCENT / 100));
const withdrawNet = computed(() => withdrawAmount.value - withdrawFee.value);
const roganEquivalent = computed(() => (depositAmount.value / 100).toFixed(2));

async function handleDeposit(): Promise<void> {
  if (depositAmount.value <= 0) return;
  loading.value = true;
  try {
    emit('deposit', depositAmount.value);
    depositAmount.value = 0;
  } finally {
    loading.value = false;
  }
}

async function handleWithdraw(): Promise<void> {
  if (withdrawAmount.value <= 0 || withdrawAmount.value > props.tkBalance) return;
  loading.value = true;
  try {
    emit('withdraw', withdrawAmount.value);
    withdrawAmount.value = 0;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Tab Toggle -->
    <div class="flex gap-2 mb-4">
      <v-btn
        :variant="activeTab === 'deposit' ? 'flat' : 'outlined'"
        :color="activeTab === 'deposit' ? 'green' : 'gray'"
        size="small"
        rounded="lg"
        class="flex-1"
        @click="activeTab = 'deposit'"
      >
        <v-icon start size="16">mdi-arrow-down</v-icon>
        Deposit
      </v-btn>
      <v-btn
        :variant="activeTab === 'withdraw' ? 'flat' : 'outlined'"
        :color="activeTab === 'withdraw' ? 'red' : 'gray'"
        size="small"
        rounded="lg"
        class="flex-1"
        @click="activeTab = 'withdraw'"
      >
        <v-icon start size="16">mdi-arrow-up</v-icon>
        Withdraw
      </v-btn>
    </div>

    <!-- Deposit Form -->
    <div v-if="activeTab === 'deposit'" class="space-y-3">
      <v-text-field
        v-model.number="depositAmount"
        type="number"
        label="ROGAN Amount"
        variant="solo-filled"
        bg-color="#2D2D2D"
        suffix="ROGAN"
        :min="1"
      />
      <div class="bg-[#2D2D2D] rounded-lg px-4 py-2 flex items-center justify-between">
        <span class="text-gray-400 text-xs">You'll receive</span>
        <span class="text-amber-400 text-sm font-bold">{{ (depositAmount * 100).toLocaleString() }} TK</span>
      </div>
      <v-btn
        color="green"
        block
        rounded="lg"
        :loading="loading"
        :disabled="depositAmount <= 0"
        @click="handleDeposit"
      >
        <v-icon start>mdi-arrow-down</v-icon>
        Deposit ROGAN
      </v-btn>
    </div>

    <!-- Withdraw Form -->
    <div v-if="activeTab === 'withdraw'" class="space-y-3">
      <v-text-field
        v-model.number="withdrawAmount"
        type="number"
        label="TK Amount"
        variant="solo-filled"
        bg-color="#2D2D2D"
        suffix="TK"
        :min="1"
        :max="tkBalance"
      />

      <div class="space-y-1 text-xs">
        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-2">
          <span class="text-gray-400">Available</span>
          <span class="text-white">{{ tkBalance.toLocaleString() }} TK</span>
        </div>
        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-2">
          <span class="text-gray-400">Fee ({{ WITHDRAW_FEE_PERCENT }}%)</span>
          <span class="text-red-400">-{{ withdrawFee }} TK</span>
        </div>
        <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-2">
          <span class="text-gray-400">You'll receive</span>
          <span class="text-green-400 font-bold">{{ (withdrawNet / 100).toFixed(2) }} ROGAN</span>
        </div>
      </div>

      <v-btn
        color="red"
        block
        rounded="lg"
        :loading="loading"
        :disabled="withdrawAmount <= 0 || withdrawAmount > tkBalance"
        @click="handleWithdraw"
      >
        <v-icon start>mdi-arrow-up</v-icon>
        Withdraw to ROGAN
      </v-btn>
    </div>
  </div>
</template>
