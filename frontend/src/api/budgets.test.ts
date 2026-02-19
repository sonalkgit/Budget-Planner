import { describe, it, expect, vi } from 'vitest';
import { getBudgets, createBudget } from './budgets';
import * as client from './client';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

describe('budgets api', () => {
  it('getBudgets calls apiGet', async () => {
    await getBudgets();
    expect(client.apiGet).toHaveBeenCalledWith('/budgets');
  });

  it('createBudget calls apiPost with data', async () => {
    const data = { name: 'Jan', totalAllocation: 5000, month: '2025-01' };
    await createBudget(data);
    expect(client.apiPost).toHaveBeenCalledWith('/budgets', data);
  });
});
