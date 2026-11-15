import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();
  const homePath =
    user?.role === 'ADMINISTRATOR' ? '/admin/categories' : '/transactions';

  return (
    <AppShell>
      <section className="status-page" aria-labelledby="forbidden-heading">
        <div className="status-code">403</div>
        <h1 id="forbidden-heading" className="status-title">
          Access Denied
        </h1>
        <p className="status-description">
          Your role ({user?.role ?? 'Guest'}) does not have permission to access
          this screen.
        </p>
        <Link to={homePath} className="btn btn-primary">
          Return to Dashboard
        </Link>
      </section>
    </AppShell>
  );
};

