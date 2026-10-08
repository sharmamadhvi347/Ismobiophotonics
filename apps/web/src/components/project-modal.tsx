import React, { useState, useEffect, FormEvent } from 'react';
import { Project, ProjectStatus, CreateProjectDto, UpdateProjectDto } from '@pms/shared-types';
import { Modal, Input, Textarea, Select, Button, Alert } from './ui';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  project?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
}) => {
  const isEditing = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.status || 'NOT_STARTED');
      setStartDate(project.startDate ? project.startDate.substring(0, 10) : '');
      setEndDate(project.endDate ? project.endDate.substring(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setStatus('NOT_STARTED');
      setStartDate('');
      setEndDate('');
    }
    setError(null);
  }, [project, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required');
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('End date must be greater than or equal to start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save project. Please check your inputs.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      onClose={onClose}
    >
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="project-name"
          label="Project Name"
          placeholder="e.g. Core System Migration"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />

        <Textarea
          id="project-desc"
          label="Description"
          placeholder="Brief overview of project scope and objectives"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />

        <Select
          id="project-status"
          label="Execution Status"
          value={status}
          options={statusOptions}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          disabled={isSubmitting}
        />

        <div className="form-row">
          <Input
            id="project-start-date"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="project-end-date"
            label="Target End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
