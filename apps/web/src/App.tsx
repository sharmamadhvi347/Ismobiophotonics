import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/auth-context';
import { RouterProvider, useRouter } from './context/router-context';
import { AppLayout } from './layouts/app-layout';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';
import { DashboardPage } from './pages/dashboard-page';
import { ProjectsPage } from './pages/projects-page';
import { ProjectDetailPage } from './pages/project-detail-page';
import { NotFoundPage } from './pages/not-found-page';
import { LoadingSpinner } from './components/ui';
import './index.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { path, params, navigate } = useRouter();

  useEffect(() => {
    // If route is / and user is authenticated, redirect to /dashboard
    if (path === '/' && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [path, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="auth-wrapper">
        <LoadingSpinner message="Restoring workspace session..." />
      </div>
    );
  }

  // Public unauthenticated routes
  if (path === '/login') {
    return <LoginPage />;
  }

  if (path === '/register') {
    return <RegisterPage />;
  }

  // Protected route boundary
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated routes wrapped with AppLayout
  return (
    <AppLayout>
      {path === '/' || path === '/dashboard' ? (
        <DashboardPage />
      ) : path === '/projects' ? (
        <ProjectsPage />
      ) : params.id ? (
        <ProjectDetailPage />
      ) : (
        <NotFoundPage />
      )}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppRoutes />
      </RouterProvider>
    </AuthProvider>
  );
};

export default App;
