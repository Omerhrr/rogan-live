<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useModerationStore } from '@/stores/moderation';
import ReportCard from '@/components/moderation/ReportCard.vue';
import type { ReportStatus } from '@/types';

const modStore = useModerationStore();

const activeTab = ref<'reports' | 'bans' | 'stats'>('reports');
const statusFilter = ref<ReportStatus | undefined>(undefined);
const showBanDialog = ref(false);
const banUserId = ref('');
const banReason = ref('');
const banPermanent = ref(false);
const banDuration = ref(24);

onMounted(async () => {
  await modStore.fetchStats();
  await modStore.fetchReports(false, statusFilter.value);
});

async function handleResolve(reportId: string, action: 'dismiss' | 'warn' | 'strike' | 'ban'): Promise<void> {
  await modStore.resolveReport(reportId, action, `Action: ${action}`);
  await modStore.fetchStats();
}

async function filterByStatus(status?: ReportStatus): Promise<void> {
  statusFilter.value = status;
  await modStore.fetchReports(false, status);
}

async function handleBan(): Promise<void> {
  if (!banUserId.value || !banReason.value) return;
  await modStore.banUser({
    user_id: banUserId.value,
    reason: banReason.value,
    is_permanent: banPermanent.value,
    duration_hours: banPermanent.value ? undefined : banDuration.value,
  });
  showBanDialog.value = false;
  banUserId.value = '';
  banReason.value = '';
  await modStore.fetchStats();
}

