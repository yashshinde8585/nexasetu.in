import React from 'react';
import { TASK_STATUS, USER_ROLES } from '../../constants';
import {
  ChevronRight,
  ShieldCheck,
  GitBranch,
  Activity,
  Calendar,
} from 'lucide-react';

const getTaskDeadlineInfo = (task) => {
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    // Compare calendar days
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((todayStart - dueDayStart) / (1000 * 60 * 60 * 24));
    const formatted = due.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (task.status === TASK_STATUS.DONE) {
      return { text: `Due ${formatted}`, isOverdue: false, isToday: false, isEstimate: false };
    }

    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isToday: true, isEstimate: false };
    }
    if (diffDays > 0) {
      return {
        text: `${diffDays === 1 ? '1d overdue' : `${diffDays}d overdue`} • Due ${formatted}`,
        isOverdue: true,
        isToday: false,
        isEstimate: false,
      };
    }
    return { text: `Due ${formatted}`, isOverdue: false, isToday: false, isEstimate: false };
  }

  if (task.estimatedDuration && task.status !== TASK_STATUS.DONE) {
    const mins = task.estimatedDuration || 0;
    const durationInMs = mins * 60 * 1000;
    const suggested = new Date(Date.now() + durationInMs);
    const formatted = suggested.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { text: `Est. ${formatted}`, isOverdue: false, isToday: false, isEstimate: true };
  }

  return null;
};

