import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ModerationReport, UserBan, ReportStatus } from '@/types';
import * as moderationService from '@/services/moderation';

export const useModerationStore = defineStore('moderation', () => {
  const reports = ref<ModerationReport[]>([]);
  const bans = ref<UserBan[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const hasMore = ref(true);
  const stats = ref({
    pending_reports: 0,
    active_bans: 0,
    total_strikes: 0,
    reports_today: 0,
  });

  async function fetchReports(
    append: boolean = false,
    status?: ReportStatus
  ): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
      if (!append) page.value = 1;
      const res = await moderationService.getReports(page.value, 20, status);
      const items = res.streams ?? res.items ?? [];
      if (append) {
        reports.value.push(...items);
      } else {
        reports.value = items;
      }
      hasMore.value = page.value < res.pages;
      page.value++;
    } finally {
      loading.value = false;
    }
  }

  async function resolveReport(
    reportId: string,
    action: 'dismiss' | 'warn' | 'strike' | 'ban',
    reason: string
  ): Promise<void> {
    const updated = await moderationService.resolveReport(reportId, action, reason);
    const idx = reports.value.findIndex((r) => r.id === reportId);
    if (idx >= 0) reports.value[idx] = updated;
  }

  async function banUser(payload: {
    user_id: string;
    reason: string;
    duration_hours?: number;
    is_permanent?: boolean;
  }): Promise<UserBan> {
    const ban = await moderationService.banUser(payload);
    bans.value.unshift(ban);
    return ban;
  }

  async function unbanUser(userId: string): Promise<void> {
    await moderationService.unbanUser(userId);
    bans.value = bans.value.filter((b) => b.user_id !== userId);
  }

  async function fetchBans(): Promise<void> {
    loading.value = true;
    try {
      const res = await moderationService.getBans();
      bans.value = res.streams ?? res.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats(): Promise<void> {
    try {
      stats.value = await moderationService.getModerationStats();
    } catch {
      // silently fail
    }
  }

  async function createReport(payload: {
    target_user_id: string;
    target_type: 'stream' | 'message' | 'user' | 'product';
    target_id: string;
    reason: 'harassment' | 'spam' | 'nudity' | 'violence' | 'hate_speech' | 'other';
    description: string;
  }): Promise<ModerationReport> {
    const report = await moderationService.createReport(payload);
    reports.value.unshift(report);
    return report;
  }

  return {
    reports,
    bans,
    loading,
    hasMore,
    stats,
    fetchReports,
    resolveReport,
    banUser,
    unbanUser,
    fetchBans,
    fetchStats,
    createReport,
  };
});
