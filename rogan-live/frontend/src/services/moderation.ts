import api from './api';
import type {
  ModerationReport,
  UserBan,
  UserStrike,
  ReportReason,
  ReportStatus,
  PaginatedResponse,
} from '@/types';

export async function createReport(payload: {
  target_user_id: string;
  target_type: 'stream' | 'message' | 'user' | 'product';
  target_id: string;
  reason: ReportReason;
  description: string;
}): Promise<ModerationReport> {
  const { data } = await api.post<ModerationReport>('/moderation/reports', payload);
  return data;
}

export async function getReports(
  page: number = 1,
  limit: number = 20,
  status?: ReportStatus
): Promise<PaginatedResponse<ModerationReport>> {
  const { data } = await api.get<PaginatedResponse<ModerationReport>>('/moderation/reports', {
    params: { page, limit, status },
  });
  return data;
}

export async function getReport(reportId: string): Promise<ModerationReport> {
  const { data } = await api.get<ModerationReport>(`/moderation/reports/${reportId}`);
  return data;
}

export async function resolveReport(
  reportId: string,
  action: 'dismiss' | 'warn' | 'strike' | 'ban',
  reason: string
): Promise<ModerationReport> {
  const { data } = await api.post<ModerationReport>(
    `/moderation/reports/${reportId}/resolve`,
    { action, reason }
  );
  return data;
}

export async function banUser(payload: {
  user_id: string;
  reason: string;
  duration_hours?: number;
  is_permanent?: boolean;
}): Promise<UserBan> {
  const { data } = await api.post<UserBan>('/moderation/bans', payload);
  return data;
}

export async function unbanUser(userId: string): Promise<void> {
  await api.post(`/moderation/bans/${userId}/unban`);
}

export async function getBans(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<UserBan>> {
  const { data } = await api.get<PaginatedResponse<UserBan>>('/moderation/bans', {
    params: { page, limit },
  });
  return data;
}

export async function issueStrike(payload: {
  user_id: string;
  reason: string;
  strike_type: 'warning' | 'strike' | 'suspension';
}): Promise<UserStrike> {
  const { data } = await api.post<UserStrike>('/moderation/strikes', payload);
  return data;
}

export async function getUserStrikes(userId: string): Promise<UserStrike[]> {
  const { data } = await api.get<UserStrike[]>(`/moderation/strikes/${userId}`);
  return data;
}

export async function getModerationStats(): Promise<{
  pending_reports: number;
  active_bans: number;
  total_strikes: number;
  reports_today: number;
}> {
  const { data } = await api.get<{
    pending_reports: number;
    active_bans: number;
    total_strikes: number;
    reports_today: number;
  }>('/moderation/stats');
  return data;
}
