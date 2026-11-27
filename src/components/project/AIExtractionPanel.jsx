import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Cpu,
  Check,
  X as DiscardIcon,
  Sparkles,
  RefreshCw,
  UserPlus,
  Layers,
  Zap,
  Clock,
  Type,
  Activity,
  Calendar,
  Minus,
  Plus,
  Paperclip,
  FileIcon,
  Loader2,
  X,
} from 'lucide-react';
import StorageService from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import Button from '../atoms/Button';

import { TASK_TYPE } from '../../constants';

const AIExtractionPanel = ({
  aiInput,
  setAiInput,
  handleAiExtract,
  isAiProcessing,
  aiSuggestion,
  setAiSuggestion,
  handleCreateTask,
  project,
  sprints,
  onCancel,
  isCreatingTask = false,
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
          project?._id || 'global',
          'ai-extract'
        )
      );

      const results = await Promise.all(uploadPromises);
      setAiSuggestion((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...results],
      }));
    } catch (err) {
      alert('Failed to upload one or more files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAiSuggestion((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      className={`grid grid-cols-1 ${aiSuggestion ? 'xl:grid-cols-[400px_1fr] gap-6' : 'max-w-4xl mx-auto'} items-start animate-in fade-in slide-in-from-top-4 duration-500`}
    >
      {/* AI Task Generator (Input Section) */}
      <div
        className={`bg-card p-6 rounded-xl border border-border-subtle transition-all ${aiSuggestion ? 'sticky top-6' : ''}`}
      >
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-subtle">
          <Sparkles size={16} className="text-secondary" />
          <h3 className="text-xs font-semibold text-text">
            Describe your task to auto-generate details
          </h3>
        </div>

        <div className="space-y-4">
          <textarea
            className="w-full bg-background-elevated border border-border-subtle text-xs text-text px-4 py-3 rounded-xl focus:border-primary focus:outline-none placeholder:text-text-subtle transition-colors leading-relaxed min-h-[180px]"
            placeholder="e.g., 'Optimize authentication middleware to validate JWT expiry and refresh tokens cleanly...'"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <div className="flex items-center gap-2 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-10 px-4 text-xs font-medium rounded-lg border border-border-subtle text-text hover:bg-background-elevated transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <Button
              onClick={handleAiExtract}
              disabled={isAiProcessing || !aiInput.trim()}
              variant="primary"
              className="flex-1 h-10 text-xs font-semibold bg-primary text-background-dark border-none hover:bg-primary/90 transition-colors"
            >
              {isAiProcessing ? (
                <RefreshCw size={14} className="animate-spin mr-2" />
              ) : (
                <Sparkles size={14} className="mr-2 text-background-dark" />
              )}
              {isAiProcessing
                ? 'Generating task...'
                : 'Generate task details'}
            </Button>
          </div>
        </div>
      </div>

      {/* Suggested Task Details */}
      {aiSuggestion && (
        <div className="bg-card p-6 rounded-xl border border-border-subtle transition-all animate-in fade-in duration-300 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="text-xs font-semibold text-text">
                AI task recommendation
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {/* Identity (Title & Priority) */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_160px] gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-subtle">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  value={aiSuggestion.title}
                  onChange={(e) =>
                    setAiSuggestion({ ...aiSuggestion, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-subtle">
                  Type
                </label>
                <select
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors cursor-pointer capitalize"
                  value={aiSuggestion.type || TASK_TYPE.TASK}
                  onChange={(e) =>
                    setAiSuggestion({ ...aiSuggestion, type: e.target.value })
                  }
                >
                  <option value={TASK_TYPE.EPIC} className="bg-card text-text">
                    Epic
                  </option>
                  <option value={TASK_TYPE.STORY} className="bg-card text-text">
                    Story
                  </option>
                  <option value={TASK_TYPE.TASK} className="bg-card text-text">
                    Task
                  </option>
                  <option value={TASK_TYPE.BUG} className="bg-card text-text">
                    Bug
                  </option>
                  <option value={TASK_TYPE.SPIKE} className="bg-card text-text">
                    Spike
                  </option>
                  <option value={TASK_TYPE.TECH_DEBT} className="bg-card text-text">
                    Tech Debt
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-subtle">
                  Priority
                </label>
                <select
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors cursor-pointer"
                  value={aiSuggestion.priority || 'medium'}
                  onChange={(e) =>
                    setAiSuggestion({
                      ...aiSuggestion,
                      priority: e.target.value,
                    })
                  }
                >
                  <option value="low" className="bg-card text-text">
                    Low (P4)
                  </option>
                  <option value="medium" className="bg-card text-text">
                    Medium (P3)
                  </option>
                  <option value="high" className="bg-card text-text">
                    High (P2)
                  </option>
                  <option value="urgent" className="bg-card text-text">
                    Urgent (P1)
                  </option>
                </select>
              </div>
            </div>

            {/* Context (Description) */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-subtle">
                Task Description
              </label>
              <textarea
                className="w-full bg-background-elevated border border-border-subtle text-xs text-text px-3.5 py-2.5 rounded-lg focus:border-primary focus:outline-none transition-colors h-[120px] resize-none leading-relaxed"
                value={aiSuggestion.description}
                onChange={(e) =>
                  setAiSuggestion({
                    ...aiSuggestion,
                    description: e.target.value,
                  })
                }
              />
            </div>

            {/* Logistics (Assignee, Sprint, Duration, Start Date) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
                  <UserPlus size={12} className="text-text-subtle" /> Assignee
                </label>
                <select
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3 py-2 rounded-lg focus:border-primary transition-colors outline-none cursor-pointer"
                  value={aiSuggestion.assignedUser || ''}
                  onChange={(e) =>
                    setAiSuggestion({
                      ...aiSuggestion,
                      assignedUser: e.target.value,
                    })
                  }
                >
                  <option value="" className="bg-card text-text">
                    Unassigned
                  </option>
                  {project?.members
                    ?.filter((m) => m.role !== 'WORKSPACE_ADMIN')
                    .map((m) => (
                      <option
                        key={m._id}
                        value={m._id}
                        className="bg-card text-text"
                      >
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
                  <Layers size={12} className="text-text-subtle" /> Sprint
                </label>
                <select
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3 py-2 rounded-lg focus:border-primary transition-colors outline-none cursor-pointer"
                  value={aiSuggestion.sprint || ''}
                  onChange={(e) =>
                    setAiSuggestion({ ...aiSuggestion, sprint: e.target.value })
                  }
                >
                  <option value="" className="bg-card text-text">
                    Backlog
                  </option>
                  {(sprints || []).map((s) => (
                    <option key={s._id} value={s._id} className="bg-card text-text">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
                  <Clock size={12} className="text-text-subtle" /> Duration
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-background-elevated rounded-lg border border-border-subtle h-[38px] overflow-hidden flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        setAiSuggestion({
                          ...aiSuggestion,
                          estimatedDuration: Math.max(
                            0,
                            (aiSuggestion.estimatedDuration || 0) - 5
                          ),
                        })
                      }
                      className="w-8 h-full flex items-center justify-center text-text-subtle hover:text-text transition-colors border-r border-border-subtle"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      className="bg-transparent text-xs font-medium text-text text-center w-full focus:outline-none"
                      value={aiSuggestion.estimatedDuration || 30}
                      onChange={(e) =>
                        setAiSuggestion({
                          ...aiSuggestion,
                          estimatedDuration: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAiSuggestion({
                          ...aiSuggestion,
                          estimatedDuration:
                            (aiSuggestion.estimatedDuration || 0) + 5,
                        })
                      }
                      className="w-8 h-full flex items-center justify-center text-text-subtle hover:text-text transition-colors border-l border-border-subtle"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const u = ['minutes', 'hours', 'days'];
                      setAiSuggestion({
                        ...aiSuggestion,
                        durationUnit:
                          u[
                            (u.indexOf(aiSuggestion.durationUnit || 'minutes') +
                              1) %
                              3
                          ],
                      });
                    }}
                    className="px-3 h-[38px] bg-background-elevated border border-border-subtle rounded-lg text-xs font-medium text-text-subtle transition-colors hover:bg-card"
                  >
                    {aiSuggestion.durationUnit === 'minutes'
                      ? 'min'
                      : aiSuggestion.durationUnit || 'min'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
                  <Calendar size={12} className="text-text-subtle" /> Start Date
                </label>
                <DatePicker
                  selected={
                    aiSuggestion.startDate
                      ? new Date(aiSuggestion.startDate)
                      : new Date()
                  }
                  onChange={(date) =>
                    setAiSuggestion({ ...aiSuggestion, startDate: date })
                  }
                  className="w-full bg-background-elevated border border-border-subtle text-xs font-medium text-text px-3 py-2 rounded-lg focus:border-primary transition-colors outline-none"
                  placeholderText="Select start date"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            </div>
          </div>

          {/* AI Attachment Extension */}
          <div className="space-y-2 pt-3 border-t border-border-subtle">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
              <Paperclip size={12} className="text-primary" /> Attachments
            </label>

            <div className="flex flex-wrap gap-2">
              {aiSuggestion.attachments?.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-background-elevated border border-border-subtle px-2.5 py-1 rounded-lg group transition-colors"
                >
                  <FileIcon size={12} className="text-primary" />
                  <span className="text-xs text-text-subtle truncate max-w-[140px]">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border-subtle rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}
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

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-5 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setAiSuggestion(null);
                if (onCancel) onCancel();
              }}
              className="w-full sm:w-auto h-10 px-5 text-xs font-medium rounded-lg border border-border-subtle text-text hover:bg-background-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              onClick={() => handleCreateTask(aiSuggestion)}
              disabled={isCreatingTask}
              variant="primary"
              className="w-full sm:w-auto h-10 px-6 text-xs font-semibold bg-primary text-background-dark border-none hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              {isCreatingTask ? 'Creating task...' : 'Create task'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExtractionPanel;
