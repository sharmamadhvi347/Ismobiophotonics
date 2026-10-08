import React, { useState, useEffect, FormEvent } from 'react';
import { Task, TaskPriority, TaskStatus, CreateTaskDto, UpdateTaskDto } from '@pms/shared-types';
import { Modal, Input, Textarea, Select, Button, Alert } from './ui';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => Promise<void>;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, task }) => {
  const isEditing = !!task;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setStatus(task.status || 'PENDING');
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      setDueDate('');
    }
    setError(null);
  }, [task, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Task name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save task. Please check your inputs.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <Modal isOpen={isOpen} title={isEditing ? 'Edit Task' : 'Create New Task'} onClose={onClose}>
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="task-name"
          label="Task Name"
          placeholder="e.g. Implement refresh token rotation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />

        <Textarea
          id="task-desc"
          label="Description"
          placeholder="Detailed task description or acceptance criteria"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="form-row">
          <Select
            id="task-priority"
            label="Priority"
            value={priority}
            options={priorityOptions}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={isSubmitting}
          />

          <Select
            id="task-status"
            label="Status"
            value={status}
            options={statusOptions}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="task-due-date"
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
