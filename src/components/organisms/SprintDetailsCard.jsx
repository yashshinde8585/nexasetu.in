import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Play,
  Edit3,
  Trash2,
  Target,
  BarChart3,
  Sparkles,
  TrendingUp,
  Layers,
  Search,
  ArrowUpDown,
  X,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';

// Helper to determine semantic sprint status badge styling
const getSprintStatusBadge = (status) => {
  const norm = (status || 'active').toLowerCase();
  switch (norm) {
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-status-success/10 text-status-success border-status-success/20',
      };
    case 'upcoming':
    case 'planning':
    case 'draft':
      return {
        label: 'Planned',
        className: 'bg-secondary/10 text-secondary border-secondary/20',
      };
    case 'archived':
      return {
        label: 'Archived',
        className: 'bg-background-elevated text-text-subtler border-border-subtle',
      };
    case 'active':
    default:
      return {
        label: 'Active',
        className: 'bg-primary/10 text-primary border-primary/20',
      };
  }
};

/**
 * Streamlined Sprint Details & Overview Card
 * 1. Sprint selector, lifecycle-aware status, dates, and relevant actions
 * 2. Prominent Sprint Goal (with helpful empty state during planning)
 * 3. Essential progress metrics (Task Breakdown and Velocity/Estimation)
 * 4. Scalable Team workload & blockers
 * 5. Contextual Sprint Insights
 */
