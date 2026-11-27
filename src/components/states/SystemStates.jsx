import React from 'react';
import PropTypes from 'prop-types';
import {
  ShieldAlert,
  FileQuestion,
  Lock,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StateLayout = ({
  icon: Icon,
  title,
  message,
  actionText,
  onAction,
  errorCode,
  secondaryActionText = 'Go to Dashboard',
  onSecondaryAction,
  iconColorClass = 'text-primary',
  iconBgClass = 'bg-primary/10 border-primary/20',
}) => {
  const navigate = useNavigate();

  const handleSecondary =
    onSecondaryAction ||
    (() => {
      try {
        navigate('/dashboard');
      } catch {
        window.location.href = '/dashboard';
      }
    });

  return (
    <div
      role="alert"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-300"
    >
      <div
        className={`w-12 h-12 rounded-full border flex items-center justify-center mb-1 shrink-0 ${iconBgClass} ${iconColorClass}`}
      >
        <Icon size={24} />
      </div>

      {errorCode && (
        <span className="text-[11px] font-mono text-text-subtler tracking-wider uppercase">
          {errorCode}
        </span>
      )}

      <div className="space-y-1.5">
        <h1 className="text-lg sm:text-xl font-bold text-text">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-text-subtle leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {actionText && (
          <button
            type="button"
            onClick={onAction}
            className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {actionText === 'Try again' ? <RotateCcw size={14} /> : null}
            <span>{actionText}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSecondary}
          className="h-9 px-4 border border-border-subtle bg-background-elevated hover:bg-card text-text text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LayoutDashboard size={14} />
          <span>{secondaryActionText}</span>
        </button>
      </div>
    </div>
  );
};

StateLayout.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  errorCode: PropTypes.string,
  secondaryActionText: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  iconColorClass: PropTypes.string,
  iconBgClass: PropTypes.string,
};

export const AccessDenied = () => (
  <StateLayout
    icon={ShieldAlert}
    iconColorClass="text-status-warning"
    iconBgClass="bg-status-warning/10 border-status-warning/20"
    title="Access restricted"
    message="You don't have permission to view this resource. Contact your workspace administrator if you need access."
    errorCode="403 Forbidden"
    actionText="Request access"
    onAction={() => (window.location.href = 'mailto:admin@nexasetu.ai')}
  />
);

export const NotFound = () => (
  <StateLayout
    icon={FileQuestion}
    iconColorClass="text-text-subtle"
    iconBgClass="bg-background-elevated border-border-subtle"
    title="Page not found"
    message="The page or resource you are looking for doesn't exist or has been moved."
    errorCode="404 Not Found"
  />
);

export const AuthRequired = () => {
  const navigate = useNavigate();
  return (
    <StateLayout
      icon={Lock}
      iconColorClass="text-primary"
      iconBgClass="bg-primary/10 border-primary/20"
      title="Authentication required"
      message="Your session may have expired. Please sign in to access your workspace."
      errorCode="401 Unauthorized"
      actionText="Sign in"
      onAction={() => navigate('/login')}
      secondaryActionText="Go to Home"
      onSecondaryAction={() => navigate('/')}
    />
  );
};

export const ServerError = ({ onRetry }) => (
  <StateLayout
    icon={AlertTriangle}
    iconColorClass="text-status-error"
    iconBgClass="bg-status-error/10 border-status-error/20"
    title="Something went wrong"
    message="We encountered an issue communicating with the server. Please try again."
    errorCode="500 Server Error"
    actionText="Try again"
    onAction={onRetry || (() => window.location.reload())}
  />
);

ServerError.propTypes = {
  onRetry: PropTypes.func,
};

export default StateLayout;
