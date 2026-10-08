import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, TaskPriority, TaskStatus, CreateTaskDto, UpdateTaskDto } from '@pms/shared-types';
import { Modal, Input, Button, Alert } from './ui';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => Promise<void>;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ visible, onClose, onSubmit, task }) => {
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
  }, [task, visible]);

  const handleSubmit = async () => {
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
        dueDate: dueDate.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save task. Please check input values.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityList: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
  const statusList: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <Modal visible={visible} title={isEditing ? 'Edit Task' : 'New Task'} onClose={onClose}>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Input
        label="Task Name"
        placeholder="e.g. Build Android auth UI"
        value={name}
        onChangeText={setName}
        required
      />

      <Input
        label="Description (Optional)"
        placeholder="Task details or acceptance criteria"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={2}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Priority</Text>
        <View style={styles.chipsRow}>
          {priorityList.map((pr) => (
            <TouchableOpacity
              key={pr}
              onPress={() => setPriority(pr)}
              style={[styles.chip, priority === pr && styles.chipActive]}
            >
              <Text style={[styles.chipText, priority === pr && styles.chipTextActive]}>{pr}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.chipsRow}>
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
        label="Due Date (YYYY-MM-DD)"
        placeholder="2026-10-25"
        value={dueDate}
        onChangeText={setDueDate}
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
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  chipsRow: {
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
