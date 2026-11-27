import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  X as CloseIcon,
  ChevronDown,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjectManagement } from '../../hooks/useProjectManagement';
import { TICKETS_PROJECT_ID, TASK_STATUS } from '../../constants';
import { USER_ROLES } from '../../constants/auth';

// Clean UI Components
import GithubPanel from '../../components/project/GithubPanel';
import AIExtractionPanel from '../../components/project/AIExtractionPanel';
import TaskBoard from '../../components/project/TaskBoard';
import TaskTable from '../../components/project/TaskTable';
import TaskForm from '../../components/project/TaskForm';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import Button from '../../components/atoms/Button';
import { ResilientPage } from '../../components/states';

const ProjectDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  // Core Management Engine
  const {
    project,
    isLoading,
    error,
    ui,
    statusMutation,
    createTaskMutation,
    groupedTasks,
    ai,
    github,
    sprints,
    updateProjectMutation,
    setNewTask,
    newTask,
    queryClient,
    directives,
  } = useProjectManagement(id, user);

  const activeStabilize = directives?.find(
    (d) => d.type === 'STABILIZE' && d.status === 'issued'
  );
  const isManager =
    user?.role === USER_ROLES.TECH_LEAD ||
    user?.role === USER_ROLES.WORKSPACE_ADMIN;
  const isProjectLocked = !!activeStabilize && !isManager;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [cardLayout, setCardLayout] = React.useState('standard');
  const [activeDropdown, setActiveDropdown] = React.useState(null); // 'operator' | 'date' | 'layout' | 'sprint' | 'pagesize' | null

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const DATE_OPTIONS = [
    { value: 'all', label: 'All time' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
  ];

  const getDateStart = (filter) => {
    const now = new Date();
    if (filter === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    if (filter === 'month') {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      return start;
    }
    return null;
  };

  const hasActiveFilters =
    assigneeFilter !== 'all' ||
    dateFilter !== 'all' ||
    searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setAssigneeFilter('all');
    setDateFilter('all');
  };

  const filteredGroupedTasks = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const dateStart = getDateStart(dateFilter);

    const filterFn = (t) => {
      if (term) {
        const matches =
          t.title?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.assignedUser?.name?.toLowerCase().includes(term) ||
          t.taskNumber?.toString().includes(term);
        if (!matches) return false;
      }
      if (assigneeFilter !== 'all') {
        const assignedUserId =
          typeof t.assignedUser === 'object'
            ? t.assignedUser?._id
            : t.assignedUser;
        if (assignedUserId !== assigneeFilter) return false;
      }
      if (dateStart) {
        const createdDate = new Date(t.createdAt);
        if (isNaN(createdDate.getTime()) || createdDate < dateStart)
          return false;
      }
      return true;
    };

    return {
      [TASK_STATUS.TODO]: (groupedTasks[TASK_STATUS.TODO] || []).filter(
        filterFn
      ),
      [TASK_STATUS.IN_PROGRESS]: (
        groupedTasks[TASK_STATUS.IN_PROGRESS] || []
      ).filter(filterFn),
      [TASK_STATUS.IN_REVIEW]: (
        groupedTasks[TASK_STATUS.IN_REVIEW] || []
      ).filter(filterFn),
      [TASK_STATUS.DONE]: (groupedTasks[TASK_STATUS.DONE] || []).filter(
        filterFn
      ),
    };
  }, [groupedTasks, searchTerm, assigneeFilter, dateFilter]);

  const filteredTasks = React.useMemo(() => {
    const allTasks = Object.values(filteredGroupedTasks).flat();

    // Sort strictly by Ticket ID (taskNumber) in descending order
    return [...allTasks].sort((a, b) => {
      const numA = parseInt(a.taskNumber, 10) || 0;
      const numB = parseInt(b.taskNumber, 10) || 0;
      return numB - numA;
    });
  }, [filteredGroupedTasks]);

  const totalTasksCount = React.useMemo(() => {
    return Object.values(groupedTasks).flat().length;
  }, [groupedTasks]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);

  const paginatedTasks = React.useMemo(() => {
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, startIndex, endIndex]);

  const paginatedGroupedTasks = React.useMemo(() => {
    // For Board view, we show all columns but limit total visible tasks if needed.
    // However, usually boards don't paginate well.
    // We'll show the grouped version of paginatedTasks to keep it consistent.
    const result = {
      [TASK_STATUS.TODO]: [],
      [TASK_STATUS.IN_PROGRESS]: [],
      [TASK_STATUS.IN_REVIEW]: [],
      [TASK_STATUS.DONE]: [],
    };

    paginatedTasks.forEach((task) => {
      if (result[task.status]) result[task.status].push(task);
    });

    return result;
  }, [paginatedTasks]);

  // Sync: Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, assigneeFilter, dateFilter]);

  const isTicketView = id === TICKETS_PROJECT_ID;

  const columns = [
    {
      id: TASK_STATUS.TODO,
      title: isTicketView ? 'Open Tickets' : 'To Do',
      color: 'border-status-error text-status-error',
    },
    {
      id: TASK_STATUS.IN_PROGRESS,
      title: 'In Progress',
      color: 'border-status-warning text-status-warning',
    },
    {
      id: TASK_STATUS.IN_REVIEW,
      title: 'In Review',
      color: 'border-secondary text-secondary',
    },
    {
      id: TASK_STATUS.DONE,
      title: isTicketView ? 'Resolved' : 'Done',
      color: 'border-status-success text-status-success',
    },
  ];

  return (
    <ResilientPage
      isLoading={isLoading}
      error={error}
      onRetry={() =>
        queryClient.invalidateQueries({ queryKey: ['project', id] })
      }
    >
      <div className="min-h-screen bg-background text-text px-3 sm:px-4 lg:px-6 py-4">
        <div className="w-full space-y-6 max-w-7xl mx-auto">
          {/* --- Project Restrictions Banner --- */}
          {activeStabilize && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-status-error/15 text-status-error shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-status-error">
                      Project restrictions
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-status-error/15 text-status-error">
                      Project locked
                    </span>
                  </div>
                  <p className="text-xs text-text-subtle mt-0.5">
                    {activeStabilize.title}
                  </p>
                </div>
              </div>
              <div className="bg-card border border-status-error/30 px-3 py-1.5 rounded-lg text-xs font-medium text-status-error">
                New tasks disabled • Only reviews allowed
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-border-subtle">
            <div className="space-y-4 flex-1 w-full">
              {/* Project Title & Context */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                  {project?.name || (isTicketView ? 'Project Tickets' : 'Project Workspace')}
                </h1>
                {project?.key && (
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-primary/10 border border-primary/20 text-primary">
                    {project.key}
                  </span>
                )}
                {project?.category && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-background-elevated border border-border-subtle text-text-subtle capitalize">
                    {project.category}
                  </span>
                )}
              </div>

              {project?.description && (
                <p className="text-xs sm:text-sm text-text-subtle max-w-2xl line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div
                  className="flex flex-col gap-1.5 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-medium text-text-subtle">
                    Active Sprint
                  </span>
                  <button
                    type="button"
                    aria-label="Active sprint selector"
                    disabled={isProjectLocked}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === 'sprint' ? null : 'sprint'
                      )
                    }
                    className={`flex items-center gap-2 bg-card border border-border-subtle px-3 py-1.5 rounded-lg hover:bg-background-elevated text-text transition-colors group ${isProjectLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Calendar size={14} className="text-primary" />
                    <span className="text-xs font-medium text-text">
                      {sprints?.find((s) => s._id === project?.sprint)?.name ||
                        'No sprint'}
                    </span>
                    {!isProjectLocked && (
                      <ChevronDown
                        size={14}
                        className={`text-text-subtle transition-transform ${activeDropdown === 'sprint' ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {activeDropdown === 'sprint' && !isProjectLocked && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border-subtle rounded-xl shadow-xl z-[70] overflow-hidden">
                      <div className="p-1.5 max-h-[260px] overflow-y-auto space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            updateProjectMutation.mutate({ sprint: null });
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            !project?.sprint
                              ? 'bg-primary text-background-dark font-semibold'
                              : 'text-text-subtle hover:bg-background-elevated hover:text-text'
                          }`}
                        >
                          No sprint selected
                        </button>
                        {(sprints || []).map((s) => (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => {
                              updateProjectMutation.mutate({ sprint: s._id });
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              project?.sprint === s._id
                                ? 'bg-primary text-background-dark font-semibold'
                                : 'text-text-subtle hover:bg-background-elevated hover:text-text'
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                type="button"
                aria-label={ui.showAiInput ? 'Close task generator' : isTicketView ? 'Generate tickets with AI' : 'Generate tasks with AI'}
                title={
                  isProjectLocked
                    ? 'Task generation is disabled while project is locked'
                    : ui.showAiInput
                      ? 'Close task generator'
                      : 'Generate tasks from text with AI'
                }
                disabled={isProjectLocked}
                onClick={() => ui.setShowAiInput(!ui.showAiInput)}
                className={`flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${isProjectLocked ? 'opacity-40 cursor-not-allowed' : ''} ${
                  ui.showAiInput
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'bg-card text-text border-border-subtle hover:bg-background-elevated'
                }`}
              >
                {ui.showAiInput ? (
                  <CloseIcon size={14} />
                ) : (
                  <Sparkles size={14} className="text-secondary" />
                )}
                <span>{ui.showAiInput ? 'Close AI' : isTicketView ? 'Generate tickets' : 'Generate tasks'}</span>
              </button>

              <button
                type="button"
                aria-label={ui.showTaskForm ? 'Close new task form' : isTicketView ? 'Create new ticket' : 'Create new task'}
                title={
                  isProjectLocked
                    ? 'Task creation is disabled while project is locked'
                    : ui.showTaskForm
                      ? 'Close new task form'
                      : isTicketView
                        ? 'Create a new ticket'
                        : 'Create a new task'
                }
                disabled={isProjectLocked}
                onClick={() => ui.setShowTaskForm(!ui.showTaskForm)}
                className={`w-full sm:w-auto h-10 sm:h-9 px-4 rounded-lg border font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm ${isProjectLocked ? 'opacity-40 cursor-not-allowed' : ''} ${
                  ui.showTaskForm
                    ? 'bg-status-error/10 text-status-error border-status-error/40 hover:bg-status-error/20'
                    : 'bg-primary text-background-dark border-primary hover:bg-primary/90 font-semibold'
                }`}
              >
                {ui.showTaskForm ? (
                  <CloseIcon size={14} />
                ) : (
                  <Plus size={14} strokeWidth={2.5} />
                )}
                <span>
                  {ui.showTaskForm
                    ? 'Close'
                    : isTicketView
                      ? 'New ticket'
                      : 'New task'}
                </span>
              </button>
            </div>
          </div>

          {/* Dynamic Context Panels */}
          {(ui.showGithubPanel || ui.showAiInput || ui.showTaskForm) && (
            <div className="space-y-6">
              {ui.showGithubPanel && (
                <div>
                  <GithubPanel
                    project={project}
                    githubConnected={github.connected}
                    githubToken={github.token}
                    setGithubToken={github.setToken}
                    handleConnectGithub={github.connect}
                    repos={github.repos}
                    loadingRepos={github.loadingRepos}
                    handleLinkRepo={github.linkRepo}
                    fetchRepos={github.fetchRepos}
                    githubSuggestions={github.suggestions}
                    fetchGithubActivity={github.syncActivity}
                    isFetchingGithub={github.isFetchingActivity}
                    handleApproveGithubTask={(s) => github.approveTasks([s])}
                    handleApproveAllGithubTasks={() =>
                      github.approveTasks(github.suggestions)
                    }
                    setProject={(proj) =>
                      queryClient.setQueryData(['project', id], proj)
                    }
                    setGithubSuggestions={github.setSuggestions}
                  />
                </div>
              )}

              {ui.showAiInput && (
                <div>
                  <AIExtractionPanel
                    aiInput={ai.input}
                    setAiInput={ai.setInput}
                    handleAiExtract={ai.extract}
                    isAiProcessing={ai.processing}
                    aiSuggestion={ai.suggestion}
                    setAiSuggestion={ai.setSuggestion}
                    handleCreateTask={(task) => createTaskMutation.mutate(task)}
                    project={project}
                    sprints={sprints}
                    onCancel={() => ui.setShowAiInput(false)}
                    isCreatingTask={createTaskMutation.isPending}
                  />
                </div>
              )}

              {ui.showTaskForm && (
                <div>
                  <TaskForm
                    sprints={sprints}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    handleCreateTask={(task) => createTaskMutation.mutate(task)}
                    onCancel={() => ui.setShowTaskForm(false)}
                    isLoading={createTaskMutation.isPending}
                  />
                </div>
              )}
            </div>
          )}

          {/* Workspace Task Management */}
          <div className="space-y-4">
            {/* Search and Filters Toolbar */}
            <div className="bg-card border border-border-subtle rounded-xl p-3 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shadow-sm">
              {/* Primary Search Input */}
              <div className="relative flex-1 min-w-0 group">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full h-10 sm:h-9 bg-background-elevated border border-border-subtle rounded-lg pl-10 pr-9 text-xs sm:text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search tasks"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-subtle hover:text-text hover:bg-card rounded-md transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

              {/* Secondary Controls Toolbar */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Filter Task Count Indicator */}
                <div className="hidden lg:flex items-center text-xs text-text-subtle whitespace-nowrap px-1">
                  {hasActiveFilters ? (
                    <span>
                      Showing <strong className="text-text font-semibold">{totalTasks}</strong> of {totalTasksCount}
                    </span>
                  ) : (
                    <span>
                      <strong className="text-text font-semibold">{totalTasks}</strong> {totalTasks === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                {/* Select Assignee */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Select assignee"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === 'operator' ? null : 'operator'
                      )
                    }
                    className={`h-10 sm:h-9 px-3 rounded-lg flex items-center gap-2 border text-xs font-medium transition-colors ${
                      assigneeFilter !== 'all' || activeDropdown === 'operator'
                        ? 'bg-primary/10 text-primary border-primary/40'
                        : 'bg-background-elevated text-text-subtle border-border-subtle hover:text-text hover:bg-card'
                    }`}
                  >
                    <Users size={14} />
                    <span className="hidden sm:inline">
                      {assigneeFilter === 'all'
                        ? 'All members'
                        : assigneeFilter === user?._id
                          ? 'Assigned to me'
                          : 'Assignee'}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-text-subtle transition-transform ${activeDropdown === 'operator' ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {activeDropdown === 'operator' && (
                    <div className="absolute top-full mt-2 right-0 w-48 max-w-[calc(100vw-32px)] bg-card border border-border-subtle rounded-xl shadow-xl z-[60] overflow-hidden">
                      <div className="p-1.5 space-y-1">
                        {[
                          { id: 'all', label: 'All members' },
                          { id: user?._id, label: 'Assigned to me' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setAssigneeFilter(opt.id);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              assigneeFilter === opt.id
                                ? 'bg-primary text-background-dark font-semibold'
                                : 'text-text-subtle hover:bg-background-elevated hover:text-text'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Filter */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Date filter"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === 'date' ? null : 'date'
                      )
                    }
                    className={`h-10 sm:h-9 px-3 rounded-lg flex items-center gap-2 border text-xs font-medium transition-colors ${
                      dateFilter !== 'all' || activeDropdown === 'date'
                        ? 'bg-primary/10 text-primary border-primary/40'
                        : 'bg-background-elevated text-text-subtle border-border-subtle hover:text-text hover:bg-card'
                    }`}
                  >
                    <Calendar size={14} />
                    <span className="hidden sm:inline">
                      {DATE_OPTIONS.find((d) => d.value === dateFilter)?.label ||
                        'All time'}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-text-subtle transition-transform ${activeDropdown === 'date' ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {activeDropdown === 'date' && (
                    <div className="absolute top-full mt-2 right-0 w-44 max-w-[calc(100vw-32px)] bg-card border border-border-subtle rounded-xl shadow-xl z-[60] overflow-hidden">
                      <div className="p-1.5 space-y-1">
                        {DATE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setDateFilter(opt.value);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              dateFilter === opt.value
                                ? 'bg-primary text-background-dark font-semibold'
                                : 'text-text-subtle hover:bg-background-elevated hover:text-text'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Switcher: Board vs List */}
                <div className="flex items-center h-10 sm:h-9 bg-background-elevated border border-border-subtle rounded-lg p-0.5">
                  <button
                    type="button"
                    title="Board view"
                    aria-label="Board view"
                    onClick={() => setCardLayout('standard')}
                    className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      cardLayout !== 'list'
                        ? 'bg-card text-text border border-border-subtle shadow-sm font-semibold'
                        : 'text-text-subtle hover:text-text'
                    }`}
                  >
                    <LayoutGrid size={14} />
                    <span className="hidden md:inline">Board</span>
                  </button>
                  <button
                    type="button"
                    title="List view"
                    aria-label="List view"
                    onClick={() => setCardLayout('list')}
                    className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      cardLayout === 'list'
                        ? 'bg-card text-text border border-border-subtle shadow-sm font-semibold'
                        : 'text-text-subtle hover:text-text'
                    }`}
                  >
                    <List size={14} />
                    <span className="hidden md:inline">List</span>
                  </button>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="h-10 sm:h-9 px-2.5 flex items-center gap-1.5 text-xs font-medium text-status-error bg-status-error/10 border border-status-error/30 rounded-lg hover:bg-status-error hover:text-white transition-colors cursor-pointer"
                    title="Reset filters"
                    aria-label="Reset filters"
                  >
                    <CloseIcon size={14} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Global Task Execution Engine */}
            <div className="relative z-10 space-y-4">
              {cardLayout === 'list' ? (
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pb-4 px-1 sm:px-0">
                  <div className="min-w-[1000px]">
                    <TaskTable
                      tasks={paginatedTasks}
                      onTaskClick={(task) => navigate(`/task/${task._id}`)}
                      handleStatusChange={(taskId, status) =>
                        statusMutation.mutate({ taskId, status })
                      }
                    />
                  </div>
                </div>
              ) : (
                <TaskBoard
                  groupedTasks={filteredGroupedTasks}
                  user={user}
                  columns={columns}
                  handleStatusChange={(taskId, status) =>
                    statusMutation.mutate({ taskId, status })
                  }
                  onTaskClick={(task) => navigate(`/task/${task._id}`)}
                  cardLayout={cardLayout}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />
              )}

              {/* Pagination Interface */}
              {totalTasks > 0 && (
                <div className="flex items-center justify-between gap-3 bg-card border border-border-subtle rounded-xl px-3 py-2 mt-4 shadow-sm">
                  {/* Left: Page Size Selector */}
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Tasks per page"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === 'pagesize' ? null : 'pagesize'
                        )
                      }
                      className="flex items-center gap-2 bg-background-elevated border border-border-subtle rounded-lg px-2.5 h-8 hover:bg-card text-xs font-medium text-text transition-colors"
                    >
                      <span>{pageSize} per page</span>
                      <ChevronDown
                        size={12}
                        className={`text-text-subtle transition-transform ${activeDropdown === 'pagesize' ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {activeDropdown === 'pagesize' && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 bg-card border border-border-subtle rounded-xl shadow-xl z-[70] overflow-hidden">
                        <div className="p-1 space-y-1">
                          {[10, 20, 50, 100].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setPageSize(size);
                                setCurrentPage(1);
                                setActiveDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                pageSize === size
                                  ? 'bg-primary text-background-dark font-semibold'
                                  : 'text-text-subtle hover:bg-background-elevated hover:text-text'
                              }`}
                            >
                              {size} per page
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Info & Controls */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-subtle font-medium">
                      Page {currentPage} of {totalPages}
                    </span>

                    <div className="flex items-center bg-background-elevated border border-border-subtle rounded-lg overflow-hidden h-8">
                      <button
                        type="button"
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        className="w-8 h-full flex items-center justify-center text-text-subtle hover:bg-card hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-border-subtle"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next page"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        className="w-8 h-full flex items-center justify-center text-text-subtle hover:bg-card hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResilientPage>
  );
};

export default ProjectDetail;
