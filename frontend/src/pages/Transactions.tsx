import { useEffect, useState } from 'react';
import { getBudgets, createBudget } from '../api/budgets';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions';
import type { Budget } from '../api/budgets';
import type { Transaction } from '../api/transactions';
import styles from './Transactions.module.css';

const ITEMS_PER_PAGE = 10;

export function Transactions() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNote, setFormNote] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetMonth, setBudgetMonth] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [budgetCategories, setBudgetCategories] = useState('');
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [budgetError, setBudgetError] = useState('');

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
      setTransactions([]);
      return;
    }
    getTransactions(selectedBudgetId)
      .then(setTransactions)
      .catch(() => setTransactions([]));
  }, [selectedBudgetId]);

  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean)),
  ).sort();
  const filtered = categoryFilter
    ? transactions.filter((t) => t.category === categoryFilter)
    : transactions;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  function resetForm() {
    setFormAmount('');
    setFormCategory('');
    setFormNote('');
    setSubmitError('');
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(t: Transaction) {
    setEditingId(t.id);
    setFormType(t.type);
    setFormAmount(t.amount);
    setFormCategory(t.category);
    setFormNote(t.note ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBudgetId) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      setSubmitError('Enter a valid amount');
      return;
    }
    if (!formCategory.trim()) {
      setSubmitError('Category is required');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      if (editingId) {
        await updateTransaction(editingId, {
          type: formType,
          amount,
          category: formCategory.trim(),
          note: formNote.trim() || undefined,
        });
      } else {
        await createTransaction({
          budgetId: selectedBudgetId,
          type: formType,
          amount,
          category: formCategory.trim(),
          note: formNote.trim() || undefined,
        });
      }
      const list = await getTransactions(selectedBudgetId);
      setTransactions(list);
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      if (selectedBudgetId) {
        const list = await getTransactions(selectedBudgetId);
        setTransactions(list);
      }
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <label>
          Budget
          <select
            value={selectedBudgetId ?? ''}
            onChange={(e) => {
              setSelectedBudgetId(e.target.value || null);
              setPage(0);
            }}
            className={styles.select}
          >
            <option value="">Select budget</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.month})
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className={styles.select}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {selectedBudgetId && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Add transaction
          </button>
        )}
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setShowBudgetForm(true)}
        >
          New budget
        </button>
      </div>

      {showBudgetForm && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const total = parseFloat(budgetTotal);
            if (!budgetName.trim() || !budgetMonth || isNaN(total) || total < 0) {
              setBudgetError('Name, month and valid total required');
              return;
            }
            const categoryLimits: Record<string, number> = {};
            budgetCategories.split(',').forEach((pair) => {
              const [name, val] = pair.split(':').map((s) => s.trim());
              if (name && val) categoryLimits[name] = parseFloat(val) || 0;
            });
            setBudgetSubmitting(true);
            setBudgetError('');
            try {
              const created = await createBudget({
                name: budgetName.trim(),
                month: budgetMonth,
                totalAllocation: total,
                categoryLimits: Object.keys(categoryLimits).length ? categoryLimits : undefined,
              });
              setBudgets((prev) => [created, ...prev]);
              setSelectedBudgetId(created.id);
              setShowBudgetForm(false);
              setBudgetName('');
              setBudgetMonth('');
              setBudgetTotal('');
              setBudgetCategories('');
            } catch (err) {
              setBudgetError(err instanceof Error ? err.message : 'Failed to create budget');
            } finally {
              setBudgetSubmitting(false);
            }
          }}
        >
          {budgetError && <div className={styles.submitError}>{budgetError}</div>}
          <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>Create budget</h3>
          <label>
            Name
            <input
              className={styles.input}
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              required
            />
          </label>
          <label>
            Month (YYYY-MM)
            <input
              type="month"
              className={styles.input}
              value={budgetMonth}
              onChange={(e) => setBudgetMonth(e.target.value)}
              required
            />
          </label>
          <label>
            Total allocation
            <input
              type="number"
              step="0.01"
              min="0"
              className={styles.input}
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              required
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Category limits (e.g. Food: 10000, Transport: 5000)
            <input
              className={styles.input}
              value={budgetCategories}
              onChange={(e) => setBudgetCategories(e.target.value)}
              placeholder="Food: 10000, Transport: 5000"
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" disabled={budgetSubmitting}>
              {budgetSubmitting ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowBudgetForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {showForm && selectedBudgetId && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {submitError && <div className={styles.submitError}>{submitError}</div>}
          <label>
            Type
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
              className={styles.input}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className={styles.input}
              required
            />
          </label>
          <label>
            Category
            <input
              type="text"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className={styles.input}
              list="categories-list"
              required
            />
            <datalist id="categories-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Note
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              className={styles.input}
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!selectedBudgetId ? (
        <p className={styles.empty}>Select a budget to view transactions.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={t.type === 'income' ? styles.income : styles.expense}>
                      {t.type}
                    </span>
                  </td>
                  <td>{t.category}</td>
                  <td className={t.type === 'income' ? styles.income : styles.expense}>
                    {t.type === 'income' ? '+' : '-'}
                    {Number(t.amount).toFixed(2)}
                  </td>
                  <td>{t.note ?? '-'}</td>
                  <td>
                    <button type="button" onClick={() => openEdit(t)} className={styles.smBtn}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className={styles.smBtnDanger}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className={styles.empty}>No transactions in this budget.</p>
          )}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
