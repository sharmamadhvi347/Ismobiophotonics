import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal as RNModal,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ==========================================
// Button
// ==========================================
interface ButtonProps {
  title?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'danger':
        return styles.btnDanger;
      case 'outline':
        return styles.btnOutline;
      case 'ghost':
        return styles.btnGhost;
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
        return styles.btnTextSecondary;
      case 'outline':
        return styles.btnTextOutline;
      case 'ghost':
        return styles.btnTextGhost;
      default:
        return styles.btnTextPrimary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return styles.btnSm;
      case 'lg':
        return styles.btnLg;
      default:
        return styles.btnMd;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
      style={[
        styles.btnBase,
        getButtonStyle(),
        getSizeStyle(),
        (disabled || isLoading) && styles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#2563eb' : '#ffffff'}
        />
      ) : children ? (
        children
      ) : (
        <Text style={[styles.btnTextBase, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ==========================================
// Input
// ==========================================
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required,
  style,
  containerStyle,
  ...rest
}) => {
  return (
    <View style={[styles.formGroup, containerStyle]}>
      {label && (
        <Text style={styles.formLabel}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[styles.formInput, error ? styles.inputError : undefined, style]}
        placeholderTextColor="#94a3b8"
        {...rest}
      />
      {error && <Text style={styles.formError}>{error}</Text>}
      {!error && helperText && <Text style={styles.formHelper}>{helperText}</Text>}
    </View>
  );
};

// ==========================================
// Badge
// ==========================================
interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (variant) {
      case 'success':
        return styles.badgeSuccess;
      case 'warning':
        return styles.badgeWarning;
      case 'info':
        return styles.badgeInfo;
      case 'danger':
        return styles.badgeDanger;
      default:
        return styles.badgeDefault;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'success':
        return styles.badgeTextSuccess;
      case 'warning':
        return styles.badgeTextWarning;
      case 'info':
        return styles.badgeTextInfo;
      case 'danger':
        return styles.badgeTextDanger;
      default:
        return styles.badgeTextDefault;
    }
  };

  return (
    <View style={[styles.badgeBase, getBadgeStyle()]}>
      <Text style={[styles.badgeTextBase, getTextStyle()]}>{label}</Text>
    </View>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge label="Completed" variant="success" />;
    case 'IN_PROGRESS':
      return <Badge label="In Progress" variant="info" />;
    case 'PENDING':
      return <Badge label="Pending" variant="warning" />;
    case 'NOT_STARTED':
      return <Badge label="Not Started" variant="default" />;
    default:
      return <Badge label={status} variant="default" />;
  }
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'HIGH':
      return <Badge label="High" variant="danger" />;
    case 'MEDIUM':
      return <Badge label="Medium" variant="warning" />;
    case 'LOW':
      return <Badge label="Low" variant="default" />;
    default:
      return <Badge label={priority} variant="default" />;
  }
};

// ==========================================
// Alert Banner
// ==========================================
interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose, action }) => {
  const getAlertStyle = (): ViewStyle => {
    switch (type) {
      case 'error':
        return styles.alertError;
      case 'success':
        return styles.alertSuccess;
      case 'warning':
        return styles.alertWarning;
      default:
        return styles.alertInfo;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (type) {
      case 'error':
        return styles.alertTextError;
      case 'success':
        return styles.alertTextSuccess;
      case 'warning':
        return styles.alertTextWarning;
      default:
        return styles.alertTextInfo;
    }
  };

  return (
    <View style={[styles.alertBase, getAlertStyle()]}>
      <View style={styles.alertMainContent}>
        <Text style={[styles.alertTextBase, getTextStyle()]}>{message}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} style={styles.alertActionBtn}>
            <Text style={[styles.alertActionText, getTextStyle()]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.alertCloseBtn}>
          <Text style={[styles.alertCloseText, getTextStyle()]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ==========================================
// Loading Spinner
// ==========================================
export const LoadingSpinner: React.FC<{ message?: string; text?: string }> = ({
  message,
  text,
}) => {
  const displayText = message || text || 'Loading...';
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.spinnerText}>{displayText}</Text>
    </View>
  );
};

// ==========================================
// Empty State
// ==========================================
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📁',
  title,
  description,
  message,
  actionText,
  onAction,
  action,
}) => {
  const resolvedDesc = description || message || '';
  const resolvedActionLabel = actionText || action?.label;
  const resolvedOnAction = onAction || action?.onPress;

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {resolvedDesc ? <Text style={styles.emptyDesc}>{resolvedDesc}</Text> : null}
      {resolvedActionLabel && resolvedOnAction && (
        <Button
          title={resolvedActionLabel}
          onPress={resolvedOnAction}
          style={styles.emptyActionBtn}
        />
      )}
    </View>
  );
};

// ==========================================
// Modal
// ==========================================
interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ visible, title, onClose, children }) => {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>{children}</View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  // Button
  btnBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnSm: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  btnMd: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnLg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextBase: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: '#ffffff',
  },
  btnTextSecondary: {
    color: '#1e293b',
  },
  btnTextOutline: {
    color: '#334155',
  },
  btnTextGhost: {
    color: '#64748b',
  },

  // Input
  formGroup: {
    marginBottom: 14,
    width: '100%',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#dc2626',
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  formError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  formHelper: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },

  // Badge
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: '#f1f5f9',
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
  },
  badgeInfo: {
    backgroundColor: '#e0f2fe',
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
  },
  badgeTextBase: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextDefault: {
    color: '#475569',
  },
  badgeTextSuccess: {
    color: '#15803d',
  },
  badgeTextWarning: {
    color: '#b45309',
  },
  badgeTextInfo: {
    color: '#0369a1',
  },
  badgeTextDanger: {
    color: '#b91c1c',
  },

  // Alert
  alertBase: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertMainContent: {
    flex: 1,
  },
  alertActionBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  alertActionText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertInfo: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  alertTextBase: {
    fontSize: 13,
    flex: 1,
  },
  alertTextError: {
    color: '#991b1b',
  },
  alertTextSuccess: {
    color: '#166534',
  },
  alertTextWarning: {
    color: '#92400e',
  },
  alertTextInfo: {
    color: '#1e40af',
  },
  alertCloseBtn: {
    marginLeft: 8,
    padding: 2,
  },
  alertCloseText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Spinner
  spinnerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyActionBtn: {
    marginTop: 4,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalBody: {
    padding: 16,
  },
});
