import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface Transaction {
  id: string;
  budgetId: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  note: string | null;
  createdAt: string;
}

export function getTransactions(budgetId: string) {
  return apiGet<Transaction[]>(`/transactions?budgetId=${encodeURIComponent(budgetId)}`);
}

export function createTransaction(data: {
  budgetId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note?: string;
}) {
  return apiPost<Transaction>('/transactions', data);
}

export function updateTransaction(
  id: string,
  data: Partial<{ type: 'income' | 'expense'; amount: number; category: string; note: string }>,
) {
  return apiPut<Transaction>(`/transactions/${id}`, data);
}

export function deleteTransaction(id: string) {
  return apiDelete(`/transactions/${id}`);
}
