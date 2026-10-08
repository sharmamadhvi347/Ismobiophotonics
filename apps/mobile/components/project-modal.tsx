import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Project, ProjectStatus, CreateProjectDto, UpdateProjectDto } from '@pms/shared-types';
import { Modal, Input, Button, Alert } from './ui';

interface ProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => Promise<void>;
  project?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  visible,
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
  }, [project, visible]);

  const handleSubmit = async () => {
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
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save project. Please check input values.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusList: ProjectStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <Modal visible={visible} title={isEditing ? 'Edit Project' : 'New Project'} onClose={onClose}>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Input
        label="Project Name"
        placeholder="e.g. Android PMS Implementation"
        value={name}
        onChangeText={setName}
        required
      />

      <Input
        label="Description (Optional)"
        placeholder="Brief description of the project"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={2}
      />

      <View style={styles.statusSection}>
        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.statusChips}>
          {statusList.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setStatus(st)}
              style={[styles.chip, status === st && styles.chipActive]}
            >
              <Text style={[styles.chipText, status === st && styles.chipTextActive]}>
                {st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label="Start Date (YYYY-MM-DD)"
        placeholder="2026-10-01"
        value={startDate}
        onChangeText={setStartDate}
      />

      <Input
        label="End Date (YYYY-MM-DD)"
        placeholder="2026-12-31"
        value={endDate}
        onChangeText={setEndDate}
      />

      <View style={styles.modalButtons}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onClose}
          disabled={isSubmitting}
          style={styles.btnFlex}
        />
        <View style={styles.gap} />
        <Button
          title={isEditing ? 'Save' : 'Create'}
          variant="primary"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          style={styles.btnFlex}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  statusSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  statusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  chipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#2563eb',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  btnFlex: {
    flex: 1,
  },
  gap: {
    width: 10,
  },
});
