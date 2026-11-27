import React from 'react';

// Dashboard metric strip item component
const MetricStripItem = ({
  icon,
  label,
  value,
  color = 'text-text',
  className = '',
}) => (
  <div
    className={`bg-card border border-border-subtle p-4 rounded-xl flex flex-col gap-2 group hover:border-border transition-colors shadow-xs ${className}`}
  >
    <div className="flex items-center gap-2">
      {icon && (
        <div
          className={`${color} opacity-70 group-hover:opacity-100 transition-opacity shrink-0`}
        >
          {icon}
        </div>
      )}
      <span className="text-xs font-medium text-text-subtle tracking-normal leading-none group-hover:text-text transition-colors truncate">
        {label}
      </span>
    </div>

    <div className="flex items-baseline gap-2 pt-0.5">
      <span
        className={`text-2xl font-bold tracking-tight ${color} leading-none`}
      >
        {value}
      </span>
    </div>
  </div>
);

export default MetricStripItem;
