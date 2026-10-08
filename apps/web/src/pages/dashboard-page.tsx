import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';
import { projectsService } from '../services/projects.service';
import { DashboardMetrics, Project } from '@pms/shared-types';
import { useRouter, Link } from '../context/router-context';
import { Button, Alert, LoadingSpinner, StatusBadge } from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { navigate } = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsData, projectsData] = await Promise.all([
        dashboardService.getMetrics(),
        projectsService.list({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setMetrics(metricsData);
      setRecentProjects(projectsData.items || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load dashboard data. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <LoadingSpinner message="Loading workspace dashboard..." />;
  }

  if (error) {
    return (
      <div className="page-error-state">
        <Alert type="error">{error}</Alert>
        <Button variant="primary" onClick={fetchDashboardData} className="mt-4">
          Retry Loading Dashboard
        </Button>
      </div>
    );
  }

  const projectsCount = metrics?.totalProjects ?? 0;
  const tasksCount = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const pendingTasks = metrics?.pendingTasks ?? 0;
  const inProgressProjects = metrics?.projectsInProgress ?? metrics?.inProgressProjects ?? 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspace Overview</h1>
          <p className="page-subtitle">
            High-level real-time metrics across your projects and tasks
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => navigate('/projects')}>
            + Manage Projects
          </Button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon metric-icon-primary" aria-hidden="true">
            📁
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Projects</span>
            <span className="metric-value">{projectsCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-info" aria-hidden="true">
            📋
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{tasksCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-success" aria-hidden="true">
            ✅
          </div>
          <div className="metric-info">
            <span className="metric-label">Completed Tasks</span>
            <span className="metric-value">{completedTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-warning" aria-hidden="true">
            ⏳
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Tasks</span>
            <span className="metric-value">{pendingTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-purple" aria-hidden="true">
            🚀
          </div>
          <div className="metric-info">
            <span className="metric-label">Projects In Progress</span>
            <span className="metric-value">{inProgressProjects}</span>
          </div>
        </div>
      </div>

      <section className="dashboard-section mt-8">
        <div className="section-header">
          <h2 className="section-title">Recent Projects</h2>
          <Link to="/projects" className="section-link">
            View All Projects →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to start tracking milestones and tasks.</p>
            <Button variant="primary" onClick={() => navigate('/projects')} className="mt-4">
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Project Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created Date</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="font-medium">
                      <Link to={`/projects/${project.id}`} className="project-title-link">
                        {project.name}
                      </Link>
                      {project.description && <p className="table-desc">{project.description}</p>}
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="text-muted">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Open Tasks
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
