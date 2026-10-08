import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useRouter, Link } from '../context/router-context';
import { Button, Input, Alert } from '../components/ui';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, error: authError, clearError } = useAuth();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState('');
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

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Full name must be at least 2 characters long');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFormError('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
      });
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
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Get started with your collaborative project workspace</p>
        </div>

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
            id="fullName"
            label="Full Name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Input
            id="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            helperText="Must be at least 8 characters"
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
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
