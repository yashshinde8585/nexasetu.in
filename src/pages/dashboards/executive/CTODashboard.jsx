import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import ProjectService from '../../../api/projectApi';
import DashboardSection from '../../../components/molecules/dashboard/DashboardSection';
import StatusIndicator from '../../../components/molecules/dashboard/StatusIndicator';
import FunctionalCard from '../../../components/molecules/dashboard/FunctionalCard';
import PipelineStep from '../../../components/molecules/dashboard/PipelineStep';
import BlockerCategory from '../../../components/molecules/dashboard/BlockerCategory';
import DrilldownModal from '../../../components/molecules/dashboard/DrilldownModal';
import StrategicInsights from '../../../components/molecules/dashboard/StrategicInsights';
import CenteredLoading from '../../../components/atoms/CenteredLoading';

import {
  LayoutGrid,
  Zap,
  AlertTriangle,
  FolderGit2,
  FolderPlus,
  Plus,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

const CTODashboard = () => {
  const { data, isLoading, error, drilldown, handleDrilldown, closeDrilldown } =
    useRoleDashboard('cto');

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () =>
      ProjectService.getProjects().then(
        (res) => res.data?.projects || res.data || []
      ),
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const hasProjects = projects.length > 0;

  if (isLoading || projectsLoading || !data) return <CenteredLoading />;

  if (error) {
    return (
      <div className="p-8 text-status-error bg-background min-h-screen font-mono font-bold uppercase text-center flex flex-col items-center justify-center border border-status-error/20">
        <AlertTriangle size={36} className="mb-3 text-status-error" />
        <span>
          {error?.message || 'Unable to load dashboard. Please try again.'}
        </span>
      </div>
    );
  }

  const {
    global = {},
    functionalBreakdown = {},
    functionalTable = [],
    blockers = {},
    pipeline = {},
  } = data || {};

  const leadership = functionalBreakdown.engineeringLeadership || {};
  const engineering = functionalBreakdown.engineeringIC || {};

  // Active projects count
  const activeProjectsCount = hasProjects
    ? projects.filter((p) => p.status !== 'archived').length
    : leadership.activeProjects || 0;

  // Pipeline calculations
  const totalPipeline =
    (pipeline.backlog || 0) +
    (pipeline.dev || 0) +
    (pipeline.qa || 0) +
    (pipeline.release || 0);

  const getPipelineProgress = (val) =>
    totalPipeline > 0 ? (val / totalPipeline) * 100 : 0;

  // Blocker calculations
  const totalBlockers = global.totalBlockers || 0;
  const hasBlockers =
    (blockers.engineering?.length || 0) > 0 ||
    (blockers.qa?.length || 0) > 0 ||
    (blockers.hr?.length || 0) > 0;

  // Data availability checks for conditional rendering
  const hasLeadershipData =
    (leadership.activeProjects || 0) > 0 ||
    (leadership.decisionsPending || 0) > 0 ||
    (leadership.delayed || 0) > 0;

  const hasExecutionData =
    (engineering.totalEngineers || 0) > 0 ||
    (engineering.avgLoad || 0) > 0 ||
    (engineering.completionRate || 0) > 0;

  const hasExecutiveCards = hasLeadershipData || hasExecutionData;

  const hasDepartmentData =
    Array.isArray(functionalTable) &&
    functionalTable.some(
      (row) =>
        (row.load || 0) > 0 ||
        (row.blockers || 0) > 0 ||
        (row.delay && row.delay !== '0d')
    );

  const hasPipelineData = totalPipeline > 0;

  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 font-sans selection:bg-primary selection:text-text max-w-screen-2xl mx-auto space-y-4 sm:space-y-6 pb-12 sm:pb-6">
      {/* 1. Executive Overview: Unified Metric Strip (4 Core Metrics) */}
      <div
        id="cto-performance-strip"
        className="bg-card border border-border-subtle rounded-xl p-3 sm:p-5 shadow-xs grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-0 lg:divide-x lg:divide-border-subtle/50"
      >
        <div className="p-2 sm:px-4 sm:py-1 flex items-center gap-2.5 sm:gap-3.5 bg-background-elevated/40 sm:bg-transparent rounded-lg sm:rounded-none min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-background-elevated border border-border-subtle/60 flex items-center justify-center text-text-subtle shrink-0">
            <FolderGit2 size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-medium text-text-subtle block leading-tight">
              Active Projects
            </span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-text leading-none block mt-1">
              {activeProjectsCount}
            </span>
          </div>
        </div>

        <div className="p-2 sm:px-4 sm:py-1 flex items-center gap-2.5 sm:gap-3.5 bg-background-elevated/40 sm:bg-transparent rounded-lg sm:rounded-none min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-background-elevated border border-border-subtle/60 flex items-center justify-center shrink-0 ${
              (global.projectsAtRisk || 0) > 0
                ? 'text-status-error'
                : 'text-text-subtle'
            }`}
          >
            <AlertTriangle size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-medium text-text-subtle block leading-tight">
              Projects at Risk
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-none block mt-1 ${
                (global.projectsAtRisk || 0) > 0
                  ? 'text-status-error'
                  : 'text-text'
              }`}
            >
              {global.projectsAtRisk || 0}
            </span>
          </div>
        </div>

        <div className="p-2 sm:px-4 sm:py-1 flex items-center gap-2.5 sm:gap-3.5 bg-background-elevated/40 sm:bg-transparent rounded-lg sm:rounded-none min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-background-elevated border border-border-subtle/60 flex items-center justify-center shrink-0 ${
              totalBlockers > 0 ? 'text-status-warning' : 'text-text-subtle'
            }`}
          >
            <ShieldAlert size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-medium text-text-subtle block leading-tight">
              Active Blockers
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-none block mt-1 ${
                totalBlockers > 0 ? 'text-status-warning' : 'text-text'
              }`}
            >
              {totalBlockers}
            </span>
          </div>
        </div>

        <div className="p-2 sm:px-4 sm:py-1 flex items-center gap-2.5 sm:gap-3.5 bg-background-elevated/40 sm:bg-transparent rounded-lg sm:rounded-none min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-background-elevated border border-border-subtle/60 flex items-center justify-center text-text-subtle shrink-0">
            <Cpu size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-medium text-text-subtle block leading-tight">
              Team Capacity Usage
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-none block mt-1 ${
                (global.avgUtilization || 0) > 85
                  ? 'text-status-warning'
                  : 'text-text'
              }`}
            >
              {hasProjects || engineering.totalEngineers > 0
                ? `${global.avgUtilization || 0}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Content Area */}
      {!hasProjects ? (
        /* Single clean, compact onboarding empty state when no active projects exist */
        <div className="bg-card border border-border-subtle rounded-xl p-6 sm:p-12 text-center max-w-lg mx-auto flex flex-col items-center shadow-xs animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3.5">
            <FolderPlus size={24} />
          </div>
          <h2 className="text-base font-semibold text-text mb-1.5">
            No active projects
          </h2>
          <p className="text-xs text-text-subtle max-w-sm mb-6 leading-relaxed">
            Create your first project to start tracking engineering capacity,
            delivery pipelines, and active blockers.
          </p>
          <Link
            to="/project-setup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Create Project</span>
          </Link>
        </div>
      ) : (
        /* Populated Dashboard Layout (Organized by Executive Overview, Project Delivery, Risks & Decisions) */
        <div className="space-y-4 sm:space-y-6">
          {/* Section 2: Project Delivery (Balanced 2-column layout with content-based heights) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Left: Project Overview / Execution (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            {/* Functional Cards Grid */}
            {hasExecutiveCards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FunctionalCard
                  id="strategic-leadership"
                  title="Engineering Leadership"
                  onClick={() => handleDrilldown('leadership')}
                  metrics={[
                    { label: 'Active Projects', value: activeProjectsCount },
                    {
                      label: 'Pending Decisions',
                      value: leadership.decisionsPending || 0,
                      color:
                        leadership.decisionsPending > 0
                          ? 'text-status-warning'
                          : 'text-text',
                    },
                    {
                      label: 'Escalations at Risk',
                      value: leadership.delayed || 0,
                      color:
                        leadership.delayed > 0
                          ? 'text-status-error'
                          : 'text-text',
                    },
                    {
                      label: 'Delivery Health',
                      value:
                        leadership.delayed > 0
                          ? 'Needs Attention'
                          : 'On Track',
                      color:
                        leadership.delayed > 0
                          ? 'text-status-warning'
                          : 'text-status-success',
                    },
                  ]}
                />
                <FunctionalCard
                  id="engineering-operations"
                  title="Engineering Execution"
                  onClick={() => handleDrilldown('engineering')}
                  metrics={[
                    {
                      label: 'Active Engineers',
                      value: engineering.totalEngineers || 0,
                    },
                    {
                      label: 'Average Workload',
                      value:
                        engineering.totalEngineers > 0
                          ? `${engineering.avgLoad || 0}%`
                          : 'N/A',
                      color:
                        (engineering.avgLoad || 0) > 85
                          ? 'text-status-warning'
                          : 'text-text',
                    },
                    {
                      label: 'Overloaded Teams',
                      value: engineering.overloaded || 0,
                      color:
                        engineering.overloaded > 0
                          ? 'text-status-error'
                          : 'text-text',
                    },
                    {
                      label: 'Sprint Velocity',
                      value:
                        engineering.totalEngineers > 0
                          ? `${engineering.completionRate || 0}%`
                          : 'N/A',
                      color: 'text-primary',
                    },
                  ]}
                />
              </div>
            )}

            {/* Organizational Overview Section */}
            {hasDepartmentData && (
              <DashboardSection
                title="Organizational Overview"
                icon={<LayoutGrid size={14} />}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-background-elevated/40 text-xs font-semibold text-text-subtle">
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4 text-center">Workload</th>
                        <th className="py-2.5 px-4 text-center">
                          Active Blockers
                        </th>
                        <th className="py-2.5 px-4">Schedule Drift</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-xs">
                      {functionalTable.map((row, i) => {
                        const hasActivity =
                          (row.load || 0) > 0 ||
                          (row.blockers || 0) > 0 ||
                          (row.delay && row.delay !== '0d');

                        return (
                          <tr
                            key={i}
                            onClick={() =>
                              handleDrilldown(
                                row.function?.split(' ')[0]?.toLowerCase() ||
                                  'engineering'
                              )
                            }
                            className="hover:bg-background-elevated/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 font-medium text-text group-hover:text-primary transition-colors">
                              {row.function}
                            </td>
                            <td className="py-3 px-4 text-center text-text font-medium">
                              {hasActivity ? `${row.load}%` : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.blockers > 0 ? (
                                <span className="font-semibold text-status-warning">
                                  {row.blockers}
                                </span>
                              ) : (
                                <span className="text-text-subtle">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-text-subtle">
                              {hasActivity && row.delay && row.delay !== '0d'
                                ? `+${row.delay}`
                                : hasActivity
                                  ? 'On schedule'
                                  : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <StatusIndicator
                                color={hasActivity ? row.status : 'no_data'}
                                label={hasActivity ? undefined : 'No data'}
                                showLabel
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DashboardSection>
            )}

            {!hasExecutiveCards && !hasDepartmentData && (
              <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-6 text-center shadow-xs">
                <h3 className="text-sm font-semibold text-text mb-1">
                  Project Initialized
                </h3>
                <p className="text-xs text-text-subtle max-w-md mx-auto leading-relaxed">
                  {activeProjectsCount > 0
                    ? `${activeProjectsCount} ${activeProjectsCount === 1 ? 'project is' : 'projects are'} active. Teams and task assignments are being set up. Organizational metrics and project analytics will populate as work begins.`
                    : 'Teams and task assignments are being set up. Organizational metrics and project analytics will populate as work begins.'}
                </p>
              </div>
            )}
          </div>

          {/* Right: Delivery Pipeline (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <DashboardSection
              title="Delivery Pipeline"
              icon={<Zap size={14} />}
            >
              {totalPipeline > 0 ? (
                <div className="flex flex-col gap-2.5 sm:gap-3.5 pt-1">
                  <PipelineStep
                    label="Backlog"
                    value={pipeline.backlog || 0}
                    progress={getPipelineProgress(pipeline.backlog || 0)}
                    color="bg-text-subtle/30"
                  />
                  <PipelineStep
                    label="In Development"
                    value={pipeline.dev || 0}
                    progress={getPipelineProgress(pipeline.dev || 0)}
                    color="bg-primary"
                  />
                  <PipelineStep
                    label="In QA Review"
                    value={pipeline.qa || 0}
                    progress={getPipelineProgress(pipeline.qa || 0)}
                    color="bg-status-warning"
                    isWarning={(pipeline.qa || 0) > 5}
                  />
                  <PipelineStep
                    label="Ready for Release"
                    value={pipeline.release || 0}
                    progress={getPipelineProgress(pipeline.release || 0)}
                    color="bg-status-success"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 bg-background-elevated/40 border border-border-subtle rounded-lg text-center">
                  <div>
                    <div className="text-[11px] text-text-subtle font-medium">
                      Backlog
                    </div>
                    <div className="text-xs font-semibold text-text">0</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-subtle font-medium">
                      Dev
                    </div>
                    <div className="text-xs font-semibold text-text">0</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-subtle font-medium">
                      QA
                    </div>
                    <div className="text-xs font-semibold text-text">0</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-text-subtle font-medium">
                      Release
                    </div>
                    <div className="text-xs font-semibold text-text">0</div>
                  </div>
                </div>
              )}
            </DashboardSection>
          </div>
        </div>

        {/* Section 3: Risks & Strategic Decisions (Balanced 2-column layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
          {/* Strategic Insights */}
          <StrategicInsights />

          {/* Critical Blockers */}
          <DashboardSection
            title="Critical Blockers"
            icon={<AlertTriangle size={14} />}
          >
            <div className="pt-1">
              {hasBlockers ? (
                <div className="space-y-3">
                  <BlockerCategory
                    label="Engineering"
                    items={blockers.engineering || []}
                  />
                  <BlockerCategory
                    label="Quality Assurance"
                    items={blockers.qa || []}
                  />
                  <BlockerCategory
                    label="Operational"
                    items={blockers.hr || []}
                  />
                </div>
              ) : (
                <div className="py-2.5 px-3.5 bg-background-elevated/40 border border-border-subtle rounded-lg text-xs text-text-subtle flex items-center justify-between">
                  <span>Active Blockers</span>
                  <span className="font-semibold text-text">0 reported</span>
                </div>
              )}
            </div>
          </DashboardSection>
        </div>
      </div>
      )}

      {/* Drilldown Modal */}
      <DrilldownModal
        isOpen={drilldown.isOpen}
        onClose={closeDrilldown}
        category={drilldown.category}
        type={drilldown.type}
        data={drilldown.data}
      />
    </div>
  );
};

export default CTODashboard;
