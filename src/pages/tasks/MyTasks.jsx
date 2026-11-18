import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TASK_STATUS } from '../../constants';
import useTasks from '../../hooks/useTasks';
import TaskCard from '../../components/organisms/TaskCard';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import CenteredLoading from '../../components/atoms/CenteredLoading';

const CARDS_PER_PAGE = 16;

// A task management page that allows users to filter, search, and track their assigned or workspace tasks.
const MyTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set the initial filter and scope based on the URL parameters.
  const queryFilter = searchParams.get('filter') || 'active';
  const queryUserId = searchParams.get('userId');
  const queryScope = queryUserId
    ? 'workspace'
    : searchParams.get('scope') || 'personal';

  // Manage task data and logic using a custom hook.
  const {
    tasks,
    loading,
    filter,
    setFilter,
    scope,
    setScope,
    search,
    setSearch,
    handleStatusChange,
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

  // Update the URL parameters whenever the filter or scope changes.
  useEffect(() => {
    setSearchParams({ filter, scope });
  }, [filter, scope, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / CARDS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * CARDS_PER_PAGE;
    return tasks.slice(start, start + CARDS_PER_PAGE);
  }, [tasks, page]);

  if (loading) return <CenteredLoading />;

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6 animate-in fade-in duration-700">
      {/* Page header with the title and description. */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
            {scope === 'personal' ? 'My Tasks' : 'Workspace Tasks'}
          </h1>
          <p className="text-xs sm:text-sm text-text-subtle max-w-xl">
            {scope === 'personal'
              ? 'Manage and track your assigned tasks across all active projects.'
              : 'Overview of all tasks across the entire workspace.'}
          </p>
        </div>

        {/* Buttons to switch between different task scopes. */}
        <div className="flex bg-background-elevated border border-border-subtle rounded-lg p-0.5 shrink-0 h-fit mb-1 gap-1">
          {[
            { id: 'personal', label: 'My Tasks' },
            { id: 'workspace', label: 'Overall Tasks' },
          ].map((s) => (
            <button
              key={s.id}
              className={`rounded-md text-xs font-medium transition-all whitespace-nowrap px-3.5 py-1.5 cursor-pointer ${
                scope === s.id
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-text-subtle hover:text-text hover:bg-card/50'
              }`}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-1 justify-between items-center border-b border-border-subtle pb-4">
        <div className="relative w-full md:w-80 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within:text-primary transition-colors z-10"
            size={15}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-background-elevated border border-border-subtle text-text rounded-lg px-4 pl-9 focus:outline-none focus:border-primary transition-all text-xs placeholder:text-text-subtler"
          />
        </div>

        <div className="flex bg-background-elevated border border-border-subtle rounded-lg p-0.5 shrink-0 overflow-x-auto max-w-full no-scrollbar gap-1 w-full md:w-auto">
          {[
            'active',
            'in_review',
            'completed',
            'due',
            'todo',
            'in_progress',
            'all',
          ].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === f
                  ? 'bg-card text-text border border-border-subtle shadow-sm font-semibold'
                  : 'text-text-subtle hover:text-text hover:bg-card/50 border border-transparent'
              }`}
            >
              {f === 'active'
                ? 'Active'
                : f === 'completed'
                  ? 'Completed'
                  : f === 'due'
                    ? 'Critical Blockers'
                    : f === TASK_STATUS.TODO
                      ? 'To Do'
                      : f === TASK_STATUS.IN_REVIEW
                        ? 'In Review'
                        : f === TASK_STATUS.IN_PROGRESS
                          ? 'In Progress'
                          : 'All Tasks'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of task cards based on the selected filters. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedTasks.length > 0 ? (
          paginatedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onNavigate={() => navigate(`/task/${task._id}`)}
              onStatusChange={handleStatusChange}
              showAssignedUser={scope === 'workspace'}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-card border border-dashed border-border-subtle rounded-xl animate-in zoom-in-95 duration-500">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-90" />
            <h3 className="text-base font-semibold text-text">
              {filter === 'due'
                ? 'No Critical Blockers'
                : filter === 'completed'
                  ? 'No Completed Tasks'
                  : filter === 'in_review'
                    ? 'No Tasks to Review'
                    : filter === 'active'
                      ? 'No Active Tasks'
                      : 'All Clear'}
            </h3>
            <p className="text-text-subtle text-xs mt-1.5 max-w-sm mx-auto">
              {filter === 'due'
                ? 'All your pending items are currently on schedule.'
                : filter === 'completed'
                  ? "You haven't finalized any tasks in this view yet."
                  : filter === 'in_review'
                    ? 'You are all caught up with your team reviews.'
                    : scope === 'personal'
                      ? 'All your personal tasks are fully up to date.'
                      : 'Your workspace is fully synchronized and up to date.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination bar — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <span className="text-xs font-medium text-text-subtle">
            {(page - 1) * CARDS_PER_PAGE + 1}–
            {Math.min(page * CARDS_PER_PAGE, tasks.length)} of {tasks.length}{' '}
            tasks
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-border-subtle bg-background-elevated text-text-subtle hover:text-text disabled:opacity-30 transition-colors cursor-pointer rounded-md"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-text px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-border-subtle bg-background-elevated text-text-subtle hover:text-text disabled:opacity-30 transition-colors cursor-pointer rounded-md"
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
