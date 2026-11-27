import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle2, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react';

const SprintCompletionModal = ({
  show,
  onClose,
  sprint,
  tasks = [],
  availableSprints = [],
  onComplete,
  isLoading,
}) => {
  const [rolloverAction, setRolloverAction] = useState('backlog');
  const [targetSprintId, setTargetSprintId] = useState('');

  // Sprints eligible for rollover (upcoming/planned sprints other than this one)
  const candidateSprints = availableSprints.filter(
    (s) => (s._id || s.id) !== (sprint?._id || sprint?.id) && s.status !== 'completed'
  );

  useEffect(() => {
    if (candidateSprints.length > 0 && !targetSprintId) {
      setTargetSprintId(candidateSprints[0]._id || candidateSprints[0].id);
    }
  }, [candidateSprints, targetSprintId]);

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show || !sprint) return null;

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const incompleteTasks = tasks.filter((t) => t.status !== 'done');

  const completedPoints = completedTasks.reduce(
    (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
    0
  );
  const incompletePoints = incompleteTasks.reduce(
    (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      rolloverAction,
      targetSprintId: rolloverAction === 'sprint' ? targetSprintId : null,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-complete-sprint-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border-subtle rounded-md p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h2
                id="modal-complete-sprint-title"
                className="text-base font-bold text-text"
              >
                Complete {sprint.name}
              </h2>
              <p className="text-xs text-text-subtle">
                Finalize sprint deliverables and handle unfinished work
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 flex items-center justify-center text-text-subtle hover:text-text rounded-xs transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sprint Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-background-elevated/70 border border-border-subtle rounded-md p-3">
            <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-lg font-bold text-status-success mt-1">
              {completedTasks.length}{' '}
              <span className="text-xs font-normal text-text-subtle">
                tasks ({completedPoints} pts)
              </span>
            </div>
          </div>

          <div className="bg-background-elevated/70 border border-border-subtle rounded-md p-3">
            <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
              Incomplete (Rollover)
            </span>
            <div className="text-lg font-bold text-status-warning mt-1">
              {incompleteTasks.length}{' '}
              <span className="text-xs font-normal text-text-subtle">
                tasks ({incompletePoints} pts)
              </span>
            </div>
          </div>
        </div>

        {/* Rollover Options if incomplete tasks exist */}
        {incompleteTasks.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text">
                Where should {incompleteTasks.length} open task
                {incompleteTasks.length > 1 ? 's' : ''} be moved?
              </label>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-md border border-border-subtle bg-background-elevated/40 hover:bg-background-elevated cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="rollover"
                    value="backlog"
                    checked={rolloverAction === 'backlog'}
                    onChange={() => setRolloverAction('backlog')}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-text block">
                      Move to Product Backlog
                    </span>
                    <span className="text-text-subtle">
                      Tasks return to the project backlog for future sprint planning.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-md border border-border-subtle bg-background-elevated/40 hover:bg-background-elevated cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="rollover"
                    value="sprint"
                    checked={rolloverAction === 'sprint'}
                    onChange={() => setRolloverAction('sprint')}
                    disabled={candidateSprints.length === 0}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="text-xs flex-1">
                    <span className="font-semibold text-text block">
                      Move to another Planned Sprint
                    </span>
                    <span className="text-text-subtle block mb-2">
                      Carry forward incomplete items directly into an upcoming sprint.
                    </span>

                    {rolloverAction === 'sprint' && candidateSprints.length > 0 && (
                      <select
                        value={targetSprintId}
                        onChange={(e) => setTargetSprintId(e.target.value)}
                        className="w-full h-8 bg-background border border-border-subtle rounded-xs px-2.5 text-xs text-text focus:border-primary/50 outline-none"
                      >
                        {candidateSprints.map((s) => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.name} ({s.status})
                          </option>
                        ))}
                      </select>
                    )}

                    {candidateSprints.length === 0 && (
                      <span className="text-[11px] text-text-subtler italic">
                        No other planned sprints available. Incomplete tasks will move to backlog.
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-8 sm:h-9 px-4 rounded-xs border border-border-subtle hover:bg-background-elevated text-xs font-semibold text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="h-8 sm:h-9 px-4 rounded-xs bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Completing...' : 'Complete Sprint'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-status-success/10 border border-status-success/20 rounded-md p-3.5 text-xs text-text flex items-center gap-2">
              <CheckCircle2 size={16} className="text-status-success shrink-0" />
              <span>
                All committed tasks in this sprint have been completed! No rollover necessary.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-8 sm:h-9 px-4 rounded-xs border border-border-subtle hover:bg-background-elevated text-xs font-semibold text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onComplete({ rolloverAction: 'backlog' })}
                disabled={isLoading}
                className="h-8 sm:h-9 px-4 rounded-xs bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Completing...' : 'Complete Sprint'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

SprintCompletionModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sprint: PropTypes.object,
  tasks: PropTypes.array,
  availableSprints: PropTypes.array,
  onComplete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default SprintCompletionModal;
