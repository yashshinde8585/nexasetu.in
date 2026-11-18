import React from 'react';

// Dashboard metric strip item component.
const MetricStripItem = ({
  icon,
  label,
  value,
  color = 'text-text',
  accent = 'bg-primary',
  className = '',
}) => (
  <div
    className={`bg-card border border-border-subtle p-3.5 sm:p-4 rounded-sm flex flex-col gap-2.5 relative group hover:border-border transition-colors ${className}`}
  >
    {/* Minimal Accent Indicator */}
    <div
      className={`absolute left-0 top-0 bottom-0 w-0.5 ${accent} opacity-60 group-hover:opacity-100 transition-opacity`}
    />

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

    <div className="flex items-baseline gap-2">
      <span
        className={`text-xl sm:text-2xl font-bold tracking-tight ${color} leading-none`}
      >
        {value}
      </span>
    </div>
  </div>
);

export default MetricStripItem;
