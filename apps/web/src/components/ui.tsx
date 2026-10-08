import React, { ReactNode } from 'react';

// ==========================================
// Button
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="btn-loading-wrapper">
          <span className="spinner-small" aria-hidden="true" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// ==========================================
// Input
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, required, className = '', ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && (
              <span className="required-star" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`form-input ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          required={required}
          {...rest}
        />
        {error && (
          <div id={inputId ? `${inputId}-error` : undefined} className="form-error" role="alert">
            {error}
          </div>
        )}
        {!error && helperText && <div className="form-helper">{helperText}</div>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ==========================================
// Textarea
// ==========================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, required, className = '', ...rest }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
            {required && (
              <span className="required-star" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`form-input form-textarea ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={!!error}
          required={required}
          {...rest}
        />
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

// ==========================================
// Select
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  id,
  required,
  className = '',
  ...rest
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && (
            <span className="required-star" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <select
        id={selectId}
        className={`form-input form-select ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={!!error}
        required={required}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// ==========================================
// Badge
// ==========================================
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  return <span className={`badge-pill badge-${variant}`}>{children}</span>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="info">In Progress</Badge>;
    case 'NOT_STARTED':
      return <Badge variant="default">Not Started</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'HIGH':
      return <Badge variant="danger">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning">Medium</Badge>;
    case 'LOW':
      return <Badge variant="default">Low</Badge>;
    default:
      return <Badge variant="default">{priority}</Badge>;
  }
};

// ==========================================
// Alert
// ==========================================
interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', children, onClose }) => {
  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-content">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="alert-close" aria-label="Dismiss alert">
          &times;
        </button>
      )}
    </div>
  );
};

// ==========================================
// Modal Dialog
// ==========================================
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// Loading Spinner
// ==========================================
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="spinner-container" role="status">
      <div className="spinner-large" aria-hidden="true" />
      <span className="spinner-text">{message}</span>
    </div>
  );
};
