import React, { useCallback, useEffect, useState } from 'react';
import { ApiError, categoriesApi } from '../api/client';
import { AppShell } from '../components/AppShell';
import type { Category, TransactionType } from '../types/auth';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to load system categories.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    setFormError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      const msg = 'Category name is required';
      setNameError(msg);
      setFormError(msg);
      return;
    }
    if (trimmedName.length > 40) {
      const msg = 'Category name must be between 1 and 40 characters';
      setNameError(msg);
      setFormError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await categoriesApi.create({
        name: trimmedName,
        type,
      });
      setCategories((prev) => [
        ...prev.filter((cat) => cat.id !== created.id),
        created,
      ]);
      setName('');
      setSuccessMessage(
        `Category "${created.name}" (${created.type}) created successfully.`
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to create category. Please try again.';
      setFormError(message);
      setNameError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="section-title">Create Category</h2>

          {formError && (
            <div role="alert" className="alert alert-error">
              {formError}
            </div>
          )}

          {successMessage && (
            <div role="status" className="alert alert-success">
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="category-form"
            aria-label="Create Category Form"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category-name" className="form-label">
                  Category Name
                </label>
                <input
                  id="category-name"
                  name="name"
                  type="text"
                  placeholder="e.g., Healthcare"
                  className="form-input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                    setFormError(null);
                  }}
                  disabled={isSubmitting}
                />
                {nameError && <p className="field-error">{nameError}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="category-type" className="form-label">
                  Category Type
                </label>
                <select
                  id="category-type"
                  name="type"
                  className="form-input"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as TransactionType);
                    setFormError(null);
                  }}
                  disabled={isSubmitting}
                >
                  <option value="EXPENSE">Expense (EXPENSE)</option>
                  <option value="INCOME">Income (INCOME)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>

        {loadError && (
          <div role="alert" className="alert alert-error">
            {loadError}
          </div>
        )}

        <div className="card table-card">
          <h2 className="section-title">Active Categories</h2>
          {isLoading ? (
            <p className="empty-state-text" role="status">
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <p className="empty-state-text">
              No categories found. Create a category above to get started.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table" aria-label="System Categories">
                <thead>
                  <tr>
                    <th scope="col">Category Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} data-testid="category-row">
                      <td>{cat.name}</td>
                      <td>
                        <span
                          className={`type-badge ${
                            cat.type === 'INCOME'
                              ? 'type-income'
                              : 'type-expense'
                          }`}
                        >
                          {cat.type}
                        </span>
                      </td>
                      <td>{cat.isActive !== false ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};
