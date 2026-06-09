<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();

const messageInput = ref('');
const messagesContainer = ref<HTMLDivElement | null>(null);
const isAtBottom = ref(true);

const props = defineProps<{
  streamId: string;
}>();

function sendMessage(): void {
  const msg = messageInput.value.trim();
  if (!msg) return;
  chatStore.sendMessage(props.streamId, msg);
  messageInput.value = '';
  scrollToBottom();
}

function scrollToBottom(): void {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function handleScroll(): void {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  isAtBottom.value = scrollHeight - scrollTop - clientHeight < 50;
}

watch(
  () => chatStore.messages.length,
  () => {
    if (isAtBottom.value) {
      scrollToBottom();
    }
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="flex flex-col h-full bg-[#1E1E1E]">
    <!-- Messages list -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-3 py-2 space-y-1.5"
      @scroll="handleScroll"
    >
      <div
        v-for="msg in chatStore.messages"
        :key="msg.id"
        class="chat-message"
        :class="{ 'gift-message rounded-lg px-2 py-1.5': msg.is_gift }"
      >
        <div class="flex items-start gap-1.5">
          <v-avatar size="24" class="flex-shrink-0 mt-0.5">
            <v-img v-if="msg.avatar" :src="msg.avatar" />
            <v-icon v-else size="14">mdi-account</v-icon>
          </v-avatar>

          <div class="min-w-0">
            <span class="text-rogan-accent text-xs font-semibold mr-1">
              {{ msg.username }}
            </span>
            <span class="text-white/90 text-xs break-words">
              <span v-if="msg.is_gift" class="mr-1">
                {{ msg.gift_type === 'rose' ? '🌹' : msg.gift_type === 'heart' ? '❤️' : msg.gift_type === 'diamond' ? '💎' : msg.gift_type === 'rocket' ? '🚀' : '👑' }}
                x{{ msg.gift_amount }}
              </span>
              {{ msg.message }}
            </span>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="chatStore.typingUsers.length" class="text-xs text-gray-500 italic px-1">
        {{ chatStore.typingUsers.join(', ') }} typing...
      </div>
    </div>

    <!-- Input bar -->
    <div class="flex items-center gap-2 px-3 py-2 border-t border-[#3D3D3D]">
      <v-text-field
        v-model="messageInput"
        placeholder="Say something..."
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
</template>
