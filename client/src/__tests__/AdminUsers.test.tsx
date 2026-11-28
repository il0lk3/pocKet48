import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { AmbianceProvider } from '../context/AmbianceContext';
import { AppRoutes } from '../App';

function renderWithRouter(initialEntries: string[] = ['/admin/users']) {
  return render(
    <AuthProvider>
      <AmbianceProvider>
        <MemoryRouter
          initialEntries={initialEntries}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </AmbianceProvider>
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

describe('F-11 (TEST-49): Admin User Accounts Page & RBAC', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('TEST-49 (AC-11-01, AC-11-02): Admin views accounts, sees self-deactivation disabled, and confirms deactivate then reactivate for a User', async () => {
    const adminProfile = {
      id: 'admin-1',
      email: 'admin@pocket48.local',
      displayName: 'System Administrator',
      role: 'ADMINISTRATOR' as const,
    };

    const seededUsers = [
      {
        id: 'admin-1',
        email: 'admin@pocket48.local',
        displayName: 'System Administrator',
        role: 'ADMINISTRATOR' as const,
        isActive: true,
        createdAt: '2026-11-10T00:00:00.000Z',
      },
      {
        id: 'user-2',
        email: 'user2@pocket48.local',
        displayName: 'Demo User 2',
        role: 'USER' as const,
        isActive: true,
        createdAt: '2026-11-11T00:00:00.000Z',
      },
    ];

    // 1. GET /api/auth/me -> Admin
    fetchMock.mockResolvedValueOnce(mockJsonResponse(200, { data: adminProfile }));
    // 2. GET /api/admin/users
    fetchMock.mockResolvedValueOnce(mockJsonResponse(200, { data: seededUsers }));
    // 3. PATCH /api/admin/users/user-2 -> isActive: false
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: { ...seededUsers[1], isActive: false },
      })
    );
    // 4. PATCH /api/admin/users/user-2 -> isActive: true
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: { ...seededUsers[1], isActive: true },
      })
    );

    const user = userEvent.setup();
    renderWithRouter(['/admin/users']);

    expect(
      await screen.findByRole('heading', { name: /user accounts/i })
    ).toBeInTheDocument();
    expect(await screen.findByText('user2@pocket48.local')).toBeInTheDocument();

    // Admin's own deactivate button must be disabled (D-11)
    const ownDeactivateBtn = screen.getByRole('button', {
      name: /deactivate system administrator/i,
    });
    expect(ownDeactivateBtn).toBeDisabled();

    // Click Deactivate on Demo User 2 -> opens confirmation dialog -> test Cancel first
    const user2DeactivateBtn = screen.getByRole('button', {
      name: /deactivate demo user 2/i,
    });
    await user.click(user2DeactivateBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2); // No PATCH sent on Cancel

    // Click Deactivate again -> Confirm Deactivate
    await user.click(user2DeactivateBtn);
    await user.click(
      screen.getByRole('button', { name: /confirm deactivate/i })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/user-2'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isActive: false }),
        })
      );
    });

    // Now Activate button should appear for Demo User 2
    const activateBtn = await screen.findByRole('button', {
      name: /activate demo user 2/i,
    });
    await user.click(activateBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/user-2'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isActive: true }),
        })
      );
    });
  });

  it('blocks USER role from /admin/users with 403 Access Denied screen (BR-10)', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(200, {
        data: {
          id: 'user-1',
          email: 'user1@pocket48.local',
          displayName: 'Demo User 1',
          role: 'USER',
        },
      })
    );

    renderWithRouter(['/admin/users']);

    expect(await screen.findByText(/403/i)).toBeInTheDocument();
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