const TaskCard = ({
  task,
  user,
  columns,
  handleStatusChange,
  onTaskClick,
  cardLayout = 'standard',
}) => {
  const isCompact = cardLayout === 'compact';
  const isMinimal = cardLayout === 'minimal';
  const isList = cardLayout === 'list';

  const getNextStatus = (currentStatus) => {
    if (currentStatus === TASK_STATUS.TODO) return TASK_STATUS.IN_PROGRESS;
    if (currentStatus === TASK_STATUS.IN_PROGRESS) return TASK_STATUS.IN_REVIEW;
    return TASK_STATUS.DONE;
  };

  const getStatusActionLabel = (currentStatus) => {
    if (currentStatus === TASK_STATUS.TODO) return 'Start progress';
    if (currentStatus === TASK_STATUS.IN_PROGRESS) return 'Move to review';
    return 'Mark complete';
  };

  if (isList) {
    const actionLabel = getStatusActionLabel(task.status);
    return (
      <div
        key={task._id}
        onClick={() => onTaskClick(task)}
        className="bg-card hover:bg-background-elevated p-3 rounded-xl border border-border-subtle relative overflow-hidden cursor-pointer group shadow-sm flex items-center justify-between gap-3 min-h-[52px] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xs font-mono font-semibold rounded bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 shrink-0">
            {task.projectKey || 'NEXA'}-{task.taskNumber || '0'}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              task.priority?.toLowerCase() === 'urgent'
                ? 'bg-status-error'
                : task.priority?.toLowerCase() === 'high'
                  ? 'bg-status-warning'
                  : task.priority?.toLowerCase() === 'low'
                    ? 'bg-status-success'
                    : 'bg-primary'
            }`}
            title={`Priority: ${task.priority || 'Medium'}`}
          />
          <h4 className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
            {task.title}
          </h4>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {(() => {
            const deadline = getTaskDeadlineInfo(task);
            if (!deadline) return null;
            return (
              <span
                className={`hidden md:inline-flex items-center gap-1 text-xs shrink-0 ${
                  deadline.isOverdue
                    ? 'text-status-error font-medium'
                    : deadline.isToday
                      ? 'text-status-warning font-medium'
                      : deadline.isEstimate
                        ? 'text-secondary font-medium'
                        : 'text-text-subtle'
                }`}
              >
                <Calendar size={11} className="shrink-0" />
                {deadline.text}
              </span>
            );
          })()}

          {task.assignedUser && (
            <div
              className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0"
              title={`Assigned to ${task.assignedUser.name}`}
            >
              {task.assignedUser.name[0].toUpperCase()}
            </div>
          )}

          {task.status !== TASK_STATUS.DONE && (
            <button
              type="button"
              title={actionLabel}
              aria-label={actionLabel}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(task._id, getNextStatus(task.status));
              }}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
                user?.role === USER_ROLES.INTERN &&
                task.status === TASK_STATUS.IN_REVIEW
                  ? 'hidden'
                  : ''
              } ${
                task.status === TASK_STATUS.TODO
                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-background-dark'
                  : task.status === TASK_STATUS.IN_PROGRESS
                    ? 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning hover:text-background-dark'
                    : 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success hover:text-background-dark'
              }`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  const actionLabel = getStatusActionLabel(task.status);

  return (
    <div
      key={task._id}
      onClick={() => onTaskClick(task)}
      className={`bg-card p-4 rounded-xl border border-border-subtle relative overflow-hidden cursor-pointer group transition-all duration-200 hover:border-primary/50 hover:shadow-md flex flex-col justify-between ${
        isMinimal ? 'min-h-[110px]' : isCompact ? 'min-h-[140px]' : 'min-h-[175px]'
      }`}
    >
      <div
        className={`flex justify-between items-start gap-3 ${isMinimal ? 'mb-1' : 'mb-3'}`}
      >
        <div className="flex flex-col min-w-0 flex-1">
          {!isMinimal && (
            <div
              className={`flex flex-wrap items-center gap-1.5 ${isCompact ? 'mb-1.5' : 'mb-2.5'}`}
            >
              <span className="text-xs font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                {task.projectKey || 'NEXA'}-{task.taskNumber || '0'}
              </span>

              {/* Priority Indicator */}
              <span
                className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                  task.priority?.toLowerCase() === 'urgent'
                    ? 'border-status-error/30 text-status-error bg-status-error/10'
                    : task.priority?.toLowerCase() === 'high'
                      ? 'border-status-warning/30 text-status-warning bg-status-warning/10'
                      : task.priority?.toLowerCase() === 'low'
                        ? 'border-status-success/30 text-status-success bg-status-success/10'
                        : 'border-border-subtle text-text-subtle bg-background-elevated'
                }`}
                title={`Priority: ${task.priority || 'Medium'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    task.priority?.toLowerCase() === 'urgent'
                      ? 'bg-status-error'
                      : task.priority?.toLowerCase() === 'high'
                        ? 'bg-status-warning'
                        : task.priority?.toLowerCase() === 'low'
                          ? 'bg-status-success'
                          : 'bg-primary'
                  }`}
                />
                {task.priority || 'Medium'}
              </span>

              {!isCompact && (
                <>
                  <span
                    className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded border ${
                      task.type === 'bug'
                        ? 'border-status-error/30 text-status-error bg-status-error/10'
                        : task.type === 'epic'
                          ? 'border-secondary/30 text-secondary bg-secondary/10'
                          : task.type === 'story'
                            ? 'border-status-success/30 text-status-success bg-status-success/10'
                            : task.type === 'spike'
                              ? 'border-primary/30 text-primary bg-primary/10'
                              : task.type === 'tech_debt'
                                ? 'border-status-warning/30 text-status-warning bg-status-warning/10'
                                : 'border-border-subtle text-text-subtle bg-background-elevated'
                    }`}
                  >
                    {task.type || 'Task'}
                  </span>
                  <span className="text-xs text-text-subtle font-medium ml-0.5">
                    {task.createdFormatted || 'New'}
                  </span>
                </>
              )}
            </div>
          )}
          <h4 className="text-sm font-semibold text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {task.title}
          </h4>
        </div>
        {!isMinimal && task.delayStatus && task.delayStatus !== 'On Track' && (
          <div className="flex flex-col items-end shrink-0">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                task.delayStatus === 'Delayed'
                  ? 'bg-status-error/10 text-status-error border-status-error/30'
                  : 'bg-status-warning/10 text-status-warning border-status-warning/30'
              }`}
            >
              {task.delayStatus}
            </span>
          </div>
        )}
      </div>

      {!isMinimal &&
        task.status === TASK_STATUS.DONE &&
        task.actualDuration !== null && (
          <div className="mt-2 pt-2 border-t border-border-subtle text-xs font-medium text-status-success flex items-center gap-1.5">
            <ShieldCheck size={13} /> Completed in {task.actualDuration}m
          </div>
        )}

      {!isMinimal && task.timelineHistory?.length > 0 && (
        <div className="mt-2 text-xs font-medium text-secondary flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded w-fit">
          <Activity size={12} /> AI optimized
        </div>
      )}

      {/* Due Date Indicator */}
      {!isMinimal && (() => {
        const deadline = getTaskDeadlineInfo(task);
        if (!deadline) return null;

        return (
          <div className="mt-2.5 flex items-center gap-1.5 min-w-0">
            <Calendar
              size={12}
              className={
                deadline.isOverdue
                  ? 'text-status-error shrink-0'
                  : deadline.isToday
                    ? 'text-status-warning shrink-0'
                    : deadline.isEstimate
                      ? 'text-secondary shrink-0'
                      : 'text-text-subtle shrink-0'
              }
            />
            <span
              className={`text-xs truncate ${
                deadline.isOverdue
                  ? 'text-status-error font-semibold'
                  : deadline.isToday
                    ? 'text-status-warning font-semibold'
                    : deadline.isEstimate
                      ? 'text-secondary font-medium'
                      : 'text-text-subtle font-medium'
              }`}
            >
              {deadline.text}
            </span>
          </div>
        );
      })()}

      {/* Footer Section */}
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {task.assignedUser && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full bg-background-elevated border border-border-subtle flex items-center justify-center text-xs font-medium text-text-subtle"
                title={task.assignedUser.name}
              >
                {task.assignedUser.name[0].toUpperCase()}
              </div>
              {!isMinimal && (
                <span className="text-xs text-text-subtle font-medium group-hover:text-text transition-colors">
                  {task.assignedUser.name.split(' ')[0]}
                </span>
              )}
            </div>
          )}

          {task.source === 'github' && !isMinimal && (
            <div className="flex items-center gap-1 text-text-subtle ml-1">
              <GitBranch size={13} className="text-text-subtle" />
            </div>
          )}
        </div>

        {task.status !== TASK_STATUS.DONE && (
          <button
            type="button"
            title={actionLabel}
            aria-label={actionLabel}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(task._id, getNextStatus(task.status));
            }}
            className={`min-h-[36px] text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 border cursor-pointer active:scale-95 ${
              user?.role === USER_ROLES.INTERN &&
              task.status === TASK_STATUS.IN_REVIEW
                ? 'hidden'
                : ''
            } ${
              task.status === TASK_STATUS.TODO
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-background-dark'
                : task.status === TASK_STATUS.IN_PROGRESS
                  ? 'bg-status-warning/10 text-status-warning border-status-warning/30 hover:bg-status-warning hover:text-background-dark'
                  : 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success hover:text-background-dark'
            }`}
          >
            <span>{actionLabel}</span>
            {!isMinimal && (
              <ChevronRight size={13} className="opacity-60 shrink-0" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
