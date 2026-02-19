import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';

beforeEach(() => {
  globalThis.fetch = vi.fn();
  localStorage.clear();
});

describe('api client', () => {
  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('token', 'abc');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({}) });
    await api('/me');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    );
  });

  it('throws when response not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    });
    await expect(api('/me')).rejects.toThrow();
  });
});
