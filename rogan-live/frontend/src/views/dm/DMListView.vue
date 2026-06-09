<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDMStore } from '@/stores/dm';
import { useResponsive } from '@/composables/useResponsive';

const router = useRouter();
const dmStore = useDMStore();
const { isMobile } = useResponsive();
const searchQuery = ref('');

onMounted(() => {
  dmStore.fetchConversations();
});

const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) return dmStore.conversations;
  const q = searchQuery.value.toLowerCase();
  return dmStore.conversations.filter(
    (c) =>
      (c.other_user?.display_name || '').toLowerCase().includes(q) ||
      (c.other_user?.username || '').toLowerCase().includes(q)
  );
});

function openConversation(partnerId: string): void {
  router.push(`/dm/${partnerId}`);
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return 'Now';
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <div class="max-w-4xl mx-auto px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-white">Messages</h1>
      </div>

      <v-text-field v-model="searchQuery" placeholder="Search conversations..."
        prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" hide-details flat
        bg-color="#1E1E1E" rounded="lg" class="mb-6" />

      <div v-if="dmStore.loading" class="text-center py-12">
        <v-progress-circular indeterminate color="rogan-primary" />
      </div>

      <div v-else-if="filteredConversations.length === 0" class="text-center py-12">
        <v-icon size="56" color="#3D3D3D">mdi-message-outline</v-icon>
        <p class="text-gray-500 mt-3">No conversations yet</p>
        <p class="text-gray-600 text-sm">Start a conversation from a creator's profile</p>
      </div>

      <div v-else class="space-y-1">
        <div v-for="conv in filteredConversations" :key="conv.id"
          class="flex items-center gap-4 p-4 rounded-xl hover:bg-[#1E1E1E] cursor-pointer transition-colors"
          @click="openConversation(conv.other_user?.id || '')"
        >
          <v-avatar size="48" class="flex-shrink-0">
            <v-img v-if="conv.other_user?.avatar" :src="conv.other_user.avatar" :alt="conv.other_user.display_name" />
            <v-icon v-else size="28">mdi-account</v-icon>
          </v-avatar>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-white font-medium text-sm truncate">
                {{ conv.other_user?.display_name || conv.other_user?.username || 'Unknown' }}
              </span>
              <span class="text-gray-500 text-xs flex-shrink-0 ml-2">{{ formatTime(conv.last_message?.created_at || null) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <p class="text-gray-400 text-xs truncate">
                <span v-if="conv.last_message?.is_paid" class="text-amber-400 mr-1">Paid</span>
                {{ conv.last_message?.content || 'No messages yet' }}
              </p>
              <v-badge v-if="conv.unread_count > 0" :content="conv.unread_count" color="rogan-primary" inline class="ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212] max-w-2xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-white">Messages</h1>
    </div>

    <v-text-field v-model="searchQuery" placeholder="Search conversations..."
      prepend-inner-icon="mdi-magnify" variant="solo-filled" density="compact" hide-details flat
      bg-color="#2D2D2D" rounded="lg" class="mb-4" />

    <div v-if="dmStore.loading" class="text-center py-12">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="filteredConversations.length === 0" class="text-center py-12">
      <v-icon size="56" color="#3D3D3D">mdi-message-outline</v-icon>
      <p class="text-gray-500 mt-3">No conversations yet</p>
      <p class="text-gray-600 text-sm">Start a conversation from a creator's profile</p>
    </div>

    <div v-else class="space-y-1">
      <div v-for="conv in filteredConversations" :key="conv.id"
        class="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1E1E1E] cursor-pointer transition-colors"
        @click="openConversation(conv.other_user?.id || '')"
      >
        <v-avatar size="48" class="flex-shrink-0">
          <v-img v-if="conv.other_user?.avatar" :src="conv.other_user.avatar" :alt="conv.other_user.display_name" />
          <v-icon v-else size="28">mdi-account</v-icon>
        </v-avatar>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="text-white font-medium text-sm truncate">
              {{ conv.other_user?.display_name || conv.other_user?.username || 'Unknown' }}
            </span>
            <span class="text-gray-500 text-xs flex-shrink-0 ml-2">{{ formatTime(conv.last_message?.created_at || null) }}</span>
          </div>
          <div class="flex items-center justify-between mt-0.5">
            <p class="text-gray-400 text-xs truncate">
              <span v-if="conv.last_message?.is_paid" class="text-amber-400 mr-1">Paid</span>
              {{ conv.last_message?.content || 'No messages yet' }}
            </p>
            <v-badge v-if="conv.unread_count > 0" :content="conv.unread_count" color="rogan-primary" inline class="ml-2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
