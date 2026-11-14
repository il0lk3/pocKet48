import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../context/AuthContext';
import type { Category, Transaction } from '../types/auth';

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={initialEntries}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>
  );
}

function mockJsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

const sampleCategories: Category[] = [
  { id: 'cat-food', name: 'Food', type: 'EXPENSE', isActive: true },
  { id: 'cat-transport', name: 'Transport', type: 'EXPENSE', isActive: true },
  { id: 'cat-salary', name: 'Salary', type: 'INCOME', isActive: true },
  { id: 'cat-gift', name: 'Gift', type: 'INCOME', isActive: true },
];

const demoUser = {
  id: 'u-1',
  email: 'user1@pocket48.local',
  displayName: 'Demo User 1',
  role: 'USER' as const,
};

const demoAdmin = {
  id: 'admin-1',
  email: 'admin@pocket48.local',
  displayName: 'System Admin',
  role: 'ADMINISTRATOR' as const,
};

describe('Issue #10: Client transaction form, list, and category admin screen', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(mockJsonResponse(200, { data: [] }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('displays the signed-in user transactions ordered newest date first with THB formatting (F-03, AC-03-01)', async () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-older',
        type: 'EXPENSE',
        amount: '85.00',
        amountSatang: 8500,
        transactionDate: '2026-03-01',
        categoryId: 'cat-transport',
        category: { id: 'cat-transport', name: 'Transport', type: 'EXPENSE' },
        note: 'BTS Skytrain',
        createdAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'tx-newer',
        type: 'INCOME',
        amount: '25000.00',
        amountSatang: 2500000,
        transactionDate: '2026-03-10',
        categoryId: 'cat-salary',
        category: { id: 'cat-salary', name: 'Salary', type: 'INCOME' },
        note: 'Monthly salary',
        createdAt: '2026-03-10T09:00:00.000Z',
      },
    ];

    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(200, { data: demoUser }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: sampleCategories }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: transactions }));

    renderWithRouter(['/transactions']);

    const rows = await screen.findAllByTestId('transaction-row');
    expect(rows).toHaveLength(2);

    // First row must be the newer transaction (2026-03-10)
    expect(rows[0]).toHaveTextContent('2026-03-10');
    expect(rows[0]).toHaveTextContent('INCOME');
    expect(rows[0]).toHaveTextContent('Salary');
    expect(rows[0]).toHaveTextContent('Monthly salary');
    expect(rows[0]).toHaveTextContent('฿25000.00');

    // Second row must be the older transaction (2026-03-01)
    expect(rows[1]).toHaveTextContent('2026-03-01');
    expect(rows[1]).toHaveTextContent('EXPENSE');
    expect(rows[1]).toHaveTextContent('Transport');
    expect(rows[1]).toHaveTextContent('BTS Skytrain');
    expect(rows[1]).toHaveTextContent('฿85.00');
  });

  it('filters categories by selected type and validates amount, date, and note fields (F-02, BR-01..BR-03, NFR-06)', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(200, { data: demoUser }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: sampleCategories }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: [] }));

    const user = userEvent.setup();
    renderWithRouter(['/transactions/new']);

    const typeSelect = await screen.findByLabelText(/^type$/i);
    const categorySelect = screen.getByLabelText(/^category$/i);
    const amountInput = screen.getByLabelText(/amount \(thb\)/i);
    const dateInput = screen.getByLabelText(/transaction date/i);
    const noteInput = screen.getByLabelText(/note/i);

    // Default type is EXPENSE -> only Food and Transport should appear
    await screen.findByRole('option', { name: 'Food' });
    const expenseOptions = within(categorySelect)
      .getAllByRole('option')
      .map((opt) => opt.textContent);
    expect(expenseOptions).toEqual(['Food', 'Transport']);

    // Switch type to INCOME -> only Salary and Gift should appear
    await user.selectOptions(typeSelect, 'INCOME');
    const incomeOptions = within(categorySelect)
      .getAllByRole('option')
      .map((opt) => opt.textContent);
    expect(incomeOptions).toEqual(['Salary', 'Gift']);

    // Validate BR-01: amount <= 0 rejected
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    await user.click(screen.getByRole('button', { name: /save transaction/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /amount must be greater than 0/i
    );

    // Validate BR-01: more than 2 decimal places rejected
    await user.clear(amountInput);
    await user.type(amountInput, '12.345');
    await user.click(screen.getByRole('button', { name: /save transaction/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /at most 2 decimal places/i
    );

    // Validate BR-03: future date rejected
    await user.clear(amountInput);
    await user.type(amountInput, '100.00');
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');
    await user.click(screen.getByRole('button', { name: /save transaction/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /cannot be in the future/i
    );

    expect(noteInput).toBeInTheDocument();
  });

  it('submits a valid 120.50 THB expense and shows it in the transactions table (F-02, AC-02-01)', async () => {
    const createdTransaction: Transaction = {
      id: 'tx-12050',
      type: 'EXPENSE',
      amount: '120.50',
      amountSatang: 12050,
      transactionDate: '2026-03-12',
      categoryId: 'cat-food',
      category: { id: 'cat-food', name: 'Food', type: 'EXPENSE' },
      note: 'Pad Thai lunch',
      createdAt: '2026-03-12T05:00:00.000Z',
    };

    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(200, { data: demoUser }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: sampleCategories }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(201, { data: createdTransaction })
      );

    const user = userEvent.setup();
    renderWithRouter(['/transactions']);

    // Empty state shown initially
    expect(
      await screen.findByText(/no transactions recorded yet/i)
    ).toBeInTheDocument();

    // Navigate to Record Transaction form
    const recordLinks = screen.getAllByRole('link', {
      name: /record transaction/i,
    });
    await user.click(recordLinks[0]);

    const amountInput = await screen.findByLabelText(/amount \(thb\)/i);
    const dateInput = screen.getByLabelText(/transaction date/i);
    const noteInput = screen.getByLabelText(/note/i);

    await user.clear(amountInput);
    await user.type(amountInput, '120.50');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-03-12');
    await user.type(noteInput, 'Pad Thai lunch');

    await user.click(screen.getByRole('button', { name: /save transaction/i }));

    // Navigates back to /transactions and shows the newly recorded row
    const row = await screen.findByTestId('transaction-row');
    expect(row).toHaveTextContent('2026-03-12');
    expect(row).toHaveTextContent('EXPENSE');
    expect(row).toHaveTextContent('Food');
    expect(row).toHaveTextContent('Pad Thai lunch');
    expect(row).toHaveTextContent('฿120.50');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/transactions'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: 120.5,
          categoryId: 'cat-food',
          transactionDate: '2026-03-12',
          note: 'Pad Thai lunch',
        }),
      })
    );
  });

  it('allows ADMINISTRATOR to list categories, create a new category, and see duplicate-name validation errors (F-04, AC-04-01, AC-04-02)', async () => {
    const createdCategory: Category = {
      id: 'cat-health',
      name: 'Healthcare',
      type: 'EXPENSE',
      isActive: true,
    };

    fetchMock
      .mockResolvedValueOnce(mockJsonResponse(200, { data: demoAdmin }))
      .mockResolvedValueOnce(mockJsonResponse(200, { data: sampleCategories }))
      .mockResolvedValueOnce(mockJsonResponse(201, { data: createdCategory }))
      .mockResolvedValueOnce(
        mockJsonResponse(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: "Category 'Food' already exists for type EXPENSE",
          },
        })
      );

    const user = userEvent.setup();
    renderWithRouter(['/admin/categories']);

    const rowsBefore = await screen.findAllByTestId('category-row');
    expect(rowsBefore).toHaveLength(4);

    // Create a new category (AC-04-01)
    const nameInput = screen.getByLabelText(/category name/i);
    const typeSelect = screen.getByLabelText(/category type/i);

    await user.type(nameInput, 'Healthcare');
    await user.selectOptions(typeSelect, 'EXPENSE');
    await user.click(screen.getByRole('button', { name: /create category/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      /category "healthcare" \(expense\) created successfully/i
    );
    const rowsAfter = await screen.findAllByTestId('category-row');
    expect(rowsAfter).toHaveLength(5);
    expect(rowsAfter[4]).toHaveTextContent('Healthcare');

    // Attempt to create duplicate category (AC-04-02)
    await user.type(nameInput, 'food');
    await user.click(screen.getByRole('button', { name: /create category/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      "Category 'Food' already exists for type EXPENSE"
    );
  });
});
