import React from 'react';
import { APP_CONFIG } from '@pms/config';
import './index.css';

export const App: React.FC = () => {
  return (
    <div className="container">
      <div className="card">
        <span className="badge">Module 00: Foundation Established</span>
        <h1>{APP_CONFIG.APP_NAME}</h1>
        <p>
          Web client architecture foundation initialized with React, TypeScript, and Vite in strict
          mode.
        </p>

        <div className="grid">
          <div className="grid-item">
            <strong>Architecture</strong>
            <p>Modular Monorepo</p>
          </div>
          <div className="grid-item">
            <strong>API Target</strong>
            <p>NestJS REST API</p>
          </div>
          <div className="grid-item">
            <strong>Database</strong>
            <p>PostgreSQL + Prisma</p>
          </div>
          <div className="grid-item">
            <strong>Status</strong>
            <p>Foundation Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
