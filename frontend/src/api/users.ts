import { apiGet, apiPut } from './client';
import type { User } from './auth';

export function getMe() {
  return apiGet<User>('/users/me');
}

export function updateProfile(data: { email?: string; displayName?: string }) {
  return apiPut<User>('/users/me', data);
}
