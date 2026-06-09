import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WSChatMessage, WSGiftEvent, GiftType } from '@/types';
import * as ws from '@/services/websocket';
import { useAuthStore } from '@/stores/auth';

export interface GiftAnimation {
  id: string;
  giftType: GiftType;
  senderName: string;
  x: number;
  y: number;
  timestamp: number;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<WSChatMessage[]>([]);
  const giftAnimations = ref<GiftAnimation[]>([]);
  const viewerCount = ref(0);
  const typingUsers = ref<string[]>([]);
  const connected = ref(false);
  const activeStreamId = ref<string | null>(null);

  // Bound handler references so we can unregister them later
  let chatHandler: ((msg: WSChatMessage) => void) | null = null;
  let giftHandler: ((gift: WSGiftEvent) => void) | null = null;
  let viewerHandler: ((update: any) => void) | null = null;
  let typingHandler: ((event: any) => void) | null = null;
  let connectedHandler: (() => void) | null = null;

  function connectToStream(streamId: string): void {
    const authStore = useAuthStore();
    const jwtToken = authStore.token;
    const userId = authStore.user?.id;

    if (!jwtToken || !userId) {
      console.error('Cannot connect to stream: not authenticated');
      return;
    }

    // Disconnect from previous stream if any
    if (activeStreamId.value) {
      disconnectFromStream(activeStreamId.value);
    }

    // Clear previous state
    messages.value = [];
    giftAnimations.value = [];
    viewerCount.value = 0;
    typingUsers.value = [];
    connected.value = false;
    activeStreamId.value = streamId;

    // Create handlers
    chatHandler = (msg: WSChatMessage) => {
      messages.value.push(msg);
      // Keep only last 100 messages
      if (messages.value.length > 100) {
        messages.value = messages.value.slice(-100);
      }
    };

    giftHandler = (gift: WSGiftEvent) => {
      // Add gift chat message
      const chatMsg: WSChatMessage = {
        id: gift.id,
        stream_id: gift.stream_id,
        user_id: gift.sender_id,
        username: gift.sender_username,
        avatar: gift.sender_avatar,
        message: gift.message || `sent a ${gift.gift_type}`,
        is_gift: true,
        gift_type: gift.gift_type,
        gift_amount: gift.amount,
        created_at: gift.created_at,
      };
      messages.value.push(chatMsg);

      // Add gift animation
      const animation: GiftAnimation = {
        id: gift.id + '-' + Date.now(),
        giftType: gift.gift_type,
        senderName: gift.sender_username,
        x: Math.random() * 60 + 20, // 20-80% of screen width
        y: 80, // Start near bottom
        timestamp: Date.now(),
      };
      giftAnimations.value.push(animation);

      // Auto-remove animation after 3 seconds
      setTimeout(() => {
        giftAnimations.value = giftAnimations.value.filter(
          (a) => a.timestamp !== animation.timestamp
        );
      }, 3000);
    };

    viewerHandler = (update: any) => {
      if (update.viewer_count !== undefined) {
        viewerCount.value = update.viewer_count;
      }
    };

    typingHandler = (event: any) => {
      if (!typingUsers.value.includes(event.username)) {
        typingUsers.value.push(event.username);
        // Remove after 3 seconds
        setTimeout(() => {
          typingUsers.value = typingUsers.value.filter(
            (u) => u !== event.username
          );
        }, 3000);
      }
    };

    connectedHandler = () => {
      connected.value = true;
    };

    // Register event handlers
    ws.onChat(streamId, chatHandler);
    ws.onGift(streamId, giftHandler);
    ws.onViewerUpdate(streamId, viewerHandler);
    ws.onTyping(streamId, typingHandler);
    ws.onConnected(streamId, connectedHandler);

    // Connect to the WebSocket
    ws.connectToStream(streamId, userId, jwtToken);
  }

  function disconnectFromStream(streamId: string): void {
    // Unregister event handlers
    if (chatHandler) ws.offChat(streamId, chatHandler);
    if (giftHandler) ws.offGift(streamId, giftHandler);
    if (viewerHandler) ws.offViewerUpdate(streamId, viewerHandler);
    if (typingHandler) ws.offTyping(streamId, typingHandler);
    if (connectedHandler) ws.offConnected(streamId, connectedHandler);

    chatHandler = null;
    giftHandler = null;
    viewerHandler = null;
    typingHandler = null;
    connectedHandler = null;

    ws.disconnectFromStream(streamId);

    if (activeStreamId.value === streamId) {
      activeStreamId.value = null;
      connected.value = false;
    }
  }

  function sendMessage(streamId: string, message: string): void {
    ws.sendChatMessage(streamId, message);
  }

  function sendTyping(streamId: string): void {
    ws.sendTyping(streamId);
  }

  function addGiftAnimation(giftType: GiftType, senderName: string): void {
    const animation: GiftAnimation = {
      id: Date.now().toString(),
      giftType,
      senderName,
      x: Math.random() * 60 + 20,
      y: 80,
      timestamp: Date.now(),
    };
    giftAnimations.value.push(animation);

    setTimeout(() => {
      giftAnimations.value = giftAnimations.value.filter(
        (a) => a.timestamp !== animation.timestamp
      );
    }, 3000);
  }

  return {
    messages,
    giftAnimations,
    viewerCount,
    typingUsers,
    connected,
    activeStreamId,
    connectToStream,
    disconnectFromStream,
    sendMessage,
    sendTyping,
    addGiftAnimation,
  };
});
