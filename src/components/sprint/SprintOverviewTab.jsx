import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Layers,
} from 'lucide-react';

const SprintOverviewTab = ({
  sprint,
  tasks = [],
  metrics,
  stats,
  aiHealth,
  aiHealthLoading,
  onTaskClick,
  onNavigateTab,
}) => {
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done'),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === 'in_progress'),
    [tasks]
  );
  const inReviewTasks = useMemo(
    () => tasks.filter((t) => t.status === 'in_review'),
    [tasks]
  );
  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === 'todo'),
    [tasks]
  );
  const blockedTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.blocked || (t.dependencies && t.dependencies.length > 0)
      ),
    [tasks]
  );

  const totalPoints = useMemo(
    () =>
      tasks.reduce(
        (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
        0
      ),
    [tasks]
  );
  const completedPoints = useMemo(
    () =>
      completedTasks.reduce(
        (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
        0
      ),
    [completedTasks]
  );

  const completionPct =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const pointsCompletionPct =
    totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Remaining days calculation
  const remainingDays = useMemo(() => {
    if (!sprint?.endDate) return 0;
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [sprint?.endDate]);

  // Team Workload calculation from real tasks
  const memberWorkload = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const user = t.assignedUser;
      const key = user?._id || user?.id || 'unassigned';
      if (!map[key]) {
        map[key] = {
          name: user?.name || 'Unassigned',
          role: user?.role || user?.jobTitle || 'Team Member',
          avatar: user?.profilePicture,
          tasksCount: 0,
          pointsCount: 0,
          doneCount: 0,
        };
      }
      map[key].tasksCount += 1;
      map[key].pointsCount += typeof t.storyPoints === 'number' ? t.storyPoints : 0;
      if (t.status === 'done') map[key].doneCount += 1;
    });

    return Object.values(map).sort((a, b) => b.tasksCount - a.tasksCount);
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Quick Stats Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Story Points */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            Story Points
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text tracking-tight">
              {completedPoints}
            </span>
            <span className="text-xs text-text-subtle">/ {totalPoints} pts</span>
          </div>
          <span className="text-[11px] text-primary font-medium block">
            {pointsCompletionPct}% estimated
          </span>
        </div>

        {/* Tasks Progress */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            Tasks Completed
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-status-success tracking-tight">
              {completedTasks.length}
            </span>
            <span className="text-xs text-text-subtle">/ {tasks.length}</span>
          </div>
          <span className="text-[11px] text-text-subtle font-medium block">
            {completionPct}% overall done
          </span>
        </div>

        {/* In Progress */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            In Progress
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-primary tracking-tight">
              {inProgressTasks.length + inReviewTasks.length}
            </span>
            <span className="text-xs text-text-subtle">active</span>
          </div>
          <span className="text-[11px] text-text-subtle font-medium block">
            {inReviewTasks.length} in review
          </span>
        </div>

        {/* Backlog / Todo */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            Remaining To Do
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text tracking-tight">
              {todoTasks.length}
            </span>
            <span className="text-xs text-text-subtle">open</span>
          </div>
          <span className="text-[11px] text-text-subtler font-medium block">
            {tasks.length > 0 ? Math.round((todoTasks.length / tasks.length) * 100) : 0}% left
          </span>
        </div>

        {/* Active Blockers */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            Active Blockers
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold tracking-tight ${
                blockedTasks.length > 0 ? 'text-status-error' : 'text-text'
              }`}
            >
              {blockedTasks.length}
            </span>
            <span className="text-xs text-text-subtle">items</span>
          </div>
          <span
            className={`text-[11px] font-medium block ${
              blockedTasks.length > 0 ? 'text-status-error' : 'text-status-success'
            }`}
          >
            {blockedTasks.length > 0 ? 'Requires triage' : 'Clear runway'}
          </span>
        </div>

        {/* Days Remaining */}
        <div className="bg-card border border-border-subtle rounded-md p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
            Sprint Time
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text tracking-tight">
              {remainingDays}
            </span>
            <span className="text-xs text-text-subtle">days left</span>
          </div>
          <span className="text-[11px] text-text-subtle font-medium block truncate">
            {sprint?.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* 2. Sprint Goal & Delivery Progress Bar */}
      <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Target size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-subtler uppercase tracking-wider block">
                Sprint Goal
              </span>
              <p className="text-sm font-semibold text-text mt-0.5">
                {sprint?.goal || 'No goal set for this sprint yet. Click Edit to establish a goal.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('board')}
              className="px-3 py-1.5 rounded-xs border border-border-subtle hover:bg-background-elevated text-xs font-semibold text-text transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Board</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('backlog')}
              className="px-3 py-1.5 rounded-xs bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage Backlog</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. AI Sprint Health & Intelligence Card */}
      {aiHealth && (
        <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">
                  AI Sprint Health & Risk Insights
                </h3>
                <span className="text-[11px] text-text-subtle">
                  Tactical evaluation based on live velocity and task commitments
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                aiHealth.statusBadge === 'ON_TRACK'
                  ? 'bg-status-success/10 text-status-success border-status-success/20'
                  : aiHealth.statusBadge === 'NEEDS_ATTENTION'
                  ? 'bg-status-warning/10 text-status-warning border-status-warning/20'
                  : 'bg-status-error/10 text-status-error border-status-error/20'
              }`}
            >
              {aiHealth.statusBadge === 'ON_TRACK'
                ? 'On Track'
                : aiHealth.statusBadge === 'NEEDS_ATTENTION'
                ? 'Needs Attention'
                : 'At Risk'}
            </span>
          </div>

          <p className="text-xs text-text leading-relaxed bg-background-elevated/50 p-3 rounded-md border border-border-subtle">
            {aiHealth.summary}
          </p>

          {aiHealth.recommendations && aiHealth.recommendations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider block">
                Actionable Recommendations
              </span>
              <ul className="space-y-1">
                {aiHealth.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-xs text-text flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4. Two Columns: Active Blockers & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Blockers & Dependencies */}
        <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-status-warning" />
              <h3 className="text-sm font-bold text-text">
                Blockers & Dependencies
              </h3>
            </div>
            <span className="text-xs font-semibold text-text-subtle px-2 py-0.5 bg-background-elevated rounded">
              {blockedTasks.length} {blockedTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {blockedTasks.length > 0 ? (
            <div className="space-y-2.5">
              {blockedTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => onTaskClick?.(t)}
                  className="p-3 bg-background-elevated/40 hover:bg-background-elevated border border-border-subtle rounded-md cursor-pointer transition-colors space-y-1.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors">
                      {t.title}
                    </span>
                    <span className="text-[11px] font-mono text-status-error uppercase font-semibold">
                      Blocked
                    </span>
                  </div>

                  {t.blockedReason && (
                    <p className="text-[11px] text-status-error/90 bg-status-error/10 px-2 py-1 rounded">
                      Reason: {t.blockedReason}
                    </p>
                  )}

                  {t.dependencies && t.dependencies.length > 0 && (
                    <div className="text-[11px] text-text-subtle flex items-center gap-1.5">
                      <span className="font-medium text-text-subtler">Dependencies:</span>
                      {t.dependencies.map((dep, idx) => (
                        <span
                          key={dep._id || idx}
                          className="px-1.5 py-0.5 bg-background border border-border-subtle rounded text-[10px] font-mono"
                        >
                          {dep.taskNumber ? `#${dep.taskNumber}` : dep.title || 'Task'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-text-subtle space-y-1">
              <CheckCircle2 size={24} className="text-status-success mx-auto mb-2" />
              <p className="font-semibold text-text">No active blockers</p>
              <p className="text-text-subtle">
                All sprint tasks are clear of reported dependencies and blockages.
              </p>
            </div>
          )}
        </div>

        {/* Team Capacity & Allocation Metrics */}
        <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-text">
                Team Workload & Capacity
              </h3>
            </div>
            <span className="text-xs font-semibold text-text-subtle px-2 py-0.5 bg-background-elevated rounded">
              {memberWorkload.length} active assignees
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
              <span className="text-xs text-text-subtle font-medium block">Allocated Work</span>
              <span className="text-base font-bold text-text mt-0.5 block">
                {tasks.length} tasks ({totalPoints} pts)
              </span>
              <span className="text-[11px] text-text-subtler">Distributed across squad</span>
            </div>
            <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
              <span className="text-xs text-text-subtle font-medium block">Workload Balance</span>
              <span className="text-base font-bold text-status-success mt-0.5 block">
                {memberWorkload.filter((m) => m.tasksCount >= 6).length === 0 ? 'Healthy' : `${memberWorkload.filter((m) => m.tasksCount >= 6).length} High Load`}
              </span>
              <span className="text-[11px] text-text-subtler">
                Avg {memberWorkload.length > 0 ? (totalPoints / memberWorkload.length).toFixed(1) : 0} pts/person
              </span>
            </div>
            <div className="p-3 bg-background-elevated border border-border-subtle rounded-md">
              <span className="text-xs text-text-subtle font-medium block">Unassigned Tasks</span>
              <span className="text-base font-bold text-text mt-0.5 block">
                {tasks.filter((t) => !t.assignedUser && !t.assignedTo).length} tasks
              </span>
              <span className="text-[11px] text-text-subtler">Awaiting owner in backlog</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SprintOverviewTab.propTypes = {
  sprint: PropTypes.object,
  tasks: PropTypes.array,
  metrics: PropTypes.object,
  stats: PropTypes.object,
  aiHealth: PropTypes.object,
  aiHealthLoading: PropTypes.bool,
  onTaskClick: PropTypes.func,
  onNavigateTab: PropTypes.func.isRequired,
};

export default SprintOverviewTab;
