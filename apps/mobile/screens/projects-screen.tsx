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
import { Project, ProjectStatus, CreateProjectDto, UpdateProjectDto } from '@pms/shared-types';
import { projectsService } from '../services/projects.service';
import { Input, Button, StatusBadge, Alert, LoadingSpinner, EmptyState } from '../components/ui';
import { ProjectModal } from '../components/project-modal';

interface ProjectsScreenProps {
  onSelectProject: (project: Project) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const query = {
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        pageSize: 50,
      };
      const response = await projectsService.list(query);
      setProjects(response.items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProjects();
  };

  const handleCreateOrUpdate = async (data: CreateProjectDto | UpdateProjectDto) => {
    if (editingProject) {
      await projectsService.update(editingProject.id, data);
    } else {
      await projectsService.create(data as CreateProjectDto);
    }
    await fetchProjects();
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setModalVisible(true);
  };

  const handleDelete = (project: Project) => {
    NativeAlert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? All associated tasks will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsService.delete(project.id);
              await fetchProjects();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to delete project';
              setError(message);
            }
          },
        },
      ],
    );
  };

  const statusChips: Array<{ label: string; value: ProjectStatus | 'ALL' }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Not Started', value: 'NOT_STARTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>Manage and track your ongoing projects</Text>
        </View>
        <Button title="+ New Project" onPress={handleOpenCreate} style={styles.newButton} />
      </View>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          action={{
            label: 'Retry',
            onPress: fetchProjects,
          }}
        />
      )}

      {/* Search Input */}
      <Input
        placeholder="Search projects by name..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchBar}
      />

      {/* Status Filter Chips */}
      <View style={styles.filterRow}>
        {statusChips.map((chip) => (
          <TouchableOpacity
            key={chip.value}
            onPress={() => setStatusFilter(chip.value)}
            style={[styles.filterChip, statusFilter === chip.value && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === chip.value && styles.filterChipTextActive,
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Project }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {(item.startDate || item.endDate) && (
        <View style={styles.datesRow}>
          <Text style={styles.dateText}>
            📅 {item.startDate ? item.startDate.substring(0, 10) : '—'}
            {' → '}
            {item.endDate ? item.endDate.substring(0, 10) : '—'}
          </Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onSelectProject(item)}
          style={[styles.actionBtn, styles.actionBtnPrimary]}
        >
          <Text style={styles.actionBtnPrimaryText}>View Tasks →</Text>
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
    return <LoadingSpinner text="Loading projects..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No projects found"
              message={
                search || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query or filter.'
                  : 'Get started by creating your first project.'
              }
              action={
                !search && statusFilter === 'ALL'
                  ? {
                      label: 'Create Project',
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

      <ProjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateOrUpdate}
        project={editingProject}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  newButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchBar: {
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  datesRow: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnPrimary: {
    backgroundColor: '#eff6ff',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnDanger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  actionBtnDangerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
});
