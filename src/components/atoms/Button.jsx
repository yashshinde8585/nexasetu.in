import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  isDisabled = false,
  onClick,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 rounded-lg select-none';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-dark shadow-xs',
    secondary:
      'bg-background-elevated border border-border-subtle text-text hover:bg-background-light hover:border-border',
    outline:
      'bg-transparent border border-primary text-primary hover:bg-primary/10',
    ghost:
      'bg-transparent text-text-muted hover:text-text hover:bg-background-elevated',
    glass:
      'bg-background-elevated/70 backdrop-blur-md text-text hover:bg-background-light border border-border-subtle',
    error:
      'bg-status-error text-white hover:opacity-90 shadow-xs',
    success:
      'bg-status-success text-white hover:opacity-90 shadow-xs',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
    icon: 'p-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'glass',
    'error',
    'success',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'icon']),
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Button;
