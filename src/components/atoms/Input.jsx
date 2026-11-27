import React from 'react';
import PropTypes from 'prop-types';

const Input = ({
  type = 'text',
  placeholder = '',
  className = '',
  isError = false,
  errorMsg = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-md border focus:outline-none transition-all text-xs sm:text-sm font-medium placeholder:text-text-subtler ${
          isError
            ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error/40'
            : 'border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary/40'
        } ${className}`}
        style={{
          backgroundColor: 'var(--color-background-elevated)',
          color: 'var(--color-text)',
        }}
        {...props}
      />
      {isError && errorMsg && (
        <span className="text-xs text-status-error mt-1 block px-0.5 animate-[fadeIn_150ms_ease_forwards]">
          {errorMsg}
        </span>
      )}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  isError: PropTypes.bool,
  errorMsg: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
