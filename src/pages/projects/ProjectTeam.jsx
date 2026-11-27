import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  RefreshCw,
  CheckCircle,
  Check,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Context & Services
import { useAuth } from '../../context/AuthContext';
import TeamService from '../../api/teamApi';
import ProjectService from '../../api/projectApi';
import AdminService from '../../api/adminApi';
import { USER_ROLES } from '../../constants';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';

// Atomic Components
import Skeleton from '../../components/atoms/Skeleton';
import TacticalModal from '../../components/molecules/TacticalModal';
import { ActionPortalMenu, ActionSubmenuPortal } from '../../components/molecules/ActionPortalMenu';

const ProjectTeamSkeleton = () => (
  <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6 space-y-6 bg-background min-h-screen font-sans">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle/50 pb-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg animate-pulse" />
        <Skeleton className="h-4 w-72 rounded-md animate-pulse" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-60 rounded-lg animate-pulse" />
        <Skeleton className="h-9 w-24 rounded-lg animate-pulse" />
      </div>
    </div>
    <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50">
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-3 sm:py-0 px-2 sm:px-5 space-y-2">
          <Skeleton className="h-4 w-28 rounded-md animate-pulse" />
          <Skeleton className="h-7 w-16 rounded-md animate-pulse" />
          <Skeleton className="h-3 w-36 rounded-md animate-pulse" />
        </div>
      ))}
    </div>
    <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40 rounded-md animate-pulse" />
        <Skeleton className="h-4 w-28 rounded-md animate-pulse" />
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const ProjectTeam = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Permission Checks
  const canManageProjects =
    hasPermission(PERMISSIONS.EDIT_PROJECT) ||
    user?.role === USER_ROLES.WORKSPACE_ADMIN ||
    user?.role === USER_ROLES.SUPER_ADMIN ||
    user?.role === USER_ROLES.WORKSPACE_MANAGER;

  const canManageUsers =
    hasPermission(PERMISSIONS.MANAGE_ROLES) ||
    user?.role === USER_ROLES.WORKSPACE_ADMIN ||
    user?.role === USER_ROLES.SUPER_ADMIN;

  const canPerformAnyAction = canManageProjects || canManageUsers;

  // Data & Pagination State
  const [data, setData] = useState({
    projectName: '',
    members: [],
    total: 0,
    stats: null,
    projectDetail: null,
  });
  const [allProjects, setAllProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null); // { member, triggerEl }
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [submenuTriggerEl, setSubmenuTriggerEl] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    updating: null,
  });

  // Modal Configs
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });

  // Reset page to 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  /**
   * Fetch project team and projects list
   */
  const fetchData = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError('');

        const projectDetailPromise =
          projectId === 'unassigned'
            ? Promise.resolve({ data: { name: 'Unassigned Members' } })
            : ProjectService.getProject(projectId).catch(() => null);

        const [teamRes, projectRes, projectDetail] = await Promise.all([
          TeamService.getMembers({
            page: currentPage,
            limit: pageSize,
            search: debouncedSearch,
            projectId,
          }),
          ProjectService.getProjects().catch(() => ({ projects: [] })),
          projectDetailPromise,
        ]);

        if (signal?.aborted) return;

        const members = teamRes?.items || teamRes?.members || [];
        const projectArray = Array.isArray(projectRes?.data?.projects)
          ? projectRes.data.projects.map((p) => ({ ...p, id: p._id || p.id }))
          : (projectRes?.projects || projectRes || []).map((p) => ({
              ...p,
              id: p._id || p.id,
            }));

        setAllProjects(projectArray);

        const fetchedProject = projectDetail?.data?.project || projectDetail?.data || projectDetail?.project || projectDetail;
        const projectName =
          fetchedProject?.name ||
          (projectId === 'unassigned' ? 'Unassigned Members' : 'Project Team');

        setData({
          projectName,
          members,
          total: teamRes?.total || members.length,
          stats: teamRes?.stats || null,
          projectDetail: fetchedProject || null,
          activeCount:
            typeof teamRes?.activeCount === 'number'
              ? teamRes.activeCount
              : typeof teamRes?.stats?.projectActiveCount === 'number'
              ? teamRes.stats.projectActiveCount
              : null,
        });
        setLastUpdated(new Date());
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError('Failed to load project team directory. Please refresh.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, currentPage, pageSize, debouncedSearch]
  );

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);
    return () => abortController.abort();
  }, [projectId, fetchData]);

  /**
   * Action Handlers
   */
  const handleAssignProject = async (memberId, targetProjectId) => {
    try {
      setActionLoading((prev) => ({ ...prev, updating: memberId }));
      await TeamService.updateMemberProject(memberId, targetProjectId);
      toast.success('Member project reassigned successfully.');
      fetchData();
    } catch (err) {
      toast.error('Failed to update project assignment.');
    } finally {
      setActionLoading((prev) => ({ ...prev, updating: null }));
      setMenuAnchor(null);
      setIsSubmenuOpen(false);
      setSubmenuTriggerEl(null);
    }
  };

  const handleToggleDeactivate = async (memberId, currentStatus) => {
    const targetStatus =
      currentStatus === 'Deactivated' ? 'Active' : 'Deactivated';
    try {
      setActionLoading((prev) => ({ ...prev, updating: memberId }));
      await AdminService.deactivateUser(memberId, targetStatus);
      toast.success(
        `User membership ${targetStatus === 'Active' ? 'reactivated' : 'deactivated'} successfully.`
      );
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle user active status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, updating: null }));
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  /**
   * Formatting Helpers
   */
  const getRoleDisplayName = (role, jobTitle) => {
    const r = role?.toUpperCase();
    if (r === 'WORKSPACE_ADMIN') return 'Workspace Admin';
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'SUPER_ADMIN') return 'Super Admin';
    if (r === 'TECH_LEAD') return 'Tech Lead';
    if (r === 'WORKSPACE_MANAGER' || r === 'PROJECT_ADMIN')
      return 'Project Admin';
    if (r === 'SENIOR_ENGINEER') return 'Senior Engineer';
    if (r === 'SOFTWARE_ENGINEER') return 'Software Engineer';
    if (r === 'QA_ENGINEER') return 'QA Engineer';
    if (r === 'HR_MANAGER') return 'HR Manager';
    if (r === 'INTERN') return 'Intern';
    return jobTitle || (role ? role.replace(/_/g, ' ') : 'Developer');
  };

  const getRoleBadgeClass = (role, jobTitle) => {
    const r = (role || jobTitle || '').toUpperCase();
    if (r.includes('ADMIN') || r.includes('SUPER_ADMIN'))
      return 'bg-primary/10 border border-primary/20 text-primary';
    if (r.includes('TECH_LEAD') || r.includes('LEAD') || r.includes('MANAGER'))
      return 'bg-primary/10 border border-primary/20 text-primary';
    return 'bg-background-elevated border border-border-subtle text-text-subtle';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-status-success/10 border border-status-success/20 text-status-success';
      case 'Inactive':
        return 'bg-background-elevated border border-border-subtle text-text-subtle';
      case 'Deactivated':
        return 'bg-status-error/10 border border-status-error/20 text-status-error';
      case 'Invited':
        return 'bg-status-warning/10 border border-status-warning/20 text-status-warning';
      default:
        return 'bg-background-elevated border border-border-subtle text-text-subtle';
    }
  };

  const formatLastActive = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const formatJoinedOn = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * CSV Exporter
   */
  const handleExportCSV = async () => {
    if (!canPerformAnyAction) {
      toast.error('You do not have permission to export project team data.');
      return;
    }
    try {
      const toastId = toast.loading('Preparing CSV export...');
      const res = await TeamService.getMembers({
        limit: 10000,
        search: debouncedSearch,
        projectId,
      });
      const exportItems = res?.items || res?.members || [];

      if (!exportItems.length) {
        toast.error('No data to export', { id: toastId });
        return;
      }

      const sanitizeCSVField = (val) => {
        if (val == null) return '""';
        let str = String(val);
        // Neutralize CSV formula injection (CWE-1236)
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Name',
        'Email',
        'Role',
        'Status',
        'MFA Status',
        'Joined On',
      ];
      const rows = exportItems.map((item) => [
        item.name,
        item.email,
        getRoleDisplayName(item.role, item.jobTitle),
        item.status,
        item.mfaEnabled ? 'Enabled' : 'Disabled',
        item.joinedOn ? new Date(item.joinedOn).toLocaleDateString() : 'N/A',
      ]);

      const csvContent =
        '\uFEFF' +
        [
          headers.map(sanitizeCSVField).join(','),
          ...rows.map((r) => r.map(sanitizeCSVField).join(',')),
        ].join('\r\n');

      let downloadUrl;
      if (typeof window !== 'undefined' && window.URL?.createObjectURL) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadUrl = window.URL.createObjectURL(blob);
      } else {
        downloadUrl = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
      }

      const link = document.createElement('a');
      link.setAttribute('href', downloadUrl);
      const safeProjectSlug = (data.projectName || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      link.setAttribute(
        'download',
        `${safeProjectSlug}_team_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof window !== 'undefined' && window.URL?.revokeObjectURL && downloadUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(downloadUrl);
      }
      toast.success('Project team CSV exported.', { id: toastId });
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  /**
   * Sorting & Pagination
   */
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMembers = useMemo(() => {
    let sortableItems = [...(data.members || [])];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'role') {
          aValue = getRoleDisplayName(a.role, a.jobTitle);
          bValue = getRoleDisplayName(b.role, b.jobTitle);
        }

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data.members, sortConfig]);

  const totalPages = Math.ceil(data.total / pageSize) || 1;

  // 3 Simplified Metrics Calculation
  const activeMembersCount = useMemo(() => {
    if (typeof data.activeCount === 'number') {
      return data.activeCount;
    }
    if (typeof data.stats?.projectActiveCount === 'number') {
      return data.stats.projectActiveCount;
    }
    if (
      data.stats?.activeUsers?.count !== undefined &&
      data.stats?.totalUsers?.count === data.total
    ) {
      return data.stats.activeUsers.count;
    }
    return (data.members || []).filter((m) => m.status === 'Active').length;
  }, [data.activeCount, data.stats, data.total, data.members]);

  const assignedTeamsCount = useMemo(() => {
    if (Array.isArray(data.projectDetail?.teams)) {
      return data.projectDetail.teams.length;
    }
    if (typeof data.projectDetail?.teamsCount === 'number') {
      return data.projectDetail.teamsCount;
    }
    const distinctTeams = new Set();
    (data.members || []).forEach((m) => {
      if (m.team?.name) distinctTeams.add(m.team.name);
      else if (m.team && typeof m.team === 'string') distinctTeams.add(m.team);
      else if (m.squad) distinctTeams.add(m.squad);
    });
    if (distinctTeams.size > 0) return distinctTeams.size;

    return data.stats?.assignedTeams ?? (data.total > 0 ? 1 : 0);
  }, [data.projectDetail, data.members, data.stats, data.total]);

  if (loading && !data.members.length) return <ProjectTeamSkeleton />;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6 space-y-6 bg-background text-text min-h-screen flex flex-col font-sans">
      {/* 1. Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle/60 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
            {data.projectName}
          </h1>
          <p className="text-xs sm:text-sm text-text-subtle">
            {canPerformAnyAction
              ? 'Manage project members, roles, and assignments.'
              : 'View project members, roles, and team assignments.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[220px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors"
              size={14}
            />
            <input
              type="text"
              aria-label="Search members"
              placeholder="Search by name or email..."
              className="w-full h-9 bg-background-elevated border border-border-subtle text-text rounded-lg px-4 pl-9 focus:outline-none focus:border-primary/50 transition-all text-xs placeholder:text-text-subtle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canPerformAnyAction && (
            <button
              onClick={handleExportCSV}
              disabled={!data.total}
              aria-label="Export members as CSV"
              className="h-9 px-3.5 bg-background-elevated border border-border-subtle hover:bg-background-elevated/80 disabled:opacity-40 text-text font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Download size={13} className="text-text-subtle" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-status-error/5 border border-status-error/30 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-status-error shrink-0" size={18} />
            <div>
              <h4 className="text-xs font-semibold text-text">
                Error Loading Project Directory
              </h4>
              <p className="text-xs text-text-subtle mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            aria-label="Retry loading directory"
            className="p-2 bg-background-elevated border border-border-subtle rounded-lg hover:bg-background-elevated/80 transition-colors text-text cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* 2. Compact Horizontal Metrics Strip */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50">
        {/* Metric 1: Project Members */}
        <div className="py-3 sm:py-0 px-2 sm:px-5 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Project Members
            </span>
            <Users size={15} className="text-text-subtle shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text">
              {data.total.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-text-subtle">
            Total assigned to this project
          </span>
        </div>

        {/* Metric 2: Active Members */}
        <div className="py-3 sm:py-0 px-2 sm:px-5 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Active Members
            </span>
            <CheckCircle size={15} className="text-text-subtle shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text">
              {activeMembersCount.toLocaleString()}
            </span>
            {data.total > 0 && (
              <span className="text-xs text-text-subtle font-medium">
                ({Math.round((activeMembersCount / data.total) * 100)}%)
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-subtle">
            Active contributors
          </span>
        </div>

        {/* Metric 3: Assigned Teams */}
        <div className="py-3 sm:py-0 px-2 sm:px-5 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Assigned Teams
            </span>
            <Layers size={15} className="text-text-subtle shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text">
              {assignedTeamsCount > 0
                ? assignedTeamsCount.toLocaleString()
                : '—'}
            </span>
          </div>
          <span className="text-[11px] text-text-subtle">
            {assignedTeamsCount > 0
              ? `${assignedTeamsCount} active ${assignedTeamsCount === 1 ? 'squad' : 'squads'}`
              : 'No dedicated squads assigned'}
          </span>
        </div>
      </div>

      {/* 3. Main Member Directory Table */}
      <div className="bg-card border border-border-subtle rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Table Title and Actions */}
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-elevated/30">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text">
              Member Directory
            </h2>
            <span className="text-xs text-text-subtle font-medium bg-background-elevated px-2 py-0.5 rounded-full border border-border-subtle/50">
              {data.total} {data.total === 1 ? 'member' : 'members'}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-text-subtle">
              Last synced: {formatLastActive(lastUpdated)}
            </span>
          )}
        </div>

        {/* User Table (Redundant Workspace Project column and checkboxes removed) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="text-xs font-medium text-text-subtle border-b border-border-subtle/60 bg-background-elevated/20 select-none">
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Member</span>
                    {sortConfig.key === 'name' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email</span>
                    {sortConfig.key === 'email' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role</span>
                    {sortConfig.key === 'role' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig.key === 'status' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('mfaEnabled')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>MFA</span>
                    {sortConfig.key === 'mfaEnabled' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('lastActive')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last active</span>
                    {sortConfig.key === 'lastActive' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('joinedOn')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Joined on</span>
                    {sortConfig.key === 'joinedOn' && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                {canPerformAnyAction && (
                  <th scope="col" className="py-3 px-4 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30 text-xs text-text">
              {sortedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-background-elevated/20 transition-colors align-middle"
                >
                  {/* User Avatar + Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-background-elevated border border-border-subtle text-text flex items-center justify-center font-medium text-xs shrink-0 overflow-hidden select-none">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.name?.slice(0, 2)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="font-medium text-text truncate max-w-[180px]">
                        {member.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-text-subtle select-all">
                    {member.email}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-normal rounded-md ${getRoleBadgeClass(
                        member.role,
                        member.jobTitle
                      )}`}
                    >
                      {getRoleDisplayName(member.role, member.jobTitle)}
                    </span>
                  </td>

                  {/* Account Status Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${getStatusBadgeClass(
                        member.status
                      )}`}
                    >
                      {member.status}
                    </span>
                  </td>

                  {/* MFA */}
                  <td className="py-3 px-4">
                    {member.mfaEnabled ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-status-success"
                        title="MFA Enabled"
                        aria-label="MFA Enabled"
                      >
                        <ShieldCheck size={14} className="shrink-0" />
                        <span className="hidden lg:inline text-xs">
                          Enabled
                        </span>
                      </span>
                    ) : (
                      <span
                        className="text-xs text-text-subtle/50"
                        title="MFA Disabled"
                        aria-label="MFA Disabled"
                      >
                        —
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-text-subtle text-xs whitespace-nowrap">
                    {formatLastActive(member.lastActive)}
                  </td>

                  <td className="py-3 px-4 text-text-subtle text-xs whitespace-nowrap">
                    {formatJoinedOn(member.createdAt || member.joinedOn)}
                  </td>

                  {/* Actions Dropdown */}
                  {canPerformAnyAction && (
                    <td className="py-3 px-4 text-right">
                      <button
                        aria-label={`Actions for ${member.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menuAnchor?.member?.id === member.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (menuAnchor?.member?.id === member.id) {
                            setMenuAnchor(null);
                            setIsSubmenuOpen(false);
                            setSubmenuTriggerEl(null);
                          } else {
                            setMenuAnchor({ member, triggerEl: e.currentTarget });
                            setIsSubmenuOpen(false);
                            setSubmenuTriggerEl(null);
                          }
                        }}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          menuAnchor?.member?.id === member.id
                            ? 'text-text bg-background-elevated'
                            : 'text-text-subtle hover:text-text hover:bg-background-elevated'
                        }`}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {sortedMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={canPerformAnyAction ? 8 : 7}
                    className="py-12 text-center"
                  >
                    <AlertTriangle
                      size={28}
                      className="mx-auto text-text-subtle/60 mb-3"
                    />
                    <h3 className="text-sm font-semibold text-text">
                      {searchTerm
                        ? 'No matching members found'
                        : 'No members assigned to this project'}
                    </h3>
                    <p className="text-xs text-text-subtle mt-1 max-w-sm mx-auto">
                      {searchTerm
                        ? `No project members matched "${searchTerm}". Try adjusting your search keyword.`
                        : 'Team members will appear here once allocated to this project.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Control Footer */}
        <div className="p-4 sm:px-5 border-t border-border-subtle/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-background-elevated/20 text-xs text-text-subtle select-none">
          <div>
            {data.total > 0 ? (
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, data.total)} of {data.total}{' '}
                {data.total === 1 ? 'member' : 'members'}
              </span>
            ) : (
              <span>Showing 0 members</span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="w-8 h-8 flex items-center justify-center border border-border-subtle hover:bg-background-elevated disabled:opacity-40 rounded-lg transition-colors cursor-pointer text-text disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (
                  totalPages > 7 &&
                  Math.abs(p - currentPage) > 2 &&
                  p !== 1 &&
                  p !== totalPages
                ) {
                  if (p === 2 || p === totalPages - 1) {
                    return (
                      <span key={p} className="px-1.5 text-text-subtle">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center border text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-primary border-primary text-background-dark'
                        : 'border-border-subtle hover:bg-background-elevated text-text'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((c) => Math.min(totalPages, c + 1))
                }
                className="w-8 h-8 flex items-center justify-center border border-border-subtle hover:bg-background-elevated disabled:opacity-40 rounded-lg transition-colors cursor-pointer text-text disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="relative">
            <select
              aria-label="Members per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-background-elevated border border-border-subtle text-xs text-text pl-3 pr-8 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer rounded-lg appearance-none"
            >
              {[5, 10, 20, 50].map((sz) => (
                <option key={sz} value={sz}>
                  {sz} / page
                </option>
              ))}
            </select>
            <ChevronRight
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-text-subtle pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Portal-Based Actions Menu & Submenu */}
      {menuAnchor && (
        <ActionPortalMenu
          triggerEl={menuAnchor.triggerEl}
          isOpen={Boolean(menuAnchor)}
          onClose={() => {
            setMenuAnchor(null);
            setIsSubmenuOpen(false);
            setSubmenuTriggerEl(null);
          }}
          width={196}
        >
          {/* Project Reassignment Sub-menu Trigger */}
          {canManageProjects && (
            <button
              ref={(node) => {
                if (node && !submenuTriggerEl) {
                  setSubmenuTriggerEl(node);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSubmenuTriggerEl(e.currentTarget);
                setIsSubmenuOpen((prev) => !prev);
              }}
              onMouseEnter={(e) => {
                setSubmenuTriggerEl(e.currentTarget);
                setIsSubmenuOpen(true);
              }}
              aria-haspopup="menu"
              aria-expanded={isSubmenuOpen}
              className="w-full px-3 py-2 text-xs font-medium text-text hover:bg-background-elevated flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Reassign Project</span>
              <ChevronRight
                size={13}
                className={`text-text-subtle transition-transform ${isSubmenuOpen ? 'translate-x-0.5' : ''}`}
              />
            </button>
          )}

          {/* Deactivate / Reactivate User */}
          {canManageUsers && user?.id !== menuAnchor.member.id && (
            <button
              onClick={() => {
                const targetMember = menuAnchor.member;
                setMenuAnchor(null);
                setIsSubmenuOpen(false);
                setSubmenuTriggerEl(null);
                setModalConfig({
                  isOpen: true,
                  title:
                    targetMember.status === 'Deactivated'
                      ? 'Reactivate User'
                      : 'Deactivate User',
                  message: `Are you sure you want to ${
                    targetMember.status === 'Deactivated'
                      ? 'reactivate'
                      : 'deactivate'
                  } ${targetMember.name}? This will update their login access.`,
                  confirmText:
                    targetMember.status === 'Deactivated'
                      ? 'Reactivate'
                      : 'Deactivate',
                  type:
                    targetMember.status === 'Deactivated'
                      ? 'info'
                      : 'danger',
                  onConfirm: () =>
                    handleToggleDeactivate(
                      targetMember.id,
                      targetMember.status
                    ),
                });
              }}
              className={`w-full px-3 py-2 text-xs font-medium text-left cursor-pointer hover:bg-background-elevated transition-colors ${
                canManageProjects
                  ? 'border-t border-border-subtle/40 mt-1 pt-1.5'
                  : ''
              } ${
                menuAnchor.member.status === 'Deactivated'
                  ? 'text-status-success'
                  : 'text-status-error'
              }`}
            >
              {menuAnchor.member.status === 'Deactivated'
                ? 'Reactivate Member'
                : 'Deactivate Member'}
            </button>
          )}
        </ActionPortalMenu>
      )}

      {/* Submenu for Project Reassignment */}
      {menuAnchor && canManageProjects && isSubmenuOpen && submenuTriggerEl && (
        <ActionSubmenuPortal
          parentTriggerEl={submenuTriggerEl}
          isOpen={isSubmenuOpen}
          onClose={() => setIsSubmenuOpen(false)}
          width={216}
          maxHeight={240}
        >
          <button
            onClick={() => handleAssignProject(menuAnchor.member.id, null)}
            className="w-full px-3 py-2 text-xs font-medium text-text hover:bg-background-elevated text-left flex justify-between items-center cursor-pointer transition-colors"
          >
            <span>Remove from Project</span>
            {!menuAnchor.member.assignedProjectId && (
              <Check size={12} className="text-primary shrink-0 ml-2" />
            )}
          </button>
          {allProjects.map((p) => {
            const isAssigned =
              menuAnchor.member.assignedProjectId?.id === p.id ||
              menuAnchor.member.assignedProjectId?._id === p.id ||
              menuAnchor.member.assignedProjectId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => handleAssignProject(menuAnchor.member.id, p.id)}
                className="w-full px-3 py-2 text-xs font-medium text-text hover:bg-background-elevated text-left flex justify-between items-center cursor-pointer transition-colors"
              >
                <span className="truncate max-w-[150px]">{p.name}</span>
                {isAssigned && (
                  <Check size={12} className="text-primary shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </ActionSubmenuPortal>
      )}

      {/* Confirmation Modals */}
      <TacticalModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ProjectTeam;
