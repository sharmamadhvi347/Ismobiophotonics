import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { APP_CONFIG } from '@pms/config';

export default function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Module 00: Foundation</Text>
      </View>
      <Text style={styles.title}>{APP_CONFIG.APP_NAME}</Text>
      <Text style={styles.subtitle}>Mobile Application (Android Target)</Text>
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Architecture Readiness</Text>
        <Text style={styles.cardBody}>• React Native + Expo</Text>
        <Text style={styles.cardBody}>• Shared Types &amp; Validation</Text>
        <Text style={styles.cardBody}>• Unified REST API Integration</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: '#1e40af',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});
