import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const homePath = user?.role === 'ADMINISTRATOR' ? '/admin/categories' : '/transactions';

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-and-nav">
            <Link to={homePath} className="brand-link">
              Pocket48
            </Link>
            {user && (
              <nav aria-label="Main navigation" className="main-nav">
                {user.role === 'USER' && (
                  <>
                    <NavLink
                      to="/transactions"
                      end
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      My Transactions
                    </NavLink>
                    <NavLink
                      to="/transactions/new"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      Record Transaction
                    </NavLink>
                  </>
                )}
                {user.role === 'ADMINISTRATOR' && (
                  <NavLink
                    to="/admin/categories"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Category Catalogue
                  </NavLink>
                )}
              </nav>
            )}
          </div>

          {user && (
            <div className="user-controls">
              <span className="user-display-name" data-testid="user-display-name">
                {user.displayName}
              </span>
              <span
                className={`role-badge role-${user.role.toLowerCase()}`}
                data-testid="user-role-badge"
              >
                {user.role}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-secondary btn-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
};

