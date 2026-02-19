import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface Budget {
  id: string;
  userId: string;
  name: string;
  totalAllocation: string;
  categoryLimits: Record<string, string>;
  month: string;
  createdAt: string;
}

export function getBudgets() {
  return apiGet<Budget[]>('/budgets');
}

export function getBudget(id: string) {
  return apiGet<Budget>(`/budgets/${id}`);
}

export function createBudget(data: {
  name: string;
  totalAllocation: number;
  month: string;
  categoryLimits?: Record<string, number>;
}) {
  return apiPost<Budget>('/budgets', data);
}

export function updateBudget(
  id: string,
  data: Partial<{ name: string; totalAllocation: number; categoryLimits: Record<string, number> }>,
) {
  return apiPut<Budget>(`/budgets/${id}`, data);
}

export function deleteBudget(id: string) {
  return apiDelete(`/budgets/${id}`);
}
