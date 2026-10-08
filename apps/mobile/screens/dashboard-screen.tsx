import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { dashboardService } from '../services/dashboard.service';
import { projectsService } from '../services/projects.service';
import { DashboardMetrics, Project } from '@pms/shared-types';
import { LoadingSpinner, Alert, StatusBadge, Button } from '../components/ui';

interface DashboardScreenProps {
  onNavigateToProjects: () => void;
  onSelectProject: (project: Project) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToProjects,
  onSelectProject,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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
        err instanceof Error
          ? err.message
          : 'Unable to connect to server. Please verify network and backend readiness.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading workspace dashboard..." />;
  }

  const projectsCount = metrics?.totalProjects ?? 0;
  const tasksCount = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const pendingTasks = metrics?.pendingTasks ?? 0;
  const inProgressProjects = metrics?.projectsInProgress ?? metrics?.inProgressProjects ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workspace Overview</Text>
        <Text style={styles.headerSubtitle}>Real-time metrics synced across Web and Android</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Alert type="error" message={error} />
          <Button
            title="Retry Connection"
            onPress={fetchDashboardData}
            variant="primary"
            size="sm"
            style={styles.retryBtn}
          />
        </View>
      )}

      {/* Five Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📁</Text>
          <Text style={styles.metricValue}>{projectsCount}</Text>
          <Text style={styles.metricLabel}>Total Projects</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>📋</Text>
          <Text style={styles.metricValue}>{tasksCount}</Text>
          <Text style={styles.metricLabel}>Total Tasks</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>✅</Text>
          <Text style={[styles.metricValue, { color: '#16a34a' }]}>{completedTasks}</Text>
          <Text style={styles.metricLabel}>Completed Tasks</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏳</Text>
          <Text style={[styles.metricValue, { color: '#d97706' }]}>{pendingTasks}</Text>
          <Text style={styles.metricLabel}>Pending Tasks</Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardWide]}>
          <Text style={styles.metricIcon}>🚀</Text>
          <Text style={[styles.metricValue, { color: '#9333ea' }]}>{inProgressProjects}</Text>
          <Text style={styles.metricLabel}>Projects In Progress</Text>
        </View>
      </View>

      {/* Quick Navigation to Projects */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <TouchableOpacity onPress={onNavigateToProjects}>
          <Text style={styles.sectionActionText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {recentProjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>No projects created yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first project to start tracking work.
          </Text>
          <Button
            title="+ Manage Projects"
            onPress={onNavigateToProjects}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        recentProjects.map((proj) => (
          <TouchableOpacity
            key={proj.id}
            style={styles.projectCard}
            onPress={() => onSelectProject(proj)}
            activeOpacity={0.7}
          >
            <View style={styles.projectCardHeader}>
              <Text style={styles.projectName} numberOfLines={1}>
                {proj.name}
              </Text>
              <StatusBadge status={proj.status} />
            </View>
            {proj.description && (
              <Text style={styles.projectDesc} numberOfLines={2}>
                {proj.description}
              </Text>
            )}
            <View style={styles.projectFooter}>
              <Text style={styles.projectDate}>
                {new Date(proj.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.openTasksLink}>Open Tasks →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  errorContainer: {
    marginBottom: 16,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    alignItems: 'center',
  },
  metricCardWide: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  emptyBtn: {
    marginTop: 4,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    elevation: 1,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  projectDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  projectDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  openTasksLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
});
