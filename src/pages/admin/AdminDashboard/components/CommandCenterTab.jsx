import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';
import SprintService from '../../../../api/sprintApi';
import DashboardService from '../../../../api/dashboardApi';
import TaskService from '../../../../api/taskApi';
import {
  LayoutGrid,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Plus,
  Users,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Activity,
  Zap,
  Check,
  Layers,
  GitCommit,
  Rocket,
  Shield,
  ArrowUpRight,
  Play,
  CheckSquare,
  AlertOctagon,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS = [
  '#3B82F6', // Blue (primary)
  '#10B981', // Emerald / Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

const CommandCenterTab = ({
  data,
  setActiveTab,
  setCurrentPage,
  setActiveSetting,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { overview = {}, settings: rawSettings = {} } = data || {};

  // Fetch real-time software project management data
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats-pm', user?.workspaceId],
    queryFn: () => DashboardService.getDashboardStats().then((res) => res.data),
    enabled: !!user?.workspaceId,
    staleTime: 60000,
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints-pm', user?.workspaceId],
    queryFn: () =>
      SprintService.getSprints().then((res) => res.data?.sprints || []),
    enabled: !!user?.workspaceId,
    staleTime: 60000,
  });

  const { data: tasksList = [] } = useQuery({
    queryKey: ['tasks-pm', user?.workspaceId],
    queryFn: () =>
      TaskService.getMyTasks('all').then(
        (res) => res.data?.data?.tasks || res.data?.tasks || []
      ),
    enabled: !!user?.workspaceId,
    staleTime: 60000,
  });

  // Projects Overview list
  const projectsOverview = useMemo(() => {
    return Array.isArray(data?.projectsOverview)
      ? data.projectsOverview.filter(Boolean)
      : [];
  }, [data?.projectsOverview]);

  const activeSprint = useMemo(() => {
    // Sprints are only meaningful if there are projects in the workspace
    if (projectsOverview.length === 0) return null;
    return (
      sprints.find((s) => s.status === 'active') ||
      sprints.find((s) => s.status === 'in_progress') ||
      null
    );
  }, [sprints, projectsOverview]);

  // Task metrics calculation
  const taskSummary = useMemo(() => {
    const summary = dashboardStats?.summary || {};
    const todo =
      summary.todo ??
      tasksList.filter((t) => (t.status || '').toLowerCase() === 'todo').length;
    const inProgress =
      summary.in_progress ??
      tasksList.filter(
        (t) =>
          (t.status || '').toLowerCase() === 'in_progress' ||
          (t.status || '').toLowerCase() === 'inprogress'
      ).length;
    const inReview =
      summary.in_review ??
      tasksList.filter((t) => (t.status || '').toLowerCase() === 'in_review')
        .length;
    const done =
      summary.done ??
      tasksList.filter((t) => (t.status || '').toLowerCase() === 'done').length;
    const total = todo + inProgress + inReview + done;
    const completionPercent =
      total > 0
        ? Math.round((done / total) * 100)
        : Math.round(overview?.progress || 0);

    return { todo, inProgress, inReview, done, total, completionPercent };
  }, [dashboardStats?.summary, tasksList, overview?.progress]);

  // Urgent and at-risk task count
  const urgentCount = useMemo(() => {
    const count = tasksList.filter(
      (t) =>
        t.priority === 'CRITICAL' ||
        t.priority === 'HIGH' ||
        t.blocked ||
        (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < Date.now())
    ).length;
    if (count > 0) return count;
    return overview?.riskLevel === 'HIGH' ? 1 : 0;
  }, [tasksList, overview?.riskLevel]);

  // Sparkline data
  const sparklineData = useMemo(() => {
    const rawProjects = Array.isArray(data?.analyticsTrends?.projects) && data.analyticsTrends.projects.length > 0
      ? data.analyticsTrends.projects
      : [{ val: projectsOverview.length || 0 }];
    const rawTasks = Array.isArray(data?.analyticsTrends?.activeUsers) && data.analyticsTrends.activeUsers.length > 0
      ? data.analyticsTrends.activeUsers
      : [{ val: taskSummary.inProgress || 0 }];

    return {
      projects: rawProjects,
      tasks: rawTasks,
      velocity: [{ val: 0 }],
      completed: [{ val: taskSummary.done || 0 }],
    };
  }, [data?.analyticsTrends, projectsOverview.length, taskSummary]);

  // Team allocation breakdown - actual backend data & unassigned handling
  const userDistributionData = useMemo(() => {
    const rawUsers = Array.isArray(data?.users)
      ? data.users.filter(Boolean)
      : [];

    const totalWorkspaceUsers = overview?.totalUsers || (rawUsers.length > 0 ? rawUsers.length : (user ? 1 : 0));

    const counts = {
      DEVELOPER: 0,
      QA_ENGINEER: 0,
      PROJECT_ADMIN: 0,
      WORKSPACE_ADMIN: 0,
      UNASSIGNED: 0,
    };

    let mappedCount = 0;

    rawUsers.forEach((u) => {
      const r = (u?.role || '').toUpperCase();
      const jt = (u?.jobTitle || '').toUpperCase();

      if (r === 'DEVELOPER' || r === 'SOFTWARE_ENGINEER' || jt.includes('DEV') || jt.includes('ENGINEER')) {
        counts.DEVELOPER += 1;
        mappedCount++;
      } else if (r === 'QA_ENGINEER' || r === 'TESTER' || jt.includes('QA') || jt.includes('TEST')) {
        counts.QA_ENGINEER += 1;
        mappedCount++;
      } else if (r === 'PROJECT_ADMIN' || r === 'LEAD' || jt.includes('LEAD')) {
        counts.PROJECT_ADMIN += 1;
        mappedCount++;
      } else if (r === 'WORKSPACE_ADMIN' || r === 'ADMIN' || jt.includes('ADMIN')) {
        counts.WORKSPACE_ADMIN += 1;
        mappedCount++;
      } else {
        counts.UNASSIGNED += 1;
        mappedCount++;
      }
    });

    // Ensure logged-in user is accounted for if not present in rawUsers
    const isCurrentUserInList = rawUsers.some(
      (u) =>
        (u.id || u._id)?.toString() === (user?.id || user?._id)?.toString() ||
        u.email === user?.email
    );
    if (!isCurrentUserInList && user?.role === 'WORKSPACE_ADMIN') {
      counts.WORKSPACE_ADMIN += 1;
      mappedCount++;
    }

    // Account for remaining workspace members as unassigned
    if (totalWorkspaceUsers > mappedCount) {
      counts.UNASSIGNED += (totalWorkspaceUsers - mappedCount);
    }

    const formatRoleName = (key) => {
      switch (key) {
        case 'WORKSPACE_ADMIN':
          return 'Workspace Admin';
        case 'PROJECT_ADMIN':
          return 'Project Admin';
        case 'DEVELOPER':
          return 'Developer';
        case 'QA_ENGINEER':
          return 'QA Engineer';
        case 'UNASSIGNED':
          return 'Unassigned';
        default:
          return key
            .toLowerCase()
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
      }
    };

    // Only include roles with actual members (> 0)
    const activeRolesList = Object.keys(counts)
      .filter((key) => counts[key] > 0)
      .map((key) => ({
        name: formatRoleName(key),
        value: counts[key],
      }));

    const total = activeRolesList.reduce((sum, item) => sum + item.value, 0);

    if (activeRolesList.length === 0) {
      return [
        {
          name: 'Unassigned Members',
          value: totalWorkspaceUsers || 1,
          percentage: '100.0',
        },
      ];
    }

    return activeRolesList.map((item) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '100.0',
    }));
  }, [data?.users, overview?.totalUsers, user]);

  // Upcoming deadlines & milestone schedule - actual data only
  const upcomingDeadlines = useMemo(() => {
    const list = [];

    // ONLY add sprint deadline if a genuine active sprint exists with an end date
    if (activeSprint?.endDate) {
      const diffDays = Math.ceil(
        (new Date(activeSprint.endDate) - Date.now()) / (1000 * 60 * 60 * 24)
      );
      list.push({
        id: activeSprint._id || activeSprint.id || 'sprint-close',
        title: `${activeSprint.name || 'Sprint Cycle'} Close`,
        project: activeSprint.project?.name || activeSprint.projectName || 'Active Sprint',
        dueDate: new Date(activeSprint.endDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        daysLeft: diffDays,
        urgency:
          diffDays <= 2 ? 'critical' : diffDays <= 5 ? 'warning' : 'normal',
        type: 'Sprint',
      });
    }

    // Add real tasks deadlines
    tasksList
      .filter((t) => t.dueDate && t.status !== 'done')
      .slice(0, 4)
      .forEach((t) => {
        const diffDays = Math.ceil(
          (new Date(t.dueDate) - Date.now()) / (1000 * 60 * 60 * 24)
        );
        list.push({
          id: t._id || t.id,
          title: t.title,
          project:
            typeof t.project === 'object'
              ? t.project?.name || 'Project'
              : 'Project',
          dueDate: new Date(t.dueDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          daysLeft: diffDays,
          urgency:
            diffDays < 0 ? 'critical' : diffDays <= 3 ? 'warning' : 'normal',
          type: 'Task',
        });
      });

    return list;
  }, [activeSprint, tasksList]);

  // Actual deadlines status calculation
  const overdueDeadlinesCount = useMemo(() => {
    return upcomingDeadlines.filter((dl) => typeof dl.daysLeft === 'number' && dl.daysLeft < 0).length;
  }, [upcomingDeadlines]);

  const criticalDeadlinesCount = useMemo(() => {
    return upcomingDeadlines.filter((dl) => dl.urgency === 'critical').length;
  }, [upcomingDeadlines]);

  // Recent Project Activity
  const recentActivities = useMemo(() => {
    if (
      Array.isArray(dashboardStats?.recentActivity) &&
      dashboardStats.recentActivity.length > 0
    ) {
      return dashboardStats.recentActivity.slice(0, 5).map((act) => ({
        id: act._id || act.id || Math.random(),
        name: act.user?.name || act.performer || 'Team Member',
        action: act.action || 'Updated sprint delivery',
        time: act.time
          ? new Date(act.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Recent',
        avatarInitials: (act.user?.name || act.performer || 'TM')
          .substring(0, 2)
          .toUpperCase(),
      }));
    }

    return (
      Array.isArray(data?.securityLogs) ? data.securityLogs.filter(Boolean) : []
    )
      .slice(0, 5)
      .map((log) => ({
        id: log?.id || log?._id || Math.random(),
        name: log?.performer || 'System Engineer',
        action: (log?.action || 'Updated task state')
          .replace(/_/g, ' ')
          .toLowerCase(),
        time: log?.time
          ? new Date(log.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Just now',
        avatarInitials: String(log?.performer || 'SE')
          .substring(0, 2)
          .toUpperCase(),
      }));
  }, [dashboardStats?.recentActivity, data?.securityLogs]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Software Project Management Metric Strip (Projects, Team Members, Tasks in Progress) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Projects */}
        <div className="bg-card border border-border-subtle p-4 flex flex-col justify-between group hover:border-border transition-all rounded-sm">
          <div className="flex items-center gap-2 text-text-subtle">
            <FolderKanban size={16} className="text-primary" />
            <span className="text-sm font-medium">Projects</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-text">
              {projectsOverview.length || overview?.activeProjects || 0}
            </span>
            <p className="text-xs text-text-subtler font-normal mt-1">
              Active workspace projects
            </p>
          </div>
        </div>

        {/* Card 2: Team Members */}
        <div className="bg-card border border-border-subtle p-4 flex flex-col justify-between group hover:border-border transition-all rounded-sm">
          <div className="flex items-center gap-2 text-text-subtle">
            <Users size={16} className="text-primary" />
            <span className="text-sm font-medium">Team members</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-text">
              {(data?.users?.length || overview?.totalUsers || 1).toLocaleString()}
            </span>
            <p className="text-xs text-text-subtler font-normal mt-1">
              Registered workspace contributors
            </p>
          </div>
        </div>

        {/* Card 3: Tasks in Progress */}
        <div className="bg-card border border-border-subtle p-4 flex flex-col justify-between group hover:border-border transition-all rounded-sm">
          <div className="flex items-center gap-2 text-text-subtle">
            <Clock size={16} className="text-status-warning" />
            <span className="text-sm font-medium">Tasks in progress</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-text">
              {taskSummary.inProgress}
            </span>
            <p className="text-xs text-text-subtler font-normal mt-1">
              {taskSummary.done} completed • {taskSummary.todo} in backlog
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sprint Progress & Team Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sprint Progress Monitor */}
        <div className="lg:col-span-7 bg-card border border-border-subtle p-5 flex flex-col justify-between rounded-sm">
          <div className="flex justify-between items-center pb-4 border-b border-border-subtler">
            <div className="flex items-center gap-2.5">
              {activeSprint ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  <span className="text-sm font-semibold text-text">
                    {activeSprint.name}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-xs">
                    Active sprint
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-border-subtle" />
                  <span className="text-sm font-medium text-text-subtler">
                    No active sprint
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-background-elevated text-text-subtler rounded-xs">
                    Inactive
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/project-info')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View sprint</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Progress Gauge */}
          <div className="my-5 flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-bold tracking-tight text-text">
                  {activeSprint ? `${taskSummary.completionPercent}%` : 'N/A'}
                </span>
                <span className="text-xs font-medium text-text-subtle ml-2">
                  Sprint progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-status-success">
                  {taskSummary.total > 0
                    ? `${taskSummary.done} of ${taskSummary.total} done`
                    : '0 of 0 done'}
                </span>
                <div className="text-xs text-text-subtle font-normal mt-0.5">
                  Tasks completed
                </div>
              </div>
            </div>

            {/* Multi-stage Progress Bar - True 0% empty bar when empty */}
            <div className="w-full bg-background-elevated h-2.5 flex overflow-hidden rounded-full">
              {taskSummary.total > 0 && taskSummary.done > 0 && (
                <div
                  className="bg-status-success h-full transition-all duration-700"
                  style={{
                    width: `${(taskSummary.done / taskSummary.total) * 100}%`,
                  }}
                  title={`Done: ${taskSummary.done}`}
                />
              )}
              {taskSummary.total > 0 && taskSummary.inReview > 0 && (
                <div
                  className="bg-secondary h-full transition-all duration-700"
                  style={{
                    width: `${(taskSummary.inReview / taskSummary.total) * 100}%`,
                  }}
                  title={`In Review: ${taskSummary.inReview}`}
                />
              )}
              {taskSummary.total > 0 && taskSummary.inProgress > 0 && (
                <div
                  className="bg-primary h-full transition-all duration-700"
                  style={{
                    width: `${(taskSummary.inProgress / taskSummary.total) * 100}%`,
                  }}
                  title={`In Progress: ${taskSummary.inProgress}`}
                />
              )}
            </div>

            {/* Task stage metrics */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="bg-background-elevated/40 p-2.5 rounded-xs flex flex-col">
                <span className="text-xs font-medium text-text-subtle">
                  Backlog
                </span>
                <span className="text-sm font-bold text-text mt-1">
                  {taskSummary.todo}
                </span>
              </div>

              <div className="bg-background-elevated/40 p-2.5 rounded-xs flex flex-col">
                <span className="text-xs font-medium text-primary">
                  In progress
                </span>
                <span className="text-sm font-bold text-primary mt-1">
                  {taskSummary.inProgress}
                </span>
              </div>

              <div className="bg-background-elevated/40 p-2.5 rounded-xs flex flex-col">
                <span className="text-xs font-medium text-secondary">
                  In review
                </span>
                <span className="text-sm font-bold text-secondary mt-1">
                  {taskSummary.inReview}
                </span>
              </div>

              <div className="bg-background-elevated/40 p-2.5 rounded-xs flex flex-col">
                <span className="text-xs font-medium text-status-success">
                  Done
                </span>
                <span className="text-sm font-bold text-status-success mt-1">
                  {taskSummary.done}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs font-medium text-text-subtle border-t border-border-subtler pt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" />
              <span>
                Target completion:{' '}
                {activeSprint?.endDate
                  ? new Date(activeSprint.endDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </span>
            <span className="text-text-subtle">
              Velocity:{' '}
              {activeSprint && taskSummary.total > 0 && taskSummary.done > 0
                ? `${Math.round((taskSummary.done / taskSummary.total) * 100)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Team Breakdown */}
        <div className="lg:col-span-5 bg-card border border-border-subtle p-5 flex flex-col justify-between rounded-sm">
          <div className="flex justify-between items-center pb-4 border-b border-border-subtler">
            <span className="text-sm font-semibold text-text">
              Team breakdown
            </span>
            <button
              onClick={() => navigate('/teams?tab=teams')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Manage teams
            </button>
          </div>

          <div className="my-3 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-text-subtle">
              <span>{(overview?.totalUsers || userDistributionData.reduce((s, r) => s + r.value, 0)).toLocaleString()} team members</span>
              <span>{userDistributionData.length} {userDistributionData.length === 1 ? 'role' : 'roles'}</span>
            </div>

            {/* Horizontal Segmented Role Progress Bar */}
            <div className="w-full bg-background-elevated h-2 rounded-full flex overflow-hidden gap-0.5">
              {userDistributionData.map((d, index) => (
                <div
                  key={d.name}
                  className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${d.percentage}%`,
                    backgroundColor: ROLE_COLORS[index % ROLE_COLORS.length],
                  }}
                  title={`${d.name}: ${d.value} (${d.percentage}%)`}
                />
              ))}
            </div>

            {/* Compact Role Distribution List for Small Teams */}
            <div className="flex flex-col gap-1.5 mt-2">
              {userDistributionData.map((d, index) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between py-1.5 px-2 hover:bg-background-elevated/40 rounded-xs transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: ROLE_COLORS[index % ROLE_COLORS.length],
                      }}
                    />
                    <span className="text-text font-medium truncate">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-text font-semibold">
                      {d.value} {d.value === 1 ? 'member' : 'members'}
                    </span>
                    <span className="text-text-subtler text-[11px] font-normal w-12 text-right">
                      {d.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-text-subtle border-t border-border-subtler pt-3 flex items-center justify-between">
            <span>Role distribution</span>
            <span
              onClick={() => navigate('/teams?tab=directory')}
              className="text-primary hover:underline cursor-pointer"
            >
              View directory ↗
            </span>
          </div>
        </div>
      </div>

      {/* 3. Assigned Tasks & Deadlines Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Assigned Tasks Board */}
        <div className="lg:col-span-7 bg-card border border-border-subtle p-4 flex flex-col justify-between rounded-sm">
          <div className="flex justify-between items-center pb-2.5 border-b border-border-subtler">
            <div className="flex items-center gap-2">
              <CheckSquare size={15} className="text-primary" />
              <span className="text-sm font-semibold text-text">
                My tasks
              </span>
            </div>
            <button
              onClick={() => navigate('/my-tasks')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Task board</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex-1 mt-2.5 overflow-y-auto max-h-56 scrollbar-none flex flex-col gap-2">
            {tasksList.length > 0 ? (
              tasksList.slice(0, 5).map((task, idx) => {
                const rawPriority = (task.priority || 'MEDIUM').toUpperCase();
                const priority =
                  rawPriority.charAt(0) + rawPriority.slice(1).toLowerCase();
                const status = (task.status || 'todo').toLowerCase();
                const priorityColor =
                  rawPriority === 'CRITICAL'
                    ? 'text-status-error bg-status-error/10 border-status-error/20'
                    : rawPriority === 'HIGH'
                      ? 'text-status-warning bg-status-warning/10 border-status-warning/20'
                      : rawPriority === 'MEDIUM'
                        ? 'text-primary bg-primary/10 border-primary/20'
                        : 'text-text-subtler bg-background-elevated border-border-subtle';

                const statusColor =
                  status === 'done'
                    ? 'text-status-success bg-status-success/10'
                    : status === 'in_progress'
                      ? 'text-primary bg-primary/10'
                      : status === 'in_review'
                        ? 'text-secondary bg-secondary/10'
                        : 'text-text-subtler bg-background-elevated';

                const formattedStatus =
                  status === 'done'
                    ? 'Done'
                    : status === 'in_progress'
                      ? 'In progress'
                      : status === 'in_review'
                        ? 'In review'
                        : 'To do';

                return (
                  <div
                    key={task._id || task.id || `task-${idx}`}
                    onClick={() => navigate(task._id ? `/task/${task._id}` : '/my-tasks')}
                    className="p-2.5 bg-background-elevated/20 border border-border-subtler hover:border-border-subtle transition-all flex items-center justify-between gap-3 cursor-pointer group rounded-sm"
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 border rounded-xs ${priorityColor} shrink-0`}>
                        {priority}
                      </span>
                      <div className="flex flex-col truncate">
                        <span className="text-[13px] font-medium text-text group-hover:text-primary transition-colors truncate">
                          {task.title || 'Untitled Task'}
                        </span>
                        <span className="text-xs text-text-subtle font-normal truncate">
                          {typeof task.project === 'object'
                            ? task.project?.name || 'Project'
                            : 'Sprint Deliverable'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-xs ${statusColor}`}>
                        {formattedStatus}
                      </span>
                      <ChevronRight size={14} className="text-text-subtler group-hover:text-text transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-text-subtle">
                  No active tasks in current sprint
                </span>
                <button
                  onClick={() => navigate('/my-tasks')}
                  className="mt-2.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-black transition-all cursor-pointer rounded-xs"
                >
                  + Create task
                </button>
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-border-subtler text-xs text-text-subtle font-medium flex justify-between items-center">
            <span>{tasksList.length > 0 ? 'Top active deliverables' : 'Backlog clean'}</span>
            <span
              onClick={() => navigate('/my-tasks')}
              className="text-primary hover:underline cursor-pointer"
            >
              Manage backlog ↗
            </span>
          </div>
        </div>

        {/* Deadlines & Target Milestones */}
        <div className="lg:col-span-5 bg-card border border-border-subtle p-4 flex flex-col justify-between rounded-sm">
          <div className="flex justify-between items-center pb-2.5 border-b border-border-subtler">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-status-warning" />
              <span className="text-sm font-semibold text-text">
                Upcoming deadlines
              </span>
            </div>
            <span
              onClick={() => navigate('/project-info')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Full schedule
            </span>
          </div>

          <div className="flex-1 mt-2.5 flex flex-col gap-2">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((dl) => {
                const isUrgent = dl.urgency === 'critical';
                const isWarning = dl.urgency === 'warning';

                return (
                  <div
                    key={dl.id}
                    className="p-2.5 bg-background-elevated/20 border border-border-subtler hover:border-border-subtle transition-all flex items-center justify-between gap-3 rounded-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-xs ${
                          isUrgent
                            ? 'bg-status-error/10 text-status-error'
                            : isWarning
                              ? 'bg-status-warning/10 text-status-warning'
                              : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Target size={14} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[13px] font-medium text-text truncate">
                          {dl.title}
                        </span>
                        <span className="text-xs text-text-subtle font-normal truncate">
                          {dl.project} • {dl.type}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-xs ${
                          isUrgent
                            ? 'bg-status-error/15 text-status-error'
                            : isWarning
                              ? 'bg-status-warning/15 text-status-warning'
                              : 'bg-background-elevated text-text-subtle'
                        }`}
                      >
                        {typeof dl.daysLeft === 'number'
                          ? dl.daysLeft < 0
                            ? 'Overdue'
                            : dl.daysLeft === 0
                              ? 'Due today'
                              : `${dl.daysLeft}d left`
                          : dl.dueDate}
                      </span>
                      <div className="text-xs text-text-subtler font-normal mt-0.5">
                        {dl.dueDate}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-text-subtle">
                  No upcoming milestone deadlines
                </span>
                <span className="text-xs text-text-subtler mt-1">
                  Deadlines sync automatically with sprint schedules
                </span>
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-border-subtler text-xs text-text-subtle font-medium flex items-center justify-between">
            <span>Sprint cadence</span>
            <span>
              {upcomingDeadlines.length === 0 ? (
                <span className="text-text-subtler">No active milestones</span>
              ) : overdueDeadlinesCount > 0 ? (
                <span className="text-status-error font-bold">{overdueDeadlinesCount} overdue</span>
              ) : criticalDeadlinesCount > 0 ? (
                <span className="text-status-warning font-bold">{criticalDeadlinesCount} due soon</span>
              ) : (
                <span className="text-status-success font-bold">All on schedule</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Project Overview, Live Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Overview Table */}
        <div className="lg:col-span-6 bg-card border border-border-subtle p-5 flex flex-col justify-between rounded-sm">
          <div className="flex justify-between items-center pb-3 border-b border-border-subtler">
            <div className="flex items-center gap-2">
              <FolderKanban size={15} className="text-primary" />
              <span className="text-sm font-semibold text-text">
                Project overview
              </span>
            </div>
            <button
              onClick={() => navigate('/project-info')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex-1 mt-3 overflow-x-auto scrollbar-none">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-medium text-text-subtle border-b border-border-subtler">
                  <th className="pb-2.5">Project</th>
                  <th className="pb-2.5 text-center">Type</th>
                  <th className="pb-2.5 text-center">Team members</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectsOverview.length > 0 ? (
                  projectsOverview.map((item, idx) => {
                    const projName = item.name || 'Unnamed';
                    const projType = item.type || 'Product Dev';
                    const projUsers = item.users || 0;
                    const rawStatus = (item.status || 'active').toLowerCase();
                    const formattedStatus =
                      rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                    const stableKey =
                      item.id || item._id || projName || `project-${idx}`;

                    return (
                      <tr
                        key={stableKey}
                        onClick={() => navigate(item.id || item._id ? `/project/${item.id || item._id}` : '/project-info')}
                        className="hover:bg-background-elevated/40 transition-colors border-b border-border-subtler/40 last:border-0 cursor-pointer group"
                      >
                        <td className="py-2.5 text-[13px] font-medium text-text truncate max-w-[140px] group-hover:text-primary transition-colors">
                          {projName}
                        </td>
                        <td className="py-2.5 text-center text-xs text-text-subtle font-normal">
                          {projType}
                        </td>
                        <td className="py-2.5 text-center text-xs text-text-subtle font-normal">
                          {projUsers}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-xs font-medium ${
                              rawStatus === 'active'
                                ? 'bg-status-success/10 text-status-success'
                                : 'bg-background-elevated text-text-subtler'
                            }`}
                          >
                            {formattedStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-subtler text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderKanban size={22} className="text-text-subtler opacity-40" />
                        <span>No projects active in current workspace</span>
                        <button
                          onClick={() => navigate('/project-setup')}
                          className="mt-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-black transition-all cursor-pointer rounded-xs"
                        >
                          + Create project
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-border-subtler text-xs text-text-subtle font-medium flex justify-between">
            <span>
              Project health:{' '}
              {projectsOverview.length > 0 && overview?.healthScore != null
                ? `${overview.healthScore}%`
                : 'N/A'}
            </span>
            <span
              onClick={() => navigate('/velocity')}
              className="text-primary hover:underline cursor-pointer"
            >
              Sprint report ↗
            </span>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="bg-card border border-border-subtle p-4 rounded-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-border-subtler mb-2.5">
              <div className="flex items-center gap-2">
                <GitCommit size={15} className="text-primary" />
                <span className="text-sm font-semibold text-text">
                  Recent activity
                </span>
              </div>
              <span
                onClick={() => toast.success('Telemetry logs synchronized.')}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Sync
              </span>
            </div>

            <div className="flex flex-col">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 3).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between py-2 px-1 border-b border-border-subtler/40 last:border-0 hover:bg-background-elevated/40 transition-all rounded-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 rounded-xs">
                        {act.avatarInitials}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[13px] font-medium text-text truncate">
                          {act.name}
                        </span>
                        <span className="text-xs text-text-subtle font-normal truncate">
                          {act.action}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-text-subtler font-normal shrink-0 ml-2">
                      {act.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-2.5 text-center text-text-subtler text-xs font-normal">
                  No recent activity recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border-subtle p-5 rounded-sm flex flex-col justify-between">
            <div className="flex justify-between items-center pb-3 border-b border-border-subtler mb-3">
              <span className="text-sm font-semibold text-text">
                Quick actions
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Action 1: Create Project */}
              <button
                onClick={() => navigate('/project-setup')}
                className="flex items-center gap-3 border border-border-subtle hover:border-border bg-background-elevated/30 hover:bg-background-elevated/60 p-3 transition-all cursor-pointer group text-left rounded-sm"
              >
                <div className="w-9 h-9 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                  <Plus size={16} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
                    Create project
                  </span>
                  <span className="text-xs text-text-subtler font-normal truncate">
                    New workspace project
                  </span>
                </div>
              </button>

              {/* Action 2: Create Task */}
              <button
                onClick={() => navigate('/my-tasks')}
                className="flex items-center gap-3 border border-border-subtle hover:border-border bg-background-elevated/30 hover:bg-background-elevated/60 p-3 transition-all cursor-pointer group text-left rounded-sm"
              >
                <div className="w-9 h-9 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                  <CheckSquare size={16} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
                    Create task
                  </span>
                  <span className="text-xs text-text-subtler font-normal truncate">
                    New sprint deliverable
                  </span>
                </div>
              </button>

              {/* Action 3: Invite Users */}
              <button
                onClick={() => navigate('/team/add')}
                className="flex items-center gap-3 border border-border-subtle hover:border-border bg-background-elevated/30 hover:bg-background-elevated/60 p-3 transition-all cursor-pointer group text-left rounded-sm"
              >
                <div className="w-9 h-9 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                  <UserPlus size={16} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
                    Invite users
                  </span>
                  <span className="text-xs text-text-subtler font-normal truncate">
                    Add team collaborator
                  </span>
                </div>
              </button>

              {/* Action 4: View Reports */}
              <button
                onClick={() => navigate('/project-info')}
                className="flex items-center gap-3 border border-border-subtle hover:border-border bg-background-elevated/30 hover:bg-background-elevated/60 p-3 transition-all cursor-pointer group text-left rounded-sm"
              >
                <div className="w-9 h-9 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                  <BarChart3 size={16} />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
                    View reports
                  </span>
                  <span className="text-xs text-text-subtler font-normal truncate">
                    Sprint metrics & summary
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterTab;
