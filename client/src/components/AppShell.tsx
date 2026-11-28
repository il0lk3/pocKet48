import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SakuraBackground } from './SakuraBackground';
import { AmbianceSwitcher } from './AmbianceSwitcher';
import {
  SakuraIcon,
  WalletIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from './Icons';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Close mobile nav drawer whenever route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsMobileNavOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const homePath =
    user?.role === 'ADMINISTRATOR' ? '/admin/categories' : '/transactions';

  return (
    <div className="app-layout">
      {/* Dreamy Pastel Japanese Sky & Floating Petals */}
      <SakuraBackground />

      <header className="app-header">
        <div className="header-inner">
          <div className="brand-bar-mobile">
            <Link
              to={homePath}
              className="brand-link"
              aria-label="pocKet48 Home"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <span className="brand-icon-wrapper">
                <SakuraIcon size={26} className="brand-sakura" />
              </span>
              <span className="brand-text">
                pocKet<span className="brand-48">48</span>
              </span>
            </Link>

            {user && (
              <div className="mobile-header-actions">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((prev) => !prev)}
                  className="btn-mobile-menu"
                  aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileNavOpen}
                >
                  {isMobileNavOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
                </button>
              </div>
            )}
          </div>

          {user && (
            <div className={`nav-collapsible ${isMobileNavOpen ? 'nav-open' : ''}`}>
              <nav aria-label="Main navigation" className="main-nav">
                {user.role === 'USER' && (
                  <>
                    <NavLink
                      to="/transactions"
                      end
                      onClick={() => setIsMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <WalletIcon size={16} className="nav-icon" />
                      <span>My Transactions</span>
                    </NavLink>
                    <NavLink
                      to="/transactions/new"
                      onClick={() => setIsMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <PlusIcon size={15} className="nav-icon" />
                      <span>Record Transaction</span>
                    </NavLink>
                  </>
                )}
                {user.role === 'ADMINISTRATOR' && (
                  <>
                    <NavLink
                      to="/admin/categories"
                      onClick={() => setIsMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <TagIcon size={16} className="nav-icon" />
                      <span>Category Catalogue</span>
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      onClick={() => setIsMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <UserIcon size={16} className="nav-icon" />
                      <span>User Accounts</span>
                    </NavLink>
                  </>
                )}
              </nav>

              <div className="user-controls">
                <div className="ambiance-ctrl-wrap">
                  <AmbianceSwitcher />
                </div>
                <div className="user-profile-badge">
                  <span className="user-avatar-dot">
                    <UserIcon size={13} />
                  </span>
                  <span
                    className="user-display-name"
                    data-testid="user-display-name"
                  >
                    {user.displayName}
                  </span>
                  <span
                    className={`role-badge role-${user.role.toLowerCase()}`}
                    data-testid="user-role-badge"
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-secondary btn-sm btn-logout"
                >
                  <LogoutIcon size={14} className="logout-icon" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p className="footer-text">
          <SakuraIcon size={16} className="footer-sakura" />
          <strong>pocKet48</strong> — Personal Money & Expense Logging System
          <span className="footer-release" data-testid="release-commit">
            {' · v1.0.0 ('}
            {(import.meta.env.VITE_APP_COMMIT_SHA || 'dev').slice(0, 7)}
            {')'}
          </span>
        </p>
      </footer>
    </div>
  );
};
