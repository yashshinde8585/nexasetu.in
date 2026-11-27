import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '4 weeks', days: 28 },
];

const SprintEditModal = ({ show, onClose, sprint, onUpdate, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const handleSave = onUpdate || onSubmit;

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name || '',
        goal: sprint.goal || '',
        description: sprint.description || '',
        startDate: sprint.startDate
          ? new Date(sprint.startDate).toISOString().split('T')[0]
          : '',
        endDate: sprint.endDate
          ? new Date(sprint.endDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [sprint]);

  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Compute selected duration in days to highlight corresponding shortcut
  const selectedDurationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [formData.startDate, formData.endDate]);

  if (!show || !sprint) return null;

  const isDateInvalid =
    Boolean(formData.startDate &&
    formData.endDate &&
    new Date(formData.endDate) < new Date(formData.startDate));

  const setDurationDays = (days) => {
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      endDate: end.toISOString().split('T')[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDateInvalid || !formData.name?.trim()) return;
    if (handleSave) {
      handleSave(formData);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-sprint-title"
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
            <h2
              id="modal-edit-sprint-title"
              className="text-base font-semibold text-text"
            >
              Edit sprint
            </h2>
            <p className="text-xs text-text-subtle mt-0.5">
              Update sprint details and schedule
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sprint Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="editSprintName"
              className="text-xs font-semibold text-text flex items-center justify-between"
            >
              <span>
                Sprint name <span className="text-status-error">*</span>
              </span>
            </label>
            <input
              id="editSprintName"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Sprint 2 - Scale"
              className="w-full h-9 bg-background-elevated border border-border-subtle rounded-md px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          {/* Sprint Goal: Multiline 3 visible rows with natural wrapping */}
          <div className="space-y-1.5">
            <label
              htmlFor="editSprintGoal"
              className="text-xs font-semibold text-text flex items-center justify-between"
            >
              <span>Sprint goal</span>
              <span className="text-[11px] font-normal text-text-subtler">Optional</span>
            </label>
            <textarea
              id="editSprintGoal"
              rows={3}
              value={formData.goal}
              onChange={(e) =>
                setFormData({ ...formData, goal: e.target.value })
              }
              placeholder="What should this sprint achieve?"
              className="w-full min-h-[76px] bg-background-elevated border border-border-subtle rounded-md p-2.5 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Sprint Duration Shortcuts */}
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
                    onClick={() => setDurationDays(days)}
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

          {/* Date Range: Start and End Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="editStartDate"
                className="text-xs font-semibold text-text"
              >
                Start date <span className="text-status-error">*</span>
              </label>
              <input
                id="editStartDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-md px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="editEndDate"
                className="text-xs font-semibold text-text"
              >
                End date <span className="text-status-error">*</span>
              </label>
              <input
                id="editEndDate"
                type="date"
                required
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                aria-invalid={isDateInvalid}
                aria-describedby={isDateInvalid ? 'edit-date-error' : undefined}
                className={`w-full h-9 bg-background-elevated border rounded-md px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors ${
                  isDateInvalid ? 'border-status-error' : 'border-border-subtle'
                }`}
              />
            </div>
          </div>

          {isDateInvalid && (
            <p id="edit-date-error" className="text-xs text-status-error font-medium">
              End date must be on or after the start date.
            </p>
          )}

          {/* Actions */}
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
              disabled={isLoading || isDateInvalid || !formData.name?.trim()}
              className="h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SprintEditModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sprint: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    goal: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  onUpdate: PropTypes.func,
  onSubmit: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default SprintEditModal;
