import React from 'react';

// Status indicator with semantic dot and optional label
const StatusIndicator = ({ color = 'default', label, showLabel = false }) => {
  const colors = {
    red: { dot: 'bg-status-error', text: 'text-status-error', defaultLabel: 'Critical' },
    yellow: { dot: 'bg-status-warning', text: 'text-status-warning', defaultLabel: 'At risk' },
    green: { dot: 'bg-status-success', text: 'text-status-success', defaultLabel: 'Healthy' },
    neutral: { dot: 'bg-text-subtler/40', text: 'text-text-subtle', defaultLabel: 'No activity' },
    no_data: { dot: 'bg-text-subtler/40', text: 'text-text-subtle', defaultLabel: 'No data' },
    default: { dot: 'bg-text-subtler/40', text: 'text-text-subtle', defaultLabel: 'N/A' },
  };

  const config = colors[color] || colors.default;
  const displayText = label || config.defaultLabel;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${config.dot} shrink-0`}
        aria-hidden="true"
      />
      {(showLabel || label) && (
        <span className={`text-xs font-medium ${config.text}`}>
          {displayText}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