const SprintDetailsCard = ({
  sprint,
  metrics,
  stats,
  statsLoading,
  showWorkload,
  setShowWorkload,
  onDownload,
  sprints = [],
  onSprintChange,
  onFinalize,
  finalizing,
  canCreate,
  onStartSprint,
  onEditSprint,
  onDeleteSprint,
  onNavigateTab,
  aiHealth,
  aiHealthLoading,
}) => {
  if (!sprint) return null;

  const [isSprintDropdownOpen, setIsSprintDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isSprintDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsSprintDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSprintDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSprintDropdownOpen]);

  // Lifecycle status flags
  const normStatus = (sprint.status || 'active').toLowerCase();
  const isPlanned =
    normStatus === 'upcoming' || normStatus === 'planning' || normStatus === 'draft';
  const isActive = normStatus === 'active' || normStatus === 'in_progress';
  const isCompleted = normStatus === 'completed';
  const statusBadge = getSprintStatusBadge(sprint.status);

  // Dates and duration
  const formatDate = (dateVal) => {
    if (!dateVal) return null;
    try {
      return new Date(dateVal).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedStartDate = formatDate(sprint.startDate);
  const formattedEndDate = formatDate(sprint.endDate);

  const sprintDurationDays = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return null;
    try {
      const diff = Math.ceil(
        (new Date(sprint.endDate) - new Date(sprint.startDate)) /
          (1000 * 60 * 60 * 24)
      );
      return Math.max(1, diff);
    } catch {
      return null;
    }
  }, [sprint.startDate, sprint.endDate]);

  // Detect whether the scheduled start date has passed for a planned sprint
  const isPastScheduledStart = useMemo(() => {
    if (!isPlanned || !sprint.startDate) return false;
    try {
      const start = new Date(sprint.startDate);
      start.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start < today;
    } catch {
      return false;
    }
  }, [isPlanned, sprint.startDate]);

  // Unified metrics: accurate across all cards
  const totalTasks = metrics?.total ?? 0;
  const completedTasks = metrics?.completed ?? 0;
  const inProgressTasks = metrics?.active ?? 0;
  const inReviewTasks = metrics?.review ?? 0;
  const todoTasks =
    metrics?.todo ??
    Math.max(0, totalTasks - (completedTasks + inProgressTasks + inReviewTasks));
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const workloadCount = metrics?.workload?.length || 0;
  const totalPoints = metrics?.totalPoints ?? 0;
  const completedPoints = metrics?.completedPoints ?? 0;
  const blockerCount = metrics?.blockerCount ?? 0;

  // ------------------------------------------------------------
  // Scalable Team Workload State & Filtering (1 to 200+ members)
  // ------------------------------------------------------------
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'HIGH_VOLUME' | 'IDLE'
  const [memberSort, setMemberSort] = useState('TASKS_DESC'); // 'TASKS_DESC' | 'TASKS_ASC' | 'NAME_ASC'
  const [workloadPage, setWorkloadPage] = useState(1);
  const WORKLOAD_PAGE_SIZE = 5;

  // ------------------------------------------------------------
  // Scalable Blockers State & Pagination
  // ------------------------------------------------------------
  const [blockerPage, setBlockerPage] = useState(1);
  const BLOCKER_PAGE_SIZE = 3;

  // Reset pagination when search, filter, sort, or sprint changes
  useEffect(() => {
    setWorkloadPage(1);
  }, [memberSearch, memberFilter, memberSort, sprint?._id, sprint?.id]);

  useEffect(() => {
    setBlockerPage(1);
  }, [sprint?._id, sprint?.id]);

  // Workload summary & metrics
  const rawWorkload = useMemo(() => metrics?.workload || [], [metrics?.workload]);

  const workloadSummary = useMemo(() => {
    const totalMembers = rawWorkload.length;
    const totalAssignedTasks = rawWorkload.reduce((sum, m) => sum + (m.count || 0), 0);
    const unassignedTasks =
      typeof metrics?.unassignedCount === 'number'
        ? metrics.unassignedCount
        : Math.max(0, totalTasks - totalAssignedTasks);
    const highVolumeCount = rawWorkload.filter((m) => (m.count || 0) >= 6).length;
    const activeCount = rawWorkload.filter(
      (m) => (m.count || 0) > 0 && (m.count || 0) < 6
    ).length;
    const idleCount = rawWorkload.filter((m) => (m.count || 0) === 0).length;

    return {
      totalMembers,
      totalAssignedTasks,
      unassignedTasks,
      highVolumeCount,
      activeCount,
      idleCount,
    };
  }, [rawWorkload, totalTasks, metrics?.unassignedCount]);

  // Client-side memoized filter & sort for high performance across enterprise teams
  const filteredAndSortedMembers = useMemo(() => {
    let result = rawWorkload;

    const query = memberSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => (m.name || '').toLowerCase().includes(query));
    }

    if (memberFilter === 'HIGH_VOLUME') {
      result = result.filter((m) => (m.count || 0) >= 6);
    } else if (memberFilter === 'ACTIVE') {
      result = result.filter((m) => (m.count || 0) > 0 && (m.count || 0) < 6);
    } else if (memberFilter === 'IDLE') {
      result = result.filter((m) => (m.count || 0) === 0);
    }

    const sorted = [...result].sort((a, b) => {
      const countA = a.count || 0;
      const countB = b.count || 0;
      const nameA = a.name || '';
      const nameB = b.name || '';

      if (memberSort === 'TASKS_DESC') {
        return countB - countA || nameA.localeCompare(nameB);
      }
      if (memberSort === 'TASKS_ASC') {
        return countA - countB || nameA.localeCompare(nameB);
      }
      if (memberSort === 'NAME_ASC') {
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return sorted;
  }, [rawWorkload, memberSearch, memberFilter, memberSort]);

  // Workload pagination
  const totalWorkloadPages = Math.max(
    1,
    Math.ceil(filteredAndSortedMembers.length / WORKLOAD_PAGE_SIZE)
  );
  const currentWorkloadPage = Math.min(workloadPage, totalWorkloadPages);
  const paginatedMembers = useMemo(() => {
    const start = (currentWorkloadPage - 1) * WORKLOAD_PAGE_SIZE;
    return filteredAndSortedMembers.slice(start, start + WORKLOAD_PAGE_SIZE);
  }, [filteredAndSortedMembers, currentWorkloadPage]);

  // Blockers list & pagination
  const blockedTasksList = useMemo(
    () => metrics?.blockedTasks || [],
    [metrics?.blockedTasks]
  );
  const totalBlockerPages = Math.max(
    1,
    Math.ceil(blockedTasksList.length / BLOCKER_PAGE_SIZE)
  );
  const currentBlockerPage = Math.min(blockerPage, totalBlockerPages);
  const paginatedBlockers = useMemo(() => {
    const start = (currentBlockerPage - 1) * BLOCKER_PAGE_SIZE;
    return blockedTasksList.slice(start, start + BLOCKER_PAGE_SIZE);
  }, [blockedTasksList, currentBlockerPage]);

  // Lifecycle-aware status badge & recommendations
  const aiLifecycleStatus = useMemo(() => {
    if (isPlanned) return 'Planning readiness';
    if (isCompleted) return 'Completed';
    if (aiHealth?.status) return aiHealth.status;
    if (blockerCount > 0 || (metrics?.unestimatedCount || 0) > 3)
      return 'Needs attention';
    return 'On track';
  }, [isPlanned, isCompleted, aiHealth, blockerCount, metrics?.unestimatedCount]);

  const aiLifecycleSummary = useMemo(() => {
    // Preserve real AI summary if provided
    if (aiHealth?.summary) {
      return aiHealth.summary;
    }

    if (isPlanned) {
      if (totalTasks === 0) {
        return 'Sprint is in planning with no tasks committed yet. Pull items from the project backlog and allocate estimates before starting.';
      }
      return `Sprint is in planning with ${totalTasks} ${
        totalTasks === 1 ? 'task' : 'tasks'
      } allocated. Review the sprint goal, task estimates, and team capacity before activating execution.`;
    }

    if (isCompleted) {
      return `Sprint iteration completed. ${completedTasks} of ${totalTasks} tasks delivered (${completionPercentage}%). Final metrics and burndown trajectory are preserved for retrospective review.`;
    }

    // Active sprint fallbacks
    if (totalTasks === 0) {
      return 'This sprint has no committed items. Pull work from the project backlog and allocate Fibonacci estimates.';
    }
    if (completedTasks === totalTasks) {
      return 'All committed deliverables for this sprint are verified and completed.';
    }
    if (blockerCount > 0) {
      return `${totalTasks} ${
        totalTasks === 1 ? 'task' : 'tasks'
      } assigned to this sprint across ${workloadCount} team member${
        workloadCount === 1 ? '' : 's'
      }. ${blockerCount} blocked item${
        blockerCount === 1 ? '' : 's'
      } require lead intervention.`;
    }
    if (completedTasks > 0) {
      return `${totalTasks} ${
        totalTasks === 1 ? 'task' : 'tasks'
      } in scope (${completedTasks} completed) across ${workloadCount} team member${
        workloadCount === 1 ? '' : 's'
      }.`;
    }
    return `${totalTasks} ${
      totalTasks === 1 ? 'task' : 'tasks'
    } assigned to this sprint across ${workloadCount} team member${
      workloadCount === 1 ? '' : 's'
    }. Tracking initial delivery cadence.`;
  }, [
    aiHealth,
    isPlanned,
    isCompleted,
    totalTasks,
    completedTasks,
    completionPercentage,
    blockerCount,
    workloadCount,
  ]);

  const aiRecommendations = useMemo(() => {
    if (aiHealth?.recommendations && aiHealth.recommendations.length > 0) {
      return aiHealth.recommendations;
    }
    const recs = [];

    if (isPlanned) {
      if (!sprint.goal) {
        recs.push(
          'Define an explicit sprint goal to establish team alignment on the primary iteration objective.'
        );
      }
      if ((metrics?.unestimatedCount || 0) > 0) {
        recs.push(
          `${metrics.unestimatedCount} task(s) lack story point estimates. Estimate them in the Backlog to calibrate burndown tracking.`
        );
      }
      if ((metrics?.unassignedCount || 0) > 0) {
        recs.push(
          `${metrics.unassignedCount} task(s) do not have an assignee. Assign them to team members before sprint kickoff.`
        );
      }
      if (recs.length === 0) {
        recs.push(
          'Planning checklist complete: sprint goal set, estimates assigned, and capacity verified.'
        );
      }
      return recs;
    }

    if (isCompleted) {
      recs.push(
        'Sprint cycle closed. Review retrospective summary and export final delivery CSV report.'
      );
      return recs;
    }

    // Active sprint
    if (!sprint.goal) {
      recs.push(
        'Define an explicit sprint goal to maintain delivery focus and squad alignment.'
      );
    }
    if ((metrics?.unestimatedCount || 0) > 0) {
      recs.push(
        `${metrics.unestimatedCount} task(s) lack story point estimates. Estimate them in the Backlog to calibrate burndown tracking.`
      );
    }
    if (metrics?.workload) {
      const overloaded = metrics.workload.filter((m) => m.count >= 6);
      if (overloaded.length > 0) {
        recs.push(
          `Workload bottleneck: ${overloaded
            .map((m) => m.name)
            .join(', ')} has ${overloaded[0].count} active tasks.`
        );
      }
    }
    if (blockerCount > 0) {
      recs.push(
        `${blockerCount} task(s) currently flagged with dependencies or blockers requiring lead unblocking.`
      );
    }
    if (recs.length === 0) {
      recs.push(
        'Maintain current cadence. No delivery bottlenecks or blocked paths detected.'
      );
    }
    return recs;
  }, [aiHealth, isPlanned, isCompleted, sprint.goal, metrics, blockerCount]);

  // Metric presentation helpers (distinguish measured 0 vs N/A vs Not estimated)
  const storyPointsDisplay = useMemo(() => {
    if (totalPoints > 0) {
      return `${completedPoints} / ${totalPoints}`;
    }
    if (totalTasks > 0 && totalPoints === 0) {
      return 'Not estimated';
    }
    return 'N/A';
  }, [totalPoints, completedPoints, totalTasks]);

  const flowEfficiencyDisplay = useMemo(() => {
    if (isPlanned) return 'N/A';
    if (metrics?.flowEfficiency && metrics.flowEfficiency !== 'N/A') {
      return metrics.flowEfficiency;
    }
    if (totalTasks > 0 && completedTasks > 0) {
      return `${Math.round((completedTasks / totalTasks) * 100)}%`;
    }
    return 'N/A';
  }, [isPlanned, metrics?.flowEfficiency, totalTasks, completedTasks]);

  const velocityDisplay = useMemo(() => {
    if (isPlanned) return 'N/A';
    if (completedTasks > 0) {
      return `${completedTasks}`;
    }
    // In active sprint with 0 completed tasks
    if (isActive) {
      return '0';
    }
    return 'N/A';
  }, [isPlanned, isActive, completedTasks]);

  return (
    <div className="bg-card border border-border-subtle rounded-md p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
      {/* ============================================================ */}
      {/* 1. SPRINT SELECTOR, STATUS, DATES, AND RELEVANT ACTIONS     */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-border-subtle">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Sprint Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isSprintDropdownOpen}
              onClick={() => setIsSprintDropdownOpen(!isSprintDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-md text-xs sm:text-sm font-bold transition-colors cursor-pointer max-w-full"
            >
              <Clock size={14} className="text-primary shrink-0" />
              <span className="truncate max-w-[140px] xs:max-w-[190px] sm:max-w-[280px]">
                {sprint.name}
              </span>
              <ChevronDown
                size={13}
                className={`text-text-subtle transition-transform duration-200 shrink-0 ${
                  isSprintDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isSprintDropdownOpen && (
              <div
                role="listbox"
                className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-card border border-border-subtle rounded-md shadow-xl py-1 z-50 animate-scale-up max-h-72 overflow-y-auto"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-text-subtler border-b border-border-subtle uppercase tracking-wider">
                  Select Iteration
                </div>
                {sprints.map((s) => {
                  const sid = s._id || s.id;
                  const isSelected = sid === (sprint._id || sprint.id);
                  const badge = getSprintStatusBadge(s.status);
                  return (
                    <button
                      key={sid}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSprintChange(sid);
                        setIsSprintDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text hover:bg-background-elevated'
                      }`}
                    >
                      <span className="truncate flex-1 mr-2">{s.name}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0 ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>

          {/* Neutral indication if scheduled start date has passed */}
          {isPastScheduledStart && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border bg-status-warning/10 text-status-warning border-status-warning/20 shrink-0"
              title="The scheduled start date has passed without activation."
            >
              <AlertCircle size={11} className="shrink-0" />
              <span>Scheduled start passed</span>
            </span>
          )}

          {/* Timeline & Duration */}
          <div className="flex items-center gap-1.5 text-xs text-text-subtle w-full xs:w-auto mt-0.5 xs:mt-0">
            <Calendar size={13} className="shrink-0 text-text-subtler" />
            <span className="truncate">
              {formattedStartDate && formattedEndDate
                ? `${formattedStartDate} – ${formattedEndDate}`
                : 'Dates not scheduled'}
            </span>
            {sprintDurationDays && (
              <>
                <span className="text-border-subtle">•</span>
                <span className="shrink-0">
                  {sprintDurationDays} {sprintDurationDays === 1 ? 'day' : 'days'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons based on actual Lifecycle Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Planned Sprint Actions: Start Sprint, Edit, Delete */}
          {isPlanned && canCreate && (
            <>
              {onStartSprint && (
                <button
                  type="button"
                  onClick={onStartSprint}
                  className="h-8 px-3 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Play size={12} className="fill-white" />
                  <span>Start sprint</span>
                </button>
              )}
              {onEditSprint && (
                <button
                  type="button"
                  onClick={onEditSprint}
                  aria-label="Edit sprint settings"
                  className="h-8 px-2.5 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Edit Sprint Settings"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              )}
              {onDeleteSprint && (
                <button
                  type="button"
                  onClick={onDeleteSprint}
                  aria-label="Delete planned sprint"
                  className="h-8 px-2.5 bg-background-elevated hover:bg-status-error/10 border border-border-subtle hover:border-status-error/30 text-text hover:text-status-error rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Delete Planned Sprint"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </>
          )}

          {/* Active Sprint Actions: Complete Sprint, Edit */}
          {isActive && canCreate && (
            <>
              <button
                type="button"
                onClick={onFinalize}
                disabled={finalizing}
                className="h-8 px-3 bg-status-success/10 hover:bg-status-success/20 border border-status-success/30 text-status-success rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 size={13} />
                <span>{finalizing ? 'Finalizing...' : 'Complete sprint'}</span>
              </button>
              {onEditSprint && (
                <button
                  type="button"
                  onClick={onEditSprint}
                  aria-label="Edit sprint goal and dates"
                  className="h-8 px-2.5 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Edit Sprint Goal & Dates"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              )}
            </>
          )}

          {/* Completed Sprint Actions: View Report */}
          {isCompleted && onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="h-8 px-3 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <BarChart3 size={13} className="text-primary" />
              <span>View Report</span>
            </button>
          )}

          {/* Export CSV Report (Always accessible) */}
          {canCreate && onDownload && (
            <button
              type="button"
              onClick={onDownload}
              aria-label="Download sprint report"
              className="h-8 px-2.5 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Download Sprint CSV Report"
            >
              <FileText size={13} className="text-primary" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SPRINT GOAL (Compact, Clear, Content-First)               */}
      {/* ============================================================ */}
      {!sprint.goal ? (
        <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-md border border-dashed border-border-subtle bg-background-elevated/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Target size={15} className="text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text block truncate">
                Sprint goal not defined
              </span>
              <span className="text-[11px] text-text-subtle block truncate">
                Add an objective for this sprint.
              </span>
            </div>
          </div>
          {canCreate && onEditSprint && (
            <button
              type="button"
              onClick={onEditSprint}
              className="h-7 px-2.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Target size={12} />
              <span>Set goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2.5 text-xs bg-background-elevated/30 border border-border-subtle rounded-md p-2.5 sm:p-3">
          <Target size={15} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-text uppercase tracking-wider text-[11px]">
                Sprint Goal
              </span>
              {canCreate && onEditSprint && (
                <button
                  type="button"
                  onClick={onEditSprint}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Edit goal
                </button>
              )}
            </div>
            <p className="text-xs text-text leading-relaxed mt-0.5 break-words">
              {sprint.goal}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TASK BREAKDOWN & DELIVERY METRICS (Flat, Content-First)   */}
      {/* ============================================================ */}
      <div className="space-y-2.5">
        {/* Task Breakdown: 5 Primary Metrics */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-text-subtler uppercase tracking-wider">
              Task Breakdown
            </span>
            <span className="text-[11px] text-text-subtle">
              {totalTasks} total {totalTasks === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 text-center">
            {/* Total Tasks */}
            <div className="p-2 sm:p-2.5 rounded bg-background-elevated/50 border border-border-subtle/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-text-subtle block truncate">
                Total
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-text block mt-0.5">
                {totalTasks}
              </span>
            </div>

            {/* To Do */}
            <div className="p-2 sm:p-2.5 rounded bg-background-elevated/50 border border-border-subtle/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-text-subtle block truncate">
                To Do
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-text block mt-0.5">
                {todoTasks}
              </span>
            </div>

            {/* In Progress */}
            <div className="p-2 sm:p-2.5 rounded bg-background-elevated/50 border border-border-subtle/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-status-warning block truncate">
                In Progress
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-status-warning block mt-0.5">
                {inProgressTasks}
              </span>
            </div>

            {/* In Review */}
            <div className="p-2 sm:p-2.5 rounded bg-background-elevated/50 border border-border-subtle/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-secondary block truncate">
                In Review
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-secondary block mt-0.5">
                {inReviewTasks}
              </span>
            </div>

            {/* Done */}
            <div className="p-2 sm:p-2.5 rounded bg-background-elevated/50 border border-border-subtle/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-status-success block truncate">
                Done
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-bold text-status-success block mt-0.5">
                {completedTasks}
              </span>
            </div>
          </div>
        </div>

        {/* Velocity & Estimation: 3 Secondary Metrics */}
        <div className="p-2 sm:p-2.5 rounded-md bg-background-elevated/30 border border-border-subtle/60 grid grid-cols-3 gap-2 text-center">
          {/* Story Points */}
          <div className="border-r border-border-subtle/50 pr-2">
            <span className="text-[10px] sm:text-[11px] text-text-subtler uppercase tracking-wider font-semibold block truncate">
              Story Points
            </span>
            <span
              className={`text-xs sm:text-sm font-bold block mt-0.5 truncate ${
                totalPoints > 0 ? 'text-primary' : 'text-text-subtle'
              }`}
            >
              {storyPointsDisplay}
            </span>
          </div>

          {/* Flow efficiency */}
          <div className="border-r border-border-subtle/50 px-2">
            <span className="text-[10px] sm:text-[11px] text-text-subtler uppercase tracking-wider font-semibold block truncate">
              Flow efficiency
            </span>
            <span className="text-xs sm:text-sm font-bold text-text block mt-0.5 truncate">
              {flowEfficiencyDisplay}
            </span>
          </div>

          {/* Workflow Velocity */}
          <div className="pl-2">
            <span className="text-[10px] sm:text-[11px] text-text-subtler uppercase tracking-wider font-semibold block truncate">
              Workflow velocity
            </span>
            <span className="text-xs sm:text-sm font-bold text-text block mt-0.5 truncate">
              {velocityDisplay}
              {velocityDisplay !== 'N/A' && (
                <span className="text-[10px] font-normal text-text-subtler ml-0.5">
                  tasks
                </span>
              )}
            </span>
          </div>
        </div>

        {totalTasks === 0 && !statsLoading && (
          <div className="p-2.5 bg-background-elevated/40 border border-border-subtle rounded-md text-xs text-text-subtle text-center">
            No tasks have been added to this sprint yet. Use the Backlog tab to add tasks.
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. TEAM WORKLOAD AND BLOCKERS (Scalable, Flat Structure)      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Left: Team Workload Drawer */}
        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={showWorkload}
            onClick={() => setShowWorkload(!showWorkload)}
            className="flex justify-between items-center w-full px-3.5 py-2.5 bg-background-elevated border border-border-subtle rounded-md hover:border-border transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Users size={15} className="text-primary shrink-0" />
              <span className="text-xs font-semibold text-text">Team workload</span>
              <span className="text-[11px] px-2 py-0.5 bg-card border border-border-subtle rounded text-text-subtle font-medium">
                {workloadSummary.totalMembers} {workloadSummary.totalMembers === 1 ? 'member' : 'members'}
              </span>
              {workloadSummary.highVolumeCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
                  {workloadSummary.highVolumeCount} high volume
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-subtle shrink-0">
              <span>{showWorkload ? 'Hide' : 'Show'}</span>
              {showWorkload ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </div>
          </button>

          {showWorkload && (
            <div className="border border-border-subtle rounded-md bg-background-elevated/40 p-2.5 space-y-2.5 animate-fade-in">
              {/* Summary Strip (Assigned, Unassigned, High Volume) */}
              {workloadSummary.totalMembers > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-card border border-border-subtle rounded text-center">
                  <div>
                    <div className="text-[10px] text-text-subtler uppercase tracking-wider font-semibold">
                      Members
                    </div>
                    <div className="text-xs font-bold text-text">
                      {workloadSummary.totalMembers}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-subtler uppercase tracking-wider font-semibold">
                      Assigned Tasks
                    </div>
                    <div className="text-xs font-bold text-text">
                      {workloadSummary.totalAssignedTasks}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-subtler uppercase tracking-wider font-semibold">
                      Unassigned
                    </div>
                    <div className="text-xs font-bold text-text">
                      {workloadSummary.unassignedTasks}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-subtler uppercase tracking-wider font-semibold">
                      High Volume (≥6)
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        workloadSummary.highVolumeCount > 0
                          ? 'text-status-warning'
                          : 'text-text-subtle'
                      }`}
                    >
                      {workloadSummary.highVolumeCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Search, Filter Tabs & Sort Controls (Displayed when members > 5 or active search) */}
              {(workloadSummary.totalMembers > 5 || memberSearch.trim() !== '') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtler"
                      />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search member by name..."
                        aria-label="Search members by name"
                        className="w-full pl-8 pr-7 py-1 text-xs bg-card border border-border-subtle rounded text-text placeholder:text-text-subtler focus:outline-none focus:border-primary"
                      />
                      {memberSearch && (
                        <button
                          type="button"
                          onClick={() => setMemberSearch('')}
                          aria-label="Clear member search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtler hover:text-text"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArrowUpDown size={12} className="text-text-subtler shrink-0" />
                      <select
                        value={memberSort}
                        onChange={(e) => setMemberSort(e.target.value)}
                        aria-label="Sort members"
                        className="text-[11px] py-1 px-2 bg-card border border-border-subtle rounded text-text focus:outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="TASKS_DESC">Most tasks</option>
                        <option value="TASKS_ASC">Fewest tasks</option>
                        <option value="NAME_ASC">Name (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMemberFilter('ALL')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        memberFilter === 'ALL'
                          ? 'bg-primary text-text-on-primary font-semibold'
                          : 'bg-card border border-border-subtle text-text-subtle hover:text-text'
                      }`}
                    >
                      All ({workloadSummary.totalMembers})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFilter('ACTIVE')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        memberFilter === 'ACTIVE'
                          ? 'bg-primary text-text-on-primary font-semibold'
                          : 'bg-card border border-border-subtle text-text-subtle hover:text-text'
                      }`}
                    >
                      Active ({workloadSummary.activeCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFilter('HIGH_VOLUME')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        memberFilter === 'HIGH_VOLUME'
                          ? 'bg-primary text-text-on-primary font-semibold'
                          : 'bg-card border border-border-subtle text-text-subtle hover:text-text'
                      }`}
                    >
                      High volume ({workloadSummary.highVolumeCount})
                    </button>
                    {workloadSummary.idleCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setMemberFilter('IDLE')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          memberFilter === 'IDLE'
                            ? 'bg-primary text-text-on-primary font-semibold'
                            : 'bg-card border border-border-subtle text-text-subtle hover:text-text'
                        }`}
                      >
                        Idle ({workloadSummary.idleCount})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Members List */}
              {paginatedMembers.length > 0 ? (
                <div className="divide-y divide-border-subtle/50">
                  {paginatedMembers.map((wp, idx) => {
                    const count = wp.count || 0;
                    const isHighVolume = count >= 6;
                    const initial = (wp.name || 'Member').charAt(0).toUpperCase();
                    return (
                      <div
                        key={wp._id || wp.id || idx}
                        className="py-2 px-2 flex items-center justify-between gap-3 hover:bg-background-elevated/60 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-card border border-border-subtle flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-text block truncate">
                              {wp.name}
                            </span>
                            <span className="text-[11px] text-text-subtle block">
                              {count} active {count === 1 ? 'task' : 'tasks'}
                              {typeof wp.storyPoints === 'number' && wp.storyPoints > 0 && ` · ${wp.storyPoints} pts`}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                            isHighVolume
                              ? 'bg-status-warning/10 text-status-warning border-status-warning/20 font-semibold'
                              : count > 0
                                ? 'bg-status-success/10 text-status-success border-status-success/20'
                                : 'bg-background-elevated text-text-subtler border-border-subtle'
                          }`}
                        >
                          {isHighVolume ? 'High volume' : count > 0 ? 'Active' : 'Idle'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-text-subtle space-y-1">
                  <div>
                    {memberSearch || memberFilter !== 'ALL'
                      ? 'No team members match your filter criteria.'
                      : 'No member task assignments recorded for this sprint yet.'}
                  </div>
                  {(memberSearch || memberFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearch('');
                        setMemberFilter('ALL');
                      }}
                      className="text-primary hover:underline text-[11px] font-medium"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              )}

              {/* Workload Pagination Footer */}
              {totalWorkloadPages > 1 && (
                <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs text-text-subtle">
                  <span className="text-[11px]">
                    {(currentWorkloadPage - 1) * WORKLOAD_PAGE_SIZE + 1}–
                    {Math.min(
                      currentWorkloadPage * WORKLOAD_PAGE_SIZE,
                      filteredAndSortedMembers.length
                    )}{' '}
                    of {filteredAndSortedMembers.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentWorkloadPage <= 1}
                      onClick={() => setWorkloadPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous workload page"
                      className="p-1 rounded border border-border-subtle hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed text-text"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="text-[11px] font-medium px-1">
                      {currentWorkloadPage} / {totalWorkloadPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentWorkloadPage >= totalWorkloadPages}
                      onClick={() =>
                        setWorkloadPage((p) => Math.min(totalWorkloadPages, p + 1))
                      }
                      aria-label="Next workload page"
                      className="p-1 rounded border border-border-subtle hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed text-text"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Active Blockers & Impediments */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-3.5 py-2.5 bg-background-elevated border border-border-subtle rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={15}
                className={
                  blockerCount > 0 ? 'text-status-error' : 'text-status-success'
                }
              />
              <span className="text-xs font-semibold text-text">
                Active Blockers & Impediments
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  blockerCount > 0
                    ? 'bg-status-error/10 text-status-error border-status-error/20'
                    : 'bg-status-success/10 text-status-success border-status-success/20'
                }`}
              >
                {blockerCount} {blockerCount === 1 ? 'blocker' : 'blockers'}
              </span>
              {blockerCount > 0 && onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('board')}
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
                >
                  <span>Board</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="border border-border-subtle rounded-md bg-background-elevated/40 p-2.5 space-y-2">
            {blockerCount > 0 ? (
              blockedTasksList.length > 0 ? (
                <div className="space-y-1.5">
                  {paginatedBlockers.map((task) => {
                    const assigneeName =
                      task.assignedTo?.name ||
                      task.assignedUser?.name ||
                      (typeof task.assignedTo === 'string'
                        ? task.assignedTo
                        : null);

                    return (
                      <div
                        key={task._id || task.id}
                        className="p-2 bg-card border border-status-error/20 rounded flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-error shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-text truncate block">
                              {task.title}
                            </span>
                            {assigneeName && (
                              <span className="text-[10px] text-text-subtler block truncate">
                                Assigned: {assigneeName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-status-error uppercase shrink-0 px-1.5 py-0.5 bg-status-error/10 rounded">
                          {task.priority || 'Blocked'}
                        </span>
                      </div>
                    );
                  })}

                  {/* Blocker Pagination Controls */}
                  {totalBlockerPages > 1 && (
                    <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-xs text-text-subtle">
                      <span className="text-[11px]">
                        {(currentBlockerPage - 1) * BLOCKER_PAGE_SIZE + 1}–
                        {Math.min(
                          currentBlockerPage * BLOCKER_PAGE_SIZE,
                          blockedTasksList.length
                        )}{' '}
                        of {blockedTasksList.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentBlockerPage <= 1}
                          onClick={() => setBlockerPage((p) => Math.max(1, p - 1))}
                          aria-label="Previous blockers page"
                          className="p-1 rounded border border-border-subtle hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed text-text"
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <span className="text-[11px] font-medium px-1">
                          {currentBlockerPage} / {totalBlockerPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentBlockerPage >= totalBlockerPages}
                          onClick={() =>
                            setBlockerPage((p) =>
                              Math.min(totalBlockerPages, p + 1)
                            )
                          }
                          aria-label="Next blockers page"
                          className="p-1 rounded border border-border-subtle hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed text-text"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2.5 px-2 flex items-center justify-between text-xs text-text-subtle">
                  <span>{blockerCount} task(s) flagged with blockers in sprint metrics.</span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('board')}
                      className="text-primary hover:underline text-[11px] font-medium"
                    >
                      View Board
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="py-2.5 px-2 flex items-center gap-2 text-xs text-text-subtle">
                <CheckCircle2 size={14} className="text-status-success shrink-0" />
                <span>0 active blockers: No delivery impediments or dependencies flagged.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. CONTEXTUAL, LIFECYCLE-AWARE SPRINT INSIGHTS               */}
      {/* ============================================================ */}
      <div className="bg-background-elevated/30 border border-border-subtle rounded-md p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-text">
              Sprint insights
              <span className="sr-only"> AI Sprint Health</span>
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
              aiLifecycleStatus === 'Planning readiness'
                ? 'bg-secondary/10 text-secondary border-secondary/20'
                : aiLifecycleStatus === 'Needs attention'
                  ? 'bg-status-warning/10 text-status-warning border-status-warning/20'
                  : 'bg-status-success/10 text-status-success border-status-success/20'
            }`}
          >
            {aiLifecycleStatus}
          </span>
        </div>

        <p className="text-xs text-text leading-relaxed">
          {aiLifecycleSummary}
        </p>

        {/* Actionable recommendations based on real data */}
        {aiRecommendations.length > 0 && (
          <div className="pt-2 border-t border-border-subtle/50 space-y-1.5">
            {aiRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-subtle">
                <span className="text-primary font-bold leading-none mt-0.5">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

SprintDetailsCard.propTypes = {
  sprint: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    goal: PropTypes.string,
    health: PropTypes.number,
    healthScore: PropTypes.number,
    pressureIndex: PropTypes.number,
    velocity: PropTypes.number,
  }).isRequired,
  metrics: PropTypes.shape({
    total: PropTypes.number,
    open: PropTypes.number,
    todo: PropTypes.number,
    active: PropTypes.number,
    review: PropTypes.number,
    completed: PropTypes.number,
    remaining: PropTypes.number,
    totalPoints: PropTypes.number,
    completedPoints: PropTypes.number,
    unestimatedCount: PropTypes.number,
    unassignedCount: PropTypes.number,
    blockerCount: PropTypes.number,
    overdueCount: PropTypes.number,
    flowEfficiency: PropTypes.string,
    velocity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    workload: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        count: PropTypes.number,
        storyPoints: PropTypes.number,
      })
    ),
    blockedTasks: PropTypes.array,
  }),
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
  showWorkload: PropTypes.bool.isRequired,
  setShowWorkload: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
  sprints: PropTypes.array,
  onSprintChange: PropTypes.func.isRequired,
  onFinalize: PropTypes.func,
  finalizing: PropTypes.bool,
  canCreate: PropTypes.bool,
  onStartSprint: PropTypes.func,
  onEditSprint: PropTypes.func,
  onDeleteSprint: PropTypes.func,
  onNavigateTab: PropTypes.func,
  aiHealth: PropTypes.shape({
    status: PropTypes.string,
    summary: PropTypes.string,
    recommendations: PropTypes.arrayOf(PropTypes.string),
    score: PropTypes.number,
  }),
  aiHealthLoading: PropTypes.bool,
};

export default SprintDetailsCard;
