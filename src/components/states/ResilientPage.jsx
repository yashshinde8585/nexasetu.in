import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import {
  AccessDenied,
  NotFound,
  AuthRequired,
  ServerError,
} from './SystemStates';
import CenteredLoading from '../atoms/CenteredLoading';

const ResilientPage = ({
  isLoading,
  error,
  children,
  loadingMessage,
  onRetry,
}) => {
  if (isLoading) {
    return <CenteredLoading message={loadingMessage} />;
  }

  if (error) {
    const uiState = error.uiState;

    switch (uiState) {
      case 'auth-required':
        return <AuthRequired />;
      case 'access-denied':
        return <AccessDenied />;
      case 'not-found':
        return <NotFound />;
      case 'server-error':
        return <ServerError onRetry={onRetry} />;
      default:
        return (
          <div
            role="alert"
            aria-live="assertive"
            className="min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto space-y-4 animate-in fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center text-status-error mb-1 shrink-0">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-text">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-text-subtle leading-relaxed">
                {error.message || "We couldn't display this page. Please try again."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onRetry || (() => window.location.reload())}
                className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw size={14} />
                <span>Try again</span>
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/dashboard')}
                className="h-9 px-4 border border-border-subtle bg-background-elevated hover:bg-card text-text text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        );
    }
  }

  return <>{children}</>;
};

ResilientPage.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  children: PropTypes.node,
  loadingMessage: PropTypes.string,
  onRetry: PropTypes.func,
};

export default ResilientPage;
