import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle } from 'lucide-react';

const SprintStartModal = ({
  show,
  onClose,
  sprint,
  tasks = [],
  tasksLoading = false,
  onStart,
  onConfirm,
  isLoading = false,
}) => {
  const handleStart = onConfirm || onStart;

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  const tasksCount = tasks?.length || 0;

  const totalPoints = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    return tasks.reduce(
      (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
      0
    );
  }, [tasks]);

  const unestimatedCount = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    return tasks.filter(
      (t) => t.storyPoints === null || t.storyPoints === undefined || isNaN(t.storyPoints)
    ).length;
  }, [tasks]);

  const storyPointsDisplay = useMemo(() => {
    if (tasksLoading) return 'Calculating...';
    if (tasksCount === 0) return '0 pts';
    if (unestimatedCount === tasksCount) return 'Not estimated';
    return `${totalPoints} pts`;
  }, [tasksLoading, tasksCount, unestimatedCount, totalPoints]);

  const dateWarnings = useMemo(() => {
    if (!sprint) return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (sprint.endDate) {
      const end = new Date(sprint.endDate).getTime();
      if (end < todayStart) {
        const formattedEndDate = new Date(sprint.endDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return {
          title: 'Scheduled end date has passed',
          description: `This sprint was scheduled to end on ${formattedEndDate}. Consider updating the sprint schedule before activation.`,
        };
      }
    }

    if (sprint.startDate) {
      const start = new Date(sprint.startDate).getTime();
      if (start < todayStart) {
        const formattedStartDate = new Date(sprint.startDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return {
          title: 'Scheduled start date has passed',
          description: `This sprint was scheduled to start on ${formattedStartDate}. Starting it now will begin tracking from today.`,
        };
      }
    }

    return null;
  }, [sprint]);

  if (!show || !sprint) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-start-sprint-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border-subtle rounded-md p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border-subtle gap-3">
          <div className="min-w-0 flex-1">
            <h2
              id="modal-start-sprint-title"
              className="text-base font-bold text-text leading-tight"
            >
              Start sprint
            </h2>
            <p className="text-xs text-text-subtle truncate mt-0.5" title={sprint.name}>
              {sprint.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 -mr-1 -mt-1 flex items-center justify-center text-text-subtle hover:text-text rounded-xs transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sprint Summary */}
        <div className="bg-background-elevated/40 border border-border-subtle rounded-md p-3.5 space-y-3">
          {/* Sprint Goal */}
          <div className="text-xs">
            <span className="text-[11px] font-semibold text-text-subtler uppercase tracking-wider block">
              Sprint Goal
            </span>
            <p
              className={`text-xs mt-0.5 break-words ${
                sprint.goal ? 'text-text' : 'text-text-subtle italic'
              }`}
            >
              {sprint.goal || 'No goal set.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-border-subtle/60 text-xs">
            <div>
              <span className="text-[11px] text-text-subtler uppercase tracking-wider font-medium block">
                Committed Tasks
              </span>
              <span className="font-semibold text-text text-sm mt-0.5 block">
                {tasksLoading ? 'Loading...' : `${tasksCount} ${tasksCount === 1 ? 'task' : 'tasks'}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-text-subtler uppercase tracking-wider font-medium block">
                Story Points
              </span>
              <span className="font-semibold text-primary text-sm mt-0.5 block">
                {storyPointsDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Date Warning */}
        {dateWarnings && (
          <div className="bg-status-warning/10 border border-status-warning/20 rounded-md p-3 text-xs flex items-start gap-2.5">
            <AlertCircle size={15} className="text-status-warning shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-status-warning block">
                {dateWarnings.title}
              </span>
              <p className="text-text-subtle text-[11px] leading-relaxed">
                {dateWarnings.description}
              </p>
            </div>
          </div>
        )}

        {/* Unestimated Tasks Notice */}
        {!tasksLoading && unestimatedCount > 0 && tasksCount > 0 && (
          <div className="bg-background-elevated/60 border border-border-subtle rounded-md p-3 text-xs flex items-start gap-2.5">
            <AlertCircle size={14} className="text-text-subtle shrink-0 mt-0.5" />
            <p className="text-text-subtle text-[11px] leading-relaxed">
              {unestimatedCount === tasksCount
                ? 'Tasks do not have story point estimates. Velocity tracking will rely on task counts.'
                : `${unestimatedCount} of ${tasksCount} tasks lack story point estimates.`}
            </p>
          </div>
        )}

        {/* Confirmation Explanation */}
        <p className="text-xs text-text-subtle leading-relaxed">
          Starting this sprint saves its initial task commitment and enables sprint progress tracking.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 sm:h-9 px-3.5 rounded-xs border border-border-subtle hover:bg-background-elevated text-xs font-semibold text-text transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading || tasksLoading}
            className="h-8 sm:h-9 px-4 rounded-xs bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start sprint'}
          </button>
        </div>
      </div>
    </div>
  );
};

SprintStartModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sprint: PropTypes.object,
  tasks: PropTypes.array,
  tasksLoading: PropTypes.bool,
  onStart: PropTypes.func,
  onConfirm: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default SprintStartModal;
