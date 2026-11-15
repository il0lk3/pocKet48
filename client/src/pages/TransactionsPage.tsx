import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, categoriesApi, transactionsApi } from '../api/client';
import { AppShell } from '../components/AppShell';
import type { Category, Transaction, TransactionType } from '../types/auth';
import { GrandCalendarPicker } from '../components/GrandCalendarPicker';
import {
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BalanceIcon,
  PlusIcon,
  SparkleIcon,
  SakuraIcon,
  CuteWalletIllustration,
} from '../components/Icons';

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

  // Compute Financial Summary for Pastel Stat Cards
  const summary = useMemo(() => {
    let incomeSatang = 0;
    let expenseSatang = 0;
    for (const tx of transactions) {
      const satang =
        typeof tx.amountSatang === 'number'
          ? tx.amountSatang
          : Math.round(Number(tx.amount || 0) * 100);
      if (tx.type === 'INCOME') {
        incomeSatang += satang;
      } else {
        expenseSatang += satang;
      }
    }
    return {
      totalIncome: (incomeSatang / 100).toFixed(2),
      totalExpense: (expenseSatang / 100).toFixed(2),
      netBalance: ((incomeSatang - expenseSatang) / 100).toFixed(2),
      isPositive: incomeSatang >= expenseSatang,
      count: transactions.length,
    };
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

      setTransactions((prev) => [enrichedTransaction, ...prev]);
      navigate('/transactions');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to record transaction. Please check your inputs.';
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
            <div className="header-tag">
              <SparkleIcon size={12} className="header-tag-icon" />
              <span className="idol-tag-text">Personal Ledger</span>
            </div>
            <h1 id="transactions-heading" className="page-title">
              {isNewMode ? 'Record Transaction' : 'My Transactions'}
            </h1>
            <p className="page-subtitle">
              {isNewMode
                ? 'Record your income or expense with pastel elegance and precision.'
                : 'Track your money flow with gentle pastel aesthetics and financial discipline.'}
            </p>
          </div>

          {!isNewMode && (
            <Link to="/transactions/new" className="btn btn-primary btn-record-header">
              <PlusIcon size={16} />
              <span>Record Transaction</span>
            </Link>
          )}
        </div>

        {loadError && (
          <div className="alert alert-error" role="alert">
            {loadError}
          </div>
        )}

        {/* Financial KPI Cards in Pastel Palette */}
        {!isNewMode && (
          <div className="idol-stats-grid">
            <div className="stat-card stat-income">
              <div className="stat-card-header">
                <span className="stat-icon-wrapper icon-mint">
                  <TrendingUpIcon size={18} />
                </span>
                <span className="stat-label">Total Income</span>
              </div>
              <div className="stat-value">฿{summary.totalIncome}</div>
              <div className="stat-hint">Pastel mint inflow</div>
            </div>

            <div className="stat-card stat-expense">
              <div className="stat-card-header">
                <span className="stat-icon-wrapper icon-pink">
                  <TrendingDownIcon size={18} />
                </span>
                <span className="stat-label">Total Expense</span>
              </div>
              <div className="stat-value">฿{summary.totalExpense}</div>
              <div className="stat-hint">Pastel sakura outflow</div>
            </div>

            <div className="stat-card stat-balance">
              <div className="stat-card-header">
                <span className="stat-icon-wrapper icon-violet">
                  <BalanceIcon size={18} />
                </span>
                <span className="stat-label">Net Balance</span>
              </div>
              <div
                className={`stat-value ${
                  summary.isPositive ? 'val-positive' : 'val-negative'
                }`}
              >
                {summary.isPositive ? '+' : ''}฿{summary.netBalance}
              </div>
              <div className="stat-hint">
                {summary.count} {summary.count === 1 ? 'transaction' : 'transactions'} logged
              </div>
            </div>
          </div>
        )}

        {isNewMode ? (
          <div className="card form-card form-card-stage">
            <div className="card-stage-accent" />
            <div className="card-header-styled">
              <h2 className="card-title">New Entry Details</h2>
              <span className="card-subtitle-note">
                Record today's cash flow
              </span>
            </div>

            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="transaction-form">
              <div className="form-group">
                <label htmlFor="transaction-type" className="form-label">
                  Type
                </label>
                <div className="type-toggle-bar">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('EXPENSE')}
                    className={`type-toggle-btn ${
                      type === 'EXPENSE' ? 'active-expense' : ''
                    }`}
                  >
                    <TrendingDownIcon size={16} />
                    <span>Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('INCOME')}
                    className={`type-toggle-btn ${
                      type === 'INCOME' ? 'active-income' : ''
                    }`}
                  >
                    <TrendingUpIcon size={16} />
                    <span>Income</span>
                  </button>
                </div>
                {/* Native select kept for test compatibility & full accessibility */}
                <select
                  id="transaction-type"
                  name="type"
                  value={type}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as TransactionType)
                  }
                  className="form-input form-select-styled form-select-hidden"
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
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      categoryId: undefined,
                    }));
                  }}
                  className="form-input form-select-styled"
                  disabled={isSubmitting || filteredCategories.length === 0}
                  required
                >
                  {filteredCategories.length === 0 ? (
                    <option value="" disabled>
                      No active categories for this type
                    </option>
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

              <div className="form-group">
                <label htmlFor="transaction-amount" className="form-label">
                  Amount (THB)
                </label>
                <div className="amount-input-container">
                  <span className="currency-pill">฿</span>
                  <input
                    id="transaction-amount"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 120.50"
                    className="form-input amount-field"
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
                </div>
                {fieldErrors.amount && (
                  <p className="field-error">{fieldErrors.amount}</p>
                )}
              </div>

              {/* GRAND OVERSIZED INTERACTIVE CALENDAR SELECTOR */}
              <div className="form-group form-group-date">
                <label
                  htmlFor="transaction-date"
                  className="form-label form-label-prominent"
                >
                  <CalendarIcon size={20} className="field-label-icon" />
                  <span>Transaction Date</span>
                </label>

                <GrandCalendarPicker
                  id="transaction-date"
                  name="transactionDate"
                  value={transactionDate}
                  onChange={(nextDate) => {
                    setTransactionDate(nextDate);
                    setFieldErrors((prev) => ({
                      ...prev,
                      transactionDate: undefined,
                    }));
                  }}
                  maxDate={todayBangkok}
                  disabled={isSubmitting}
                  required
                />

                <span className="field-helper-caption">
                  Asia/Bangkok timezone standard • Max today (cannot record future date)
                </span>
                {fieldErrors.transactionDate && (
                  <p className="field-error">{fieldErrors.transactionDate}</p>
                )}
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
                  className="form-input form-textarea"
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
                  className="btn btn-primary btn-save btn-idol-stage"
                  disabled={isSubmitting}
                >
                  <SparkleIcon size={16} />
                  <span>{isSubmitting ? 'Saving...' : 'Save Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : isLoading ? (
          <div className="card loading-card" role="status">
            <span className="loading-spinner-svg">
              <SakuraIcon size={28} className="spin-slow" />
            </span>
            <p className="empty-state-text">Loading transactions...</p>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="card empty-state-card empty-state-card-grand">
            <div className="empty-wallet-graphic-wrapper">
              <CuteWalletIllustration size={130} />
            </div>
            <h2 className="empty-state-title">No transactions recorded yet</h2>
            <p className="empty-state-subtitle">
              Start by adding your first transaction!
            </p>
            <div className="empty-state-action">
              <Link to="/transactions/new" className="btn btn-primary btn-record-empty">
                <PlusIcon size={16} />
                <span>Record Transaction</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card table-card table-card-stage">
            <div className="table-header-title">
              <h2 className="section-title">Ledger Entries</h2>
              <span className="records-count-badge">
                {sortedTransactions.length} records
              </span>
            </div>
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
                        <td className="date-cell">{tx.transactionDate}</td>
                        <td>
                          <span
                            className={`type-badge ${
                              tx.type === 'INCOME'
                                ? 'type-income'
                                : 'type-expense'
                            }`}
                          >
                            {tx.type === 'INCOME' ? (
                              <TrendingUpIcon size={12} className="badge-arrow" />
                            ) : (
                              <TrendingDownIcon size={12} className="badge-arrow" />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="category-cell">
                          <span className="category-pill">{categoryName}</span>
                        </td>
                        <td className="note-cell">{tx.note || '—'}</td>
                        <td className="amount-col">
                          <span
                            className={`amount-text ${
                              tx.type === 'INCOME'
                                ? 'amount-income'
                                : 'amount-expense'
                            }`}
                          >
                            ฿{formattedAmount}
                          </span>
                        </td>
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
