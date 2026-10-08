import React from 'react';
import { useRouter } from '../context/router-context';
import { Button } from '../components/ui';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="empty-state-card mt-8">
      <div className="empty-icon">404</div>
      <h2>Page Not Found</h2>
      <p>The page or workspace resource you requested could not be found.</p>
      <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-4">
        Return to Dashboard
      </Button>
    </div>
  );
};
