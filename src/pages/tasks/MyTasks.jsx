import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  X,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  Clock,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TASK_STATUS } from '../../constants';
import useTasks from '../../hooks/useTasks';
import TaskCard from '../../components/organisms/TaskCard';
import CenteredLoading from '../../components/atoms/CenteredLoading';

const CARDS_PER_PAGE = 16;

const MyTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL parameters initialization
  const queryFilter = searchParams.get('filter') || 'active';
  const queryUserId = searchParams.get('userId');
  const queryScope = queryUserId
    ? 'workspace'
    : searchParams.get('scope') || 'personal';
  const queryView = searchParams.get('view') || 'grid';

  const [viewMode, setViewMode] = useState(
    queryView === 'list' ? 'list' : 'grid'
  );

  const {
    tasks,
    loading,
    error,
    filter,
    setFilter,
    scope,
    setScope,
    search,
    setSearch,
    handleStatusChange,
    refreshTasks,
  } = useTasks(queryScope, queryFilter, queryUserId);

  const [page, setPage] = useState(1);
  const [prevFilterKey, setPrevFilterKey] = useState(
    `${filter}-${scope}-${search}`
  );

  const currentFilterKey = `${filter}-${scope}-${search}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setPage(1);
  }

  // Synchronize state with URL parameters
  useEffect(() => {
    const params = { filter, scope };
    if (queryUserId) params.userId = queryUserId;
    if (viewMode === 'list') params.view = 'list';
    setSearchParams(params);
  }, [filter, scope, viewMode, queryUserId, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / CARDS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * CARDS_PER_PAGE;
    return tasks.slice(start, start + CARDS_PER_PAGE);
  }, [tasks, page]);

  const getStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.TODO:
        return 'To Do';
      case TASK_STATUS.IN_PROGRESS:
        return 'In Progress';
      case TASK_STATUS.IN_REVIEW:
        return 'In Review';
      case TASK_STATUS.DONE:
        return 'Done';
      default:
        return status ? status.replace('_', ' ') : 'To Do';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case TASK_STATUS.DONE:
        return 'bg-status-success/10 border-status-success/30 text-status-success';
      case TASK_STATUS.IN_REVIEW:
        return 'bg-secondary/10 border-secondary/30 text-secondary';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-status-warning/10 border-status-warning/30 text-status-warning';
      default:
        return 'bg-background-elevated border-border-subtle text-text-subtle';
    }
  };

  const getPriorityStyle = (priority) => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'urgent':
        return { dot: 'bg-status-error', text: 'text-status-error' };
      case 'high':
        return { dot: 'bg-status-warning', text: 'text-status-warning' };
      case 'low':
        return { dot: 'bg-status-success', text: 'text-status-success' };
      default:
        return { dot: 'bg-primary', text: 'text-primary' };
    }
  };

  const formatEffort = (mins) => {
    if (!mins || mins <= 0) return '—';
    if (mins >= 1440) {
      const days = Math.round((mins / 1440) * 10) / 10;
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    if (mins >= 60) {
      const hours = Math.round((mins / 60) * 10) / 10;
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }
    return `${mins}m`;
  };

  const getEmptyStateContent = () => {
    if (search.trim()) {
      return {
        title: 'No tasks match your search',
        message: `No tasks matching "${search}". Try adjusting your search keywords.`,
        action: (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
          >
            Clear search
          </button>
        ),
      };
    }

    switch (filter) {
      case 'due':
        return {
          title: 'No overdue tasks',
          message: 'All active tasks are currently on schedule.',
        };
      case 'active':
        return {
          title: 'No active tasks',
          message:
            scope === 'personal'
              ? "You don't have any active tasks assigned right now."
              : 'No active tasks found in your accessible projects.',
        };
      case 'in_review':
        return {
          title: 'No tasks in review',
          message: 'There are currently no tasks awaiting review.',
        };
      case 'completed':
        return {
          title: 'No completed tasks',
          message: 'No completed tasks found in this view.',
        };
      case 'todo':
        return {
          title: 'No tasks to do',
          message: 'No tasks in the To Do backlog.',
        };
      case 'in_progress':
        return {
          title: 'No tasks in progress',
          message: 'There are no tasks currently in progress.',
        };
      case 'all':
      default:
        return {
          title: scope === 'personal' ? 'No tasks assigned' : 'No tasks found',
          message:
            scope === 'personal'
              ? 'No tasks are assigned to you.'
              : 'No tasks found in your accessible projects.',
        };
    }
  };

  if (loading) return <CenteredLoading />;

  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-16 text-center">
        <div className="bg-card border border-border-subtle rounded-xl p-8 max-w-md mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10 text-status-error mx-auto mb-3" />
          <h2 className="text-base font-semibold text-text mb-1">
            Couldn't load tasks
          </h2>
          <p className="text-xs text-text-subtle mb-4">
            {error || 'An unexpected error occurred while fetching your tasks.'}
          </p>
          <button
            type="button"
            onClick={() => refreshTasks()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const emptyState = getEmptyStateContent();

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-5 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex justify-between items-start sm:items-end gap-4 flex-wrap pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            {scope === 'personal' ? 'My Tasks' : 'Workspace Tasks'}
          </h1>
          <p className="text-xs sm:text-sm text-text-subtle max-w-xl">
            {scope === 'personal'
              ? 'Manage and track tasks assigned to you across all projects.'
              : 'View and track all tasks across your accessible workspace projects.'}
          </p>
        </div>

        {/* Scope Switcher: My Tasks vs Workspace Tasks */}
        <div className="flex bg-background-elevated border border-border-subtle rounded-lg p-0.5 shrink-0 gap-1">
          {[
            { id: 'personal', label: 'My Tasks' },
            { id: 'workspace', label: 'Workspace Tasks' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className={`rounded-md text-xs font-medium transition-all whitespace-nowrap px-3.5 py-1.5 cursor-pointer ${
                scope === s.id
                  ? 'bg-card text-text border border-border-subtle shadow-sm font-semibold'
                  : 'text-text-subtle hover:text-text hover:bg-card/40'
              }`}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Toolbar: Search, Filters, Live Count, View Switcher */}
      <div className="bg-card border border-border-subtle rounded-xl p-3 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-72 group">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search tasks by title or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 md:h-9 bg-background-elevated border border-border-subtle rounded-lg pl-10 pr-9 text-xs sm:text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            aria-label="Search tasks by title or project"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-subtle hover:text-text hover:bg-card rounded-md transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filters Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'active', label: 'Active' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'in_review', label: 'In Review' },
            { id: 'completed', label: 'Completed' },
            { id: 'due', label: 'Overdue' },
            { id: 'all', label: 'All Tasks' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === f.id
                  ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                  : 'text-text-subtle hover:text-text hover:bg-background-elevated border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Task Count & Grid/List View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-border-subtle">
          <span className="text-xs text-text-subtle whitespace-nowrap">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>

          <div className="flex items-center bg-background-elevated border border-border-subtle rounded-lg p-0.5">
            <button
              type="button"
              title="Grid view"
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-card text-text border border-border-subtle shadow-sm'
                  : 'text-text-subtle hover:text-text'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              title="List view"
              aria-label="List view"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-card text-text border border-border-subtle shadow-sm'
                  : 'text-text-subtle hover:text-text'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Results Display */}
      {paginatedTasks.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onNavigate={() => navigate(`/task/${task._id}`)}
                onStatusChange={handleStatusChange}
                showAssignedUser={scope === 'workspace'}
              />
            ))}
          </div>
        ) : (
          /* List / Table View */
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-background-elevated/60">
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Ticket ID
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Task Title
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Project
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Status
                    </th>
                    {scope === 'workspace' && (
                      <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                        Assignee
                      </th>
                    )}
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-subtle">
                      Effort
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs">
                  {paginatedTasks.map((task) => {
                    const ticketId =
                      task.projectKey && task.taskNumber
                        ? `${task.projectKey}-${task.taskNumber}`
                        : task.project?.key && task.taskNumber
                          ? `${task.project.key}-${task.taskNumber}`
                          : task.taskNumber
                            ? `TASK-${task.taskNumber}`
                            : 'TASK';

                    const priorityStyle = getPriorityStyle(task.priority);
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== TASK_STATUS.DONE;

                    return (
                      <tr
                        key={task._id}
                        onClick={() => navigate(`/task/${task._id}`)}
                        className="group hover:bg-background-elevated/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-xs">
                            {ticketId}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-text group-hover:text-primary transition-colors max-w-xs truncate">
                          {task.title}
                        </td>
                        <td className="px-4 py-3 text-text-subtle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <FolderKanban size={13} className="text-text-subtle/80" />
                            <span>{task.project?.name || 'General'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`}
                            />
                            <span
                              className={`font-medium capitalize ${priorityStyle.text}`}
                            >
                              {task.priority || 'Medium'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-medium px-2 py-0.5 rounded border ${getStatusBadgeStyle(task.status)}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        {scope === 'workspace' && (
                          <td className="px-4 py-3 whitespace-nowrap text-text-subtle">
                            {task.assignedUser ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {task.assignedUser.name?.[0]?.toUpperCase() ||
                                    '?'}
                                </div>
                                <span className="text-text font-medium">
                                  {task.assignedUser.name}
                                </span>
                              </div>
                            ) : (
                              'Unassigned'
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              isOverdue ? 'text-status-error' : 'text-text-subtle'
                            }`}
                          >
                            {task.dueDate ? (
                              isOverdue ? (
                                `Overdue • ${new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}`
                              ) : (
                                new Date(task.dueDate).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )
                              )
                            ) : (
                              'No due date'
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-subtle font-medium">
                          {formatEffort(task.estimatedDuration)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-card border border-dashed border-border-subtle rounded-xl">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-80" />
          <h2 className="text-base font-semibold text-text">
            {emptyState.title}
          </h2>
          <p className="text-text-subtle text-xs mt-1.5 max-w-sm mx-auto">
            {emptyState.message}
          </p>
          {emptyState.action}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-subtle pt-4 text-xs">
          <span className="font-medium text-text-subtle">
            {(page - 1) * CARDS_PER_PAGE + 1}–
            {Math.min(page * CARDS_PER_PAGE, tasks.length)} of {tasks.length}{' '}
            tasks
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-border-subtle bg-background-elevated text-text-subtle hover:text-text disabled:opacity-30 transition-colors cursor-pointer rounded-lg"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-medium text-text px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-border-subtle bg-background-elevated text-text-subtle hover:text-text disabled:opacity-30 transition-colors cursor-pointer rounded-lg"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
