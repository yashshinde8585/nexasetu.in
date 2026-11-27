import React from 'react';
import PropTypes from 'prop-types';
import Input from '../atoms/Input';

// Combines a label and input atom for a consistent form field UI.
const FormField = ({
  label = '',
  labelExtra = null,
  id,
  required = false,
  icon: Icon,
  ...inputProps
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {(label || labelExtra) && (
        <div className="flex justify-between items-center ml-1 select-none">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold text-text-subtle uppercase tracking-wider ml-1"
            >
              {label}
              {required && <span className="text-status-error ml-1">*</span>}
            </label>
          )}
          {labelExtra}
        </div>
      )}

      <div className="relative group">
        <Input
          id={id}
          required={required}
          {...inputProps}
          className={`${Icon ? 'pl-12' : ''} ${inputProps.className || ''}`}
        />
        {Icon && (
          <Icon
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within:text-primary transition-colors"
          />
        )}
      </div>
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  required: PropTypes.bool,
  icon: PropTypes.elementType,
};

export default FormField;
