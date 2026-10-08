import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/auth-context';
import { Button, Input, Alert } from '../components/ui';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login, error: authError, clearError, sessionExpired, clearSessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setFormError(null);
    clearError();
    clearSessionExpired();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFormError('Please enter your email address');
      return;
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFormError('Please provide a valid email address');
      return;
    }
    if (!password) {
      setFormError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
    } catch {
      // Handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your mobile workspace
          </Text>

          {sessionExpired && (
            <Alert
              type="warning"
              message="Your session has expired. Please log in again."
              onClose={clearSessionExpired}
            />
          )}

          {(formError || authError) && (
            <Alert
              type="error"
              message={formError || authError || 'Authentication failed'}
              onClose={() => {
                setFormError(null);
                clearError();
              }}
            />
          )}

          <Input
            label="Email Address"
            placeholder="engineer@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            placeholder="••••••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            required
          />

          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            onPress={handleLogin}
            isLoading={isSubmitting}
            style={styles.submitBtn}
          />

          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.switchAuthLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 8,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  switchAuthText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
});
