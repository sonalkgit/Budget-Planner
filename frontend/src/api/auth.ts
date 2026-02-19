import { apiPost } from './client';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  expiresIn: string;
}

export function login(email: string, password: string) {
  return apiPost<AuthResponse>('/auth/login', { email, password });
}

export function register(email: string, password: string, displayName?: string) {
  return apiPost<AuthResponse>('/auth/register', { email, password, displayName });
}
