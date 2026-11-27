import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Clock,
  Minus,
  Plus,
  Paperclip,
  X,
  FileIcon,
  Loader2,
} from 'lucide-react';
import StorageService from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

import { TASK_TYPE } from '../../constants';

// A form component for manually creating new tasks with specific titles, sprints, and descriptions.
const TaskForm = ({
  newTask,
  setNewTask,
  handleCreateTask,
  sprints = [],
  onCancel,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) =>
        StorageService.uploadAttachment(
          file,
          user.workspaceId,
          newTask.project || 'global',
          'new'
        )
      );

      const results = await Promise.all(uploadPromises);
      setNewTask((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...results],
      }));
    } catch (err) {
      alert('Failed to upload one or more files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeAttachment = async (index) => {
    const attachment = newTask.attachments[index];
    try {
      setNewTask((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index),
      }));
    } catch (err) {
      console.error('Failed to remove attachment:', err);
    }
  };

  return (
    <div className="bg-card p-5 sm:p-6 rounded-xl mb-6 border border-border-subtle animate-in fade-in duration-200 shadow-sm relative overflow-hidden">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateTask(newTask);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Core Identity */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                Task Title <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-background-elevated border border-border-subtle text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors text-xs font-medium placeholder:text-text-subtle"
                placeholder="e.g., Implement authentication middleware"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                Sprint
              </label>
              <div className="relative">
                <select
                  className="w-full bg-background-elevated border border-border-subtle text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors cursor-pointer text-xs font-medium appearance-none"
                  value={newTask.sprint || ''}
                  onChange={(e) =>
                    setNewTask({ ...newTask, sprint: e.target.value })
                  }
                >
                  <option value="" className="bg-card text-text">
                    No sprint selected (Backlog)
                  </option>
                  {(sprints || []).map((sprint) => (
                    <option
                      key={sprint._id}
                      value={sprint._id}
                      className="bg-card text-text"
                    >
                      {sprint.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle">
                  <div className="w-1.5 h-1.5 border-r border-b border-current rotate-45" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                Task Description
              </label>
              <textarea
                className="w-full bg-background-elevated border border-border-subtle text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors text-xs placeholder:text-text-subtle resize-none leading-relaxed"
                rows="4"
                placeholder="Add a detailed description or acceptance criteria..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>
          </div>

          {/* Right Column: Parameters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                  Task Type
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-background-elevated border border-border-subtle text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors cursor-pointer text-xs font-medium appearance-none capitalize"
                    value={newTask.type || TASK_TYPE.TASK}
                    onChange={(e) =>
                      setNewTask({ ...newTask, type: e.target.value })
                    }
                  >
                    <option
                      value={TASK_TYPE.EPIC}
                      className="bg-card text-text"
                    >
                      Epic
                    </option>
                    <option
                      value={TASK_TYPE.STORY}
                      className="bg-card text-text"
                    >
                      Story
                    </option>
                    <option
                      value={TASK_TYPE.TASK}
                      className="bg-card text-text"
                    >
                      Task
                    </option>
                    <option
                      value={TASK_TYPE.BUG}
                      className="bg-card text-text"
                    >
                      Bug
                    </option>
                    <option
                      value={TASK_TYPE.SPIKE}
                      className="bg-card text-text"
                    >
                      Spike
                    </option>
                    <option
                      value={TASK_TYPE.TECH_DEBT}
                      className="bg-card text-text"
                    >
                      Tech Debt
                    </option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle">
                    <div className="w-1.5 h-1.5 border-r border-b border-current rotate-45" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                  Priority
                </label>
                <div className="relative">
                  <select
                    className={`w-full bg-background-elevated border border-border-subtle px-3.5 py-2.5 rounded-lg focus:outline-none transition-colors cursor-pointer text-xs font-medium appearance-none ${
                      newTask.priority === 'urgent'
                        ? 'text-status-error'
                        : newTask.priority === 'high'
                          ? 'text-status-warning'
                          : newTask.priority === 'low'
                            ? 'text-status-success'
                            : 'text-primary'
                    }`}
                    value={newTask.priority || 'medium'}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                  >
                    <option
                      value="low"
                      className="bg-card text-status-success"
                    >
                      Low (P4)
                    </option>
                    <option
                      value="medium"
                      className="bg-card text-primary"
                    >
                      Medium (P3)
                    </option>
                    <option
                      value="high"
                      className="bg-card text-status-warning"
                    >
                      High (P2)
                    </option>
                    <option
                      value="urgent"
                      className="bg-card text-status-error"
                    >
                      Urgent (P1)
                    </option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle">
                    <div className="w-1.5 h-1.5 border-r border-b border-current rotate-45" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-subtle mb-1.5 ml-0.5">
                  Projected Due Date
                </label>
                <div className="bg-background-elevated border border-border-subtle px-3.5 py-2.5 rounded-lg text-xs font-medium text-primary flex items-center justify-between">
                  <span>
                    {(() => {
                      let mins = newTask.estimatedDuration || 0;
                      if (newTask.durationUnit === 'hours') mins *= 60;
                      if (newTask.durationUnit === 'days') mins *= 1440;
                      const start = newTask.startDate
                        ? new Date(newTask.startDate)
                        : new Date();
                      const deadline = new Date(
                        start.getTime() + mins * 60 * 1000
                      );
                      return deadline.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    })()}
                  </span>
                  <Clock size={12} className="text-text-subtle" />
                </div>
              </div>
            </div>

            <div className="bg-background-elevated border border-border-subtle p-3.5 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-primary" />
                <label className="text-xs font-medium text-text-subtle">
                  Estimated Duration
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-card border border-border-subtle rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setNewTask({
                        ...newTask,
                        estimatedDuration: Math.max(
                          0,
                          (newTask.estimatedDuration || 0) - 5
                        ),
                      })
                    }
                    className="w-8 h-8 flex items-center justify-center text-text-subtle hover:text-text hover:bg-background-elevated transition-colors"
                  >
                    <Minus size={12} />
                  </button>

                  <input
                    type="number"
                    className="bg-transparent text-xs font-semibold text-text text-center w-12 focus:outline-none"
                    value={newTask.estimatedDuration || 30}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        estimatedDuration: parseInt(e.target.value) || 0,
                      })
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setNewTask({
                        ...newTask,
                        estimatedDuration: (newTask.estimatedDuration || 0) + 5,
                      })
                    }
                    className="w-8 h-8 flex items-center justify-center text-text-subtle hover:text-text hover:bg-background-elevated transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="flex bg-card border border-border-subtle rounded-lg overflow-hidden">
                  {['minutes', 'hours', 'days'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() =>
                        setNewTask({ ...newTask, durationUnit: unit })
                      }
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        (newTask.durationUnit || 'minutes') === unit
                          ? 'bg-primary text-background-dark font-semibold'
                          : 'text-text-subtle hover:text-text hover:bg-background-elevated'
                      }`}
                    >
                      {unit === 'minutes' ? 'min' : unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1 items-center overflow-x-auto no-scrollbar">
                {[15, 60, 480].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      if (v === 15)
                        setNewTask({
                          ...newTask,
                          estimatedDuration: 15,
                          durationUnit: 'minutes',
                        });
                      if (v === 60)
                        setNewTask({
                          ...newTask,
                          estimatedDuration: 1,
                          durationUnit: 'hours',
                        });
                      if (v === 480)
                        setNewTask({
                          ...newTask,
                          estimatedDuration: 1,
                          durationUnit: 'days',
                        });
                    }}
                    className="text-xs text-text-subtle hover:text-primary transition-colors px-2 py-0.5 rounded bg-card border border-border-subtle"
                  >
                    {v === 15
                      ? 'Quick fix (15m)'
                      : v === 60
                        ? 'Standard (1h)'
                        : 'Full day (1d)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-text-subtle mb-1 ml-0.5">
                Attachments
              </label>

              <div className="flex flex-wrap gap-2">
                {newTask.attachments?.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-background-elevated border border-border-subtle px-2.5 py-1 rounded-lg group transition-colors"
                  >
                    <FileIcon size={12} className="text-primary" />
                    <span className="text-xs text-text-subtle truncate max-w-[120px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-text-subtle hover:text-status-error transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <label
                  className={`flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border-subtle rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {uploading ? (
                    <Loader2 size={12} className="text-primary animate-spin" />
                  ) : (
                    <Paperclip size={12} className="text-text-subtle" />
                  )}
                  <span className="text-xs font-medium text-text-subtle">
                    {uploading ? 'Uploading...' : 'Attach files'}
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-border-subtle text-text text-xs font-medium hover:bg-background-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !newTask.title?.trim()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-background-dark font-semibold py-2.5 px-6 rounded-lg transition-colors text-xs active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating task...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
