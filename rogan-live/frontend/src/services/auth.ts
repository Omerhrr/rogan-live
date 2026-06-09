import api from './api';
import type { AuthResponse, User } from '@/types';

export async function register(
  email: string,
  username: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    email,
    username,
    password,
  });
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function googleAuth(googleToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', {
    google_token: googleToken,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  // Backend has no /auth/logout endpoint — just clear local state
  localStorage.removeItem('rogan_token');
  localStorage.removeItem('rogan_user');
}
