import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RotateCcw, LayoutDashboard, RefreshCw, Home } from 'lucide-react';

/**
 * 🛡️ NexaSetu Universal Error Boundary
 *
 * Catches runtime JavaScript errors anywhere in the child component tree,
 * logs the diagnostic error info, and renders a theme-aware, resilient fallback UI
 * scoped appropriately to component, page, or application level.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetryAt: 0,
      isRetrying: false,
    };
    this.lastPathname =
      typeof window !== 'undefined' ? window.location.pathname : '';
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.lastPathname =
      typeof window !== 'undefined' ? window.location.pathname : '';

    // Log diagnostic information for monitoring
    console.error('[CRITICAL] UI Component Crash Detected:', error, errorInfo);

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error('[ErrorBoundary] onError callback failed:', err);
      }
    }

    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps) {
    if (!this.state.hasError) return;

    // 1. Auto-reset when explicit resetKeys change
    if (this.props.resetKeys && prevProps.resetKeys) {
      const keysChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys[idx]
      );
      if (keysChanged) {
        this.handleReset();
        return;
      }
    }

    // 2. Auto-reset when route pathname changes in browser
    if (
      typeof window !== 'undefined' &&
      this.lastPathname &&
      window.location.pathname !== this.lastPathname
    ) {
      this.lastPathname = window.location.pathname;
      this.handleReset();
    }
  }

  /**
   * Resets the error boundary state and invokes optional onReset handler.
   */
  handleReset = () => {
    const { onReset } = this.props;
    const now = Date.now();
    const isRapid = now - this.state.lastRetryAt < 1200;
    const nextRetryCount = isRapid ? this.state.retryCount + 1 : 1;

    // Prevent infinite loop if component crashes continuously during render
    if (nextRetryCount > 3) {
      const scope = this.resolveScope();
      if (scope === 'app' || scope === 'page') {
        window.location.reload();
        return;
      }
    }

    this.setState({ isRetrying: true }, () => {
      try {
        if (typeof onReset === 'function') {
          onReset();
        }
      } catch (err) {
        console.error('[ErrorBoundary] onReset handler error:', err);
      }

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: nextRetryCount,
        lastRetryAt: now,
        isRetrying: false,
      });
    });
  };

  /**
   * Navigates safely to the workspace dashboard.
   */
  handleGoToDashboard = () => {
    try {
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/';
        }
      }
    } catch {
      window.location.reload();
    }
  };

  resolveScope() {
    if (this.props.scope) return this.props.scope;
    if (this.props.compact) return 'component';
    return 'page';
  }

  /**
   * 1. COMPONENT-LEVEL ERROR FALLBACK
   * Compact card/section fallback that keeps the rest of the page intact.
   */
  renderComponentFallback() {
    const {
      title = 'Something went wrong',
      description = "We couldn't display this section. Please try again.",
      className = '',
      primaryActionText = 'Try again',
    } = this.props;
    const { error, retryCount, isRetrying } = this.state;
    const isRepeatedFailure = retryCount >= 2;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 sm:p-5 rounded-md border border-border-subtle bg-card/60 text-text flex flex-col items-center justify-center text-center gap-2.5 min-h-[140px] w-full transition-colors ${className}`}
        style={{
          backgroundColor: 'var(--color-card, #12161C)',
          borderColor: 'var(--color-border-subtle, #292D33)',
          color: 'var(--color-text, #F8FAFC)',
        }}
      >
        <div className="w-8 h-8 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center text-status-error shrink-0">
          <AlertCircle size={16} />
        </div>

        <div className="space-y-1 max-w-sm">
          <h3 className="text-xs font-semibold text-text">
            {title}
          </h3>
          <p className="text-[11px] text-text-subtle leading-relaxed">
            {description}
          </p>
          {isRepeatedFailure && (
            <p className="text-[10px] text-status-warning font-medium">
              Repeated issue encountered. Try reloading if problem persists.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={this.handleReset}
          disabled={isRetrying}
          className="h-7 px-3 text-xs font-medium rounded-xs bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50 mt-0.5"
          style={{
            backgroundColor: 'var(--color-primary, #3B82F6)',
            color: '#FFFFFF',
          }}
        >
          <RotateCcw size={12} className={isRetrying ? 'animate-spin' : ''} />
          <span>{isRetrying ? 'Retrying...' : primaryActionText}</span>
        </button>

        {import.meta.env.DEV && error && (
          <details className="mt-2 w-full text-left text-[10px] text-text-subtler font-mono border-t border-border-subtle pt-1.5">
            <summary className="cursor-pointer hover:text-text-subtle">
              Developer details
            </summary>
            <pre className="mt-1 p-2 bg-background-elevated rounded overflow-x-auto whitespace-pre-wrap max-h-24">
              {error.message || String(error)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  /**
   * 2. PAGE-LEVEL ERROR FALLBACK
   * Clean centered state providing "Try again" and "Go to Dashboard" navigation.
   */
  renderPageFallback() {
    const {
      title = 'Something went wrong',
      description = "We couldn't display this page. Please try again.",
      className = '',
      primaryActionText = 'Try again',
      secondaryActionText = 'Go to Dashboard',
      showSecondary = true,
    } = this.props;
    const { error, retryCount, isRetrying } = this.state;
    const isRepeatedFailure = retryCount >= 2;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto space-y-4 animate-in fade-in ${className}`}
        style={{
          color: 'var(--color-text, #F8FAFC)',
        }}
      >
        <div className="w-12 h-12 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center text-status-error mb-1 shrink-0">
          <AlertCircle size={24} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg sm:text-xl font-bold text-text">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-text-subtle leading-relaxed">
            {description}
          </p>
          {isRepeatedFailure && (
            <p className="text-xs text-status-warning font-medium">
              If this continues, going to the dashboard or reloading may help.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={this.handleReset}
            disabled={isRetrying}
            className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-primary, #3B82F6)',
              color: '#FFFFFF',
            }}
          >
            <RotateCcw size={14} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'Retrying...' : primaryActionText}</span>
          </button>

          {showSecondary && (
            <button
              type="button"
              onClick={this.handleGoToDashboard}
              className="h-9 px-4 border border-border-subtle bg-background-elevated hover:bg-card text-text text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              style={{
                borderColor: 'var(--color-border-subtle, #292D33)',
                backgroundColor: 'var(--color-background-elevated, #161B22)',
                color: 'var(--color-text, #F8FAFC)',
              }}
            >
              <LayoutDashboard size={14} />
              <span>{secondaryActionText}</span>
            </button>
          )}
        </div>

        {import.meta.env.DEV && error && (
          <details className="mt-4 w-full text-left text-[11px] text-text-subtler font-mono border border-border-subtle rounded-md bg-background-elevated p-3 max-h-48 overflow-y-auto">
            <summary className="cursor-pointer hover:text-text font-semibold text-xs text-text-subtle pb-1">
              Debug Information (Development Only)
            </summary>
            <div className="mt-1 space-y-1 text-status-error font-medium">
              <div>
                {error.name}: {error.message}
              </div>
              {error.stack && (
                <pre className="text-[10px] text-text-subtler whitespace-pre-wrap overflow-x-auto pt-1 border-t border-border-subtle/50">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    );
  }

  /**
   * 3. APPLICATION-LEVEL ERROR FALLBACK
   * Ultra-resilient, 0-dependency fallback ensuring users are never left on a blank screen.
   */
  renderAppFallback() {
    const {
      title = 'Something went wrong',
      description = "We couldn't display this page. Please try again.",
      primaryActionText = 'Try again',
    } = this.props;
    const { error, isRetrying } = this.state;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center"
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: 'var(--color-background, #0B0D10)',
          color: 'var(--color-text, #F8FAFC)',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F87171',
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={24} />
        </div>

        <div style={{ maxWidth: '420px', marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              lineHeight: '1.5',
              color: 'var(--color-text-subtle, #94A3B8)',
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={this.handleReset}
            disabled={isRetrying}
            style={{
              height: '36px',
              padding: '0 1rem',
              backgroundColor: 'var(--color-primary, #3B82F6)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RotateCcw size={14} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'Retrying...' : primaryActionText}</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              height: '36px',
              padding: '0 1rem',
              backgroundColor: 'var(--color-background-elevated, #161B22)',
              color: 'var(--color-text, #F8FAFC)',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '4px',
              border: '1px solid var(--color-border-subtle, #292D33)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={14} />
            <span>Reload page</span>
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            style={{
              height: '36px',
              padding: '0 1rem',
              backgroundColor: 'transparent',
              color: 'var(--color-text-subtle, #94A3B8)',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '4px',
              border: '1px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Home size={14} />
            <span>Go to Home</span>
          </button>
        </div>

        {import.meta.env.DEV && error && (
          <details
            style={{
              marginTop: '1.5rem',
              maxWidth: '540px',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              border: '1px solid var(--color-border-subtle, #292D33)',
              borderRadius: '6px',
              backgroundColor: 'var(--color-background-elevated, #161B22)',
              padding: '0.75rem',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: '600',
                color: '#F87171',
              }}
            >
              Developer Stack Trace
            </summary>
            <pre
              style={{
                margin: '0.5rem 0 0 0',
                whiteSpace: 'pre-wrap',
                color: '#94A3B8',
                fontSize: '0.7rem',
              }}
            >
              {error.stack || error.message || String(error)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      const { fallback, fallbackRender } = this.props;

      // 1. Function fallback renderer (react-error-boundary standard)
      if (typeof fallbackRender === 'function') {
        return fallbackRender({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      // 2. Custom element or function fallback
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.handleReset);
      }
      if (fallback) {
        return fallback;
      }

      const scope = this.resolveScope();

      if (scope === 'app') {
        return this.renderAppFallback();
      }
      if (scope === 'component') {
        return this.renderComponentFallback();
      }
      return this.renderPageFallback();
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  scope: PropTypes.oneOf(['component', 'page', 'app']),
  compact: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  primaryActionText: PropTypes.string,
  secondaryActionText: PropTypes.string,
  showSecondary: PropTypes.bool,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  fallbackRender: PropTypes.func,
  onReset: PropTypes.func,
  onError: PropTypes.func,
  resetKeys: PropTypes.array,
  className: PropTypes.string,
};

export default ErrorBoundary;
