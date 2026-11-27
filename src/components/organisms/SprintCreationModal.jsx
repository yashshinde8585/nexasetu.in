import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Plus } from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '4 weeks', days: 28 },
];

// Modal dialog for creating new sprints
const SprintCreationModal = ({
  show,
  onClose,
  sprintData,
  setSprintData,
  onSubmit,
  isLoading,
  projects = [],
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Compute selected duration in days to highlight corresponding shortcut
  const selectedDurationDays = useMemo(() => {
    if (!sprintData.startDate || !sprintData.endDate) return null;
    try {
      const start = new Date(sprintData.startDate);
      const end = new Date(sprintData.endDate);
      const diffTime = end.getTime() - start.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [sprintData.startDate, sprintData.endDate]);

  if (!show) return null;

  const hasProjects = projects && projects.length > 0;
  const isDateInvalid = Boolean(
    sprintData.startDate &&
      sprintData.endDate &&
      new Date(sprintData.endDate) < new Date(sprintData.startDate)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sprint-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border-subtle rounded-md p-5 sm:p-6 shadow-2xl space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 id="modal-sprint-title" className="text-base font-semibold text-text">
              Create sprint
            </h2>
            <p className="text-xs text-text-subtle mt-0.5">
              Set up a sprint for your project
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 -mr-1 flex items-center justify-center text-text-subtle hover:text-text rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning if no projects exist in the workspace */}
        {!hasProjects ? (
          <div className="bg-status-warning/10 border border-status-warning/20 rounded-md p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-text block">
                  Project required for sprint creation
                </span>
                <p className="text-text-subtle">
                  Sprints in NexaSetu must belong to a project. Create a project first to start scheduling iterations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/project-setup');
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create a project first</span>
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* 1. Sprint Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="sprintName"
                className="text-xs font-semibold text-text flex items-center justify-between"
              >
                <span>
                  Sprint name <span className="text-status-error">*</span>
                </span>
              </label>
              <input
                id="sprintName"
                type="text"
                required
                value={sprintData.name}
                onChange={(e) =>
                  setSprintData({ ...sprintData, name: e.target.value })
                }
                placeholder="e.g. Sprint 1 - Core Features"
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-md px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            {/* 2. Associated Project */}
            <div className="space-y-1.5">
              <label
                htmlFor="sprintProject"
                className="text-xs font-semibold text-text flex items-center justify-between"
              >
                <span>
                  Project <span className="text-status-error">*</span>
                </span>
              </label>
              <select
                id="sprintProject"
                required
                value={sprintData.project || ''}
                onChange={(e) =>
                  setSprintData({ ...sprintData, project: e.target.value })
                }
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-md px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
              >
                <option value="" disabled>
                  Select a project...
                </option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.key ? `(${p.key})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Sprint Goal: Multiline 3 visible rows matching Edit modal */}
            <div className="space-y-1.5">
              <label
                htmlFor="sprintGoal"
                className="text-xs font-semibold text-text flex items-center justify-between"
              >
                <span>Sprint goal</span>
                <span className="text-[11px] font-normal text-text-subtler">Optional</span>
              </label>
              <textarea
                id="sprintGoal"
                rows={3}
                value={sprintData.goal || ''}
                onChange={(e) =>
                  setSprintData({ ...sprintData, goal: e.target.value })
                }
                placeholder="What should this sprint achieve?"
                className="w-full min-h-[76px] bg-background-elevated border border-border-subtle rounded-md p-2.5 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* 4. Sprint Duration Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-text block">
                Sprint duration
              </span>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(({ label, days }) => {
                  const isSelected = selectedDurationDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        const start = sprintData.startDate
                          ? new Date(sprintData.startDate)
                          : new Date();
                        const end = new Date(
                          start.getTime() + days * 24 * 60 * 60 * 1000
                        );
                        setSprintData({
                          ...sprintData,
                          endDate: end.toISOString().split('T')[0],
                        });
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                          : 'bg-background-elevated/40 hover:bg-background-elevated border-border-subtle text-text'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 & 6. Date Range: Start and End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="startDate"
                  className="text-xs font-semibold text-text"
                >
                  Start date <span className="text-status-error">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={sprintData.startDate}
                  onChange={(e) =>
                    setSprintData({ ...sprintData, startDate: e.target.value })
                  }
                  className="w-full h-9 bg-background-elevated border border-border-subtle rounded-md px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="endDate"
                  className="text-xs font-semibold text-text"
                >
                  End date <span className="text-status-error">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  value={sprintData.endDate}
                  onChange={(e) =>
                    setSprintData({ ...sprintData, endDate: e.target.value })
                  }
                  aria-invalid={isDateInvalid}
                  aria-describedby={isDateInvalid ? 'create-date-error' : undefined}
                  className={`w-full h-9 bg-background-elevated border rounded-md px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors ${
                    isDateInvalid ? 'border-status-error' : 'border-border-subtle'
                  }`}
                />
              </div>
            </div>

            {isDateInvalid && (
              <p id="create-date-error" className="text-xs text-status-error font-medium">
                End date must be on or after the start date.
              </p>
            )}

            {/* 7. Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-9 px-4 rounded-md border border-border-subtle hover:bg-background-elevated text-xs font-semibold text-text transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !sprintData.name?.trim() ||
                  !sprintData.project ||
                  isDateInvalid
                }
                className="h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create sprint'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

SprintCreationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sprintData: PropTypes.shape({
    name: PropTypes.string,
    project: PropTypes.string,
    goal: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  setSprintData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      key: PropTypes.string,
    })
  ),
};

export default SprintCreationModal;
