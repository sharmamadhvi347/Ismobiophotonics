import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Alert as NativeAlert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './context/auth-context';
import { LoginScreen } from './screens/login-screen';
import { RegisterScreen } from './screens/register-screen';
import { DashboardScreen } from './screens/dashboard-screen';
import { ProjectsScreen } from './screens/projects-screen';
import { ProjectDetailScreen } from './screens/project-detail-screen';
import { LoadingSpinner, Alert } from './components/ui';
import { Project } from '@pms/shared-types';

type ScreenType = 'dashboard' | 'projects' | 'project-detail';

const AppNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, sessionExpired, clearSessionExpired } =
    useAuth();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Restoring session..." />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        {sessionExpired && (
          <View style={styles.sessionAlertContainer}>
            <Alert
              type="info"
              message="Your session has expired. Please log in again."
              onClose={clearSessionExpired}
            />
          </View>
        )}
        {authView === 'login' ? (
          <LoginScreen onNavigateToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterScreen onNavigateToLogin={() => setAuthView('login')} />
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentScreen('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentScreen('projects');
  };

  const handleLogoutPrompt = () => {
    NativeAlert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.appBrand}>
          <Text style={styles.appTitle}>PMS Mobile</Text>
          <Text style={styles.appSub}>{user?.fullName || user?.email || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogoutPrompt} style={styles.headerLogoutBtn}>
          <Text style={styles.headerLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigateToProjects={() => setCurrentScreen('projects')}
            onSelectProject={handleSelectProject}
          />
        )}
        {currentScreen === 'projects' && <ProjectsScreen onSelectProject={handleSelectProject} />}
        {currentScreen === 'project-detail' && selectedProject && (
          <ProjectDetailScreen project={selectedProject} onBack={handleBackToProjects} />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('dashboard');
            setSelectedProject(null);
          }}
          style={[styles.navItem, currentScreen === 'dashboard' && styles.navItemActive]}
        >
          <Text
            style={[styles.navItemIcon, currentScreen === 'dashboard' && styles.navItemIconActive]}
          >
            📊
          </Text>
          <Text
            style={[styles.navItemText, currentScreen === 'dashboard' && styles.navItemTextActive]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('projects');
            setSelectedProject(null);
          }}
          style={[
            styles.navItem,
            (currentScreen === 'projects' || currentScreen === 'project-detail') &&
              styles.navItemActive,
          ]}
        >
          <Text
            style={[
              styles.navItemIcon,
              (currentScreen === 'projects' || currentScreen === 'project-detail') &&
                styles.navItemIconActive,
            ]}
          >
            📁
          </Text>
          <Text
            style={[
              styles.navItemText,
              (currentScreen === 'projects' || currentScreen === 'project-detail') &&
                styles.navItemTextActive,
            ]}
          >
            Projects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogoutPrompt} style={styles.navItem}>
          <Text style={styles.navItemIcon}>🚪</Text>
          <Text style={styles.navItemText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  sessionAlertContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  appBrand: {
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  appSub: {
    fontSize: 12,
    color: '#64748b',
  },
  headerLogoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  headerLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
  },
  navItemIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navItemIconActive: {
    opacity: 1,
  },
  navItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  navItemTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
