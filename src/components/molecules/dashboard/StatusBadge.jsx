import React from 'react';

// Status badge indicator component.
const StatusBadge = ({ status }) => {
  const configs = {
    done: 'bg-status-success/15 text-status-success border-status-success/30',
    completed: 'bg-status-success/15 text-status-success border-status-success/30',
    healthy: 'bg-status-success/15 text-status-success border-status-success/30',
    in_progress: 'bg-primary/15 text-primary border-primary/30',
    executing: 'bg-primary/15 text-primary border-primary/30',
    in_review: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    todo: 'bg-background-elevated text-text-subtle border-border-subtle',
    degraded: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    blocked: 'bg-status-error/15 text-status-error border-status-error/30',
    failed: 'bg-status-error/15 text-status-error border-status-error/30',
  };

  const getLabel = () => {
    switch (status) {
      case 'in_progress':
      case 'executing':
        return 'In Progress';
      case 'in_review':
        return 'In Review';
      case 'todo':
        return 'To Do';
      default:
        return status ? status.replace(/_/g, ' ') : '';
    }
  };

  const normalizedStatus = status?.toLowerCase();

  return (
    <span
      className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wide border ${configs[normalizedStatus] || configs.todo}`}
    >
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
