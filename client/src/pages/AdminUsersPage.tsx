import React, { useCallback, useEffect, useState } from 'react';
import { ApiError, adminUsersApi } from '../api/client';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import type { AdminUserAccount } from '../types/auth';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState<AdminUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [confirmDeactivateUser, setConfirmDeactivateUser] =
    useState<AdminUserAccount | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await adminUsersApi.list();
      setAccounts(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to load user accounts.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (!confirmDeactivateUser) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmDeactivateUser(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeactivateUser]);

  const handleToggleStatus = async (
    target: AdminUserAccount,
    nextActive: boolean
  ) => {
    setActionError(null);
    setStatusMessage(null);
    setPendingUserId(target.id);
    try {
      const updated = await adminUsersApi.updateStatus(target.id, nextActive);
      setAccounts((prev) =>
        prev.map((acct) => (acct.id === updated.id ? updated : acct))
      );
      setStatusMessage(
        nextActive
          ? `Account "${updated.displayName}" (${updated.email}) has been activated.`
          : `Account "${updated.displayName}" (${updated.email}) has been deactivated and all active sessions revoked.`
      );
      setConfirmDeactivateUser(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update account status.';
      setActionError(message);
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <AppShell>
      <section className="page-section" aria-labelledby="admin-users-heading">
        <div className="page-header">
          <div>
            <h1 id="admin-users-heading" className="page-title">
              User Accounts
            </h1>
            <p className="page-subtitle">
              Manage active status for Pocket48 accounts. Deactivating a user
              immediately blocks login and revokes active sessions.
            </p>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="alert alert-error">
            {loadError}
          </div>
        )}

        {actionError && (
          <div role="alert" className="alert alert-error">
            {actionError}
          </div>
        )}

        {statusMessage && (
          <div role="status" className="alert alert-success">
            {statusMessage}
          </div>
        )}

        <div className="card table-card">
          <h2 className="section-title">Registered Accounts</h2>
          {isLoading ? (
            <p className="empty-state-text" role="status">
              Loading user accounts...
            </p>
          ) : accounts.length === 0 ? (
            <p className="empty-state-text">No accounts found.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table" aria-label="User Accounts">
                <thead>
                  <tr>
                    <th scope="col">Display Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acct) => {
                    const isSelf = currentUser?.id === acct.id;
                    const isBusy = pendingUserId === acct.id;
                    return (
                      <tr key={acct.id} data-testid="user-account-row">
                        <td>
                          <strong>{acct.displayName}</strong>
                          {isSelf && (
                            <span className="self-indicator"> (You)</span>
                          )}
                        </td>
                        <td>{acct.email}</td>
                        <td>
                          <span
                            className={`role-badge role-${acct.role.toLowerCase()}`}
                          >
                            {acct.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              acct.isActive
                                ? 'status-active'
                                : 'status-inactive'
                            }`}
                          >
                            <span className="status-dot" />
                            <span>{acct.isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td>
                          {acct.isActive ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm btn-danger-outline"
                              aria-label={`Deactivate ${acct.displayName}`}
                              disabled={isSelf || isBusy}
                              title={
                                isSelf
                                  ? 'Administrators cannot deactivate their own account'
                                  : `Deactivate ${acct.displayName}`
                              }
                              onClick={() => {
                                setActionError(null);
                                setConfirmDeactivateUser(acct);
                              }}
                            >
                              {isBusy ? 'Updating...' : 'Deactivate'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              aria-label={`Activate ${acct.displayName}`}
                              disabled={isBusy}
                              onClick={() => void handleToggleStatus(acct, true)}
                            >
                              {isBusy ? 'Updating...' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {confirmDeactivateUser && (
          <div
            className="confirm-modal-backdrop"
            role="presentation"
            onClick={() => setConfirmDeactivateUser(null)}
          >
            <div
              className="confirm-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-deactivate-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="confirm-deactivate-title" className="section-title">
                Confirm Account Deactivation
              </h2>
              <p>
                Deactivate{' '}
                <strong>{confirmDeactivateUser.displayName}</strong> (
                {confirmDeactivateUser.email})? Their active sessions will be
                revoked immediately and they will be unable to sign in until
                reactivated.
              </p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmDeactivateUser(null)}
                  disabled={pendingUserId === confirmDeactivateUser.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={pendingUserId === confirmDeactivateUser.id}
                  onClick={() =>
                    void handleToggleStatus(confirmDeactivateUser, false)
                  }
                >
                  {pendingUserId === confirmDeactivateUser.id
                    ? 'Deactivating...'
                    : 'Confirm Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
};
