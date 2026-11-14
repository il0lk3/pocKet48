import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { SakuraBackground } from '../components/SakuraBackground';
import { SakuraIcon, SparkleIcon, MailIcon, LockIcon } from '../components/Icons';

export const LoginPage: React.FC = () => {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <span className="loading-spinner-svg">
          <SakuraIcon size={28} className="spin-slow" />
        </span>
        <span>Loading session...</span>
      </div>
    );
  }

  if (user) {
    const defaultTarget =
      user.role === 'ADMINISTRATOR' ? '/admin/categories' : '/transactions';
    return <Navigate to={defaultTarget} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');
    setFormError('');

    let hasValidationError = false;
    if (!email.trim()) {
      setEmailError('Email is required.');
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasValidationError = true;
    }
    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const signedInUser = await login(email.trim(), password);
      const stateFrom = (location.state as { from?: string } | null)?.from;
      if (
        signedInUser.role === 'ADMINISTRATOR' &&
        stateFrom &&
        stateFrom.startsWith('/admin')
      ) {
        navigate(stateFrom, { replace: true });
      } else if (
        signedInUser.role === 'USER' &&
        stateFrom &&
        stateFrom.startsWith('/transactions')
      ) {
        navigate(stateFrom, { replace: true });
      } else {
        navigate(
          signedInUser.role === 'ADMINISTRATOR'
            ? '/admin/categories'
            : '/transactions',
          { replace: true }
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError('Invalid email or password');
      } else if (err instanceof ApiError) {
        setFormError(err.message || 'Invalid email or password');
      } else {
        setFormError('Invalid email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Dreamy Stage Ambiance & Sakura Tree Canopy */}
      <SakuraBackground />

      <div className="auth-content-flow">
        {/* Top Branding Section matching Reference Image 1 */}
        <div className="auth-top-branding">
          <div className="auth-logo-halo-grand">
            <div className="auth-logo-pulse-ring" />
            <SakuraIcon size={38} className="auth-sakura-icon" />
          </div>
          <div className="auth-brand-title">Pocket48</div>
          <p className="auth-brand-motto">
            Track your income, manage your expenses
          </p>
        </div>

        {/* Grand Glassmorphic Card matching Reference Image 1 */}
        <div className="auth-card auth-card-extravagant">
          <h1 className="auth-title">Sign In to Pocket48</h1>
          <p className="auth-subtitle">Welcome back!</p>

          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-with-icon-wrapper">
                <span className="input-lead-icon">
                  <MailIcon size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className="form-input form-input-with-icon"
                  placeholder="name@pocket48.local"
                  required
                />
              </div>
              {emailError && (
                <p id="email-error" className="field-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-with-icon-wrapper">
                <span className="input-lead-icon">
                  <LockIcon size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className="form-input form-input-with-icon"
                  required
                />
              </div>
              {passwordError && (
                <p id="password-error" className="field-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-block btn-stage-grand"
            >
              <SparkleIcon size={16} className="btn-sparkle-lead" />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="auth-card-footer-note">
            Don't have an account? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};
