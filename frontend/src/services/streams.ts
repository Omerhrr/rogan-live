import api from './api';
import type { Stream, CreateStreamPayload, StreamKey, PaginatedResponse } from '@/types';

export async function getLiveStreams(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Stream>> {
  const { data } = await api.get<PaginatedResponse<Stream>>('/streams/live', {
    params: { page, limit },
  });
  return data;
}

export async function getStream(streamId: string): Promise<Stream> {
  const { data } = await api.get<Stream>(`/streams/${streamId}`);
  return data;
}

export async function createStream(
  payload: CreateStreamPayload
): Promise<Stream> {
  const { data } = await api.post<Stream>('/streams', payload);
  return data;
}

export async function goLive(streamId: string): Promise<Stream> {
  const { data } = await api.post<Stream>(`/streams/${streamId}/go-live`);
  return data;
}

export async function endStream(streamId: string): Promise<Stream> {
  const { data } = await api.post<Stream>(`/streams/${streamId}/end`);
  return data;
}

// ── Stream Keys ──────────────────────────────────────────────────

export async function generateStreamKey(label: string = 'default'): Promise<StreamKey> {
  const { data } = await api.post<StreamKey>('/stream-keys/', { label });
  return data;
}

export async function getStreamKeys(): Promise<StreamKey[]> {
  const { data } = await api.get<{ keys: StreamKey[] }>('/stream-keys/me');
  return data.keys ?? [];
}

export async function rotateStreamKey(keyId: string): Promise<StreamKey> {
  const { data } = await api.post<StreamKey>(`/stream-keys/${keyId}/rotate`, { label: 'rotated' });
  return data;
}

export async function revokeStreamKey(keyId: string): Promise<void> {
  await api.delete(`/stream-keys/${keyId}`);
}

// ── Stream Status ────────────────────────────────────────────────

export async function getStreamStatus(streamId: string): Promise<Stream> {
  const { data } = await api.get<Stream>(`/streams/${streamId}/status`);
  return data;
}
