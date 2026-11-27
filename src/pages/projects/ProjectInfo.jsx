import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Rocket,
  Clock,
  FolderKanban,
  AlertCircle,
  FolderPlus,
  RefreshCcw,
  LayoutDashboard,
  ListFilter,
  Columns3,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDashboard } from '../../hooks/useDashboard';
import { useSprintDetails } from '../../hooks/useSprintDetails';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../constants/auth';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import SprintCreationModal from '../../components/organisms/SprintCreationModal';
import SprintDetailsCard from '../../components/organisms/SprintDetailsCard';
import ProjectStatusList from '../../components/organisms/ProjectStatusList';
import SprintSummaryModal from '../../components/organisms/SprintSummaryModal';
import SprintStartModal from '../../components/organisms/SprintStartModal';
import SprintCompletionModal from '../../components/organisms/SprintCompletionModal';
import SprintEditModal from '../../components/organisms/SprintEditModal';
import SprintBacklogTab from '../../components/sprint/SprintBacklogTab';
import SprintBoardTab from '../../components/sprint/SprintBoardTab';
import SprintReportsTab from '../../components/sprint/SprintReportsTab';

const ProjectInfo = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSprintId = searchParams.get('sprintId');
  const { user } = useAuth();

  // Active navigation tab ('overview' | 'backlog' | 'board' | 'reports') directly synced with URL
  const activeTab = searchParams.get('tab') || 'overview';

  // Selected Sprint State initialized from URL or localStorage
  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    return urlSprintId || localStorage.getItem('nexa_selected_sprint_id');
  });

  // Modal display toggles
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    projects = [],
    isLoading,
    error,
    sprints = [],
    sprintStats,
    sprintStatsLoading,
    createSprint,
    createSprintLoading,
    linkProjectToSprint: handleLinkProject,
    createTicket,
    createTicketLoading,
    getFinalSummary,
    downloadSprintReport,
  } = useDashboard(selectedSprintId);

  const [finalSummary, setFinalSummary] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showWorkload, setShowWorkload] = useState(true);
  const [sprintData, setSprintData] = useState({
    name: '',
    project: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    goal: '',
  });

  // Filtering sprints based on user project access
  const sprintsForUser = useMemo(() => {
    if (!sprints || sprints.length === 0) return [];
    if (
      user?.role === USER_ROLES.WORKSPACE_ADMIN ||
      user?.role === USER_ROLES.WORKSPACE_MANAGER ||
      user?.role === USER_ROLES.TECH_LEAD
    ) {
      return sprints;
    }

    const userProjectIds = projects.map((p) => p._id);
    return sprints.filter((s) => {
      const pid = s.project?._id || s.project;
      return !pid || userProjectIds.includes(pid);
    });
  }, [sprints, user, projects]);

  // Synchronize sprint selection with URL search parameters and localStorage
  useEffect(() => {
    if (!sprintsForUser || sprintsForUser.length === 0) {
      if (selectedSprintId) {
        setSelectedSprintId(null);
      }
      return;
    }

    // Priority 1: Valid URL parameter
    if (urlSprintId && sprintsForUser.some((s) => (s._id || s.id) === urlSprintId)) {
      localStorage.setItem('nexa_selected_sprint_id', urlSprintId);
      if (selectedSprintId !== urlSprintId) {
        setSelectedSprintId(urlSprintId);
      }
      return;
    }

    // Priority 2: Currently selected sprint if valid
    const isCurrentValid =
      selectedSprintId && sprintsForUser.some((s) => (s._id || s.id) === selectedSprintId);
    if (isCurrentValid) {
      if (urlSprintId !== selectedSprintId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('sprintId', selectedSprintId);
            return next;
          },
          { replace: true }
        );
      }
      return;
    }

    // Priority 3: Stored ID in localStorage
    const storedId = localStorage.getItem('nexa_selected_sprint_id');
    if (storedId && sprintsForUser.some((s) => (s._id || s.id) === storedId)) {
      setSelectedSprintId(storedId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('sprintId', storedId);
          return next;
        },
        { replace: true }
      );
      return;
    }

    // Priority 4: Active or first available sprint
    const active =
      sprintsForUser.find((s) => s.status === 'active' || s.status === 'in_progress') ||
      sprintsForUser[0];
    if (active) {
      const targetId = active._id || active.id;
      setSelectedSprintId(targetId);
      localStorage.setItem('nexa_selected_sprint_id', targetId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('sprintId', targetId);
          return next;
        },
        { replace: true }
      );
    }
  }, [sprintsForUser, urlSprintId, selectedSprintId, setSearchParams]);

  // Handler for explicit sprint change
  const handleSprintChange = useCallback(
    (newId) => {
      setSelectedSprintId(newId);
      localStorage.setItem('nexa_selected_sprint_id', newId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('sprintId', newId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Handler for tab change
  const handleTabChange = useCallback(
    (tabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tabId === 'overview') {
            next.delete('tab');
          } else {
            next.set('tab', tabId);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectedSprintData = useMemo(() => {
    if (!sprints || sprints.length === 0 || !selectedSprintId) return null;
    return sprints.find((s) => (s._id || s.id) === selectedSprintId) || null;
  }, [sprints, selectedSprintId]);

  // Comprehensive sprint details hook (tasks, backlog, burndown, aiPlan, aiHealth, mutations)
  const sprintDetails =
    useSprintDetails?.(
      selectedSprintId,
      selectedSprintData?.project?._id || selectedSprintData?.project
    ) || {};

  const {
    tasks = [],
    backlog = [],
    tasksLoading = false,
    burndown = null,
    burndownLoading = false,
    aiPlan = null,
    aiPlanLoading = false,
    aiHealth = null,
    aiHealthLoading = false,
    startSprint,
    startSprintLoading = false,
    completeSprint,
    completeSprintLoading = false,
    updateSprint,
    updateSprintLoading = false,
    moveTask = () => {},
    addTaskToSprint = () => {},
    removeTask = () => {},
    setStoryPoints = () => {},
    deleteSprint,
    isDeletingSprint = false,
  } = sprintDetails;

  // Single-source-of-truth sprint metrics computation
  const sprintMetrics = useMemo(() => {
    const raw = sprintStats?.metrics?.raw;
    const otherMetrics = sprintStats?.metrics || {};
    const hasLiveTasks = Array.isArray(tasks) && tasks.length > 0;

    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let inReview = 0;
    let todo = 0;

    // Prioritize raw from stats if available, otherwise calculate from live tasks
    if (raw && typeof raw.total === 'number') {
      total = raw.total;
      completed = raw.completed ?? 0;
      inProgress = raw.inProgress ?? 0;
      inReview = raw.inReview ?? 0;
      todo = raw.totalOpen ?? Math.max(0, total - (completed + inProgress + inReview));
    } else if (hasLiveTasks) {
      total = tasks.length;
      completed = tasks.filter(
        (t) => t.status === 'done' || t.status === 'completed'
      ).length;
      inProgress = tasks.filter(
        (t) => t.status === 'in_progress' || t.status === 'progress'
      ).length;
      inReview = tasks.filter(
        (t) => t.status === 'in_review' || t.status === 'review'
      ).length;
      todo = tasks.filter(
        (t) =>
          t.status === 'todo' ||
          !['in_progress', 'progress', 'in_review', 'review', 'done', 'completed'].includes(
            t.status
          )
      ).length;
    }

    // Story Points
    const totalPoints =
      typeof otherMetrics.totalPoints === 'number'
        ? otherMetrics.totalPoints
        : hasLiveTasks
        ? tasks.reduce(
            (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
            0
          )
        : 0;

    const completedPoints =
      typeof otherMetrics.completedPoints === 'number'
        ? otherMetrics.completedPoints
        : hasLiveTasks
        ? tasks
            .filter((t) => t.status === 'done' || t.status === 'completed')
            .reduce(
              (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
              0
            )
        : 0;

    const unestimatedCount =
      typeof otherMetrics.unestimatedCount === 'number'
        ? otherMetrics.unestimatedCount
        : hasLiveTasks
        ? tasks.filter((t) => t.storyPoints == null).length
        : 0;

    const unassignedCount =
      typeof otherMetrics.unassignedCount === 'number'
        ? otherMetrics.unassignedCount
        : hasLiveTasks
        ? tasks.filter((t) => !t.assignedTo && !t.assignedUser).length
        : 0;

    const blockedTasks = hasLiveTasks
      ? tasks.filter(
          (t) => t.isBlocked || t.status === 'blocked' || (t.blockers && t.blockers.length > 0)
        )
      : [];

    const blockerCount =
      raw?.blockers ??
      (blockedTasks.length > 0
        ? blockedTasks.length
        : typeof otherMetrics.blockerDensity === 'number'
        ? otherMetrics.blockerDensity
        : 0);

    // Workload: use backend workload if present, else derive from live tasks (excluding 'unassigned')
    let workload = [];
    if (otherMetrics.workload && otherMetrics.workload.length > 0) {
      workload = otherMetrics.workload.filter(
        (m) => m && m.name && m.name.toLowerCase() !== 'unassigned' && m._id !== 'unassigned'
      );
    } else if (hasLiveTasks) {
      const memberMap = new Map();
      tasks.forEach((t) => {
        const member = t.assignedUser || t.assignedTo;
        if (member && (member._id || member.id || typeof member === 'string')) {
          const id = member._id || member.id || member;
          const name = member.name || (typeof member === 'string' ? member : 'Member');
          if (name.toLowerCase() === 'unassigned') return;
          if (!memberMap.has(id)) {
            memberMap.set(id, { _id: id, name, count: 0, storyPoints: 0 });
          }
          const m = memberMap.get(id);
          m.count += 1;
          if (typeof t.storyPoints === 'number') m.storyPoints += t.storyPoints;
        }
      });
      workload = Array.from(memberMap.values());
    }

    const isPlanned =
      selectedSprintData?.status === 'planned' ||
      selectedSprintData?.status === 'planning' ||
      selectedSprintData?.status === 'upcoming' ||
      selectedSprintData?.status === 'draft';

    const flowEfficiency =
      isPlanned
        ? 'N/A'
        : total > 0
        ? otherMetrics.flowEfficiency || `${Math.round((completed / total) * 100)}%`
        : 'N/A';

    return {
      ...otherMetrics,
      total,
      open: todo,
      todo,
      active: inProgress,
      review: inReview,
      completed,
      remaining: Math.max(0, total - completed),
      totalPoints,
      completedPoints,
      unestimatedCount,
      unassignedCount,
      blockedTasks,
      blockerCount,
      overdueCount:
        raw?.overdue ??
        (typeof otherMetrics.strategicDebt === 'number' ? otherMetrics.strategicDebt : 0),
      workload,
      flowEfficiency,
      health: selectedSprintData?.healthScore || otherMetrics.healthScore || 0,
      pressure: selectedSprintData?.pressureIndex || otherMetrics.pressureIndex || 0,
      velocity: isPlanned ? 'N/A' : completed,
    };
  }, [sprintStats, tasks, selectedSprintData]);

  const canCreate =
    user?.role === USER_ROLES.WORKSPACE_ADMIN ||
    user?.role === USER_ROLES.WORKSPACE_MANAGER ||
    user?.role === USER_ROLES.TECH_LEAD;

  const submitSprint = (e) => {
    e.preventDefault();
    if (!sprintData.name?.trim() || !sprintData.project) {
      toast.error('Sprint name and associated project are required');
      return;
    }
    if (new Date(sprintData.endDate) < new Date(sprintData.startDate)) {
      toast.error('End date must be on or after the start date.');
      return;
    }
    createSprint(sprintData, {
      onSuccess: (res) => {
        toast.success('Sprint created successfully');
        const newId = res.data?.sprint?._id || res.data?.sprint?.id;
        if (newId) {
          handleSprintChange(newId);
        }
        setShowSprintForm(false);
        setSprintData({
          name: '',
          project: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          goal: '',
        });
      },
      onError: (err) => {
        toast.error(err?.message || 'Failed to create sprint');
      },
    });
  };

  const handleDeleteSprint = async () => {
    if (!selectedSprintId || !canCreate) return;
    if (
      window.confirm(
        `Are you sure you want to delete "${selectedSprintData?.name}"? Tasks assigned to this sprint will be returned to the product backlog.`
      )
    ) {
      try {
        if (deleteSprint) {
          await deleteSprint();
        }
        const remaining = sprintsForUser.filter(
          (s) => (s._id || s.id) !== selectedSprintId
        );
        if (remaining.length > 0) {
          handleSprintChange(remaining[0]._id || remaining[0].id);
        } else {
          setSelectedSprintId(null);
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to delete sprint');
      }
    }
  };

  const finalizeSelection = async () => {
    if (!canCreate) {
      toast.error("You don't have permission to complete this sprint.");
      return;
    }
    if (!selectedSprintId) return;
    setFinalizing(true);
    try {
      const summary = await getFinalSummary(selectedSprintId);
      setFinalSummary(summary);
      toast.success('Sprint finalized successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to finalize sprint');
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedSprintId) return;
    try {
      const reportData = await downloadSprintReport(selectedSprintId);
      const reportTasks = reportData?.tasks || tasks || [];
      const headers = [
        'Sprint',
        'Task Title',
        'Project',
        'Assigned To',
        'Status',
        'Priority',
        'Story Points',
        'Due Date',
      ];
      const sprintName = reportData?.sprint?.name || selectedSprintData?.name || 'Sprint';

      const csvContent = [
        headers.join(','),
        ...reportTasks.map((t) => {
          const escape = (val) =>
            `"${(val || '').toString().replace(/"/g, '""')}"`;
          return [
            escape(sprintName),
            escape(t.title),
            escape(t.project?.name || t.project),
            escape(t.assignedTo?.name || t.assignedUser?.name || t.assignedTo),
            escape(t.status),
            escape(t.priority),
            escape(t.storyPoints != null ? t.storyPoints : ''),
            escape(t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''),
          ].join(',');
        }),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint-report-${selectedSprintId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Sprint report exported');
    } catch (err) {
      console.error('Failed to download sprint report:', err);
      toast.error('Failed to export sprint report');
    }
  };

  const handleLinkProjectWithFeedback = async (projectId) => {
    try {
      await handleLinkProject(projectId);
      toast.success('Project assigned to the selected sprint');
    } catch (err) {
      toast.error(err?.message || 'Failed to assign project to sprint');
    }
  };

  const handleQuickTask = async ({ title, project, sprint, storyPoints }) => {
    return new Promise((resolve, reject) => {
      createTicket(
        { title, project, sprint: sprint || selectedSprintId, storyPoints },
        {
          onSuccess: (res) => {
            toast.success('Task created successfully');
            resolve(res);
          },
          onError: (err) => {
            toast.error(err?.message || 'Failed to create task');
            reject(err);
          },
        }
      );
    });
  };

  if (isLoading) return <CenteredLoading />;

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle size={40} className="text-status-error" />
        <h2 className="text-lg font-bold text-text">Failed to load sprints</h2>
        <p className="text-xs text-text-subtle max-w-sm">
          We encountered an issue loading sprint data. Please verify your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCcw size={13} />
          <span>Reload</span>
        </button>
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;
  const hasSprints = sprintsForUser && sprintsForUser.length > 0;

  const tabsConfig = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'backlog',
      label: 'Backlog',
      icon: ListFilter,
      count: (tasks.length || 0) + (backlog.length || 0),
    },
    {
      id: 'board',
      label: 'Board',
      icon: Columns3,
      count: tasks.length || 0,
    },
    { id: 'reports', label: 'Reports', icon: TrendingDown },
  ];

  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 pb-20 sm:pb-12 font-sans">
      <div className="w-full space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        {/* Modals */}
        <SprintCreationModal
          show={showSprintForm}
          onClose={() => setShowSprintForm(false)}
          sprintData={sprintData}
          setSprintData={setSprintData}
          onSubmit={submitSprint}
          isLoading={createSprintLoading}
          projects={projects}
        />

        <SprintStartModal
          show={showStartModal}
          onClose={() => setShowStartModal(false)}
          sprint={selectedSprintData}
          tasks={tasks}
          tasksLoading={tasksLoading}
          onConfirm={async () => {
            if (!startSprint) return;
            await startSprint(selectedSprintId);
            setShowStartModal(false);
          }}
          isLoading={startSprintLoading || sprintDetails?.isStarting}
        />

        <SprintCompletionModal
          show={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          sprint={selectedSprintData}
          tasks={tasks}
          availableSprints={sprintsForUser.filter(
            (s) =>
              (s._id || s.id) !== selectedSprintId &&
              s.status !== 'completed'
          )}
          onConfirm={async (rolloverData) => {
            if (!completeSprint) return;
            await completeSprint(rolloverData);
            setShowCompleteModal(false);
            await finalizeSelection();
          }}
          isLoading={completeSprintLoading}
        />

        <SprintEditModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          sprint={selectedSprintData}
          onSubmit={async (data) => {
            if (!updateSprint) return;
            try {
              await updateSprint(data);
              setShowEditModal(false);
            } catch {
              // preserve modal state on error
            }
          }}
          isLoading={updateSprintLoading}
        />

        <SprintSummaryModal
          finalSummary={finalSummary}
          setFinalSummary={setFinalSummary}
        />

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border-subtle">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-text">
                Sprints
              </h1>
              <span className="text-xs font-semibold text-text-subtle bg-background-elevated border border-border-subtle px-2 py-0.5 rounded-md hidden sm:inline-flex">
                Sprint Dashboard
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-subtle hidden sm:block">
              Manage iterations, track delivery velocity, and allocate project deliverables.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-text-subtle bg-background-elevated border border-border-subtle px-2.5 sm:px-3 py-1.5 rounded-md">
              <Clock size={12} className="text-primary shrink-0" />
              <span>
                {sprintsForUser.length} {sprintsForUser.length === 1 ? 'sprint' : 'sprints'}
              </span>
              <span className="text-border-subtle">•</span>
              <FolderKanban size={12} className="text-secondary shrink-0" />
              <span>
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {canCreate && (
              hasProjects ? (
                <button
                  type="button"
                  onClick={() => setShowSprintForm(true)}
                  className="h-8 sm:h-9 px-3 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Create sprint</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/project-setup')}
                  className="h-8 sm:h-9 px-3 sm:px-4 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Create project</span>
                </button>
              )
            )}
          </div>
        </header>

        {/* 2. Main Content Views */}
        <div className="space-y-4 sm:space-y-6">
          {/* Case A: Workspace has no projects */}
          {!hasProjects ? (
            <div className="bg-card border border-border-subtle rounded-md p-6 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xs bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                <FolderPlus size={24} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-text">
                  No projects in this workspace
                </h3>
                <p className="text-xs text-text-subtle leading-relaxed">
                  Sprints require an active project to track deliverables, tasks, and velocity. Create your first project to start planning iterations.
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => navigate('/project-setup')}
                  className="h-9 px-5 bg-primary hover:bg-primary-hover text-white rounded-xs text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create project</span>
                </button>
              )}
            </div>
          ) : !hasSprints ? (
            /* Case B: Projects exist, but no sprints created yet */
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card border border-border-subtle rounded-md p-6 sm:p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-xs bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                  <Rocket size={24} />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-text">
                    No active sprints
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    No sprints created yet. Create a sprint to start planning work, tracking delivery pace, and organizing task assignments.
                  </p>
                </div>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setShowSprintForm(true)}
                    className="h-9 px-5 bg-primary hover:bg-primary-hover text-white rounded-xs text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Create sprint</span>
                  </button>
                )}
              </div>

              {/* Project Inventory */}
              <ProjectStatusList
                projects={projects}
                selectedSprintId={null}
                onLinkProject={handleLinkProjectWithFeedback}
                onCreateTask={handleQuickTask}
                createTaskLoading={createTicketLoading}
                canManage={canCreate}
              />
            </div>
          ) : (
            /* Case C: Sprints exist */
            <div className="space-y-4 sm:space-y-6">
              {/* Sprint Navigation Tabs */}
              <div className="border-b border-border-subtle -mx-3 px-3 sm:mx-0 sm:px-0">
                <nav
                  className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px scroll-smooth no-scrollbar"
                  role="tablist"
                  aria-label="Sprint management views"
                >
                  {tabsConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleTabChange(tab.id)}
                        className={`h-9 px-3 sm:px-4 text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-subtle hover:text-text hover:border-border-subtle'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span>{tab.label}</span>
                        {typeof tab.count === 'number' && tab.count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-background-elevated text-text-subtler border border-border-subtle'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {selectedSprintData && (
                    <SprintDetailsCard
                      sprint={selectedSprintData}
                      metrics={sprintMetrics}
                      stats={sprintStats}
                      statsLoading={sprintStatsLoading}
                      showWorkload={showWorkload}
                      setShowWorkload={setShowWorkload}
                      onDownload={handleDownload}
                      sprints={sprintsForUser}
                      onSprintChange={handleSprintChange}
                      onFinalize={finalizeSelection}
                      finalizing={finalizing}
                      canCreate={canCreate}
                      onStartSprint={() => setShowStartModal(true)}
                      onEditSprint={() => setShowEditModal(true)}
                      onDeleteSprint={handleDeleteSprint}
                      onNavigateTab={handleTabChange}
                      aiHealth={aiHealth}
                      aiHealthLoading={aiHealthLoading}
                    />
                  )}
                </div>
              )}

              {/* Tab 2: Backlog */}
              {activeTab === 'backlog' && (
                <SprintBacklogTab
                  sprint={selectedSprintData}
                  tasks={tasks}
                  backlog={backlog}
                  onAddTaskToSprint={addTaskToSprint}
                  onRemoveTaskFromSprint={removeTask}
                  onUpdatePoints={(taskId, points) =>
                    setStoryPoints({ taskId, storyPoints: points })
                  }
                  onCreateQuickTask={handleQuickTask}
                  aiPlan={aiPlan}
                  aiPlanLoading={aiPlanLoading}
                  canManage={canCreate}
                />
              )}

              {/* Tab 3: Board */}
              {activeTab === 'board' && (
                <SprintBoardTab
                  tasks={tasks}
                  onUpdateTaskStatus={(arg1, arg2) => {
                    if (typeof arg1 === 'object' && arg1 !== null) {
                      moveTask({
                        taskId: arg1.taskId,
                        status: arg1.newStatus || arg1.status,
                      });
                    } else {
                      moveTask({ taskId: arg1, status: arg2 });
                    }
                  }}
                  canManage={canCreate}
                />
              )}

              {/* Tab 4: Reports */}
              {activeTab === 'reports' && (
                <SprintReportsTab
                  sprint={selectedSprintData}
                  tasks={tasks}
                  burndown={burndown}
                  burndownLoading={burndownLoading}
                  allSprints={sprintsForUser}
                  onSelectSprint={handleSprintChange}
                  onExportCsv={handleDownload}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
