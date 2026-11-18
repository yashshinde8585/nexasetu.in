import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TaskService from '../../api/taskApi';
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  Code,
  ShieldAlert,
  ArrowLeft,
  UserPlus,
  Rocket,
  ChevronDown,
  BrainCircuit,
  Tag,
  Loader2,
  Minus,
  Plus,
  Paperclip,
  File,
  ExternalLink,
  Wand2,
} from 'lucide-react';
import { BackButton } from '../../components/atoms';
import TacticalCustomSelect from '../../components/molecules/TacticalCustomSelect';
import TaskComments from '../../components/organisms/TaskComments';
import { ResilientPage } from '../../components/states';
import TaskEPIExplanation from '../../components/tasks/TaskEPIExplanation';
import { TASK_STATUS, USER_ROLES } from '../../constants';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const queryClient = useQueryClient();
  const [isEpiExpanded, setIsEpiExpanded] = React.useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
  const [blockReason, setBlockReason] = React.useState('');
  const [isEpiLoading, setIsEpiLoading] = React.useState(false);

  const {
    data: taskData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () =>
      TaskService.getTaskById(taskId).then((res) => res.data?.task),
  });

  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    targetStatus: null,
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      TaskService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {},
  });

  const blockMutation = useMutation({
    mutationFn: ({ blocked, reason }) =>
      TaskService.toggleTaskBlockage(taskId, blocked, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setIsBlockModalOpen(false);
      setBlockReason('');
    },
    onError: () => {},
  });

  const updateMutation = useMutation({
    mutationFn: (data) => TaskService.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {},
  });

  const reviewMutation = useMutation({
    mutationFn: ({ result, notes }) =>
      TaskService.submitTaskReview(taskId, result, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setReviewNotes('');
    },
  });

  const [reviewNotes, setReviewNotes] = React.useState('');

  const columns = [
    {
      id: TASK_STATUS.TODO,
      title: 'To Do',
      color: 'text-status-error',
      bg: 'bg-card',
      border: 'border-status-error',
    },
    {
      id: TASK_STATUS.IN_PROGRESS,
      title: 'In Progress',
      color: 'text-status-warning',
      bg: 'bg-card',
      border: 'border-status-warning',
    },
    {
      id: TASK_STATUS.IN_REVIEW,
      title: 'In Review',
      color: 'text-secondary',
      bg: 'bg-card',
      border: 'border-secondary',
    },
    {
      id: TASK_STATUS.DONE,
      title: 'Done',
      color: 'text-status-success',
      bg: 'bg-card',
      border: 'border-status-success',
    },
  ];

  const getStatusTitle = (status) =>
    columns.find((c) => c.id === status)?.title || status;

  const getAutoDueDate = () => {
    if (!taskData?.estimatedDuration) return null;
    const mins = taskData.estimatedDuration;
    const durationInMs = mins * 60 * 1000;
    return new Date(Date.now() + durationInMs);
  };

  const handleAutoDueDate = () => {
    const newDate = getAutoDueDate();
    if (newDate) updateMutation.mutate({ dueDate: newDate });
  };

  if (!isLoading && !taskData && !error) {
    return (
      <ResilientPage
        isLoading={false}
        error={{ uiState: 'not-found' }}
        onRetry={() =>
          queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
      />
    );
  }

  return (
    <ResilientPage
      isLoading={isLoading}
      error={error}
      onRetry={() =>
        queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      }
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-auto lg:min-h-0 lg:h-[calc(100vh-60px)] flex flex-col gap-2 py-2 lg:overflow-hidden animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shrink-0 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <BackButton className="shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-primary px-2.5 py-0.5 bg-card rounded-md uppercase tracking-wider border border-primary/30 shrink-0">
                  {taskData?.projectKey || 'NEXA'}-{taskData?.taskNumber || '0'}
                </span>

                <span
                  className={`text-xs font-medium uppercase tracking-wide border px-2 py-0.5 rounded-md shrink-0 ${
                    taskData?.type === 'bug'
                      ? 'border-status-error/30 text-status-error bg-status-error/10'
                      : taskData?.type === 'epic'
                        ? 'border-secondary/30 text-secondary bg-secondary/10'
                        : taskData?.type === 'story'
                          ? 'border-status-success/30 text-status-success bg-status-success/10'
                          : taskData?.type === 'spike'
                            ? 'border-primary/30 text-primary bg-primary/10'
                            : taskData?.type === 'tech_debt'
                              ? 'border-status-warning/30 text-status-warning bg-status-warning/10'
                              : 'border-border-subtle text-text-subtle bg-background-elevated'
                  }`}
                >
                  {taskData?.type || 'TASK'}
                </span>

                {taskData?.blocked && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-status-error bg-status-error/10 px-2 py-0.5 rounded-md border border-status-error/30 uppercase tracking-wide shrink-0">
                    <ShieldAlert size={12} /> Blocked
                  </span>
                )}
                {taskData?.source === 'github' && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-secondary border border-secondary/30 px-2 py-0.5 rounded-md bg-secondary/10 shrink-0">
                    <Code size={12} /> Repo Sync
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight truncate max-w-full mt-1">
                {taskData?.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Priority Status */}
            <div className="hidden sm:flex flex-col items-end gap-0.5 px-3 border-r border-border-subtle">
              <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                Priority
              </span>
              <span
                className={`text-xs font-bold flex items-center gap-1.5 uppercase ${
                  taskData?.priority === 'low'
                    ? 'text-status-success'
                    : taskData?.priority === 'high'
                      ? 'text-status-warning'
                      : taskData?.priority === 'urgent'
                        ? 'text-status-error'
                        : 'text-primary'
                }`}
              >
                {taskData?.priority || 'Medium'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Blocking Action */}
              <button
                onClick={() => {
                  if (taskData?.blocked) {
                    blockMutation.mutate({ blocked: false });
                  } else {
                    setIsBlockModalOpen(true);
                  }
                }}
                className={`h-9 px-4 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  taskData?.blocked
                    ? 'bg-status-success text-white border-status-success'
                    : 'bg-background-elevated border-border-subtle text-text-subtle hover:bg-status-error/10 hover:text-status-error hover:border-status-error/30'
                }`}
                disabled={blockMutation.isPending}
              >
                {blockMutation.isPending
                  ? 'Saving...'
                  : taskData?.blocked
                    ? 'Resolve'
                    : 'Block'}
              </button>

              {/* Status Selector */}
              <div className="relative flex-1 sm:flex-none">
                <TacticalCustomSelect
                  value={taskData?.status}
                  onChange={(newStatus) => {
                    if (newStatus !== taskData?.status) {
                      const column = columns.find((c) => c.id === newStatus);
                      setConfirmModal({ isOpen: true, targetStatus: column });
                    }
                  }}
                  options={columns.map((c) => ({
                    label: c.title,
                    value: c.id,
                    color: c.color,
                  }))}
                  displayValue={
                    <div className="flex items-center gap-2.5 truncate">
                      {getStatusTitle(taskData?.status)}
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:overflow-hidden min-h-0">
          <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
            {/* Task Description Area */}
            <section className="flex flex-col bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm min-h-[400px] lg:min-h-0 lg:flex-1">
              <div className="px-5 py-2.5 border-b border-border-subtle flex items-center justify-between shrink-0 bg-background-elevated/40">
                <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
                  Task Description
                </h3>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      !isEpiLoading && setIsEpiExpanded(!isEpiExpanded)
                    }
                    disabled={isEpiLoading}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all text-xs font-medium cursor-pointer ${
                      isEpiExpanded
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background-elevated border-border-subtle text-text-subtle hover:bg-card hover:text-text'
                    } disabled:opacity-50`}
                  >
                    {isEpiLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <BrainCircuit size={12} />
                    )}
                    AI Insights
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-thin">
                <div className="text-sm text-text leading-relaxed whitespace-pre-wrap selection:bg-primary/30">
                  {taskData?.description || 'No description provided.'}
                </div>

                {/* Attachments Display */}
                {taskData?.attachments?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border-subtle">
                    <h4 className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-4 flex items-center gap-2">
                      Attachments ({taskData?.attachments?.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {taskData?.attachments?.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 bg-card border border-border-subtle p-2.5 rounded-lg group hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-background-elevated border border-border-subtle flex items-center justify-center text-primary/70 group-hover:text-primary transition-colors shrink-0">
                              <File size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-text truncate group-hover:text-primary transition-colors">
                                {file.name}
                              </span>
                              <span className="text-xs text-text-subtle leading-none mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <ExternalLink
                            size={12}
                            className="text-text-subtler group-hover:text-primary transition-colors shrink-0"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <TaskEPIExplanation
                  taskId={taskId}
                  isExpanded={isEpiExpanded}
                  isOverdue={
                    taskData?.dueDate &&
                    new Date() > new Date(taskData?.dueDate) &&
                    taskData?.status !== TASK_STATUS.DONE
                  }
                  onLoadingChange={setIsEpiLoading}
                />
              </div>
            </section>

            {/* Review Section */}
            {taskData?.status === TASK_STATUS.IN_REVIEW && (
              <section className="bg-card border border-secondary/30 rounded-xl p-5 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-secondary/15 p-2 rounded-lg border border-secondary/30">
                    <ShieldAlert className="text-secondary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text tracking-tight">
                      Task Review Required
                    </h3>
                    <p className="text-xs text-text-subtle">
                      Verify quality and artifacts before completion
                    </p>
                  </div>
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide feedback for the team..."
                  className="w-full bg-background-elevated border border-border-subtle rounded-lg p-3 text-text text-xs mb-4 focus:outline-none focus:border-secondary min-h-[100px] resize-none placeholder:text-text-subtler"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      reviewMutation.mutate({
                        result: 'approved',
                        notes: reviewNotes,
                      })
                    }
                    disabled={reviewMutation.isPending || !reviewNotes.trim()}
                    className="flex-1 bg-status-success text-white py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Approve & Close
                  </button>
                  <button
                    onClick={() =>
                      reviewMutation.mutate({
                        result: 'rejected',
                        notes: reviewNotes,
                      })
                    }
                    disabled={reviewMutation.isPending || !reviewNotes.trim()}
                    className="flex-1 bg-status-error text-white py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Reject (Needs Rework)
                  </button>
                </div>
              </section>
            )}

            {/* Task Details Hub */}
            <section className="bg-card border border-border-subtle p-3 rounded-xl flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 shrink-0 shadow-sm px-4">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {taskData?.assignedUser?.name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-medium text-text-subtle uppercase tracking-wider">
                    Assignee
                  </span>
                  <p className="text-xs font-semibold text-text truncate">
                    {taskData?.assignedUser?.name?.split(' ')[0] ||
                      'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-6 bg-border-subtle shrink-0" />

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-7 h-7 rounded-md bg-background-elevated border border-border-subtle flex items-center justify-center text-text-subtle">
                  <Calendar size={12} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-medium text-text-subtle uppercase tracking-wider">
                    Sprint
                  </span>
                  <p className="text-xs font-semibold text-secondary tracking-tight truncate">
                    {taskData?.sprintInfo?.name || 'Backlog'}
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-6 bg-border-subtle shrink-0" />

              {/* Time Budgeting */}
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`w-7 h-7 rounded-md bg-background-elevated border flex items-center justify-center transition-all ${taskData?.status === TASK_STATUS.IN_PROGRESS ? 'border-status-success text-status-success' : 'border-border-subtle text-text-subtle'}`}
                >
                  <Clock size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="block text-xs font-medium text-text-subtle uppercase tracking-wider">
                    Allocation
                  </span>
                  <p className="text-xs font-bold text-text leading-none mt-0.5">
                    {(() => {
                      const mins = taskData?.estimatedDuration || 0;
                      if (mins >= 1440) return `${(mins / 1440).toFixed(1)}d`;
                      if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
                      return `${Math.round(mins)}m`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-6 bg-border-subtle shrink-0" />

              {/* Deadline Tracking */}
              <div className="flex items-center gap-3 shrink-0 group">
                <div
                  className={`w-7 h-7 rounded-md bg-background-elevated border flex items-center justify-center transition-all ${taskData?.dueDate && new Date(taskData?.dueDate) < new Date() && taskData?.status !== TASK_STATUS.DONE ? 'border-status-error text-status-error' : 'border-border-subtle text-primary'}`}
                >
                  <Calendar size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="block text-xs font-medium text-text-subtle uppercase tracking-wider">
                    Deadline
                  </span>
                  <div className="relative">
                    <p
                      className={`text-xs font-bold leading-none mt-0.5 transition-all ${taskData?.dueDate && new Date(taskData?.dueDate) < new Date() && taskData?.status !== TASK_STATUS.DONE ? 'text-status-error' : taskData?.dueDate ? 'text-text' : 'text-primary hover:text-primary-light cursor-pointer underline decoration-dotted decoration-primary/30'}`}
                      onClick={() => !taskData?.dueDate && handleAutoDueDate()}
                    >
                      {taskData?.dueDate
                        ? new Date(taskData?.dueDate)
                            .toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                        : 'Calculating...'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Comments Panel */}
          <aside className="lg:col-span-4 flex flex-col gap-2 min-h-[400px] lg:min-h-0 lg:overflow-hidden">
            <section className="flex flex-col min-h-0 bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm flex-1">
              <TaskComments taskId={taskId} />
            </section>
          </aside>
        </main>

        {/* Confirm Status Change */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border-subtle w-full max-w-sm rounded-xl p-6 shadow-xl animate-in zoom-in-95 duration-300 text-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 mb-5 ${confirmModal.targetStatus?.bg} ${confirmModal.targetStatus?.border} ${confirmModal.targetStatus?.color}`}
                >
                  <Rocket size={26} />
                </div>
                <h2 className="text-lg font-bold text-text tracking-tight mb-2">
                  Update Status
                </h2>
                <p className="text-xs text-text-subtle mb-6 px-4">
                  Are you sure you want to change the status to{' '}
                  <span className={`font-semibold ${confirmModal.targetStatus?.color}`}>
                    {confirmModal.targetStatus?.title}
                  </span>
                  ?
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() =>
                      setConfirmModal({ isOpen: false, targetStatus: null })
                    }
                    className="py-2.5 bg-background-elevated text-text-subtle rounded-lg text-xs font-medium border border-border-subtle hover:text-text hover:bg-card transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      statusMutation.mutate({
                        taskId: taskData?._id || taskId,
                        status: confirmModal.targetStatus.id,
                      });
                      setConfirmModal({ isOpen: false, targetStatus: null });
                    }}
                    className={`py-2.5 rounded-lg font-semibold text-xs text-white uppercase tracking-wider shadow-sm transition-all cursor-pointer ${confirmModal.targetStatus?.id === TASK_STATUS.DONE ? 'bg-status-success' : 'bg-primary'}`}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Block Task Modal */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border-subtle w-full max-w-sm rounded-xl p-6 shadow-xl animate-in zoom-in-95 duration-300 text-center">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-status-error/10 border-2 border-status-error flex items-center justify-center text-status-error mb-5">
                  <ShieldAlert size={26} />
                </div>
                <h2 className="text-lg font-bold text-text tracking-tight mb-2">
                  Block Task
                </h2>
                <p className="text-xs text-text-subtle mb-4 px-4">
                  Please provide a reason for blocking this task.
                </p>

                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking..."
                  className="w-full bg-background-elevated border border-border-subtle rounded-lg p-3 text-text text-xs mb-6 focus:outline-none focus:border-status-error min-h-[90px] resize-none placeholder:text-text-subtler"
                />

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setIsBlockModalOpen(false)}
                    className="py-2.5 bg-background-elevated text-text-subtle rounded-lg text-xs font-medium border border-border-subtle hover:text-text hover:bg-card transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      blockMutation.mutate({
                        blocked: true,
                        reason: blockReason,
                      })
                    }
                    className="py-2.5 bg-status-error text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50 hover:brightness-110 cursor-pointer"
                    disabled={!blockReason.trim() || blockMutation.isPending}
                  >
                    {blockMutation.isPending ? 'Saving...' : 'Block Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResilientPage>
  );
};

export default TaskDetailPage;
