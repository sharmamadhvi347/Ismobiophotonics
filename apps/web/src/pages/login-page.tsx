import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useRouter, Link } from '../context/router-context';
import { Button, Input, Alert } from '../components/ui';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, error: authError, clearError, sessionExpired } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFormError('Please enter your email address');
      return;
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFormError('Please provide a valid email address');
      return;
    }
    if (!password) {
      setFormError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate('/dashboard');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">⚡</div>
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">Enter your credentials to access your PMS workspace</p>
        </div>

        {sessionExpired && (
          <Alert type="warning">
            Your session expired. Please sign in again with your credentials.
          </Alert>
        )}

        {(formError || authError) && (
          <Alert
            type="error"
            onClose={() => {
              setFormError(null);
              clearError();
            }}
          >
            {formError || authError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            id="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="engineer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
