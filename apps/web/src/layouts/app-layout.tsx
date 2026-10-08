import React, { ReactNode } from 'react';
import { useAuth } from '../context/auth-context';
import { useRouter, Link } from '../context/router-context';
import { Button, Alert } from '../components/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, sessionExpired } = useAuth();
  const { path, navigate } = useRouter();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-container">
          <div className="header-brand">
            <Link to="/dashboard" className="brand-logo">
              <span className="brand-icon">⚡</span>
              <span className="brand-title">PMS Workspace</span>
            </Link>
          </div>

          <nav className="header-nav" aria-label="Main Navigation">
            <Link
              to="/dashboard"
              className={`nav-link ${path === '/dashboard' ? 'nav-link-active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`nav-link ${path.startsWith('/projects') ? 'nav-link-active' : ''}`}
            >
              Projects
            </Link>
          </nav>

          <div className="header-user">
            {user && (
              <div className="user-profile">
                <span className="user-avatar" aria-hidden="true">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </span>
                <span className="user-name">{user.fullName || user.email}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="logout-btn">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {sessionExpired && (
        <div className="session-banner">
          <Alert type="warning">
            Your session has expired. Please log in again to continue managing your workspace.
          </Alert>
        </div>
      )}

      <main className="app-main">
        <div className="main-content-container">{children}</div>
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <p>© 2026 Project Management System. Professional Full-Stack Assessment Edition.</p>
        </div>
      </footer>
    </div>
  );
};
