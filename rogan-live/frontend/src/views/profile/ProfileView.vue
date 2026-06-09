<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useResponsive } from '@/composables/useResponsive';
import api from '@/services/api';
import type { User } from '@/types';

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
const totalGifts = ref(0);
const subscriberCount = ref(0);
const isLive = ref(false);
const showEditDialog = ref(false);
const editForm = ref({ display_name: '', bio: '', avatar: '' });
const editLoading = ref(false);

onMounted(async () => {
  await loadProfile();
});

async function loadProfile(): Promise<void> {
  loading.value = true;
  try {
    const { data } = await api.get(`/auth/users/${userId.value}`);
    profile.value = data;

    // If it's a creator, also load creator profile for stats
    if (data.role === 'creator' || data.role === 'admin') {
      try {
        const { data: creatorData } = await api.get(`/creators/${userId.value}/profile`);
        if (creatorData.stats) {
          totalGifts.value = creatorData.stats.total_gifts_received || 0;
          totalEarnings.value = creatorData.stats.total_tk_earned || 0;
        }
      } catch {
        // Creator stats not available
      }
    }

    // Check if user is live
    isLive.value = data.is_live || false;
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

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

function openEditDialog(): void {
  if (!profile.value) return;
  editForm.value = {
    display_name: profile.value.display_name || '',
    bio: profile.value.bio || '',
    avatar: profile.value.avatar || '',
  };
  showEditDialog.value = true;
}

async function saveProfile(): Promise<void> {
  editLoading.value = true;
  try {
    const { data } = await api.put('/auth/me', editForm.value);
    profile.value = data;
    authStore.user = data;
    localStorage.setItem('rogan_user', JSON.stringify(data));
    showEditDialog.value = false;
  } catch {
    // Handle error silently
  } finally {
    editLoading.value = false;
  }
}

async function upgradeToCreator(): Promise<void> {
  try {
    const { data } = await api.put('/auth/me', { role: 'creator' });
    profile.value = data;
    authStore.user = data;
    localStorage.setItem('rogan_user', JSON.stringify(data));
  } catch {
    // Handle error
  }
}

function goToLiveRoom(): void {
  router.push(`/live/${userId.value}`);
}

function goToWallet(): void {
  router.push('/wallet');
}

function goToDashboard(): void {
  router.push('/dashboard');
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
      <v-btn color="rogan-primary" variant="text" class="mt-4" @click="router.push('/')">
        Back to Feed
      </v-btn>
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
          <div v-if="isLive" class="inline-flex items-center gap-1 mt-2 bg-red-600 px-3 py-1 rounded-full cursor-pointer" @click="goToLiveRoom">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span class="text-white text-xs font-bold">LIVE NOW - Click to Watch</span>
          </div>

          <!-- Role badge -->
          <div class="mt-2">
            <v-chip size="small" :color="profile.role === 'creator' ? 'rogan-primary' : profile.role === 'admin' ? 'amber' : '#3D3D3D'" variant="flat">
              <v-icon start size="14">{{ profile.role === 'creator' ? 'mdi-star' : profile.role === 'admin' ? 'mdi-shield' : 'mdi-account' }}</v-icon>
              {{ profile.role === 'creator' ? 'Creator' : profile.role === 'admin' ? 'Admin' : 'Viewer' }}
            </v-chip>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pb-2">
          <template v-if="!isOwnProfile">
            <v-btn :color="isFollowing ? '#3D3D3D' : 'rogan-primary'"
              :variant="isFollowing ? 'outlined' : 'flat'" rounded="lg" size="large" @click="handleFollow">
              <v-icon start size="18">{{ isFollowing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
              {{ isFollowing ? 'Following' : 'Follow' }}
            </v-btn>

            <v-btn v-if="profile.role === 'creator'" color="rogan-secondary" variant="outlined"
              rounded="lg" size="large" :to="`/subscriptions/${userId}`">
              <v-icon start size="18">mdi-star</v-icon>
              Subscribe
            </v-btn>

            <v-btn color="#3D3D3D" variant="outlined" rounded="lg" size="large" @click="handleDM">
              <v-icon start size="18">mdi-message-text</v-icon>
              DM
            </v-btn>

            <v-btn v-if="isLive" color="red" rounded="lg" size="large" @click="goToLiveRoom">
              <v-icon start size="18">mdi-play</v-icon>
              Watch Live
            </v-btn>
          </template>

          <template v-else>
            <v-btn color="#3D3D3D" variant="outlined" rounded="lg" size="large" @click="openEditDialog">
              <v-icon start size="18">mdi-pencil</v-icon>
              Edit Profile
            </v-btn>
            <v-btn v-if="profile.role === 'creator'" color="rogan-primary" variant="outlined" rounded="lg" size="large" @click="goToDashboard">
              <v-icon start size="18">mdi-chart-box</v-icon>
              Dashboard
            </v-btn>
            <v-btn color="rogan-primary" variant="outlined" rounded="lg" size="large" @click="goToWallet">
              <v-icon start size="18">mdi-wallet</v-icon>
              Wallet
            </v-btn>
            <v-btn color="rogan-secondary" rounded="lg" size="large" to="/stream/go-live">
              <v-icon start size="18">mdi-broadcast</v-icon>
              Go Live
            </v-btn>
          </template>
        </div>
      </div>

      <!-- Bio -->
      <p v-if="profile.bio" class="text-gray-300 text-base max-w-2xl mb-8 leading-relaxed">
        {{ profile.bio }}
      </p>
      <p v-else class="text-gray-500 text-sm italic mb-8">No bio yet</p>

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
        <div v-if="profile.role === 'creator'" class="text-center">
          <p class="text-2xl font-bold text-rogan-primary">{{ totalGifts.toLocaleString() }}</p>
          <p class="text-sm text-gray-400">Gifts Received</p>
        </div>
      </div>

      <!-- Upgrade to Creator Card -->
      <v-card v-if="isOwnProfile && profile.role === 'user'" class="bg-gradient-to-r from-rogan-primary/10 to-rogan-secondary/10 border border-rogan-primary/20 rounded-2xl p-6 mb-8">
        <div class="flex items-center gap-4">
          <v-icon size="40" color="rogan-primary">mdi-star-circle</v-icon>
          <div class="flex-1">
            <h3 class="text-white font-semibold text-lg">Become a Creator</h3>
            <p class="text-gray-400 text-sm">Start streaming, earn TK tokens from gifts, and build your audience.</p>
          </div>
          <v-btn color="rogan-primary" rounded="lg" size="large" to="/stream/go-live">
            <v-icon start>mdi-broadcast</v-icon>
            Go Live Now
          </v-btn>
        </div>
      </v-card>

      <!-- Content Section -->
      <v-card class="bg-[#1E1E1E] rounded-2xl p-6">
        <h3 class="text-white font-semibold text-lg mb-4">Recent Streams</h3>
        <div class="text-center py-10">
          <v-icon size="48" color="#3D3D3D">mdi-broadcast</v-icon>
          <p class="text-gray-500 text-sm mt-3">No recent streams</p>
          <v-btn v-if="isOwnProfile" color="rogan-primary" variant="text" class="mt-3" to="/stream/go-live">
            Start your first stream
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Edit Profile</span>
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="editForm.display_name" label="Display Name" variant="solo-filled" bg-color="#2D2D2D" class="mb-3" />
          <v-textarea v-model="editForm.bio" label="Bio" variant="solo-filled" bg-color="#2D2D2D" rows="3" class="mb-3" />
          <v-text-field v-model="editForm.avatar" label="Avatar URL" variant="solo-filled" bg-color="#2D2D2D" placeholder="https://..." />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" :loading="editLoading" @click="saveProfile">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      <v-btn color="rogan-primary" variant="text" class="mt-4" @click="router.push('/')">
        Back to Feed
      </v-btn>
    </div>

    <div v-else class="px-4 py-6">
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

        <v-chip size="small" :color="profile.role === 'creator' ? 'rogan-primary' : profile.role === 'admin' ? 'amber' : '#3D3D3D'" variant="flat" class="mt-2">
          {{ profile.role === 'creator' ? 'Creator' : profile.role === 'admin' ? 'Admin' : 'Viewer' }}
        </v-chip>

        <div v-if="isLive" class="inline-flex items-center gap-1 mt-2 bg-red-600 px-2.5 py-0.5 rounded-full cursor-pointer" @click="goToLiveRoom">
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
      <div class="space-y-2 max-w-sm mx-auto mb-6">
        <template v-if="!isOwnProfile">
          <v-btn :color="isFollowing ? '#3D3D3D' : 'rogan-primary'"
            :variant="isFollowing ? 'outlined' : 'flat'" block rounded="lg" @click="handleFollow">
            <v-icon start size="18">{{ isFollowing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
            {{ isFollowing ? 'Following' : 'Follow' }}
          </v-btn>
          <v-btn v-if="profile.role === 'creator'" color="rogan-secondary" variant="outlined"
            block rounded="lg" :to="`/subscriptions/${userId}`">
            <v-icon start size="18">mdi-star</v-icon>
            Subscribe
          </v-btn>
          <v-btn color="#3D3D3D" variant="outlined" block rounded="lg" @click="handleDM">
            <v-icon start size="18">mdi-message-text</v-icon>
            Send DM
          </v-btn>
          <v-btn v-if="isLive" color="red" block rounded="lg" @click="goToLiveRoom">
            <v-icon start size="18">mdi-play</v-icon>
            Watch Live
          </v-btn>
        </template>
        <template v-else>
          <v-btn color="#3D3D3D" variant="outlined" block rounded="lg" @click="openEditDialog">
            <v-icon start size="18">mdi-pencil</v-icon>
            Edit Profile
          </v-btn>
          <v-btn v-if="profile.role === 'creator'" color="rogan-primary" variant="outlined" block rounded="lg" @click="goToDashboard">
            <v-icon start size="18">mdi-chart-box</v-icon>
            Creator Dashboard
          </v-btn>
          <v-btn color="rogan-primary" variant="outlined" block rounded="lg" @click="goToWallet">
            <v-icon start size="18">mdi-wallet</v-icon>
            Wallet
          </v-btn>
          <v-btn color="rogan-secondary" block rounded="lg" to="/stream/go-live">
            <v-icon start size="18">mdi-broadcast</v-icon>
            Go Live
          </v-btn>
        </template>
      </div>

      <!-- Upgrade to Creator Card -->
      <v-card v-if="isOwnProfile && profile.role === 'user'" class="bg-gradient-to-r from-rogan-primary/10 to-rogan-secondary/10 border border-rogan-primary/20 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <v-icon size="32" color="rogan-primary">mdi-star-circle</v-icon>
          <div class="flex-1">
            <h3 class="text-white font-semibold text-sm">Become a Creator</h3>
            <p class="text-gray-400 text-xs">Start streaming and earn TK tokens</p>
          </div>
        </div>
      </v-card>

      <!-- Recent Streams -->
      <v-card class="bg-[#1E1E1E] rounded-2xl p-4">
        <h3 class="text-white font-semibold text-sm mb-3">Recent Streams</h3>
        <div class="text-center py-6">
          <v-icon size="40" color="#3D3D3D">mdi-broadcast</v-icon>
          <p class="text-gray-500 text-sm mt-2">No recent streams</p>
        </div>
      </v-card>
    </div>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Edit Profile</span>
        </v-card-title>
        <v-card-text class="px-6">
          <v-text-field v-model="editForm.display_name" label="Display Name" variant="solo-filled" bg-color="#2D2D2D" class="mb-3" />
          <v-textarea v-model="editForm.bio" label="Bio" variant="solo-filled" bg-color="#2D2D2D" rows="3" class="mb-3" />
          <v-text-field v-model="editForm.avatar" label="Avatar URL" variant="solo-filled" bg-color="#2D2D2D" placeholder="https://..." />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
          <v-btn color="rogan-primary" rounded="lg" :loading="editLoading" @click="saveProfile">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
