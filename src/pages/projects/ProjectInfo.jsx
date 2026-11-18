import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Rocket,
  Clock,
  FolderKanban,
  AlertCircle,
  FolderPlus,
  RefreshCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../constants/auth';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import SprintCreationModal from '../../components/organisms/SprintCreationModal';
import SprintDetailsCard from '../../components/organisms/SprintDetailsCard';
import ProjectStatusList from '../../components/organisms/ProjectStatusList';
import SprintSummaryModal from '../../components/organisms/SprintSummaryModal';

const ProjectInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Persistence for Active Sprint
  const [selectedSprintId, setSelectedSprintId] = useState(() =>
    localStorage.getItem('nexa_selected_sprint_id')
  );
  const [showSprintForm, setShowSprintForm] = useState(false);

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
  });

  // Sync selected sprint ID with localStorage
  useEffect(() => {
    if (selectedSprintId) {
      localStorage.setItem('nexa_selected_sprint_id', selectedSprintId);
    }
  }, [selectedSprintId]);

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

  // Initial and fallback selection logic
  useEffect(() => {
    if (sprintsForUser && sprintsForUser.length > 0) {
      const sprintExists = sprintsForUser.some((s) => (s._id || s.id) === selectedSprintId);
      if (!selectedSprintId || !sprintExists) {
        const active =
          sprintsForUser.find((s) => s.status === 'active' || s.status === 'in_progress') ||
          sprintsForUser[0];
        if (active) setSelectedSprintId(active._id || active.id);
      }
    } else {
      setSelectedSprintId(null);
    }
  }, [sprintsForUser, selectedSprintId]);

  const selectedSprintData = useMemo(() => {
    if (!sprints || sprints.length === 0 || !selectedSprintId) return null;
    return sprints.find((s) => (s._id || s.id) === selectedSprintId) || null;
  }, [sprints, selectedSprintId]);

  // Normalize sprint metrics safely with N/A support
  const sprintMetrics = useMemo(() => {
    if (!sprintStats?.metrics) {
      if (!selectedSprintData) return null;
      return {
        health: selectedSprintData.health || 0,
        pressure: selectedSprintData.pressureIndex || 0,
        velocity: selectedSprintData.velocity || 0,
        open: 0,
        active: 0,
        review: 0,
        completed: 0,
        velocitySpark: [],
        flowEfficiency: '0%',
        strategicDebt: 0,
        blockerCount: 0,
        workload: [],
      };
    }

    const { raw, ...otherMetrics } = sprintStats.metrics;
    return {
      ...otherMetrics,
      open: raw?.totalOpen ?? 0,
      active: raw?.inProgress ?? 0,
      review: raw?.inReview ?? 0,
      completed: raw?.completed ?? 0,
      health: selectedSprintData?.healthScore || otherMetrics.healthScore || 0,
      pressure: selectedSprintData?.pressureIndex || otherMetrics.pressureIndex || 0,
      velocity: raw?.completed ?? 0,
      blockerCount: raw?.blockers ?? (typeof otherMetrics.blockerDensity === 'number' ? otherMetrics.blockerDensity : 0),
      overdueCount: raw?.overdue ?? (typeof otherMetrics.strategicDebt === 'number' ? otherMetrics.strategicDebt : 0),
      workload: otherMetrics.workload || [],
    };
  }, [sprintStats, selectedSprintData]);

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
    createSprint(sprintData, {
      onSuccess: (res) => {
        toast.success('Sprint created successfully');
        const newId = res.data?.sprint?._id || res.data?.sprint?.id;
        if (newId) setSelectedSprintId(newId);
        setShowSprintForm(false);
        setSprintData({
          name: '',
          project: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        });
      },
      onError: (err) => {
        toast.error(err?.message || 'Failed to create sprint');
      },
    });
  };

  const finalizeSelection = async () => {
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
      const tasks = reportData?.tasks || [];
      const headers = [
        'Sprint',
        'Task Title',
        'Project',
        'Assigned To',
        'Status',
        'Priority',
        'Due Date',
      ];
      const sprintName = reportData?.sprint?.name || selectedSprintData?.name || 'Sprint';

      const csvContent = [
        headers.join(','),
        ...tasks.map((t) => {
          const escape = (val) =>
            `"${(val || '').toString().replace(/"/g, '""')}"`;
          return [
            escape(sprintName),
            escape(t.title),
            escape(t.project?.name || t.project),
            escape(t.assignedTo?.name || t.assignedTo),
            escape(t.status),
            escape(t.priority),
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
      toast.success('Project assigned to sprint');
    } catch (err) {
      toast.error(err?.message || 'Failed to assign project to sprint');
    }
  };

  const handleQuickTask = async ({ title, project, sprint }) => {
    return new Promise((resolve, reject) => {
      createTicket(
        { title, project, sprint },
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

  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 font-sans">
      <div className="w-full space-y-6 max-w-7xl mx-auto">
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

        <SprintSummaryModal
          finalSummary={finalSummary}
          setFinalSummary={setFinalSummary}
        />

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                Sprint Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-text-subtle">
              Manage iterations, track delivery velocity, and allocate project deliverables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-subtle bg-background-elevated border border-border-subtle px-3 py-1.5 rounded-xs">
              <Clock size={13} className="text-primary" />
              <span>
                {sprintsForUser.length} {sprintsForUser.length === 1 ? 'sprint' : 'sprints'}
              </span>
              <span className="text-border-subtle">•</span>
              <FolderKanban size={13} className="text-secondary" />
              <span>
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {canCreate && (
              hasProjects ? (
                <button
                  type="button"
                  onClick={() => setShowSprintForm(true)}
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-white rounded-xs text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create sprint</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/project-setup')}
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-white rounded-xs text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create project</span>
                </button>
              )
            )}
          </div>
        </header>

        {/* 2. Main Content Views */}
        <div className="space-y-6">
          {/* Case A: Workspace has no projects */}
          {!hasProjects ? (
            <div className="bg-card border border-border-subtle rounded-md p-8 sm:p-12 text-center space-y-4">
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
            <div className="space-y-6">
              <div className="bg-card border border-border-subtle rounded-md p-8 sm:p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-xs bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                  <Rocket size={24} />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-text">
                    No active sprints
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    Plan iteration goals, track delivery pace, and organize task assignments across your projects.
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

              {/* Still display project inventory so projects can be viewed */}
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
            <div className="space-y-6">
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
                  onSprintChange={(id) => setSelectedSprintId(id)}
                  onFinalize={finalizeSelection}
                  finalizing={finalizing}
                  canCreate={canCreate}
                />
              )}

              {/* Project Inventory */}
              <ProjectStatusList
                projects={projects}
                selectedSprintId={selectedSprintId}
                onLinkProject={handleLinkProjectWithFeedback}
                onCreateTask={handleQuickTask}
                createTaskLoading={createTicketLoading}
                canManage={canCreate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
