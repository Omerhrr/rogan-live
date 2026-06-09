import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Conversation, DirectMessage, PaginatedResponse } from '@/types';
import * as dmService from '@/services/dm';

export const useDMStore = defineStore('dm', () => {
  const conversations = ref<Conversation[]>([]);
  const currentMessages = ref<DirectMessage[]>([]);
  const loading = ref(false);
  const messagePage = ref(1);
  const hasMoreMessages = ref(true);
  const currentPartnerId = ref<string | null>(null);

  async function fetchConversations(): Promise<void> {
    loading.value = true;
    try {
      conversations.value = await dmService.getConversations();
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(
    partnerId: string,
    append: boolean = false
  ): Promise<void> {
    if (append && !hasMoreMessages.value) return;
    loading.value = true;
    currentPartnerId.value = partnerId;

    try {
      if (!append) {
        messagePage.value = 1;
      }
      const res: PaginatedResponse<DirectMessage> = await dmService.getMessages(
        partnerId,
        messagePage.value,
        30
      );
      const items = res.streams ?? res.items ?? [];
      if (append) {
        currentMessages.value = [...items.reverse(), ...currentMessages.value];
      } else {
        currentMessages.value = items.reverse();
      }
      hasMoreMessages.value = messagePage.value < res.pages;
      messagePage.value++;
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(
    receiverId: string,
    content: string,
    isPaid: boolean = false,
    price: number = 0
  ): Promise<DirectMessage> {
    const msg = await dmService.sendDM(receiverId, content, isPaid, price);
    currentMessages.value.push(msg);

    // Update conversation list
    const conv = conversations.value.find(
      (c) => c.partner.id === receiverId
    );
    if (conv) {
      conv.last_message = msg;
    }

    return msg;
  }

  async function markMessageRead(messageId: string): Promise<void> {
    await dmService.markRead(messageId);
    const msg = currentMessages.value.find((m) => m.id === messageId);
    if (msg) {
      msg.is_read = true;
    }
  }

  function resetCurrentMessages(): void {
    currentMessages.value = [];
    messagePage.value = 1;
    hasMoreMessages.value = true;
    currentPartnerId.value = null;
  }

  return {
    conversations,
    currentMessages,
    loading,
    hasMoreMessages,
    currentPartnerId,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessageRead,
    resetCurrentMessages,
  };
});
