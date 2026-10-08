import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert as NativeAlert,
} from 'react-native';
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
  UpdateTaskDto,
} from '@pms/shared-types';
import { tasksService } from '../services/tasks.service';
import {
  Input,
  Button,
  StatusBadge,
  PriorityBadge,
  Alert,
  LoadingSpinner,
  EmptyState,
} from '../components/ui';
import { TaskModal } from '../components/task-modal';

interface ProjectDetailScreenProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ project, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const query = {
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        pageSize: 50,
      };
      const response = await tasksService.listByProject(project.id, query);
      setTasks(response.items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [project.id, search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
  };

  const handleCreateOrUpdate = async (data: CreateTaskDto | UpdateTaskDto) => {
    if (editingTask) {
      await tasksService.update(editingTask.id, data);
    } else {
      await tasksService.create(project.id, data as CreateTaskDto);
    }
    await fetchTasks();
  };

  const handleToggleStatus = async (task: Task) => {
    let nextStatus: TaskStatus = 'IN_PROGRESS';
    if (task.status === 'PENDING') nextStatus = 'IN_PROGRESS';
    else if (task.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else if (task.status === 'COMPLETED') nextStatus = 'PENDING';

    try {
      await tasksService.update(task.id, { status: nextStatus });
      await fetchTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task status';
      setError(message);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleDelete = (task: Task) => {
    NativeAlert.alert('Delete Task', `Are you sure you want to delete "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksService.delete(task.id);
            await fetchTasks();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete task';
            setError(message);
          }
        },
      },
    ]);
  };

  const statusChips: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const priorityChips: Array<{
    label: string;
    value: TaskPriority | 'ALL';
  }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back to Projects</Text>
      </TouchableOpacity>

      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <Text style={styles.projectName}>{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>
        {project.description ? (
          <Text style={styles.projectDescription}>{project.description}</Text>
        ) : null}
        {(project.startDate || project.endDate) && (
          <Text style={styles.projectDates}>
            📅 {project.startDate ? project.startDate.substring(0, 10) : '—'}
            {' → '}
            {project.endDate ? project.endDate.substring(0, 10) : '—'}
          </Text>
        )}
      </View>

      <View style={styles.tasksTitleRow}>
        <Text style={styles.tasksTitle}>Tasks ({tasks.length})</Text>
        <Button title="+ Add Task" onPress={handleOpenCreate} style={styles.addTaskBtn} />
      </View>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          action={{
            label: 'Retry',
            onPress: fetchTasks,
          }}
        />
      )}

      {/* Search */}
      <Input
        placeholder="Search tasks..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchBar}
      />

      {/* Status Chips */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.chipsRow}>
          {statusChips.map((chip) => (
            <TouchableOpacity
              key={chip.value}
              onPress={() => setStatusFilter(chip.value)}
              style={[styles.chip, statusFilter === chip.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === chip.value && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Priority Chips */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Priority:</Text>
        <View style={styles.chipsRow}>
          {priorityChips.map((chip) => (
            <TouchableOpacity
              key={chip.value}
              onPress={() => setPriorityFilter(chip.value)}
              style={[styles.chip, priorityFilter === chip.value && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, priorityFilter === chip.value && styles.chipTextActive]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.badgeRow}>
          <PriorityBadge priority={item.priority} />
          <View style={styles.badgeGap} />
          <StatusBadge status={item.status} />
        </View>
      </View>

      {item.description ? (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {item.dueDate ? (
        <Text style={styles.taskDueDate}>Due: {item.dueDate.substring(0, 10)}</Text>
      ) : null}

      <View style={styles.taskActions}>
        <TouchableOpacity
          onPress={() => handleToggleStatus(item)}
          style={[styles.actionBtn, styles.actionBtnStatus]}
        >
          <Text style={styles.actionBtnStatusText}>
            {item.status === 'COMPLETED'
              ? '↺ Reopen'
              : item.status === 'IN_PROGRESS'
                ? '✓ Complete'
                : '▶ Start'}
          </Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={() => handleOpenEdit(item)}
            style={[styles.actionBtn, styles.actionBtnOutline]}
          >
            <Text style={styles.actionBtnOutlineText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionBtn, styles.actionBtnDanger]}
          >
            <Text style={styles.actionBtnDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner text="Loading tasks..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No tasks found"
              message={
                search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try clearing your filters or search terms.'
                  : 'Get started by creating a task for this project.'
              }
              action={
                !search && statusFilter === 'ALL' && priorityFilter === 'ALL'
                  ? {
                      label: '+ Add Task',
                      onPress: handleOpenCreate,
                    }
                  : undefined
              }
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
          />
        }
      />

      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateOrUpdate}
        task={editingTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  projectDescription: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 18,
  },
  projectDates: {
    fontSize: 12,
    color: '#64748b',
  },
  tasksTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  addTaskBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchBar: {
    marginBottom: 10,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    width: 60,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeGap: {
    width: 6,
  },
  taskDescription: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 18,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginBottom: 8,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnStatus: {
    backgroundColor: '#f1f5f9',
  },
  actionBtnStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnDanger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  actionBtnDangerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
});
