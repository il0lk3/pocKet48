import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export const TransactionsPage: React.FC<{ isNewMode?: boolean }> = ({
  isNewMode = false,
}) => {
  return (
    <AppShell>
      <section className="page-section" aria-labelledby="transactions-heading">
        <div className="page-header">
          <div>
            <h1 id="transactions-heading" className="page-title">
              {isNewMode ? 'Record Transaction' : 'My Transactions'}
            </h1>
            <p className="page-subtitle">
              Track personal income and expenses in Thai Baht (THB).
            </p>
          </div>
          {!isNewMode && (
            <Link to="/transactions/new" className="btn btn-primary">
              Record Transaction
            </Link>
          )}
        </div>

        <div className="card empty-state-card">
          <p className="empty-state-text">
            No transactions recorded yet. Click 'Record Transaction' to start.
          </p>
        </div>
      </section>
    </AppShell>
  );
};

