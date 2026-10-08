import React, { useState, useEffect, useCallback } from 'react';
import { projectsService } from '../services/projects.service';
import { Project, ProjectStatus, CreateProjectDto, UpdateProjectDto } from '@pms/shared-types';
import { useRouter, Link } from '../context/router-context';
import { Button, Input, Select, Alert, LoadingSpinner, StatusBadge } from '../components/ui';
import { ProjectModal } from '../components/project-modal';

export const ProjectsPage: React.FC = () => {
  const { navigate } = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsService.list({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ProjectStatus) : undefined,
        page,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setProjects(response.items || []);
      setTotal(response.meta.total || 0);
      setTotalPages(response.meta.totalPages || 1);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load projects. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateNew = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? All associated tasks will be removed.`,
      )
    ) {
      return;
    }

    try {
      await projectsService.delete(id);
      setSuccessMessage(`Project "${name}" was successfully deleted.`);
      fetchProjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project.';
      setError(message);
    }
  };

  const handleModalSubmit = async (data: CreateProjectDto | UpdateProjectDto) => {
    if (editingProject) {
      await projectsService.update(editingProject.id, data as UpdateProjectDto);
      setSuccessMessage('Project updated successfully.');
    } else {
      await projectsService.create(data as CreateProjectDto);
      setSuccessMessage('Project created successfully.');
    }
    fetchProjects();
  };

  const filterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track your active projects and milestones</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={handleCreateNew}>
            + New Project
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters & Search Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-search">
          <Input
            id="search-input"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="toolbar-filter">
          <Select
            id="status-filter"
            value={statusFilter}
            options={filterOptions}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : projects.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📁</div>
          <h3>No projects found</h3>
          <p>
            {search || statusFilter !== 'ALL'
              ? 'No projects match your current search or filter criteria.'
              : 'You have not created any projects yet. Create your first project to get started.'}
          </p>
          <Button variant="primary" onClick={handleCreateNew} className="mt-4">
            + Create First Project
          </Button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Project Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Timeline</th>
                  <th scope="col">Created Date</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/projects/${project.id}`} className="project-title-link">
                        {project.name}
                      </Link>
                      {project.description && <p className="table-desc">{project.description}</p>}
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="text-muted text-sm">
                      {project.startDate || project.endDate ? (
                        <>
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString()
                            : 'N/A'}
                          {' — '}
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                        </>
                      ) : (
                        'No timeline set'
                      )}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right table-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Tasks
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(project.id, project.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing page {page} of {totalPages} ({total} total projects)
              </span>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        project={editingProject}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};
