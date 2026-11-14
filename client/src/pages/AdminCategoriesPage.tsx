import React from 'react';
import { AppShell } from '../components/AppShell';

export const AdminCategoriesPage: React.FC = () => {
  return (
    <AppShell>
      <section className="page-section" aria-labelledby="categories-heading">
        <div className="page-header">
          <div>
            <h1 id="categories-heading" className="page-title">
              Category Catalogue
            </h1>
            <p className="page-subtitle">
              Manage shared income and expense categories for all Pocket48 users.
            </p>
          </div>
        </div>

        <div className="card">
          <p className="empty-state-text">
            System categories catalogue administration view.
          </p>
        </div>
      </section>
    </AppShell>
  );
};

