<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDMStore } from '@/stores/dm';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import * as dmService from '@/services/dm';
import type { DirectMessage, DMConversation } from '@/types';

const route = useRoute();
const router = useRouter();
const dmStore = useDMStore();
const authStore = useAuthStore();
const walletStore = useWalletStore();

const partnerId = computed(() => route.params.userId as string);
const messageInput = ref('');
const isPaidMessage = ref(false);
const paidPrice = ref(10);
const messagesContainer = ref<HTMLDivElement | null>(null);
const conversation = ref<DMConversation | null>(null);
const showPriceConfirmDialog = ref(false);
const showDMPriceDialog = ref(false);
const dmPriceInput = ref(0);
const pendingMessage = ref('');

const dmPrice = computed(() => conversation.value?.dm_price ?? 0);
const isCreator = computed(() => authStore.isCreator);

onMounted(async () => {
  await walletStore.fetchWallet();
  await dmStore.fetchMessages(partnerId.value);
  scrollToBottom();
  loadConversation();
});

onUnmounted(() => {
  dmStore.resetCurrentMessages();
});

const messages = computed(() => dmStore.currentMessages);

async function loadConversation(): Promise<void> {
  try {
    conversation.value = await dmService.getConversation(partnerId.value);
  } catch {
    // Conversation may not exist yet via this endpoint
  }
}

function isSentByMe(msg: DirectMessage): boolean {
  return msg.sender_id === authStore.user?.id;
}

