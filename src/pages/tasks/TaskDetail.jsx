import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import TaskService from '../../api/taskApi';
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  Code,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  UserPlus,
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

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      TaskService.updateTaskStatus(
        taskId,
        status,
        taskData?.__v !== undefined ? taskData.__v : taskData?.version
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task status updated to ${getStatusTitle(variables.status)}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ blocked, reason }) =>
      TaskService.toggleTaskBlockage(taskId, blocked, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setIsBlockModalOpen(false);
      setBlockReason('');
      if (variables.blocked) {
        toast.success('Task marked as blocked');
      } else {
        toast.success('Task unblocked');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task block status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const version =
        data.version !== undefined
          ? data.version
          : data.__v !== undefined
          ? data.__v
          : taskData?.__v !== undefined
          ? taskData.__v
          : taskData?.version;
      return TaskService.updateTask(taskId, {
        ...data,
        ...(version !== undefined ? { version } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Due date updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ result, notes }) =>
      TaskService.submitTaskReview(taskId, result, notes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setReviewNotes('');
      toast.success(`Task review ${variables.result}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    },
  });

  const [reviewNotes, setReviewNotes] = React.useState('');

  const getAutoDueDate = () => {
    if (!taskData?.estimatedDuration) return null;
    const mins = taskData.estimatedDuration;
    const durationInMs = mins * 60 * 1000;
    return new Date(Date.now() + durationInMs);
  };

  const handleAutoDueDate = () => {
    const newDate = getAutoDueDate();
    const version =
      taskData?.__v !== undefined ? taskData.__v : taskData?.version;
    if (newDate) {
      updateMutation.mutate({ dueDate: newDate, version });
    } else {
      // Default to 2 days from now if no estimated duration
      const defaultDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      updateMutation.mutate({ dueDate: defaultDate, version });
    }
  };

  const handleStatusSelect = (newStatus) => {
    if (newStatus === taskData?.status) return;
    const targetCol = columns.find((c) => c.id === newStatus);

    // Require confirmation only for high-impact transitions (marking Done)
    if (newStatus === TASK_STATUS.DONE) {
      setConfirmModal({ isOpen: true, targetStatus: targetCol });
    } else {
      statusMutation.mutate({
        taskId: taskData?._id || taskId,
        status: newStatus,
      });
    }
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

  const mins = taskData?.estimatedDuration || 0;
  const isOverdue =
    taskData?.dueDate &&
    new Date(taskData.dueDate) < new Date() &&
    taskData.status !== TASK_STATUS.DONE;

  return (
    <ResilientPage
      isLoading={isLoading}
      error={error}
      onRetry={() =>
        queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      }
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 flex flex-col gap-5 animate-in fade-in duration-300">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 pb-4 border-b border-border-subtle">
          <div className="flex items-start sm:items-center gap-3 w-full md:w-auto">
            <BackButton className="shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold text-primary px-2.5 py-0.5 bg-card rounded-md font-mono border border-primary/30 shrink-0">
                  {taskData?.projectKey || 'NEXA'}-{taskData?.taskNumber || '0'}
                </span>

                <span
                  className={`text-xs font-medium capitalize border px-2 py-0.5 rounded-md shrink-0 ${
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
                  {taskData?.type || 'Task'}
                </span>

                {/* Priority Status Badge (Always visible on mobile and desktop) */}
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 capitalize px-2 py-0.5 rounded-md border shrink-0 ${
                    taskData?.priority === 'low'
                      ? 'border-status-success/30 text-status-success bg-status-success/10'
                      : taskData?.priority === 'high'
                        ? 'border-status-warning/30 text-status-warning bg-status-warning/10'
                        : taskData?.priority === 'urgent'
                          ? 'border-status-error/40 text-status-error bg-status-error/15 font-bold animate-pulse'
                          : 'border-primary/30 text-primary bg-primary/10'
                  }`}
                  title={`Priority: ${taskData?.priority || 'Medium'}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      taskData?.priority === 'low'
                        ? 'bg-status-success'
                        : taskData?.priority === 'high'
                          ? 'bg-status-warning'
                          : taskData?.priority === 'urgent'
                            ? 'bg-status-error'
                            : 'bg-primary'
                    }`}
                  />
                  {taskData?.priority || 'Medium'}
                </span>

                {taskData?.blocked && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-status-error bg-status-error/10 px-2 py-0.5 rounded-md border border-status-error/30 shrink-0">
                    <ShieldAlert size={12} /> Blocked
                  </span>
                )}
                {taskData?.source === 'github' && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-secondary border border-secondary/30 px-2 py-0.5 rounded-md bg-secondary/10 shrink-0">
                    <Code size={12} /> Repo Sync
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-text tracking-tight break-words text-balance max-w-full mt-1.5">
                {taskData?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Blocking Action */}
            <button
              type="button"
              onClick={() => {
                if (taskData?.blocked) {
                  blockMutation.mutate({ blocked: false });
                } else {
                  setIsBlockModalOpen(true);
                }
              }}
              className={`min-h-[40px] sm:min-h-[38px] px-3 sm:px-3.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                taskData?.blocked
                  ? 'bg-status-success text-white border-status-success hover:bg-status-success/90'
                  : 'bg-background-elevated border-border-subtle text-text-subtle hover:bg-status-error/10 hover:text-status-error hover:border-status-error/30'
              }`}
              disabled={blockMutation.isPending}
              title={taskData?.blocked ? 'Unblock task' : 'Mark as blocked'}
              aria-label={taskData?.blocked ? 'Unblock task' : 'Mark as blocked'}
            >
              {taskData?.blocked ? (
                <ShieldCheck size={14} />
              ) : (
                <ShieldAlert size={14} />
              )}
              <span>
                {blockMutation.isPending
                  ? 'Saving...'
                  : taskData?.blocked
                    ? 'Unblock task'
                    : 'Mark as blocked'}
              </span>
            </button>

            {/* Status Selector */}
            <div className="relative flex-1 md:w-44 min-w-[140px]">
              <TacticalCustomSelect
                value={taskData?.status}
                onChange={handleStatusSelect}
                options={columns.map((c) => ({
                  label: c.title,
                  value: c.id,
                  color: c.color,
                }))}
                displayValue={
                  <div className="flex items-center gap-2 truncate">
                    {getStatusTitle(taskData?.status)}
                  </div>
                }
              />
            </div>
          </div>
        </header>

        {/* Essential Task Metadata Strip (Near Top) */}
        <section className="bg-card border border-border-subtle p-3 sm:p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shadow-sm">
          {/* Assignee */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {taskData?.assignedUser?.name?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-text-subtle">
                Assignee
              </span>
              <p
                className="text-xs font-semibold text-text truncate"
                title={taskData?.assignedUser?.name || 'Unassigned'}
              >
                {taskData?.assignedUser?.name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Sprint */}
          <div className="flex items-center gap-2.5 min-w-0 border-l border-border-subtle pl-2.5 sm:pl-4">
            <div className="w-8 h-8 rounded-lg bg-background-elevated border border-border-subtle flex items-center justify-center text-text-subtle shrink-0">
              <Calendar size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-text-subtle">
                Sprint
              </span>
              <p
                className="text-xs font-semibold text-text line-clamp-2 break-words"
                title={taskData?.sprintInfo?.name || 'Backlog'}
              >
                {taskData?.sprintInfo?.name || 'Backlog'}
              </p>
            </div>
          </div>

          {/* Estimated Effort */}
          <div className="flex items-center gap-2.5 min-w-0 sm:border-l border-border-subtle sm:pl-4">
            <div
              className={`w-8 h-8 rounded-lg bg-background-elevated border flex items-center justify-center shrink-0 ${
                taskData?.status === TASK_STATUS.IN_PROGRESS
                  ? 'border-status-success text-status-success'
                  : 'border-border-subtle text-text-subtle'
              }`}
            >
              <Clock size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-text-subtle">
                Estimated effort
              </span>
              <p
                className="text-xs font-semibold text-text truncate"
                title={`Estimated: ${mins} minutes (~${(mins / 1440).toFixed(1)} calendar days / ${Math.round(mins / 60)} hours)`}
              >
                {mins >= 1440
                  ? `${Math.round((mins / 1440) * 10) / 10} days`
                  : mins >= 60
                    ? `${Math.round((mins / 60) * 10) / 10} hours`
                    : `${mins} mins`}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2.5 min-w-0 border-l border-border-subtle pl-2.5 sm:pl-4">
            <div
              className={`w-8 h-8 rounded-lg bg-background-elevated border flex items-center justify-center shrink-0 ${
                isOverdue ? 'border-status-error text-status-error' : 'border-border-subtle text-primary'
              }`}
            >
              <Calendar size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-text-subtle">
                Due date
              </span>
              <div className="text-xs">
                {taskData?.dueDate ? (
                  <span
                    className={`font-semibold block break-words ${isOverdue ? 'text-status-error' : 'text-text'}`}
                    title={new Date(taskData.dueDate).toLocaleDateString()}
                  >
                    {isOverdue && 'Overdue • '}
                    {new Date(taskData.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-text-subtle text-xs">No due date</span>
                    <button
                      type="button"
                      onClick={handleAutoDueDate}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-medium cursor-pointer transition-colors min-h-[28px] disabled:opacity-50"
                      aria-label="Set due date"
                    >
                      {updateMutation.isPending ? 'Setting...' : 'Set due date'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Task Description Area */}
            <section className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 sm:px-5 py-3 border-b border-border-subtle flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 bg-background-elevated/40">
                <h3 className="text-xs font-semibold text-text">
                  Task Description
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    !isEpiLoading && setIsEpiExpanded(!isEpiExpanded)
                  }
                  disabled={isEpiLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium cursor-pointer min-h-[36px] ${
                    isEpiExpanded
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-background-elevated border-border-subtle text-text-subtle hover:bg-card hover:text-text'
                  } disabled:opacity-50`}
                  title="Toggle AI-assisted implementation plan"
                  aria-expanded={isEpiExpanded}
                >
                  {isEpiLoading ? (
                    <Loader2 size={13} className="animate-spin text-primary" />
                  ) : (
                    <BrainCircuit size={13} />
                  )}
                  <span className="hidden sm:inline">
                    {isEpiExpanded
                      ? 'Hide AI plan'
                      : 'AI-assisted implementation plan'}
                  </span>
                  <span className="inline sm:hidden">
                    {isEpiExpanded ? 'Hide plan' : 'AI plan'}
                  </span>
                </button>
              </div>

              <div className="p-5">
                <div className="text-sm text-text leading-relaxed whitespace-pre-wrap selection:bg-primary/30">
                  {taskData?.description || 'No description provided.'}
                </div>

                {/* Attachments Display */}
                {taskData?.attachments?.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border-subtle">
                    <h4 className="text-xs font-semibold text-text mb-3 flex items-center gap-2">
                      <Paperclip size={13} className="text-primary" />
                      Attachments ({taskData?.attachments?.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {taskData?.attachments?.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 bg-background-elevated border border-border-subtle p-2.5 rounded-lg group hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-card border border-border-subtle flex items-center justify-center text-primary group-hover:text-primary transition-colors shrink-0">
                              <File size={13} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-text truncate group-hover:text-primary transition-colors">
                                {file.name}
                              </span>
                              <span className="text-[11px] text-text-subtle leading-none mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <ExternalLink
                            size={12}
                            className="text-text-subtle group-hover:text-primary transition-colors shrink-0"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* AI-Assisted Implementation Plan (Collapsible Section) */}
            {isEpiExpanded && (
              <TaskEPIExplanation
                taskId={taskId}
                isExpanded={isEpiExpanded}
                isOverdue={isOverdue}
                onLoadingChange={setIsEpiLoading}
              />
            )}

            {/* Review Section */}
            {taskData?.status === TASK_STATUS.IN_REVIEW && (
              <section className="bg-card border border-secondary/30 rounded-xl p-5 shadow-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-secondary/15 p-2 rounded-lg border border-secondary/30 text-secondary">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      Task Review Required
                    </h3>
                    <p className="text-xs text-text-subtle">
                      Please verify deliverables and test results before approving completion.
                    </p>
                  </div>
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide review feedback or verification notes..."
                  className="w-full bg-background-elevated border border-border-subtle rounded-lg p-3 text-text text-xs mb-4 focus:outline-none focus:border-secondary min-h-[90px] resize-none placeholder:text-text-subtle"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      reviewMutation.mutate({
                        result: 'approved',
                        notes: reviewNotes,
                      })
                    }
                    disabled={reviewMutation.isPending || !reviewNotes.trim()}
                    className="flex-1 min-h-[40px] bg-status-success text-white py-2 px-4 rounded-lg font-medium text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    Approve & Close
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      reviewMutation.mutate({
                        result: 'rejected',
                        notes: reviewNotes,
                      })
                    }
                    disabled={reviewMutation.isPending || !reviewNotes.trim()}
                    className="flex-1 min-h-[40px] bg-status-error text-white py-2 px-4 rounded-lg font-medium text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                  >
                    Reject (Needs Rework)
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Discussion Feed */}
          <aside className="lg:col-span-4 lg:sticky lg:top-4">
            <TaskComments taskId={taskId} />
          </aside>
        </main>

        {/* Confirm Status Change Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border-subtle w-full max-w-sm rounded-xl p-6 shadow-xl animate-in zoom-in-95 duration-200 text-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${confirmModal.targetStatus?.bg} ${confirmModal.targetStatus?.border} ${confirmModal.targetStatus?.color}`}
                >
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-base font-semibold text-text tracking-tight mb-1.5">
                  Confirm Status Change
                </h2>
                <p className="text-xs text-text-subtle mb-5 px-3">
                  Are you sure you want to change the status to{' '}
                  <strong className={`font-semibold ${confirmModal.targetStatus?.color}`}>
                    {confirmModal.targetStatus?.title}
                  </strong>
                  ? This will mark the task as finished.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({ isOpen: false, targetStatus: null })
                    }
                    className="py-2 bg-background-elevated text-text-subtle rounded-lg text-xs font-medium border border-border-subtle hover:text-text hover:bg-card transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      statusMutation.mutate({
                        taskId: taskData?._id || taskId,
                        status: confirmModal.targetStatus.id,
                      });
                      setConfirmModal({ isOpen: false, targetStatus: null });
                    }}
                    className={`py-2 rounded-lg font-medium text-xs text-white shadow-sm transition-colors cursor-pointer ${
                      confirmModal.targetStatus?.id === TASK_STATUS.DONE
                        ? 'bg-status-success hover:bg-status-success/90'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block Task Modal */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border-subtle w-full max-w-sm rounded-xl p-6 shadow-xl animate-in zoom-in-95 duration-200 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-status-error/10 border border-status-error/30 flex items-center justify-center text-status-error mb-4">
                  <ShieldAlert size={24} />
                </div>
                <h2 className="text-base font-semibold text-text tracking-tight mb-1.5">
                  Mark Task as Blocked
                </h2>
                <p className="text-xs text-text-subtle mb-4 px-2">
                  Please provide a reason for blocking this task so team members can assist in resolving it.
                </p>

                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Awaiting external API credentials from third-party vendor..."
                  className="w-full bg-background-elevated border border-border-subtle rounded-lg p-3 text-text text-xs mb-5 focus:outline-none focus:border-status-error min-h-[90px] resize-none placeholder:text-text-subtle"
                />

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    className="py-2 bg-background-elevated text-text-subtle rounded-lg text-xs font-medium border border-border-subtle hover:text-text hover:bg-card transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      blockMutation.mutate({
                        blocked: true,
                        reason: blockReason,
                      })
                    }
                    className="py-2 bg-status-error text-white rounded-lg font-medium text-xs transition-colors disabled:opacity-50 hover:bg-status-error/90 cursor-pointer"
                    disabled={!blockReason.trim() || blockMutation.isPending}
                  >
                    {blockMutation.isPending ? 'Saving...' : 'Confirm Block'}
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
