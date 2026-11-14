import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const targetPath = user
    ? user.role === 'ADMINISTRATOR'
      ? '/admin/categories'
      : '/transactions'
    : '/login';

  return (
    <AppShell>
      <section className="status-page" aria-labelledby="not-found-heading">
        <div className="status-code">404</div>
        <h1 id="not-found-heading" className="status-title">
          Page Not Found
        </h1>
        <p className="status-description">
          The page or resource you requested does not exist.
        </p>
        <Link to={targetPath} className="btn btn-primary">
          {user ? 'Return to Dashboard' : 'Go to Sign In'}
        </Link>
      </section>
    </AppShell>
  );
};

