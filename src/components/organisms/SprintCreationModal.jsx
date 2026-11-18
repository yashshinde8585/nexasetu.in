import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Rocket, AlertTriangle, Plus } from 'lucide-react';

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

  if (!show) return null;

  const hasProjects = projects && projects.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border-subtle rounded-md p-6 sm:p-7 shadow-2xl space-y-6 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Rocket size={15} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">
                Create new sprint
              </h2>
              <p className="text-xs text-text-subtle">
                Define the sprint cycle name, project association, and time window
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-text-subtle hover:text-text rounded-xs transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create a project first</span>
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Sprint Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="sprintName"
                className="text-xs font-semibold text-text-subtle flex items-center justify-between"
              >
                <span>
                  Sprint Name <span className="text-status-error">*</span>
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
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            {/* Select Associated Project */}
            <div className="space-y-1.5">
              <label
                htmlFor="sprintProject"
                className="text-xs font-semibold text-text-subtle flex items-center justify-between"
              >
                <span>
                  Associated Project <span className="text-status-error">*</span>
                </span>
              </label>
              <select
                id="sprintProject"
                required
                value={sprintData.project || ''}
                onChange={(e) =>
                  setSprintData({ ...sprintData, project: e.target.value })
                }
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
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

            {/* Date Range: Start and End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="startDate"
                  className="text-xs font-semibold text-text-subtle"
                >
                  Start Date <span className="text-status-error">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={sprintData.startDate}
                  onChange={(e) =>
                    setSprintData({ ...sprintData, startDate: e.target.value })
                  }
                  className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs text-text focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="endDate"
                  className="text-xs font-semibold text-text-subtle"
                >
                  End Date <span className="text-status-error">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  value={sprintData.endDate}
                  onChange={(e) =>
                    setSprintData({ ...sprintData, endDate: e.target.value })
                  }
                  className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs text-text focus:border-primary/50 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-background-elevated hover:bg-card border border-border-subtle text-xs font-semibold text-text rounded-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !sprintData.name?.trim() || !sprintData.project}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
  sprintData: PropTypes.object.isRequired,
  setSprintData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  projects: PropTypes.array,
};

export default SprintCreationModal;