async function handleUnban(userId: string): Promise<void> {
  await modStore.unbanUser(userId);
  await modStore.fetchStats();
}
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-4 lg:p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Moderation</h1>
        <p class="text-gray-400 text-sm mt-0.5">Admin moderation dashboard</p>
      </div>
      <v-btn color="red" size="small" rounded="lg" @click="showBanDialog = true">
        <v-icon start size="16">mdi-gavel</v-icon>
        Ban User
      </v-btn>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="18" color="yellow">mdi-alert-circle</v-icon>
          <span class="text-xs text-gray-400">Pending Reports</span>
        </div>
        <p class="text-xl font-bold text-yellow-400">{{ modStore.stats.pending_reports }}</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="18" color="red">mdi-block-helper</v-icon>
          <span class="text-xs text-gray-400">Active Bans</span>
        </div>
        <p class="text-xl font-bold text-red-400">{{ modStore.stats.active_bans }}</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="18" color="orange">mdi-alert</v-icon>
          <span class="text-xs text-gray-400">Total Strikes</span>
        </div>
        <p class="text-xl font-bold text-orange-400">{{ modStore.stats.total_strikes }}</p>
      </v-card>

      <v-card class="bg-[#1E1E1E] rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <v-icon size="18" color="info">mdi-chart-line</v-icon>
          <span class="text-xs text-gray-400">Reports Today</span>
        </div>
        <p class="text-xl font-bold text-info">{{ modStore.stats.reports_today }}</p>
      </v-card>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="rogan-primary" bg-color="transparent" class="mb-4">
      <v-tab value="reports">Reports</v-tab>
      <v-tab value="bans">Bans</v-tab>
      <v-tab value="stats">Stats</v-tab>
    </v-tabs>

    <!-- Reports Tab -->
    <div v-if="activeTab === 'reports'">
      <!-- Status Filter -->
      <div class="flex gap-2 mb-4">
        <v-btn
          size="x-small"
          :variant="!statusFilter ? 'flat' : 'outlined'"
          :color="!statusFilter ? 'rogan-primary' : 'gray'"
          rounded="lg"
          @click="filterByStatus(undefined)"
        >
          All
        </v-btn>
        <v-btn
          v-for="s in (['pending', 'reviewing', 'resolved', 'dismissed'] as ReportStatus[])"
          :key="s"
          size="x-small"
          :variant="statusFilter === s ? 'flat' : 'outlined'"
          :color="statusFilter === s ? 'rogan-primary' : 'gray'"
          rounded="lg"
          @click="filterByStatus(s)"
        >
          {{ s }}
        </v-btn>
      </div>

      <div v-if="modStore.loading" class="text-center py-8">
        <v-progress-circular indeterminate color="rogan-primary" />
      </div>

      <div v-else-if="modStore.reports.length === 0" class="text-center py-8">
        <v-icon size="48" color="#3D3D3D">mdi-shield-check</v-icon>
        <p class="text-gray-500 text-sm mt-2">No reports to review</p>
      </div>

      <div v-else class="space-y-3">
        <ReportCard
          v-for="report in modStore.reports"
          :key="report.id"
          :report="report"
          @resolve="handleResolve"
        />
      </div>
    </div>

    <!-- Bans Tab -->
    <div v-if="activeTab === 'bans'">
      <div v-if="modStore.bans.length === 0" class="text-center py-8">
        <v-icon size="48" color="#3D3D3D">mdi-block-helper</v-icon>
        <p class="text-gray-500 text-sm mt-2">No active bans</p>
      </div>

      <div v-else class="space-y-3">
        <v-card
          v-for="ban in modStore.bans"
          :key="ban.id"
          class="bg-[#1E1E1E] rounded-xl p-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <v-avatar size="32">
                <v-icon size="20">mdi-account</v-icon>
              </v-avatar>
              <div>
                <p class="text-white text-sm font-medium">{{ ban.user.display_name }}</p>
                <p class="text-gray-500 text-xs">{{ ban.reason }}</p>
              </div>
            </div>
            <div class="text-right">
              <v-chip v-if="ban.is_permanent" size="x-small" color="red" variant="flat">Permanent</v-chip>
              <p v-else class="text-gray-400 text-xs">Until {{ new Date(ban.expires_at!).toLocaleDateString() }}</p>
              <v-btn size="x-small" variant="outlined" color="green" rounded="lg" class="mt-1" @click="handleUnban(ban.user_id)">
                Unban
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Stats Tab -->
    <div v-if="activeTab === 'stats'">
      <v-card class="bg-[#1E1E1E] rounded-2xl p-5">
        <h3 class="text-white font-semibold mb-4">Moderation Statistics</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
            <span class="text-gray-400 text-sm">Pending Reports</span>
            <span class="text-yellow-400 font-bold">{{ modStore.stats.pending_reports }}</span>
          </div>
          <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
            <span class="text-gray-400 text-sm">Active Bans</span>
            <span class="text-red-400 font-bold">{{ modStore.stats.active_bans }}</span>
          </div>
          <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
            <span class="text-gray-400 text-sm">Total Strikes Issued</span>
            <span class="text-orange-400 font-bold">{{ modStore.stats.total_strikes }}</span>
          </div>
          <div class="flex items-center justify-between bg-[#2D2D2D] rounded-lg px-4 py-3">
            <span class="text-gray-400 text-sm">Reports Today</span>
            <span class="text-info font-bold">{{ modStore.stats.reports_today }}</span>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Ban User Dialog -->
    <v-dialog v-model="showBanDialog" max-width="420">
      <v-card class="bg-[#1E1E1E] rounded-2xl">
        <v-card-title class="pt-5 px-6">
          <span class="text-lg font-bold text-white">Ban User</span>
        </v-card-title>
        <v-card-text class="px-6 space-y-3">
          <v-text-field
            v-model="banUserId"
            label="User ID"
            placeholder="Enter user ID"
            variant="solo-filled"
            bg-color="#2D2D2D"
          />
          <v-textarea
            v-model="banReason"
            label="Reason"
            placeholder="Reason for ban"
            variant="solo-filled"
            bg-color="#2D2D2D"
            rows="2"
          />
          <v-switch
            v-model="banPermanent"
            label="Permanent ban"
            color="red"
            hide-details
          />
          <v-text-field
            v-if="!banPermanent"
            v-model.number="banDuration"
            type="number"
            label="Duration (hours)"
            variant="solo-filled"
            bg-color="#2D2D2D"
            suffix="hours"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-btn variant="text" @click="showBanDialog = false">Cancel</v-btn>
          <v-btn color="red" rounded="lg" :disabled="!banUserId || !banReason" @click="handleBan">Ban User</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