function scrollToBottom(): void {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function sendMessage(): Promise<void> {
  const content = messageInput.value.trim();
  if (!content) return;

  // If DM has a price set by creator, confirm payment
  if (dmPrice.value > 0 && !isCreator.value) {
    pendingMessage.value = content;
    showPriceConfirmDialog.value = true;
    return;
  }

  await doSendMessage(content, isPaidMessage.value, isPaidMessage.value ? paidPrice.value : 0);
}

async function confirmPaidSend(): Promise<void> {
  const price = dmPrice.value > 0 ? dmPrice.value : paidPrice.value;
  await doSendMessage(pendingMessage.value, true, price);
  showPriceConfirmDialog.value = false;
  pendingMessage.value = '';
}

async function doSendMessage(content: string, paid: boolean, price: number): Promise<void> {
  await dmStore.sendMessage(partnerId.value, content, paid, price);
  messageInput.value = '';
  isPaidMessage.value = false;
  scrollToBottom();
  await walletStore.fetchWallet();
}

async function setDMPrice(): Promise<void> {
  try {
    if (conversation.value) {
      await dmService.setDMPrice(conversation.value.id, dmPriceInput.value);
      if (conversation.value) {
        conversation.value.dm_price = dmPriceInput.value;
      }
    }
    showDMPriceDialog.value = false;
  } catch {
    // Error
  }
}

async function markConversationRead(): Promise<void> {
  if (conversation.value) {
    await dmService.markAsRead(conversation.value.id);
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function goBack(): void {
  router.push('/dm');
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] flex flex-col max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 bg-[#1E1E1E] border-b border-[#3D3D3D]">
      <v-btn icon variant="text" size="small" @click="goBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>

      <v-avatar size="36">
        <v-icon size="22">mdi-account</v-icon>
      </v-avatar>

      <div class="flex-1">
        <p class="text-white text-sm font-medium">Conversation</p>
        <div class="flex items-center gap-2">
          <p class="text-gray-400 text-xs">Online</p>
          <v-chip v-if="dmPrice > 0" size="x-small" color="amber" variant="flat">
            <v-icon start size="10">mdi-diamond-stone</v-icon>
            {{ dmPrice }} TK/msg
          </v-chip>
        </div>
      </div>

      <v-btn v-if="isCreator" icon variant="text" size="small" @click="showDMPriceDialog = true; dmPriceInput = dmPrice">
        <v-icon color="white" size="18">mdi-currency-usd</v-icon>
      </v-btn>

      <v-btn icon variant="text" size="small" @click="markConversationRead">
        <v-icon color="white" size="18">mdi-check-all</v-icon>
      </v-btn>
    </div>

    <!-- DM Price Banner -->
    <div v-if="dmPrice > 0 && !isCreator" class="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
      <div class="flex items-center gap-2">
        <v-icon size="16" color="amber">mdi-diamond-stone</v-icon>
        <span class="text-amber-400 text-xs">This creator charges <strong>{{ dmPrice }} TK</strong> per message</span>
      </div>
    </div>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="isSentByMe(msg) ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[75%] rounded-2xl px-4 py-2.5"
          :class="isSentByMe(msg)
            ? 'bg-rogan-primary/20 rounded-br-md'
            : 'bg-[#2D2D2D] rounded-bl-md'"
        >
          <!-- Paid message indicator -->
          <div v-if="msg.is_paid" class="flex items-center gap-1 mb-1">
            <v-icon size="14" color="amber">mdi-diamond-stone</v-icon>
            <span class="text-amber-400 text-xs font-medium">Paid message ({{ msg.price }} TK)</span>
          </div>

          <p class="text-white text-sm break-words">{{ msg.content }}</p>

          <div class="flex items-center justify-end gap-1 mt-1">
            <span class="text-gray-500 text-[10px]">{{ formatTime(msg.created_at) }}</span>
            <!-- Read receipt (double checkmarks) -->
            <template v-if="isSentByMe(msg)">
              <v-icon
                size="14"
                :color="msg.is_read ? 'blue' : 'gray'"
              >
                {{ msg.is_read ? 'mdi-check-all' : 'mdi-check' }}
              </v-icon>
            </template>
          </div>
        </div>
      </div>

      <div v-if="messages.length === 0" class="text-center py-12">
        <v-icon size="48" color="#3D3D3D">mdi-message-text-outline</v-icon>
        <p class="text-gray-500 mt-2 text-sm">Start the conversation</p>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="px-4 py-3 bg-[#1E1E1E] border-t border-[#3D3D3D]">
      <!-- Paid message toggle -->
      <div v-if="isPaidMessage" class="flex items-center gap-2 mb-2 p-2 bg-amber-500/10 rounded-lg">
        <v-icon size="18" color="amber">mdi-diamond-stone</v-icon>
        <span class="text-amber-400 text-xs">Paid message</span>
        <v-text-field
          v-model.number="paidPrice"
          type="number"
          density="compact"
          variant="solo-filled"
          hide-details
          flat
          bg-color="#2D2D2D"
          suffix="TK"
          class="max-w-[100px]"
        />
        <v-btn icon size="x-small" variant="text" @click="isPaidMessage = false">
          <v-icon size="16" color="gray">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="flex items-center gap-2">
        <v-btn
          v-if="isCreator && dmPrice === 0"
          icon
          size="small"
          variant="text"
          @click="isPaidMessage = !isPaidMessage"
        >
          <v-icon :color="isPaidMessage ? 'amber' : 'gray'" size="20">mdi-currency-usd</v-icon>
        </v-btn>

        <v-text-field
          v-model="messageInput"
          placeholder="Type a message..."
          density="compact"
          variant="solo-filled"
          hide-details
          flat
          bg-color="#2D2D2D"
          class="flex-1"
          rounded="lg"
          @keydown.enter="sendMessage"
        />

        <v-btn
          icon
          size="small"
          color="rogan-primary"
          :disabled="!messageInput.trim()"
          @click="sendMessage"
        >
          <v-icon size="18">mdi-send</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Paid DM Confirmation Dialog -->
    <v-dialog v-model="showPriceConfirmDialog" max-width="380">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Confirm Paid Message</span>
        </v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm mb-3">
            This creator charges per message. You'll be charged:
          </p>
          <div class="flex items-center justify-center gap-2 mb-3">
            <v-icon size="24" color="amber">mdi-diamond-stone</v-icon>
            <span class="text-amber-400 text-2xl font-bold">{{ dmPrice || paidPrice }}</span>
            <span class="text-gray-400">TK</span>
          </div>
          <p class="text-gray-500 text-xs text-center">Current balance: {{ walletStore.tkBalance }} TK</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showPriceConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="rogan-primary"
            rounded="lg"
            :disabled="walletStore.tkBalance < (dmPrice || paidPrice)"
            @click="confirmPaidSend"
          >
            Send & Pay
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DM Price Setting Dialog (for creators) -->
    <v-dialog v-model="showDMPriceDialog" max-width="380">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Set DM Price</span>
        </v-card-title>
        <v-card-text class="px-6">
          <p class="text-gray-400 text-sm mb-3">
            Charge viewers to send you DMs. Set to 0 for free messages.
          </p>
          <v-text-field
            v-model.number="dmPriceInput"
            type="number"
            label="Price per message (TK)"
            variant="solo-filled"
            bg-color="#2D2D2D"
            suffix="TK"
            :min="0"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showDMPriceDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" @click="setDMPrice">Set Price</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
