import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTransactions, createTransaction, deleteTransaction } from './transactions';
import * as client from './client';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

describe('transactions api', () => {
  it('getTransactions calls apiGet with encoded budgetId', async () => {
    await getTransactions('b 1');
    expect(client.apiGet).toHaveBeenCalledWith('/transactions?budgetId=b%201');
  });

  it('createTransaction calls apiPost', async () => {
    const data = { budgetId: 'b1', type: 'income' as const, amount: 100, category: 'Food' };
    await createTransaction(data);
    expect(client.apiPost).toHaveBeenCalledWith('/transactions', data);
  });

  it('deleteTransaction calls apiDelete', async () => {
    await deleteTransaction('t1');
    expect(client.apiDelete).toHaveBeenCalledWith('/transactions/t1');
  });
});
