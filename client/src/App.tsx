import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AmbianceProvider } from './context/AmbianceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { NotFoundPage } from './pages/NotFoundPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === 'ADMINISTRATOR' ? '/admin/categories' : '/transactions'}
      replace
    />
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute allowedRoles={['USER']}>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions/new"
        element={
          <ProtectedRoute allowedRoles={['USER']}>
            <TransactionsPage isNewMode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
            <AdminCategoriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AmbianceProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </BrowserRouter>
      </AmbianceProvider>
    </AuthProvider>
  );
};

export default App;

