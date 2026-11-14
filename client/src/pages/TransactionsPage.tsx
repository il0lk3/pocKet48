import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, categoriesApi, transactionsApi } from '../api/client';
import { AppShell } from '../components/AppShell';
import type { Category, Transaction, TransactionType } from '../types/auth';

export function getBangkokTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatAmountTHB(
  tx: Pick<Transaction, 'amount' | 'amountSatang'>
): string {
  if (typeof tx.amount === 'string' && /^\d+\.\d{2}$/.test(tx.amount.trim())) {
    return tx.amount.trim();
  }
  if (typeof tx.amount === 'number' && Number.isFinite(tx.amount)) {
    return tx.amount.toFixed(2);
  }
  if (typeof tx.amountSatang === 'number' && Number.isFinite(tx.amountSatang)) {
    return (tx.amountSatang / 100).toFixed(2);
  }
  const parsed = Number(tx.amount ?? 0);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

interface FieldErrors {
  amount?: string;
  categoryId?: string;
  transactionDate?: string;
  note?: string;
}

export const TransactionsPage: React.FC<{ isNewMode?: boolean }> = ({
  isNewMode = false,
}) => {
  const navigate = useNavigate();
  const todayBangkok = useMemo(() => getBangkokTodayDateString(), []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(todayBangkok);
  const [note, setNote] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [loadedCategories, loadedTransactions] = await Promise.all([
        categoriesApi.list(),
        transactionsApi.list(),
      ]);
      setCategories(loadedCategories);
      setTransactions(loadedTransactions);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to load transactions and categories.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (cat) => cat.type === type && cat.isActive !== false
      ),
    [categories, type]
  );

  // Keep categoryId synchronized with available active categories for the selected type
  useEffect(() => {
    if (filteredCategories.length === 0) {
      setCategoryId('');
      return;
    }
    const stillValid = filteredCategories.some((cat) => cat.id === categoryId);
    if (!stillValid) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateCmp = b.transactionDate.localeCompare(a.transactionDate);
      if (dateCmp !== 0) return dateCmp;
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return 0;
    });
  }, [transactions]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setFieldErrors((prev) => ({ ...prev, categoryId: undefined }));
    setFormError(null);
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const trimmedAmount = amount.trim();

    if (!trimmedAmount) {
      errors.amount = 'Amount is required';
    } else if (!/^-?\d+(\.\d+)?$/.test(trimmedAmount)) {
      errors.amount = 'Amount must be a valid number';
    } else {
      const numericAmount = Number(trimmedAmount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        errors.amount = 'Amount must be greater than 0';
      } else if (numericAmount > 9999999.99) {
        errors.amount = 'Amount must not exceed 9,999,999.99 THB';
      } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
        errors.amount = 'Amount must have at most 2 decimal places';
      }
    }

    const matchingCategory = filteredCategories.find(
      (cat) => cat.id === categoryId
    );
    if (!categoryId || !matchingCategory) {
      errors.categoryId =
        'Please select an active category matching the transaction type';
    }

    const currentBangkokToday = getBangkokTodayDateString();
    if (!transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      errors.transactionDate = 'Transaction date is required (YYYY-MM-DD)';
    } else if (transactionDate > currentBangkokToday) {
      errors.transactionDate = 'Transaction date cannot be in the future';
    }

    if (note.length > 200) {
      errors.note = 'Note must be 200 characters or fewer';
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateForm();
    setFieldErrors(validationErrors);

    const firstError =
      validationErrors.amount ||
      validationErrors.categoryId ||
      validationErrors.transactionDate ||
      validationErrors.note;

    if (firstError) {
      setFormError(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAmount = Number(amount.trim());
      const trimmedNote = note.trim();
      const created = await transactionsApi.create({
        type,
        amount: numericAmount,
        categoryId,
        transactionDate,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      });

      const enrichedTransaction: Transaction = {
        ...created,
        category:
          created.category ??
          (categoryById.get(created.categoryId)
            ? {
                id: created.categoryId,
                name: categoryById.get(created.categoryId)!.name,
                type: categoryById.get(created.categoryId)!.type,
              }
            : undefined),
      };

      setTransactions((prev) => [
        enrichedTransaction,
        ...prev.filter((tx) => tx.id !== enrichedTransaction.id),
      ]);
      setAmount('');
      setNote('');
      setFieldErrors({});
      navigate('/transactions');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to record transaction. Please check your input.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <section className="page-section" aria-labelledby="transactions-heading">
        <div className="page-header">
          <div>
            <h1 id="transactions-heading" className="page-title">
              {isNewMode ? 'Record Transaction' : 'My Transactions'}
            </h1>
            <p className="page-subtitle">
              Track personal income and expenses in Thai Baht (THB).
            </p>
          </div>
          {!isNewMode ? (
            <Link to="/transactions/new" className="btn btn-primary">
              Record Transaction
            </Link>
          ) : (
            <Link to="/transactions" className="btn btn-secondary">
              Back to Transactions
            </Link>
          )}
        </div>

        {loadError && (
          <div role="alert" className="alert alert-error">
            {loadError}
          </div>
        )}

        {isNewMode ? (
          <div className="card">
            {formError && (
              <div role="alert" className="alert alert-error">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="transaction-form"
              aria-label="Record Transaction Form"
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transaction-type" className="form-label">
                    Type
                  </label>
                  <select
                    id="transaction-type"
                    name="type"
                    className="form-input"
                    value={type}
                    onChange={(e) =>
                      handleTypeChange(e.target.value as TransactionType)
                    }
                    disabled={isSubmitting}
                  >
                    <option value="EXPENSE">Expense (EXPENSE)</option>
                    <option value="INCOME">Income (INCOME)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-category" className="form-label">
                    Category
                  </label>
                  <select
                    id="transaction-category"
                    name="categoryId"
                    className="form-input"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        categoryId: undefined,
                      }));
                    }}
                    disabled={isSubmitting || filteredCategories.length === 0}
                  >
                    {filteredCategories.length === 0 ? (
                      <option value="">No active categories available</option>
                    ) : (
                      filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  {fieldErrors.categoryId && (
                    <p className="field-error">{fieldErrors.categoryId}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transaction-amount" className="form-label">
                    Amount (THB)
                  </label>
                  <input
                    id="transaction-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="9999999.99"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="form-input"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        amount: undefined,
                      }));
                    }}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.amount && (
                    <p className="field-error">{fieldErrors.amount}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-date" className="form-label">
                    Transaction Date
                  </label>
                  <input
                    id="transaction-date"
                    name="transactionDate"
                    type="date"
                    max={todayBangkok}
                    className="form-input"
                    value={transactionDate}
                    onChange={(e) => {
                      setTransactionDate(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        transactionDate: undefined,
                      }));
                    }}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.transactionDate && (
                    <p className="field-error">{fieldErrors.transactionDate}</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="transaction-note" className="form-label">
                  Note (optional)
                </label>
                <textarea
                  id="transaction-note"
                  name="note"
                  rows={3}
                  placeholder="Optional note (up to 200 characters)"
                  className="form-input"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, note: undefined }));
                  }}
                  disabled={isSubmitting}
                />
                {fieldErrors.note && (
                  <p className="field-error">{fieldErrors.note}</p>
                )}
              </div>

              <div className="form-actions">
                <Link to="/transactions" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        ) : isLoading ? (
          <div className="card" role="status">
            <p className="empty-state-text">Loading transactions...</p>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="card empty-state-card">
            <p className="empty-state-text">
              No transactions recorded yet. Click 'Record Transaction' to start.
            </p>
          </div>
        ) : (
          <div className="card table-card">
            <div className="table-responsive">
              <table className="data-table" aria-label="Transactions">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Type</th>
                    <th scope="col">Category</th>
                    <th scope="col">Note</th>
                    <th scope="col" className="amount-col">
                      Amount (THB)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((tx) => {
                    const categoryName =
                      tx.category?.name ??
                      categoryById.get(tx.categoryId)?.name ??
                      'Uncategorized';
                    const formattedAmount = formatAmountTHB(tx);
                    return (
                      <tr key={tx.id} data-testid="transaction-row">
                        <td>{tx.transactionDate}</td>
                        <td>
                          <span
                            className={`type-badge ${
                              tx.type === 'INCOME'
                                ? 'type-income'
                                : 'type-expense'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td>{categoryName}</td>
                        <td>{tx.note || '—'}</td>
                        <td className="amount-col">฿{formattedAmount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
};
