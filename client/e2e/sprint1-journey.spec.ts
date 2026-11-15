import { expect, test } from '@playwright/test';

const DEMO_USER_EMAIL = process.env.E2E_USER_EMAIL || 'user1@pocket48.local';
const DEMO_USER_PASSWORD =
  process.env.DEMO_USER_PASSWORD || 'DemoInitial123!';

test.describe('Sprint 1 End-to-End Journey (TEST-13 / AC-06-01)', () => {
  test('TEST-13: User logs in, sees validation error on rejected amount, records a 120.50 THB Food expense, reloads page, and verifies persistence in the list', async ({
    page,
  }) => {
    const uniqueNote = `E2E Food Expense ${Date.now()}`;

    // 1. Navigate to Login Page
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: /sign in to pocket48/i })
    ).toBeVisible();

    // 2. Sign in as Demo User 1
    await page.getByLabel(/email/i).fill(DEMO_USER_EMAIL);
    await page.getByLabel(/^password$/i).fill(DEMO_USER_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3. Verify redirection to My Transactions page and authenticated header state
    await expect(
      page.getByRole('heading', { name: /my transactions/i })
    ).toBeVisible();
    await expect(page.getByTestId('user-display-name')).toContainText(
      'Demo User 1'
    );
    await expect(page.getByTestId('user-role-badge')).toHaveText('USER');

    // 4. Open Record Transaction form
    await page
      .getByRole('link', { name: /record transaction/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: /record transaction/i })
    ).toBeVisible();

    // 5. Rule rejection check (BR-01 / AC-02-02): rejected amount (0) shows an error
    const amountInput = page.getByLabel(/amount \(thb\)/i);
    await amountInput.fill('0');
    await page.getByRole('button', { name: /save transaction/i }).click();
    await expect(page.getByRole('alert')).toContainText(
      /amount must be greater than 0/i
    );

    // 6. Valid expense creation (AC-02-01): 120.50 THB in Food category
    const categorySelect = page.getByLabel(/^category$/i);
    const foodOptionValue = await categorySelect
      .locator('option', { hasText: /food/i })
      .first()
      .getAttribute('value');
    if (foodOptionValue) {
      await categorySelect.selectOption(foodOptionValue);
    }

    await amountInput.fill('120.50');
    await page.getByLabel(/note/i).fill(uniqueNote);
    await page.getByRole('button', { name: /save transaction/i }).click();

    // 7. Verify transaction appears in the list immediately
    await expect(
      page.getByRole('heading', { name: /my transactions/i })
    ).toBeVisible();
    const createdRow = page
      .getByTestId('transaction-row')
      .filter({ hasText: uniqueNote });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('EXPENSE');
    await expect(createdRow).toContainText(/food/i);
    await expect(createdRow).toContainText('฿120.50');

    // 8. Reload the page and verify transaction persists from PostgreSQL (AC-03-01 / AC-06-01)
    await page.reload();
    await expect(
      page.getByRole('heading', { name: /my transactions/i })
    ).toBeVisible();
    const persistedRow = page
      .getByTestId('transaction-row')
      .filter({ hasText: uniqueNote });
    await expect(persistedRow).toBeVisible();
    await expect(persistedRow).toContainText('฿120.50');
    await expect(persistedRow).toContainText(/food/i);

    // 9. Verify role boundary on UI (/admin/categories -> 403 Access Denied) and Logout (AC-01-03)
    await page.goto('/admin/categories');
    await expect(
      page.getByRole('heading', { name: /access denied/i })
    ).toBeVisible();

    await page.goto('/transactions');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(
      page.getByRole('heading', { name: /sign in to pocket48/i })
    ).toBeVisible();
  });
});
