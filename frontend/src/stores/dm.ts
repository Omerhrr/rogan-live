import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DirectMessage, PaginatedResponse } from '@/types';
import * as dmService from '@/services/dm';

export interface ConversationItem {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  dm_price: number;
  created_at: string | null;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar: string | null;
  } | null;
  last_message: {
    id: string;
    sender_id: string;
    content: string;
    is_paid: boolean;
    amount_tk: number | null;
    created_at: string | null;
  } | null;
  unread_count: number;
}

export const useDMStore = defineStore('dm', () => {
  const conversations = ref<ConversationItem[]>([]);
  const currentMessages = ref<DirectMessage[]>([]);
  const loading = ref(false);
  const messagePage = ref(1);
  const hasMoreMessages = ref(true);
  const currentPartnerId = ref<string | null>(null);

  async function fetchConversations(): Promise<void> {
    loading.value = true;
    try {
      const res = await dmService.getConversations();
      conversations.value = res.conversations ?? [];
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
      const res = await dmService.getMessages(
        partnerId,
        messagePage.value,
        30
      );
      const items = res.messages ?? [];
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
      (c) => c.other_user?.id === receiverId
    );
    if (conv && conv.last_message) {
      conv.last_message = {
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        is_paid: msg.is_paid,
        amount_tk: msg.price,
        created_at: msg.created_at,
      };
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
