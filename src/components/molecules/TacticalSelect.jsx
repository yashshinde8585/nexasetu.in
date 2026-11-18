import React from 'react';
import PropTypes from 'prop-types';

// A specialized dropdown component with a label and an optional icon.
const TacticalSelect = ({ icon, label, options, value, onChange }) => (
  <div className="relative group/field">
    {label && (
      <label className="text-xs font-semibold text-text-subtle uppercase tracking-wider ml-1 mb-2 block">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        className="w-full bg-background-elevated border border-border-subtle focus:border-primary text-text rounded-lg px-4 py-3 outline-none transition-all appearance-none cursor-pointer text-xs font-medium tracking-tight pr-10 group-hover/field:border-border"
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="bg-card text-text py-2"
          >
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within/field:text-primary transition-colors pointer-events-none">
        {icon}
      </div>
    </div>
  </div>
);

TacticalSelect.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default TacticalSelect;
