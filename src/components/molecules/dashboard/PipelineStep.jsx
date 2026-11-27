import React from 'react';

// Stage progress indicator component with design system styling
const PipelineStep = ({ label, value, progress = 0, color = 'bg-primary', isWarning }) => (
  <div className="flex flex-col gap-1 sm:gap-1.5 group/step">
    <div className="flex justify-between items-center text-xs font-medium">
      <span
        className={
          isWarning
            ? 'text-status-warning flex items-center gap-1.5 font-semibold'
            : 'text-text-subtle group-hover/step:text-text transition-colors'
        }
      >
        {label}
        {isWarning && (
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
        )}
      </span>
      <span className="text-xs font-semibold text-text">{value}</span>
    </div>
    <div className="w-full bg-background-elevated h-1.5 sm:h-2 rounded-full overflow-hidden border border-border-subtle">
      <div
        className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

export default PipelineStep;
