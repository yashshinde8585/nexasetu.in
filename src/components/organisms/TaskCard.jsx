import React from 'react';
import PropTypes from 'prop-types';
import { Clock, FolderKanban, Paperclip } from 'lucide-react';
import { TASK_STATUS } from '../../constants';

// A card component that displays task details, status, and management actions.
const TaskCard = ({
  task,
  onNavigate,
  onStatusChange,
  showAssignedUser = false,
}) => {
  const ticketId =
    task.projectKey && task.taskNumber
      ? `${task.projectKey}-${task.taskNumber}`
      : task.project?.key && task.taskNumber
        ? `${task.project.key}-${task.taskNumber}`
        : task.taskNumber
          ? `TASK-${task.taskNumber}`
          : 'TASK';

  const projectName = task.project?.name || 'General';

  const getStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.TODO:
        return 'To Do';
      case TASK_STATUS.IN_PROGRESS:
        return 'In Progress';
      case TASK_STATUS.IN_REVIEW:
        return 'In Review';
      case TASK_STATUS.DONE:
        return 'Done';
      default:
        return status ? status.replace('_', ' ') : 'To Do';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case TASK_STATUS.DONE:
        return 'bg-status-success/10 border-status-success/30 text-status-success';
      case TASK_STATUS.IN_REVIEW:
        return 'bg-secondary/10 border-secondary/30 text-secondary';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-status-warning/10 border-status-warning/30 text-status-warning';
      default:
        return 'bg-background-elevated border-border-subtle text-text-subtle';
    }
  };

  const getPriorityStyle = (priority) => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'urgent':
        return { dot: 'bg-status-error', text: 'text-status-error' };
      case 'high':
        return { dot: 'bg-status-warning', text: 'text-status-warning' };
      case 'low':
        return { dot: 'bg-status-success', text: 'text-status-success' };
      default:
        return { dot: 'bg-primary', text: 'text-primary' };
    }
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TASK_STATUS.DONE;

  const formatEffort = (mins) => {
    if (!mins || mins <= 0) return null;
    if (mins >= 1440) {
      const days = Math.round((mins / 1440) * 10) / 10;
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    if (mins >= 60) {
      const hours = Math.round((mins / 60) * 10) / 10;
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }
    return `${mins}m`;
  };

  const priorityStyle = getPriorityStyle(task.priority);
  const effortText = formatEffort(task.estimatedDuration);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className="group bg-card hover:bg-background-elevated border border-border-subtle hover:border-primary/40 rounded-xl p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md relative outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Top Row: Ticket ID + Project Name & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-mono font-semibold rounded bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 shrink-0">
            {ticketId}
          </span>
          <span
            className="flex items-center gap-1 text-xs text-text-subtle font-medium truncate"
            title={`Project: ${projectName}`}
          >
            <FolderKanban size={13} className="shrink-0 text-text-subtle/80" />
            <span className="truncate">{projectName}</span>
          </span>
        </div>

        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border shrink-0 ${getStatusBadgeStyle(task.status)}`}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Title & Priority / Assignee */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div
            className="flex items-center gap-1.5"
            title={`Priority: ${task.priority || 'Medium'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityStyle.dot}`}
            />
            <span
              className={`text-xs font-medium capitalize ${priorityStyle.text}`}
            >
              {task.priority || 'Medium'}
            </span>
          </div>

          {showAssignedUser && task.assignedUser && (
            <div
              className="flex items-center gap-1.5 text-xs text-text-subtle"
              title={`Assigned to ${task.assignedUser?.name || 'Unassigned'}`}
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {task.assignedUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="truncate max-w-[120px] font-medium text-text-subtle">
                {task.assignedUser?.name || 'Unassigned'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Due Date & Metadata */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock
            size={13}
            className={
              isOverdue ? 'text-status-error shrink-0' : 'text-text-subtle shrink-0'
            }
          />
          <span
            className={`truncate font-medium ${
              isOverdue ? 'text-status-error' : 'text-text-subtle'
            }`}
          >
            {task.dueDate ? (
              isOverdue ? (
                `Overdue • ${new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`
              ) : (
                `Due ${new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`
              )
            ) : (
              'No due date'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-text-subtle">
          {effortText && (
            <span
              className="text-xs text-text-subtle font-medium bg-background-elevated px-2 py-0.5 rounded border border-border-subtle"
              title={`Estimated effort: ${effortText}`}
            >
              {effortText}
            </span>
          )}

          {task.attachments?.length > 0 && (
            <div
              className="flex items-center gap-1 text-text-subtle"
              title={`${task.attachments.length} attachment${task.attachments.length > 1 ? 's' : ''}`}
            >
              <Paperclip size={13} />
              <span className="text-xs font-medium">
                {task.attachments.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func,
  showAssignedUser: PropTypes.bool,
};

export default TaskCard;
