import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  User,
  Hash,
  ChevronDown,
} from 'lucide-react';
import { TASK_STATUS } from '../../constants';

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13];

const SprintBacklogTab = ({
  sprint,
  tasks = [],
  backlog = [],
  onAddTaskToSprint,
  onRemoveTaskFromSprint,
  onUpdatePoints,
  onCreateQuickTask,
  aiPlan,
  aiPlanLoading,
  canManage,
  onTaskClick,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeBacklog = Array.isArray(backlog) ? backlog : [];

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newType, setNewType] = useState('task');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks in sprint backlog
  const filteredSprintTasks = useMemo(() => {
    return safeTasks.filter((t) => {
      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.taskNumber?.toString().includes(search);
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchPriority =
        filterPriority === 'ALL' ||
        t.priority?.toLowerCase() === filterPriority.toLowerCase();
      return matchSearch && matchType && matchPriority;
    });
  }, [safeTasks, search, filterType, filterPriority]);

  // Filter project backlog items
  const filteredBacklogTasks = useMemo(() => {
    return safeBacklog.filter((t) => {
      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.taskNumber?.toString().includes(search);
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchPriority =
        filterPriority === 'ALL' ||
        t.priority?.toLowerCase() === filterPriority.toLowerCase();
      return matchSearch && matchType && matchPriority;
    });
  }, [backlog, search, filterType, filterPriority]);

  const totalSprintPoints = useMemo(() => {
    return safeTasks.reduce(
      (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
      0
    );
  }, [safeTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateQuickTask({
        title: newTaskTitle.trim(),
        project: sprint?.project?._id || sprint?.project,
        sprint: sprint?._id || sprint?.id,
        type: newType,
        storyPoints: newTaskPoints ? parseInt(newTaskPoints, 10) : null,
      });
      setNewTaskTitle('');
      setNewTaskPoints('');
      setShowCreateInline(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'bug':
        return 'bg-status-error/10 border-status-error/30 text-status-error';
      case 'epic':
        return 'bg-secondary/10 border-secondary/30 text-secondary';
      case 'story':
        return 'bg-status-success/10 border-status-success/30 text-status-success';
      case 'spike':
        return 'bg-primary/10 border-primary/30 text-primary';
      default:
        return 'bg-background-elevated border-border-subtle text-text-subtle';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    switch (p) {
      case 'urgent':
      case 'high':
        return 'text-status-error';
      case 'medium':
        return 'text-status-warning';
      case 'low':
      default:
        return 'text-status-success';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. AI Sprint Planning Banner */}
      {aiPlan && (
        <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">
                  AI Sprint Planning Assistant
                </h3>
                <span className="text-[11px] text-text-subtle">
                  Contextual recommendations based on backlog estimation and capacity
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-text-subtle">
              {aiPlan.totalPoints} points committed
            </span>
          </div>

          {aiPlan.recommendedGoal && !sprint?.goal && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-xs text-text space-y-1">
              <span className="font-semibold text-primary block">
                Suggested Sprint Goal:
              </span>
              <p className="text-text-subtle">{aiPlan.recommendedGoal}</p>
            </div>
          )}

          {aiPlan.suggestions && aiPlan.suggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {aiPlan.suggestions.map((sugg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-md border text-xs space-y-1 ${
                    sugg.severity === 'critical'
                      ? 'bg-status-error/5 border-status-error/20'
                      : sugg.severity === 'warning'
                      ? 'bg-status-warning/5 border-status-warning/20'
                      : 'bg-background-elevated/40 border-border-subtle'
                  }`}
                >
                  <span
                    className={`font-semibold block ${
                      sugg.severity === 'critical'
                        ? 'text-status-error'
                        : sugg.severity === 'warning'
                        ? 'text-status-warning'
                        : 'text-text'
                    }`}
                  >
                    {sugg.title}
                  </span>
                  <p className="text-text-subtle text-[11px]">
                    {sugg.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border-subtle rounded-md p-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtler"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search backlog items..."
              className="w-full h-8 pl-8 pr-3 bg-background border border-border-subtle rounded-xs text-xs text-text placeholder:text-text-subtler focus:border-primary/50 outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border-subtle rounded-xs text-xs text-text focus:border-primary/50 outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="story">Story</option>
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="epic">Epic</option>
            <option value="spike">Spike</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border-subtle rounded-xs text-xs text-text focus:border-primary/50 outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateInline(!showCreateInline)}
            className="h-8 px-3 bg-primary hover:bg-primary-hover text-white rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Create Task in Sprint</span>
          </button>
        )}
      </div>

      {/* 3. Inline Task Creation Form */}
      {showCreateInline && (
        <form
          onSubmit={handleCreateTask}
          className="bg-card border border-primary/30 rounded-md p-4 space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-xs font-bold text-text">
              Quick Create Task in {sprint?.name}
            </span>
            <button
              type="button"
              onClick={() => setShowCreateInline(false)}
              className="text-text-subtle hover:text-text text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title (e.g. Implement user authentication flow)"
                className="w-full h-8 px-3 bg-background border border-border-subtle rounded-xs text-xs text-text placeholder:text-text-subtler focus:border-primary/50 outline-none"
              />
            </div>

            <div>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full h-8 px-2.5 bg-background border border-border-subtle rounded-xs text-xs text-text focus:border-primary/50 outline-none"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="spike">Spike</option>
              </select>
            </div>

            <div className="flex gap-2">
              <select
                value={newTaskPoints}
                onChange={(e) => setNewTaskPoints(e.target.value)}
                className="w-full h-8 px-2 bg-background border border-border-subtle rounded-xs text-xs text-text focus:border-primary/50 outline-none"
              >
                <option value="">Estimate (pts)...</option>
                {FIBONACCI_POINTS.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt} {pt === 1 ? 'pt' : 'pts'}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSubmitting || !newTaskTitle.trim()}
                className="h-8 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4. Section A: Sprint Backlog */}
      <div className="bg-card border border-border-subtle rounded-md overflow-hidden space-y-0">
        <div className="p-3 sm:p-4 bg-background-elevated/60 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-text">Sprint Backlog</h3>
            <span className="text-xs font-semibold text-text-subtle px-2 py-0.5 bg-background border border-border-subtle rounded">
              {filteredSprintTasks.length} tasks
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-subtle font-medium">
              Committed Points:
            </span>
            <span className="font-bold text-primary font-mono text-sm">
              {totalSprintPoints} pts
            </span>
          </div>
        </div>

        {filteredSprintTasks.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {filteredSprintTasks.map((task) => (
              <div
                key={task._id}
                className="p-3 hover:bg-background-elevated/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Task Key */}
                  <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded shrink-0">
                    {task.project?.key ? `${task.project.key}-${task.taskNumber || '1'}` : `#${task.taskNumber || '1'}`}
                  </span>

                  {/* Type Badge */}
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize shrink-0 ${getTypeBadgeClass(
                      task.type
                    )}`}
                  >
                    {task.type || 'task'}
                  </span>

                  {/* Title */}
                  <span
                    onClick={() => onTaskClick?.(task)}
                    className="font-medium text-text hover:text-primary transition-colors cursor-pointer truncate"
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {/* Priority */}
                  <span
                    className={`text-[11px] font-medium capitalize ${getPriorityBadgeClass(
                      task.priority
                    )}`}
                  >
                    {task.priority || 'medium'}
                  </span>

                  {/* Assignee */}
                  <div className="flex items-center gap-1.5 min-w-[100px]">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                      {task.assignedUser?.name
                        ? task.assignedUser.name.charAt(0).toUpperCase()
                        : '?'}
                    </div>
                    <span className="text-[11px] text-text-subtle truncate max-w-[90px]">
                      {task.assignedUser?.name || 'Unassigned'}
                    </span>
                  </div>

                  {/* Story Points Selector (Fibonacci) */}
                  <div className="flex items-center gap-1">
                    <select
                      value={task.storyPoints ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        onUpdatePoints(task._id, val);
                      }}
                      disabled={!canManage}
                      className="h-7 px-1.5 bg-background border border-border-subtle rounded-xs text-[11px] font-mono text-text focus:border-primary/50 outline-none cursor-pointer"
                      title="Story Points (Fibonacci)"
                    >
                      <option value="">- pts</option>
                      {FIBONACCI_POINTS.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt} pts
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove Action */}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onRemoveTaskFromSprint(task._id)}
                      className="w-7 h-7 flex items-center justify-center text-text-subtler hover:text-status-error hover:bg-status-error/10 rounded transition-colors cursor-pointer"
                      title="Move back to Product Backlog"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-subtle space-y-1">
            <p className="font-semibold text-text">No tasks in this sprint</p>
            <p>Add existing items from the Project Backlog below to commit work.</p>
          </div>
        )}
      </div>

      {/* 5. Section B: Project Backlog (Eligible work items to pull into sprint) */}
      <div className="bg-card border border-border-subtle rounded-md overflow-hidden space-y-0">
        <div className="p-3 sm:p-4 bg-background-elevated/60 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-secondary" />
            <h3 className="text-sm font-bold text-text">
              Project Backlog (Unscheduled Work)
            </h3>
            <span className="text-xs font-semibold text-text-subtle px-2 py-0.5 bg-background border border-border-subtle rounded">
              {filteredBacklogTasks.length} items
            </span>
          </div>
        </div>

        {filteredBacklogTasks.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {filteredBacklogTasks.map((task) => (
              <div
                key={task._id}
                className="p-3 hover:bg-background-elevated/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-[11px] font-semibold text-text-subtle bg-background-elevated border border-border-subtle px-1.5 py-0.5 rounded shrink-0">
                    {task.project?.key ? `${task.project.key}-${task.taskNumber || '1'}` : `#${task.taskNumber || '1'}`}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize shrink-0 ${getTypeBadgeClass(
                      task.type
                    )}`}
                  >
                    {task.type || 'task'}
                  </span>

                  <span
                    onClick={() => onTaskClick?.(task)}
                    className="font-medium text-text hover:text-primary transition-colors cursor-pointer truncate"
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`text-[11px] font-medium capitalize ${getPriorityBadgeClass(
                      task.priority
                    )}`}
                  >
                    {task.priority || 'medium'}
                  </span>

                  <div className="flex items-center gap-1.5 min-w-[100px]">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                      {task.assignedUser?.name
                        ? task.assignedUser.name.charAt(0).toUpperCase()
                        : '?'}
                    </div>
                    <span className="text-[11px] text-text-subtle truncate max-w-[90px]">
                      {task.assignedUser?.name || 'Unassigned'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-subtler">
                    {task.storyPoints ? `${task.storyPoints} pts` : '-'}
                  </span>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onAddTaskToSprint([task._id])}
                      className="px-2.5 py-1 bg-background hover:bg-primary hover:text-white border border-border-subtle hover:border-primary rounded-xs text-xs font-semibold text-text transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Add to Sprint</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-subtle">
            No backlog items found for this project.
          </div>
        )}
      </div>
    </div>
  );
};

SprintBacklogTab.propTypes = {
  sprint: PropTypes.object,
  tasks: PropTypes.array,
  backlog: PropTypes.array,
  onAddTaskToSprint: PropTypes.func.isRequired,
  onRemoveTaskFromSprint: PropTypes.func.isRequired,
  onUpdatePoints: PropTypes.func.isRequired,
  onCreateQuickTask: PropTypes.func.isRequired,
  aiPlan: PropTypes.object,
  aiPlanLoading: PropTypes.bool,
  canManage: PropTypes.bool,
  onTaskClick: PropTypes.func,
};

export default SprintBacklogTab;
