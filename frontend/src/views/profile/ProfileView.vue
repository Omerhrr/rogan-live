<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useResponsive } from '@/composables/useResponsive';
import api from '@/services/api';
import type { User, Stream } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isMobile } = useResponsive();

const userId = computed(() => route.params.id as string);
const profile = ref<User | null>(null);
const loading = ref(true);
const isFollowing = ref(false);
const isOwnProfile = computed(() => authStore.user?.id === userId.value);

const followerCount = ref(0);
const followingCount = ref(0);
const totalEarnings = ref(0);
const currentStream = ref<Stream | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.get<User>(`/users/${userId.value}`);
    profile.value = data;
  } catch {
    // User not found
  } finally {
    loading.value = false;
  }
});

function goBack(): void {
  router.back();
}

function handleFollow(): void {
  isFollowing.value = !isFollowing.value;
  if (isFollowing.value) {
    followerCount.value++;
  } else {
    followerCount.value--;
  }
}

function handleDM(): void {
  router.push(`/dm/${userId.value}`);
}
</script>

<template>
  <!-- Desktop Layout -->
  <div v-if="!isMobile" class="h-full overflow-y-auto">
    <!-- Header Banner -->
    <div class="h-48 bg-gradient-to-br from-rogan-primary/20 via-rogan-secondary/10 to-[#121212] relative">
      <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#121212] to-transparent" />
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="!profile" class="text-center py-20">
      <v-icon size="56" color="#3D3D3D">mdi-account-off</v-icon>
      <p class="text-gray-500 mt-3">User not found</p>
    </div>

    <div v-else class="max-w-5xl mx-auto px-8 -mt-20 pb-8 relative z-10">
      <!-- Avatar + Info Row -->
      <div class="flex items-end gap-6 mb-8">
        <v-avatar size="120" class="border-4 border-[#121212] ring-4 ring-rogan-primary/30 flex-shrink-0">
          <v-img v-if="profile.avatar" :src="profile.avatar" :alt="profile.display_name" />
          <v-icon v-else size="64" color="white">mdi-account</v-icon>
        </v-avatar>

        <div class="flex-1 min-w-0 pb-2">
          <h1 class="text-3xl font-bold text-white flex items-center gap-2">
            {{ profile.display_name }}
            <v-icon v-if="profile.role === 'creator'" size="22" color="rogan-primary">mdi-star</v-icon>
          </h1>
          <p class="text-gray-400 text-base">@{{ profile.username }}</p>

          <!-- Live indicator -->
          <div v-if="currentStream" class="inline-flex items-center gap-1 mt-2 bg-red-600 px-3 py-1 rounded-full">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span class="text-white text-xs font-bold">LIVE NOW</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pb-2">
          <v-btn v-if="!isOwnProfile" :color="isFollowing ? '#3D3D3D' : 'rogan-primary'"
            :variant="isFollowing ? 'outlined' : 'flat'" rounded="lg" size="large" @click="handleFollow">
            <v-icon start size="18">{{ isFollowing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
            {{ isFollowing ? 'Following' : 'Follow' }}
          </v-btn>

          <v-btn v-if="profile.role === 'creator' && !isOwnProfile" color="rogan-secondary" variant="outlined"
            rounded="lg" size="large">
            <v-icon start size="18">mdi-star</v-icon>
            Subscribe
          </v-btn>

          <v-btn v-if="!isOwnProfile" color="#3D3D3D" variant="outlined" rounded="lg" size="large" @click="handleDM">
            <v-icon start size="18">mdi-message-text</v-icon>
            DM
          </v-btn>

          <v-btn v-if="isOwnProfile" color="#3D3D3D" variant="outlined" rounded="lg" size="large"
            @click="router.push('/dashboard')">
            <v-icon start size="18">mdi-pencil</v-icon>
            Edit Profile
          </v-btn>
        </div>
      </div>

      <!-- Bio -->
      <p v-if="profile.bio" class="text-gray-300 text-base max-w-2xl mb-8 leading-relaxed">
        {{ profile.bio }}
      </p>

      <!-- Stats -->
      <div class="flex gap-10 mb-10">
        <div class="text-center">
          <p class="text-2xl font-bold text-white">{{ followerCount.toLocaleString() }}</p>
          <p class="text-sm text-gray-400">Followers</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-white">{{ followingCount.toLocaleString() }}</p>
          <p class="text-sm text-gray-400">Following</p>
        </div>
        <div v-if="profile.role === 'creator'" class="text-center">
          <p class="text-2xl font-bold text-amber-400">{{ totalEarnings.toLocaleString() }}</p>
          <p class="text-sm text-gray-400">TK Earned</p>
        </div>
      </div>

      <!-- Content Section -->
      <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
        <h3 class="text-white font-semibold text-lg mb-4">Recent Streams</h3>
        <div class="text-center py-10">
          <v-icon size="48" color="#3D3D3D">mdi-broadcast</v-icon>
          <p class="text-gray-500 text-sm mt-3">No recent streams</p>
        </div>
      </v-card>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div v-else class="min-h-screen bg-[#121212]">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 bg-[#1E1E1E]">
      <v-btn icon variant="text" size="small" @click="goBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <span class="text-white font-semibold">Profile</span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <v-progress-circular indeterminate color="rogan-primary" />
    </div>

    <div v-else-if="!profile" class="text-center py-20">
      <v-icon size="56" color="#3D3D3D">mdi-account-off</v-icon>
      <p class="text-gray-500 mt-3">User not found</p>
    </div>

    <div v-else class="px-6 py-8">
      <!-- Avatar and Info -->
      <div class="text-center mb-6">
        <v-avatar size="96" class="border-4 border-rogan-primary mb-3">
          <v-img v-if="profile.avatar" :src="profile.avatar" :alt="profile.display_name" />
          <v-icon v-else size="52" color="white">mdi-account</v-icon>
        </v-avatar>

        <h1 class="text-xl font-bold text-white flex items-center justify-center gap-1">
          {{ profile.display_name }}
          <v-icon v-if="profile.role === 'creator'" size="18" color="rogan-primary">mdi-star</v-icon>
        </h1>
        <p class="text-gray-400 text-sm">@{{ profile.username }}</p>

        <div v-if="currentStream" class="inline-flex items-center gap-1 mt-2 bg-red-600 px-2.5 py-0.5 rounded-full">
          <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span class="text-white text-xs font-bold">LIVE NOW</span>
        </div>

        <p v-if="profile.bio" class="text-gray-300 text-sm mt-3 max-w-md mx-auto">{{ profile.bio }}</p>
      </div>

      <!-- Stats -->
      <div class="flex justify-center gap-8 mb-6">
        <div class="text-center">
          <p class="text-xl font-bold text-white">{{ followerCount.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">Followers</p>
        </div>
        <div class="text-center">
          <p class="text-xl font-bold text-white">{{ followingCount.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">Following</p>
        </div>
        <div v-if="profile.role === 'creator'" class="text-center">
          <p class="text-xl font-bold text-amber-400">{{ totalEarnings.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">TK Earned</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 max-w-sm mx-auto mb-8">
        <v-btn v-if="!isOwnProfile" :color="isFollowing ? '#3D3D3D' : 'rogan-primary'"
          :variant="isFollowing ? 'outlined' : 'flat'" block rounded="lg" @click="handleFollow">
          <v-icon start size="18">{{ isFollowing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
          {{ isFollowing ? 'Following' : 'Follow' }}
        </v-btn>
        <v-btn v-if="profile.role === 'creator' && !isOwnProfile" color="rogan-secondary" variant="outlined"
          block rounded="lg">
          <v-icon start size="18">mdi-star</v-icon>
          Subscribe
        </v-btn>
        <v-btn v-if="!isOwnProfile" color="#3D3D3D" variant="outlined" block rounded="lg" @click="handleDM">
          <v-icon start size="18">mdi-message-text</v-icon>
          DM
        </v-btn>
        <v-btn v-if="isOwnProfile" color="#3D3D3D" variant="outlined" block rounded="lg"
          @click="router.push('/dashboard')">
          <v-icon start size="18">mdi-pencil</v-icon>
          Edit Profile
        </v-btn>
      </div>

      <!-- Recent Streams -->
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <h3 class="text-white font-semibold text-sm mb-4">Recent Streams</h3>
        <div class="text-center py-6">
          <v-icon size="40" color="#3D3D3D">mdi-broadcast</v-icon>
          <p class="text-gray-500 text-sm mt-2">No recent streams</p>
        </div>
      </v-card>
    </div>
  </div>
</template>
