import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import { TASK_STATUS } from '../../constants';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-text-subtler' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'in_review', title: 'In Review', color: 'bg-secondary' },
  { id: 'done', title: 'Done', color: 'bg-status-success' },
];

const SprintBoardTab = ({
  tasks = [],
  onUpdateTaskStatus,
  onTaskClick,
  canManage,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [collapsedCols, setCollapsedCols] = useState({});

  // Unique assignees for filter
  const assignees = useMemo(() => {
    const map = new Map();
    safeTasks.forEach((t) => {
      if (t.assignedUser) {
        map.set(t.assignedUser._id || t.assignedUser.id, t.assignedUser.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [safeTasks]);

  const filteredTasks = useMemo(() => {
    return safeTasks.filter((t) => {
      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.taskNumber?.toString().includes(search);
      const matchPriority =
        filterPriority === 'ALL' ||
        t.priority?.toLowerCase() === filterPriority.toLowerCase();
      const matchAssignee =
        filterAssignee === 'ALL' ||
        (t.assignedUser &&
          (t.assignedUser._id || t.assignedUser.id) === filterAssignee);
      return matchSearch && matchPriority && matchAssignee;
    });
  }, [safeTasks, search, filterPriority, filterAssignee]);

  const groupedTasks = useMemo(() => {
    const groups = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };

    filteredTasks.forEach((t) => {
      const status = (t.status || 'todo').toLowerCase();
      if (status === 'done') {
        groups.done.push(t);
      } else if (status === 'in_review' || status === 'blocked') {
        groups.in_review.push(t);
      } else if (status === 'in_progress') {
        groups.in_progress.push(t);
      } else {
        groups.todo.push(t);
      }
    });

    return groups;
  }, [filteredTasks]);

  const toggleColumn = (colId) => {
    setCollapsedCols((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'todo':
        return 'in_progress';
      case 'in_progress':
        return 'in_review';
      case 'in_review':
      case 'blocked':
        return 'done';
      default:
        return null;
    }
  };

  const getPrevStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'done':
        return 'in_review';
      case 'in_review':
      case 'blocked':
        return 'in_progress';
      case 'in_progress':
        return 'todo';
      default:
        return null;
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border-subtle rounded-md p-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtler"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sprint board..."
              className="w-full h-8 pl-8 pr-3 bg-background border border-border-subtle rounded-xs text-xs text-text placeholder:text-text-subtler focus:border-primary/50 outline-none"
            />
          </div>

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

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border-subtle rounded-xs text-xs text-text focus:border-primary/50 outline-none cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-text-subtle font-medium">
          Showing {filteredTasks.length} of {tasks.length} sprint tasks
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle items-stretch">
          {COLUMNS.map((column) => {
            const colTasks = groupedTasks[column.id] || [];
            const isCollapsed = !!collapsedCols[column.id];

            return (
              <div
                key={column.id}
                className="flex-1 min-w-0 sm:min-w-[240px] flex flex-col h-full bg-card"
              >
                {/* Column Header */}
                <button
                  type="button"
                  onClick={() => toggleColumn(column.id)}
                  className="w-full px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40 sticky top-0 z-20 text-left cursor-pointer sm:cursor-default transition-colors hover:bg-background-elevated/60 sm:hover:bg-background-elevated/40"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                    <h3 className="text-xs sm:text-sm font-semibold text-text truncate">
                      {column.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-background-elevated border border-border-subtle rounded text-xs font-mono font-medium text-text-subtle">
                      {colTasks.length.toString().padStart(2, '0')}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-text-subtle sm:hidden transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Column Cards Container */}
                <div
                  className={`${
                    isCollapsed ? 'hidden sm:block' : 'block'
                  } p-2.5 sm:p-3 space-y-2.5 flex-grow min-h-[140px] lg:min-h-[440px] max-h-none lg:max-h-[720px] lg:overflow-y-auto scrollbar-thin`}
                >
                  {colTasks.length > 0 ? (
                    colTasks.map((task) => {
                      const next = getNextStatus(column.id);
                      const prev = getPrevStatus(column.id);

                      return (
                        <div
                          key={task._id}
                          className="p-3 bg-background border border-border-subtle hover:border-primary/40 rounded-md transition-all shadow-2xs space-y-2.5 group cursor-pointer"
                          onClick={() => onTaskClick?.(task)}
                        >
                          {/* Task Top Meta */}
                          <div className="flex items-center justify-between gap-1.5 text-[11px]">
                            <span className="font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                              {task.project?.key
                                ? `${task.project.key}-${task.taskNumber || '1'}`
                                : `#${task.taskNumber || '1'}`}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.2 rounded border text-[10px] font-medium capitalize ${getTypeBadgeClass(
                                  task.type
                                )}`}
                              >
                                {task.type || 'task'}
                              </span>

                              {typeof task.storyPoints === 'number' && (
                                <span className="font-mono text-[10px] bg-background-elevated border border-border-subtle px-1.5 py-0.5 rounded text-text-subtle">
                                  {task.storyPoints} pts
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-medium text-text group-hover:text-primary transition-colors line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Footer: Assignee & Status Quick Shifters */}
                          <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                                {task.assignedUser?.name
                                  ? task.assignedUser.name.charAt(0).toUpperCase()
                                  : '?'}
                              </div>
                              <span className="text-[11px] text-text-subtle truncate max-w-[80px]">
                                {task.assignedUser?.name || 'Unassigned'}
                              </span>
                            </div>

                            {/* Quick status transitions */}
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {prev && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTaskStatus({
                                      taskId: task._id,
                                      newStatus: prev,
                                      version: task.__v ?? task.version,
                                    })
                                  }
                                  className="p-1 text-text-subtler hover:text-text hover:bg-background-elevated rounded transition-colors cursor-pointer"
                                  title={`Move to ${prev.replace('_', ' ')}`}
                                >
                                  <ArrowLeft size={12} />
                                </button>
                              )}

                              {next && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTaskStatus({
                                      taskId: task._id,
                                      newStatus: next,
                                      version: task.__v ?? task.version,
                                    })
                                  }
                                  className="p-1 text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer flex items-center gap-0.5 text-[11px] font-semibold"
                                  title={`Move to ${next.replace('_', ' ')}`}
                                >
                                  <span>Move</span>
                                  <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-text-subtler text-xs border border-dashed border-border-subtle rounded-md">
                      <span>No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

SprintBoardTab.propTypes = {
  tasks: PropTypes.array,
  onUpdateTaskStatus: PropTypes.func.isRequired,
  onTaskClick: PropTypes.func,
  canManage: PropTypes.bool,
};

export default SprintBoardTab;
