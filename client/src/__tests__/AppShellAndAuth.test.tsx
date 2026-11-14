import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { AppRoutes } from '../App';

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

describe('Issue #9: Client login, app shell, and role-aware navigation', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('redirects unauthenticated visitors from protected routes to /login with labelled fields and no default password or role selector', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(401, {
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    );

    renderWithRouter(['/transactions']);

    const heading = await screen.findByRole('heading', {
      name: /sign in to pocket48/i,
    });
    expect(heading).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('logs in as USER, loads current user from /api/auth/me with credentials, and navigates to /transactions', async () => {
    const userPayload = {
      id: 'u-1',
      email: 'user1@pocket48.local',
      displayName: 'Demo User 1',
      role: 'USER' as const,
    };

    // 1. Initial /api/auth/me check (unauthenticated)
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(401, { error: { message: 'Unauthenticated' } })
    );
    // 2. POST /api/auth/login
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, { data: userPayload })
    );
    // 3. GET /api/auth/me after login
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, { data: userPayload })
    );

    const user = userEvent.setup();
    renderWithRouter(['/login']);

    const emailInput = await screen.findByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'user1@pocket48.local');
    await user.type(passwordInput, 'CorrectHorseBatteryStaple');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByRole('heading', { name: /my transactions/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('user-display-name')).toHaveTextContent(
      'Demo User 1'
    );
    expect(screen.getByTestId('user-role-badge')).toHaveTextContent('USER');
    expect(
      screen.queryByRole('link', { name: /category catalogue/i })
    ).not.toBeInTheDocument();

    // Verify credentials: 'include' was sent on login and /api/auth/me
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    );
  });

  it('logs in as ADMINISTRATOR, loads /api/auth/me, and navigates to /admin/categories', async () => {
    const adminPayload = {
      id: 'admin-1',
      email: 'admin@pocket48.local',
      displayName: 'System Admin',
      role: 'ADMINISTRATOR' as const,
    };

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(401, { error: { message: 'Unauthenticated' } })
    );
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, { data: adminPayload })
    );
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, { data: adminPayload })
    );

    const user = userEvent.setup();
    renderWithRouter(['/login']);

    await user.type(await screen.findByLabelText(/email/i), 'admin@pocket48.local');
    await user.type(screen.getByLabelText(/password/i), 'AdminSecret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByRole('heading', { name: /category catalogue/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('user-role-badge')).toHaveTextContent(
      'ADMINISTRATOR'
    );
    expect(
      screen.queryByRole('link', { name: /my transactions/i })
    ).not.toBeInTheDocument();
  });

  it('displays a visible generic error message when login fails (AC-01-02)', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(401, { error: { message: 'Unauthenticated' } })
    );
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(401, {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      })
    );

    const user = userEvent.setup();
    renderWithRouter(['/login']);

    await user.type(await screen.findByLabelText(/email/i), 'user1@pocket48.local');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid email or password');
  });

  it('renders 403 Access Denied when a USER navigates to /admin/categories or an ADMINISTRATOR navigates to /transactions', async () => {
    // Case 1: USER visiting /admin/categories
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: {
          id: 'u-1',
          email: 'user1@pocket48.local',
          displayName: 'Demo User 1',
          role: 'USER',
        },
      })
    );

    const { unmount } = renderWithRouter(['/admin/categories']);
    expect(
      await screen.findByRole('heading', { name: /access denied/i })
    ).toBeInTheDocument();
    unmount();

    // Case 2: ADMINISTRATOR visiting /transactions
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: {
          id: 'admin-1',
          email: 'admin@pocket48.local',
          displayName: 'System Admin',
          role: 'ADMINISTRATOR',
        },
      })
    );

    renderWithRouter(['/transactions']);
    expect(
      await screen.findByRole('heading', { name: /access denied/i })
    ).toBeInTheDocument();
  });

  it('logs out via POST /api/auth/logout and redirects back to /login', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: {
          id: 'u-1',
          email: 'user1@pocket48.local',
          displayName: 'Demo User 1',
          role: 'USER',
        },
      })
    );
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, { data: { message: 'Logged out successfully' } })
    );

    const user = userEvent.setup();
    renderWithRouter(['/transactions']);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /sign in to pocket48/i })
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });

  it('shows a clear 404 Page Not Found screen for unknown routes', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: {
          id: 'u-1',
          email: 'user1@pocket48.local',
          displayName: 'Demo User 1',
          role: 'USER',
        },
      })
    );

    renderWithRouter(['/some/nonexistent/route']);
    expect(
      await screen.findByRole('heading', { name: /page not found/i })
    ).toBeInTheDocument();
  });
});

