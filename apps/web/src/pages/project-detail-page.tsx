import React, { useState, useEffect, useCallback } from 'react';
import { projectsService } from '../services/projects.service';
import { tasksService } from '../services/tasks.service';
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
  UpdateTaskDto,
} from '@pms/shared-types';
import { useRouter, Link } from '../context/router-context';
import {
  Button,
  Input,
  Select,
  Alert,
  LoadingSpinner,
  StatusBadge,
  PriorityBadge,
} from '../components/ui';
import { TaskModal } from '../components/task-modal';

export const ProjectDetailPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState<number>(0);

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchProjectAndTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [projData, tasksData] = await Promise.all([
        projectsService.get(projectId),
        tasksService.listByProject(projectId, {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as TaskStatus) : undefined,
          priority: priorityFilter !== 'ALL' ? (priorityFilter as TaskPriority) : undefined,
          pageSize: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);
      setProject(projData);
      setTasks(tasksData.items || []);
      setTotalTasks(tasksData.meta.total || 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load project details or tasks.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskName}"?`)) {
      return;
    }

    try {
      await tasksService.delete(taskId);
      setSuccessMessage(`Task "${taskName}" was successfully deleted.`);
      fetchProjectAndTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete task.';
      setError(message);
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await tasksService.update(task.id, { status: newStatus });
      setSuccessMessage(`Task status updated to ${newStatus}.`);
      fetchProjectAndTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task status.';
      setError(message);
    }
  };

  const handleTaskModalSubmit = async (data: CreateTaskDto | UpdateTaskDto) => {
    if (!projectId) return;

    if (editingTask) {
      await tasksService.update(editingTask.id, data as UpdateTaskDto);
      setSuccessMessage('Task updated successfully.');
    } else {
      await tasksService.create(projectId, data as CreateTaskDto);
      setSuccessMessage('Task created successfully.');
    }
    fetchProjectAndTasks();
  };

  const statusFilterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const priorityFilterOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
  ];

  if (!projectId) {
    return (
      <div className="page-error-state">
        <Alert type="error">No project ID specified.</Alert>
        <Button variant="primary" onClick={() => navigate('/projects')} className="mt-4">
          ← Back to Projects
        </Button>
      </div>
    );
  }

  if (isLoading && !project) {
    return <LoadingSpinner message="Loading project and tasks..." />;
  }

  if (error && !project) {
    return (
      <div className="page-error-state">
        <Alert type="error">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/projects')} className="mt-4">
          ← Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Breadcrumb & Navigation */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/projects" className="breadcrumb-link">
          Projects
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{project?.name || 'Project Details'}</span>
      </nav>

      {/* Project Header Banner */}
      <div className="project-banner">
        <div className="project-banner-content">
          <div className="project-banner-top">
            <h1 className="project-banner-title">{project?.name}</h1>
            <StatusBadge status={project?.status || 'NOT_STARTED'} />
          </div>
          {project?.description && <p className="project-banner-desc">{project.description}</p>}
          <div className="project-banner-meta">
            <span>
              <strong>Timeline:</strong>{' '}
              {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} —{' '}
              {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
            </span>
            <span>
              <strong>Total Tasks:</strong> {totalTasks}
            </span>
          </div>
        </div>

        <div className="project-banner-actions">
          <Button variant="primary" onClick={handleCreateTask}>
            + Add Task
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

      {/* Task Filters Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-search">
          <Input
            id="task-search-input"
            placeholder="Search tasks by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-filter-group">
          <Select
            id="task-status-filter"
            value={statusFilter}
            options={statusFilterOptions}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            id="task-priority-filter"
            value={priorityFilter}
            options={priorityFilterOptions}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Task List / Table */}
      {tasks.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📋</div>
          <h3>No tasks found</h3>
          <p>
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match your active search or filters.'
              : 'This project currently has no tasks. Add the first task to begin tracking work.'}
          </p>
          <Button variant="primary" onClick={handleCreateTask} className="mt-4">
            + Create First Task
          </Button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Task Name</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Due Date</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <span className="font-medium text-dark">{task.name}</span>
                    {task.description && <p className="table-desc">{task.description}</p>}
                  </td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>
                    <div className="status-dropdown-wrapper">
                      <select
                        className="status-select-inline"
                        value={task.status}
                        onChange={(e) =>
                          handleQuickStatusChange(task, e.target.value as TaskStatus)
                        }
                        aria-label={`Change status for ${task.name}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </td>
                  <td className="text-muted text-sm">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="text-right table-actions">
                    <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id, task.name)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        task={editingTask}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskModalSubmit}
      />
    </div>
  );
};
