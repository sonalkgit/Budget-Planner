import { useEffect, useState } from 'react';
import { getBudgets } from '../api/budgets';
import { getBudgetSummary, type BudgetSummary } from '../api/dashboard';
import type { Budget } from '../api/budgets';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBudgets()
      .then((list) => {
        setBudgets(list);
        if (list.length && !selectedBudgetId) setSelectedBudgetId(list[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBudgetId) {
      setSummary(null);
      return;
    }
    getBudgetSummary(selectedBudgetId)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [selectedBudgetId]);

  if (loading) return <div className={styles.loading}>Loading budgets...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!budgets.length) {
    return (
      <div className={styles.empty}>
        <p>No budgets yet. Create one from the Transactions page.</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.controls}>
        <label>
          Budget
          <select
            value={selectedBudgetId ?? ''}
            onChange={(e) => setSelectedBudgetId(e.target.value || null)}
            className={styles.select}
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.month})
              </option>
            ))}
          </select>
        </label>
      </div>

      {summary && (
        <>
          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.label}>Total allocation</span>
              <span className={styles.value}>{formatMoney(summary.totalAllocation)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Income</span>
              <span className={styles.valueSuccess}>{formatMoney(summary.totalIncome)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Expense</span>
              <span className={styles.valueDanger}>{formatMoney(summary.totalExpense)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Remaining</span>
              <span className={styles.value}>{formatMoney(summary.remainingBalance)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.label}>Running balance</span>
              <span className={summary.runningBalance >= 0 ? styles.valueSuccess : styles.valueDanger}>
                {formatMoney(summary.runningBalance)}
              </span>
            </div>
          </div>

          {summary.categoryUtilization.length > 0 && (
            <div className={styles.chartSection}>
              <h2>Category utilization</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={summary.categoryUtilization.map((c) => ({
                    name: c.category,
                    spent: c.spent,
                    limit: c.limit,
                    remaining: c.remaining,
                  }))}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    formatter={(value: number) => formatMoney(value)}
                    labelFormatter={(name) => `Category: ${name}`}
                  />
                  <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                    {summary.categoryUtilization.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ul className={styles.categoryList}>
                {summary.categoryUtilization.map((c) => (
                  <li key={c.category}>
                    <span>{c.category}</span>
                    <span>
                      {formatMoney(c.spent)} / {formatMoney(c.limit)} ({c.utilizationPercent.toFixed(0)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}
