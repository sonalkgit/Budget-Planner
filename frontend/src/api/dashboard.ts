import { apiGet } from './client';

export interface CategoryUtilization {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
}

export interface BudgetSummary {
  budget: { id: string; name: string; totalAllocation: string; categoryLimits: Record<string, string>; month: string };
  totalIncome: number;
  totalExpense: number;
  runningBalance: number;
  categoryUtilization: CategoryUtilization[];
  totalAllocation: number;
  remainingBalance: number;
}

export function getBudgetSummary(budgetId: string) {
  return apiGet<BudgetSummary | null>(`/dashboard/summary?budgetId=${encodeURIComponent(budgetId)}`);
}
