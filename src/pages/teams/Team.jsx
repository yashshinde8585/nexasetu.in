import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Mail,
  UserPlus,
  Trash2,
  Clock,
  Search,
  Box,
  Rocket,
  AlertCircle,
  Loader2,
  MoreVertical,
  Shield,
  ShieldCheck,
  Plus,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
  UserMinus,
  UserCheck,
  Check,
  Users,
  Zap,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Context & Services
import { useAuth } from '../../context/AuthContext';
import TeamService from '../../api/teamApi';
import ProjectService from '../../api/projectApi';
import AdminService from '../../api/adminApi';
import { USER_ROLES } from '../../constants';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

// Atomic Components & Modals
import Skeleton from '../../components/atoms/Skeleton';
import TacticalModal from '../../components/molecules/TacticalModal';
import { ActionPortalMenu, ActionSubmenuPortal } from '../../components/molecules/ActionPortalMenu';
import UserEditModal from '../../components/organisms/admin/UserEditModal';

// Modular Admin Team Management Tabs
import UserDirectoryTab from '../admin/AdminDashboard/components/UserDirectoryTab';
import SquadDirectiveTab from '../admin/AdminDashboard/components/SquadDirectiveTab';

const TeamSkeleton = () => (
  <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6 space-y-6 bg-background min-h-screen">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-sm" />
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-64 w-full rounded-sm" />
    </div>
  </div>
);

const Team = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Data & Pagination State
  const [data, setData] = useState({ items: [], total: 0, stats: null });
  const [allProjects, setAllProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [menuAnchor, setMenuAnchor] = useState(null); // { item, triggerEl }
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [submenuTriggerEl, setSubmenuTriggerEl] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedMemberId, setExpandedMemberId] = useState(null);
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

  // Derived State
  const userProjectId =
    user?.assignedProjectId?.id ||
    user?.assignedProjectId?._id ||
    user?.assignedProjectId;

  // Permission checks
  const canManageProjects =
    hasPermission(PERMISSIONS.EDIT_PROJECT) ||
    user?.role === 'WORKSPACE_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'TECH_LEAD';

  const canManageUsers =
    hasPermission(PERMISSIONS.MANAGE_ROLES) ||
    user?.role === 'WORKSPACE_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const canInviteUsers =
    hasPermission(PERMISSIONS.INVITE_USERS) ||
    user?.role === 'WORKSPACE_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  // Team Management URL & View State
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const isManagementParam =
    tabParam === 'directory' || tabParam === 'teams' || viewParam === 'management';
  const [isManagementView, setIsManagementView] = useState(isManagementParam);
  const [teamSubTab, setTeamSubTab] = useState(
    tabParam === 'teams' ? 'teams' : 'directory'
  );

  // Sync if URL search params change
  useEffect(() => {
    if (
      tabParam === 'directory' ||
      tabParam === 'teams' ||
      viewParam === 'management'
    ) {
      setIsManagementView(true);
      if (tabParam === 'teams') setTeamSubTab('teams');
      else if (tabParam === 'directory') setTeamSubTab('directory');
    } else if (!tabParam && !viewParam) {
      setIsManagementView(false);
    }
  }, [tabParam, viewParam]);

  // Admin Dashboard hook for Team Management sub-interface
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const adminDebouncedSearchQuery = useDebounce(adminSearchQuery, 300);
  const [editingUser, setEditingUser] = useState(null);

  const {
    data: adminData,
    isLoading: isAdminLoading,
    updateRoleMutation,
    deactivateMutation,
    deleteTeamMutation,
  } = useAdminDashboard({ enabled: canManageUsers });

  const adminTeams = Array.isArray(adminData?.teams)
    ? adminData.teams.filter(Boolean)
    : [];

  const handleOpenManagement = (subTab = 'directory') => {
    setIsManagementView(true);
    setTeamSubTab(subTab);
    setSearchParams({ tab: subTab });
  };

  const handleCloseManagement = () => {
    setIsManagementView(false);
    setSearchParams({});
  };

  const handleSubTabSwitch = (subTab) => {
    setTeamSubTab(subTab);
    setSearchParams({ tab: subTab });
    setAdminCurrentPage(1);
  };

  // Extract all projects associated with a user/invitation (supports multiple projects)
  const getMemberProjects = useCallback(
    (item) => {
      if (!item) return [];
      const list = [];
      const addProject = (proj) => {
        if (!proj) return;
        const name = typeof proj === 'object' ? proj.name || proj.title : proj;
        const id = typeof proj === 'object' ? proj._id || proj.id : proj;
        if (name && typeof name === 'string' && !list.some((p) => p.name === name)) {
          list.push({ id, name });
        }
      };

      if (Array.isArray(item.assignedProjects)) {
        item.assignedProjects.forEach(addProject);
      }
      if (Array.isArray(item.projects)) {
        item.projects.forEach(addProject);
      }
      if (Array.isArray(allProjects) && (item.id || item._id)) {
        const itemId = (item.id || item._id).toString();
        allProjects.forEach((proj) => {
          if (Array.isArray(proj.members)) {
            const isMember = proj.members.some((m) => {
              const mId = (typeof m === 'object' ? m._id || m.id : m)?.toString();
              return mId === itemId;
            });
            if (isMember) addProject(proj);
          }
        });
      }
      if (item.assignedProjectId) {
        addProject(item.assignedProjectId);
      }
      return list;
    },
    [allProjects]
  );

  // Reset page to 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  /**
   * Primary data fetcher
   */
  const fetchData = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError('');

        const [teamRes, projectRes] = await Promise.all([
          TeamService.getMembers({
            page: currentPage,
            limit: pageSize,
            search: debouncedSearch,
          }),
          ProjectService.getProjects(),
        ]);

        if (signal?.aborted) return;

        setData(teamRes || { items: [], total: 0, stats: null });

        const projectArray = Array.isArray(projectRes?.data?.projects)
          ? projectRes.data.projects.map((p) => ({ ...p, id: p._id || p.id }))
          : (projectRes?.projects || projectRes || []).map((p) => ({
              ...p,
              id: p._id || p.id,
            }));

        setAllProjects(projectArray);
        setLastUpdated(new Date());
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError('Failed to load workspace directory. Please refresh.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [currentPage, pageSize, debouncedSearch]
  );

  useEffect(() => {
    const abortController = new AbortController();

    const IC_ROLES = [
      USER_ROLES.SENIOR_ENGINEER,
      USER_ROLES.SOFTWARE_ENGINEER,
      USER_ROLES.PROJECT_MEMBER,
      USER_ROLES.INTERN,
    ];
    const isIC = IC_ROLES.includes(user?.role);

    if (isIC && userProjectId) {
      navigate(`/team/project/${userProjectId}`, { replace: true });
    } else {
      fetchData(abortController.signal);
    }

    return () => abortController.abort();
  }, [user, navigate, fetchData, userProjectId]);

  /**
   * Action Handlers
   */
  const handleAssignProject = async (memberId, projectId) => {
    try {
      setActionLoading((prev) => ({ ...prev, updating: memberId }));
      await TeamService.updateMemberProject(memberId, projectId);
      toast.success('Project sector reallocated successfully.');
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

  const handleRevokeInvitation = async (invitationId) => {
    try {
      setActionLoading((prev) => ({ ...prev, updating: invitationId }));
      await TeamService.removeInvitation(invitationId);
      toast.success('Invitation revoked successfully.');
      fetchData();
    } catch (err) {
      toast.error('Failed to revoke invitation.');
    } finally {
      setActionLoading((prev) => ({ ...prev, updating: null }));
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
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
   * CSV Directory Exporter
   */
  const handleExportCSV = async () => {
    try {
      const toastId = toast.loading('Preparing CSV export...');
      const res = await TeamService.getMembers({
        limit: 10000,
        search: debouncedSearch,
      });
      const exportItems = res?.items || [];

      if (!exportItems.length) {
        toast.error('No data to export', { id: toastId });
        return;
      }

      const headers = [
        'Name',
        'Email',
        'Role',
        'Assigned Projects',
        'Status',
        'Last Active',
        'Joined On',
      ];
      const rows = exportItems.map((item) => {
        const memberProjects = getMemberProjects(item);
        const projectsStr =
          memberProjects.length > 0
            ? memberProjects.map((p) => p.name).join('; ')
            : 'Unassigned';

        return [
          item.name,
          item.email,
          item.jobTitle || item.role,
          projectsStr,
          item.status,
          item.lastActive
            ? new Date(item.lastActive).toLocaleDateString()
            : 'Never',
          item.joinedOn ? new Date(item.joinedOn).toLocaleDateString() : 'N/A',
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [
          headers.join(','),
          ...rows.map((r) =>
            r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `nexasetu_directory_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Directory CSV exported.', { id: toastId });
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  /**
   * Formatting Helpers
   */
  const getRoleBadgeClass = (role, jobTitle) => {
    const r = (role || jobTitle || '').toUpperCase();
    if (r === 'WORKSPACE_ADMIN' || r === 'ADMIN' || r === 'SUPER_ADMIN')
      return 'bg-primary/10 border border-primary/20 text-primary';
    if (r.includes('TECH_LEAD') || r.includes('LEAD') || r.includes('SENIOR'))
      return 'bg-secondary/10 border border-secondary/20 text-secondary';
    if (r.includes('QA'))
      return 'bg-status-info/10 border border-status-info/20 text-status-info';
    if (
      r.includes('SOFTWARE_ENGINEER') ||
      r.includes('PROJECT_MEMBER') ||
      r.includes('DEVELOPER') ||
      r.includes('SWE') ||
      r.includes('ENGINEER')
    )
      return 'bg-background-elevated border border-border-subtle text-text';
    if (r.includes('HR') || r.includes('MANAGER'))
      return 'bg-status-warning/10 border border-status-warning/20 text-status-warning';
    return 'bg-background-elevated border border-border-subtle text-text-subtle';
  };

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-status-success/10 border border-status-success/20 text-status-success';
      case 'Inactive':
        return 'bg-background-elevated border border-border-subtle text-text-subtler';
      case 'Deactivated':
        return 'bg-status-error/10 border border-status-error/20 text-status-error';
      case 'Invited':
        return 'bg-status-warning/10 border border-status-warning/20 text-status-warning';
      default:
        return 'bg-background-elevated border border-border-subtle text-text-subtler';
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

  const getTrendColor = (label, val) => {
    if (label === 'inactiveUsers' || label === 'deactivatedUsers') {
      return val <= 0 ? 'text-emerald-400' : 'text-rose-400';
    }
    return val >= 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const stats = data.stats || {
    totalUsers: { count: 0, growth: 0, trend: [] },
    activeUsers: { count: 0, growth: 0, trend: [] },
    newUsers: { count: 0, growth: 0, trend: [] },
    inactiveUsers: { count: 0, growth: 0, trend: [] },
    deactivatedUsers: { count: 0, growth: 0, trend: [] },
  };

  const pendingInvitationsCount = useMemo(() => {
    if (data.stats?.pendingInvitations?.count != null) {
      return data.stats.pendingInvitations.count;
    }
    const invCount = Array.isArray(data.invitations)
      ? data.invitations.length
      : 0;
    const itemInvCount = Array.isArray(data.items)
      ? data.items.filter(
          (i) => i.status === 'Invited' || i.type === 'invitation'
        ).length
      : 0;
    return Math.max(invCount, itemInvCount);
  }, [data.stats, data.invitations, data.items]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedItems = useMemo(() => {
    let list = [...(data.items || [])];

    // Status filter (Inactive & Deactivated moved to filters)
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => {
        const s = (
          item.status || (item.type === 'invitation' ? 'Invited' : '')
        ).toUpperCase();
        if (statusFilter === 'ACTIVE') return s === 'ACTIVE';
        if (statusFilter === 'INACTIVE') return s === 'INACTIVE';
        if (statusFilter === 'DEACTIVATED') return s === 'DEACTIVATED';
        if (statusFilter === 'INVITED')
          return s === 'INVITED' || item.type === 'invitation';
        return true;
      });
    }

    if (sortConfig.key !== null) {
      list.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'role') {
          aValue = getRoleDisplayName(a.role, a.jobTitle);
          bValue = getRoleDisplayName(b.role, b.jobTitle);
        } else if (
          sortConfig.key === 'assignedProjectId' ||
          sortConfig.key === 'assignedProjects'
        ) {
          const aProj = getMemberProjects(a);
          const bProj = getMemberProjects(b);
          aValue = aProj[0]?.name || 'Unassigned';
          bValue = bProj[0]?.name || 'Unassigned';
        }

        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [data.items, statusFilter, sortConfig, getMemberProjects]);

  // 3 Essential KPI Cards (Total Members, Active Members, Pending Invitations)
  const kpiCards = [
    {
      label: 'Total members',
      count: stats.totalUsers?.count || 0,
      subtext: 'Workspace directory',
      icon: <Users size={16} className="text-primary" />,
    },
    {
      label: 'Active members',
      count: stats.activeUsers?.count || 0,
      subtext: `${stats.activeUsers?.count || 0} active now`,
      icon: <CheckCircle size={16} className="text-status-success" />,
    },
    {
      label: 'Pending invitations',
      count: pendingInvitationsCount,
      subtext:
        pendingInvitationsCount === 1
          ? '1 awaiting response'
          : `${pendingInvitationsCount} awaiting response`,
      icon: <Mail size={16} className="text-status-warning" />,
    },
  ];

  if (loading && !data.items.length) return <TeamSkeleton />;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6 space-y-6 bg-background text-text min-h-screen flex flex-col font-sans">
      {/* 1. Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="space-y-1">
          {isManagementView ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-text-subtle text-xs sm:text-sm font-medium">Team members</span>
                <span className="text-text-subtler text-xs">/</span>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                  Team management
                </h1>
              </div>
              <p className="text-text-subtle text-xs sm:text-sm font-normal mt-0.5">
                Administrative directory, workspace role assignments, and squad governance.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                Team members
              </h1>
              <p className="text-text-subtle text-sm font-normal">
                View, search, and manage all team members across your workspace.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {isManagementView ? (
            <>
              {canManageUsers && (
                <button
                  onClick={() => navigate('/settings?tab=roles')}
                  className="h-9 px-3.5 bg-background-elevated border border-border-subtle hover:border-border font-medium text-xs rounded-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-text flex-1 sm:flex-initial"
                >
                  <ShieldCheck size={13} className="text-primary" />
                  <span>Manage roles</span>
                </button>
              )}

              <button
                onClick={handleCloseManagement}
                className="h-9 px-3.5 bg-background-elevated border border-border-subtle hover:bg-background-elevated/80 font-medium text-xs rounded-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-text flex-1 sm:flex-initial"
              >
                <ArrowLeft size={13} /> Back to members
              </button>
            </>
          ) : (
            <>
              <div className="relative group w-full sm:w-auto sm:min-w-[220px] flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within:text-primary transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  className="w-full h-9 bg-background-elevated border border-border-subtle text-text rounded-xs px-4 pl-9 pr-8 focus:outline-none focus:border-primary/50 transition-all text-xs sm:text-sm font-medium placeholder:text-text-subtler"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtler hover:text-text cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  disabled={!data.items?.length}
                  className="h-9 px-3.5 bg-background-elevated border border-border-subtle hover:border-border disabled:opacity-40 text-text font-medium text-xs rounded-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
                >
                  <Download size={13} className="text-text-subtle" /> Export
                </button>

                {canManageUsers && (
                  <button
                    onClick={() => handleOpenManagement('directory')}
                    className="h-9 px-3.5 bg-background-elevated border border-border-subtle hover:border-primary/50 font-medium text-xs rounded-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-text flex-1 sm:flex-initial"
                  >
                    <Users size={13} className="text-primary" /> Team management
                  </button>
                )}

                {canInviteUsers && (
                  <button
                    onClick={() => navigate('/team/add')}
                    className="h-9 px-3.5 bg-primary text-black font-semibold text-xs rounded-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer hover:bg-primary/95 shrink-0"
                  >
                    <UserPlus size={13} /> Add user
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-status-error/5 border border-status-error/30 p-4 rounded-md flex items-start gap-4 animate-in fade-in duration-300">
          <AlertCircle
            className="text-status-error shrink-0 mt-0.5"
            size={18}
          />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-text uppercase tracking-wide mb-1">
              Error fetching directory
            </h4>
            <p className="text-xs text-text-subtle font-normal">
              {error}
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            className="p-2 bg-background-elevated border border-border-subtle rounded hover:bg-background-light/20 transition-colors text-text"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* View Switcher: Team Management Interface vs Standard Members Directory */}
      {isManagementView ? (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Sub-Navigation: User Directory & Teams */}
          <div className="flex items-center gap-2 -mt-1 pb-1.5 border-b border-border-subtle/50">
            <button
              onClick={() => handleSubTabSwitch('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-xs ${
                teamSubTab === 'directory'
                  ? 'bg-background-elevated text-text border border-border-subtle font-semibold shadow-xs'
                  : 'text-text-subtle hover:text-text hover:bg-background-elevated/50 border border-transparent'
              }`}
            >
              <Users
                size={13}
                className={teamSubTab === 'directory' ? 'text-primary' : ''}
              />
              <span>User directory</span>
            </button>
            <button
              onClick={() => handleSubTabSwitch('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-xs ${
                teamSubTab === 'teams'
                  ? 'bg-background-elevated text-text border border-border-subtle font-semibold shadow-xs'
                  : 'text-text-subtle hover:text-text hover:bg-background-elevated/50 border border-transparent'
              }`}
            >
              <Zap
                size={13}
                className={teamSubTab === 'teams' ? 'text-secondary' : ''}
              />
              <span>Teams</span>
            </button>
          </div>

          {/* Sub-Tab Panel */}
          <div className="flex-1">
            {teamSubTab === 'directory' ? (
              <UserDirectoryTab
                data={adminData}
                currentPage={adminCurrentPage}
                setCurrentPage={setAdminCurrentPage}
                searchQuery={adminSearchQuery}
                debouncedSearchQuery={adminDebouncedSearchQuery}
                setSearchQuery={setAdminSearchQuery}
                setEditingUser={setEditingUser}
              />
            ) : (
              <SquadDirectiveTab
                teams={adminTeams}
                deleteTeamMutation={deleteTeamMutation}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Top Analytics Metric Strip (Total Members, Active Members, Pending Invitations) */}
          <div className="bg-card border border-border-subtle rounded-md p-3 sm:p-4 grid grid-cols-3 divide-x divide-border-subtle/50 shadow-xs">
            {kpiCards.map((card, idx) => (
              <div
                key={card.label}
                className={`flex flex-col justify-center px-2 sm:px-4 ${idx === 0 ? 'pl-1 sm:pl-2' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] sm:text-xs font-medium text-text-subtle truncate">
                    {card.label}
                  </span>
                  <div className="hidden sm:flex p-1 rounded bg-background-elevated border border-border-subtle/50 text-text-subtle">
                    {card.icon}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-2xl font-bold tracking-tight text-text">
                    {card.count.toLocaleString()}
                  </span>
                  {card.subtext && (
                    <span className="hidden sm:inline text-[10px] text-text-subtler font-normal">
                      {card.subtext}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Main Directory Table */}
          <div className="bg-card border border-border-subtle flex flex-col rounded-sm">
            {/* Table Title and Actions / Filters */}
            <div className="p-3 sm:p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-background-elevated/40">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-text">
                  Members ({filteredAndSortedItems.length}
                  {statusFilter !== 'ALL' && ` of ${data.total}`})
                </h2>
              </div>

              {/* Status Filters: Responsive Segmented Control */}
              <div className="flex flex-wrap items-center gap-1 p-0.5 bg-background-elevated border border-border-subtle rounded-sm">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'ACTIVE', label: 'Active' },
                  { key: 'INACTIVE', label: 'Inactive' },
                  { key: 'DEACTIVATED', label: 'Deactivated' },
                  { key: 'INVITED', label: 'Pending invites' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-xs transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.key
                        ? 'bg-primary text-black font-semibold shadow-xs'
                        : 'text-text-subtle hover:text-text hover:bg-background-elevated/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

        {/* Combined User Table (Desktop View md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-xs text-text-subtle font-medium border-b border-border-subtle bg-background-elevated/40 select-none">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="accent-primary h-3.5 w-3.5 bg-background border border-border-subtle rounded-xs cursor-pointer focus:outline-none"
                    disabled
                  />
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('name')}
                >
                  User{' '}
                  {sortConfig.key === 'name' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('email')}
                >
                  Email{' '}
                  {sortConfig.key === 'email' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('role')}
                >
                  Role{' '}
                  {sortConfig.key === 'role' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('assignedProjects')}
                >
                  Assigned projects{' '}
                  {(sortConfig.key === 'assignedProjects' ||
                    sortConfig.key === 'assignedProjectId') &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status{' '}
                  {sortConfig.key === 'status' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('lastActive')}
                >
                  Last active{' '}
                  {sortConfig.key === 'lastActive' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="hidden md:table-cell py-3 px-4 cursor-pointer hover:text-text transition-colors"
                  onClick={() => handleSort('joinedOn')}
                >
                  Joined on{' '}
                  {sortConfig.key === 'joinedOn' &&
                    (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 text-[13px] font-normal text-text">
              {filteredAndSortedItems.map((item) => {
                const memberProjects = getMemberProjects(item);
                const canReassign =
                  item.type === 'member' && canManageProjects;
                const canDeactivate =
                  item.type === 'member' &&
                  canManageUsers &&
                  user?.id !== item.id;
                const canRevoke =
                  item.type === 'invitation' && canInviteUsers;
                const hasAnyAction =
                  canReassign || canDeactivate || canRevoke || canManageUsers;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-background-elevated/40 transition-colors leading-tight align-middle"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="accent-primary h-3.5 w-3.5 bg-background border border-border-subtle rounded-xs cursor-pointer focus:outline-none"
                        disabled
                      />
                    </td>

                    {/* User Avatar + Name */}
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-sm bg-background-elevated border border-border-subtle text-text flex items-center justify-center font-bold uppercase text-xs shrink-0 overflow-hidden select-none">
                        {item.profilePicture ? (
                          <img
                            src={item.profilePicture}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          item.name?.slice(0, 2)
                        )}
                      </div>
                      <span className="font-medium text-[13px] text-text hover:text-primary transition-colors cursor-default">
                        {item.name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-text/70 select-all font-normal text-xs">
                      {item.email}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-medium rounded-sm leading-none whitespace-nowrap ${getRoleBadgeClass(
                          item.role,
                          item.jobTitle
                        )}`}
                      >
                        {getRoleDisplayName(item.role, item.jobTitle)}
                      </span>
                    </td>

                    {/* Assigned Projects (Supports multiple projects) */}
                    <td className="py-3 px-4">
                      {memberProjects.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-xs font-normal text-text-subtler">
                          <Box
                            size={13}
                            className="text-text-subtler shrink-0 opacity-40"
                          />
                          <span>Unassigned</span>
                        </span>
                      ) : memberProjects.length === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle bg-background-elevated border border-border-subtle px-2 py-0.5 rounded max-w-[170px]">
                          <Box size={12} className="text-primary shrink-0" />
                          <span className="truncate">
                            {memberProjects[0].name}
                          </span>
                        </span>
                      ) : (
                        <div
                          className="flex items-center gap-1.5"
                          title={memberProjects.map((p) => p.name).join(', ')}
                        >
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle bg-background-elevated border border-border-subtle px-2 py-0.5 rounded max-w-[140px]">
                            <Box size={12} className="text-primary shrink-0" />
                            <span className="truncate">
                              {memberProjects[0].name}
                            </span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 border border-primary/20 text-primary">
                            +{memberProjects.length - 1}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-medium rounded-sm leading-none whitespace-nowrap ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-4 text-text-subtle text-xs font-normal whitespace-nowrap">
                      {formatLastActive(item.lastActive)}
                    </td>

                    {/* Joined On (hidden on mobile, visible on md+) */}
                    <td className="hidden md:table-cell py-3 px-4 text-text-subtler text-xs font-normal whitespace-nowrap">
                      {formatJoinedOn(item.joinedOn)}
                    </td>

                    {/* Actions Dropdown (Permission-aware) */}
                    <td className="py-3 px-4 text-right">
                      {!hasAnyAction ? (
                        <span className="text-text-subtler font-medium text-xs pr-2 select-none">
                          —
                        </span>
                      ) : (
                        <button
                          aria-label="Actions menu"
                          aria-haspopup="menu"
                          aria-expanded={menuAnchor?.item?.id === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuAnchor?.item?.id === item.id) {
                              setMenuAnchor(null);
                              setIsSubmenuOpen(false);
                              setSubmenuTriggerEl(null);
                            } else {
                              setMenuAnchor({ item, triggerEl: e.currentTarget });
                              setIsSubmenuOpen(false);
                              setSubmenuTriggerEl(null);
                            }
                          }}
                          className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                            menuAnchor?.item?.id === item.id
                              ? 'text-text bg-background-elevated'
                              : 'text-text-subtle hover:text-text hover:bg-background-elevated'
                          }`}
                        >
                          <MoreVertical size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedItems.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <AlertTriangle
                      size={28}
                      className="mx-auto text-text-subtler mb-3"
                    />
                    <h3 className="text-sm font-semibold text-text">
                      No members found
                    </h3>
                    <p className="text-xs text-text-subtle font-normal mt-1">
                      No members or invitations matched the search or filter criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Directory Cards (Mobile View <768px) */}
        <div className="block md:hidden divide-y divide-border-subtle/50">
          {filteredAndSortedItems.length > 0 ? (
            filteredAndSortedItems.map((item) => {
              const memberProjects = getMemberProjects(item);
              const isTargetSelf =
                item.id === user?._id || item.id === user?.id;
              const canReassign =
                item.type === 'member' && canManageProjects;
              const canDeactivate =
                item.type === 'member' && canManageUsers && !isTargetSelf;
              const canRevoke = item.type === 'invitation' && canInviteUsers;
              const hasAnyAction =
                canReassign || canDeactivate || canRevoke || canManageUsers;
              const isExpanded = expandedMemberId === item.id;

              return (
                <div key={item.id} className="p-3.5 space-y-2.5">
                  {/* Top Row: User Avatar, Name, Email, Status & Action */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-sm bg-background-elevated border border-border-subtle text-text flex items-center justify-center font-bold uppercase text-xs shrink-0 overflow-hidden select-none">
                        {item.profilePicture ? (
                          <img
                            src={item.profilePicture}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          item.name?.slice(0, 2)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs text-text truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-text-subtler truncate">
                          {item.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-sm leading-none whitespace-nowrap ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      {hasAnyAction && (
                        <button
                          type="button"
                          aria-label="Actions menu"
                          aria-haspopup="menu"
                          aria-expanded={menuAnchor?.item?.id === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuAnchor?.item?.id === item.id) {
                              setMenuAnchor(null);
                              setIsSubmenuOpen(false);
                              setSubmenuTriggerEl(null);
                            } else {
                              setMenuAnchor({ item, triggerEl: e.currentTarget });
                              setIsSubmenuOpen(false);
                              setSubmenuTriggerEl(null);
                            }
                          }}
                          className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                            menuAnchor?.item?.id === item.id
                              ? 'text-text bg-background-elevated'
                              : 'text-text-subtle hover:text-text hover:bg-background-elevated'
                          }`}
                        >
                          <MoreVertical size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Role Badge & Expand Toggle */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-sm leading-none whitespace-nowrap ${getRoleBadgeClass(
                        item.role,
                        item.jobTitle
                      )}`}
                    >
                      {getRoleDisplayName(item.role, item.jobTitle)}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMemberId(isExpanded ? null : item.id)
                      }
                      className="text-[11px] font-medium text-text-subtle hover:text-text flex items-center gap-1 transition-colors py-1 cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expandable Accordion: Details Panel */}
                  {isExpanded && (
                    <div className="pt-2 pb-1 border-t border-border-subtle/40 space-y-2 text-xs animate-in fade-in duration-200">
                      {/* Assigned Projects */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-subtler text-[11px] shrink-0">
                          Assigned projects
                        </span>
                        <div className="text-right">
                          {memberProjects.length === 0 ? (
                            <span className="text-text-subtler text-[11px]">Unassigned</span>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-1">
                              {memberProjects.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-text-subtle bg-background-elevated border border-border-subtle px-1.5 py-0.5 rounded"
                                >
                                  <Box size={10} className="text-primary shrink-0" />
                                  <span className="truncate max-w-[120px]">{p.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-text-subtler text-[11px]">Last active</span>
                        <span className="text-text-subtle text-[11px]">
                          {formatLastActive(item.lastActive)}
                        </span>
                      </div>

                      {/* Joined On */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-text-subtler text-[11px]">Joined on</span>
                        <span className="text-text-subtle text-[11px]">
                          {formatJoinedOn(item.joinedOn)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center px-4">
              <AlertTriangle size={24} className="mx-auto text-text-subtler mb-2" />
              <h3 className="text-xs font-semibold text-text">No members found</h3>
              <p className="text-[11px] text-text-subtle font-normal mt-0.5">
                No members or invitations matched the search or filter criteria.
              </p>
            </div>
          )}
        </div>

        {/* 4. Pagination Control Footer */}
        <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-background-elevated/30 text-xs font-medium text-text-subtle select-none">
          <div>
            {filteredAndSortedItems.length > 0 ? (
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(
                  currentPage * pageSize,
                  statusFilter === 'ALL'
                    ? (data.total ?? filteredAndSortedItems.length)
                    : filteredAndSortedItems.length
                )}{' '}
                of{' '}
                {statusFilter === 'ALL'
                  ? (data.total ?? filteredAndSortedItems.length)
                  : filteredAndSortedItems.length}{' '}
                {statusFilter !== 'ALL' ? 'filtered users' : 'users'}
              </span>
            ) : (
              <span>Showing 0 to 0 of 0 users</span>
            )}
          </div>

          {/* Page numbers list */}
          {(statusFilter === 'ALL' && data.pages
            ? data.pages
            : Math.ceil(filteredAndSortedItems.length / pageSize)) > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="w-8 h-8 flex items-center justify-center border border-border-subtle hover:border-border disabled:opacity-30 rounded-xs transition-colors cursor-pointer text-text disabled:cursor-not-allowed bg-background-elevated"
              >
                <ChevronLeft size={13} />
              </button>

              {Array.from(
                {
                  length:
                    statusFilter === 'ALL' && data.pages
                      ? data.pages
                      : Math.ceil(filteredAndSortedItems.length / pageSize) ||
                        1,
                },
                (_, i) => i + 1
              ).map((p) => {
                const totalPageCount =
                  statusFilter === 'ALL' && data.pages
                    ? data.pages
                    : Math.ceil(filteredAndSortedItems.length / pageSize) || 1;
                // simple ellipsis styling for long pagination lists
                if (
                  totalPageCount > 7 &&
                  Math.abs(p - currentPage) > 2 &&
                  p !== 1 &&
                  p !== totalPageCount
                ) {
                  if (p === 2 || p === totalPageCount - 1) {
                    return (
                      <span key={p} className="px-1 text-text-subtler text-xs">
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
                    className={`w-8 h-8 flex items-center justify-center border rounded-xs text-xs font-semibold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-primary border-primary text-black'
                        : 'bg-background-elevated border-border-subtle hover:border-border text-text'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={
                  currentPage ===
                  (statusFilter === 'ALL' && data.pages
                    ? data.pages
                    : Math.ceil(filteredAndSortedItems.length / pageSize) || 1)
                }
                onClick={() =>
                  setCurrentPage((c) =>
                    Math.min(
                      statusFilter === 'ALL' && data.pages
                        ? data.pages
                        : Math.ceil(filteredAndSortedItems.length / pageSize) ||
                            1,
                      c + 1
                    )
                  )
                }
                className="w-8 h-8 flex items-center justify-center border border-border-subtle hover:border-border disabled:opacity-30 rounded-xs transition-colors cursor-pointer text-text disabled:cursor-not-allowed bg-background-elevated"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Page size dropdown */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-background-elevated border border-border-subtle hover:border-border text-xs font-medium text-text pl-3 pr-7 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer rounded-xs appearance-none"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <ChevronLeft
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 -rotate-90 text-text-subtle pointer-events-none"
            />
          </div>
        </div>
      </div>
        </>
      )}

      {/* Portal-Based Actions Menu & Submenu */}
      {menuAnchor && (() => {
        const item = menuAnchor.item;
        const isTargetSelf =
          item.id === user?._id || item.id === user?.id;
        const canReassignItem =
          item.type === 'member' && canManageProjects;
        const canDeactivateItem =
          item.type === 'member' && canManageUsers && !isTargetSelf;
        const canRevokeItem = item.type === 'invitation' && canInviteUsers;

        return (
          <>
            <ActionPortalMenu
              triggerEl={menuAnchor.triggerEl}
              isOpen={Boolean(menuAnchor)}
              onClose={() => {
                setMenuAnchor(null);
                setIsSubmenuOpen(false);
                setSubmenuTriggerEl(null);
              }}
              width={208}
            >
              {item.type === 'member' && (
                <>
                  {/* Direct Role & Permission Edit */}
                  {canManageUsers && (
                    <button
                      onClick={() => {
                        const targetItem = item;
                        setMenuAnchor(null);
                        setIsSubmenuOpen(false);
                        setSubmenuTriggerEl(null);
                        setEditingUser(targetItem);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-text-subtle hover:text-text hover:bg-background-elevated flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Shield size={13} className="text-primary" />
                      <span>Edit role & access</span>
                    </button>
                  )}

                  {/* Project Allocation Sub-menu Trigger */}
                  {canReassignItem && (
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
                      className="w-full px-3 py-2 text-xs font-medium text-text-subtle hover:text-text hover:bg-background-elevated flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Box size={13} className="text-secondary" />
                        <span>Reassign project</span>
                      </span>
                      <ChevronRight
                        size={12}
                        className={`text-text-subtle transition-transform ${isSubmenuOpen ? 'translate-x-0.5' : ''}`}
                      />
                    </button>
                  )}

                  {/* Deactivate / Reactivate User */}
                  {canDeactivateItem && (
                    <button
                      onClick={() => {
                        const targetItem = item;
                        setMenuAnchor(null);
                        setIsSubmenuOpen(false);
                        setSubmenuTriggerEl(null);
                        setModalConfig({
                          isOpen: true,
                          title:
                            targetItem.status === 'Deactivated'
                              ? 'Reactivate user'
                              : 'Deactivate user',
                          message: `Are you sure you want to ${
                            targetItem.status === 'Deactivated'
                              ? 'reactivate'
                              : 'deactivate'
                          } ${targetItem.name}? This will update their login access.`,
                          confirmText:
                            targetItem.status === 'Deactivated'
                              ? 'Reactivate'
                              : 'Deactivate',
                          type:
                            targetItem.status === 'Deactivated'
                              ? 'info'
                              : 'danger',
                          onConfirm: () =>
                            handleToggleDeactivate(
                              targetItem.id,
                              targetItem.status
                            ),
                        });
                      }}
                      className={`w-full px-3 py-2 text-xs font-medium text-left cursor-pointer hover:bg-background-elevated flex items-center gap-2 transition-colors ${
                        canManageUsers || canReassignItem
                          ? 'border-t border-border-subtle/40 mt-1 pt-1.5'
                          : ''
                      }`}
                    >
                      {item.status === 'Deactivated' ? (
                        <>
                          <UserCheck size={13} className="text-status-success" />
                          <span className="text-status-success">Reactivate member</span>
                        </>
                      ) : (
                        <>
                          <UserMinus size={13} className="text-status-error" />
                          <span className="text-status-error">Deactivate member</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {item.type === 'invitation' && canRevokeItem && (
                <button
                  onClick={() => {
                    const targetItem = item;
                    setMenuAnchor(null);
                    setIsSubmenuOpen(false);
                    setSubmenuTriggerEl(null);
                    setModalConfig({
                      isOpen: true,
                      title: 'Revoke invitation',
                      message: `Are you sure you want to cancel the pending invitation sent to ${targetItem.email}?`,
                      confirmText: 'Revoke',
                      type: 'danger',
                      onConfirm: () => handleRevokeInvitation(targetItem.id),
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-status-error hover:bg-background-elevated flex items-center gap-2 text-left cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Revoke invitation</span>
                </button>
              )}
            </ActionPortalMenu>

            {/* Submenu for Project Reassignment */}
            {canReassignItem && isSubmenuOpen && submenuTriggerEl && (
              <ActionSubmenuPortal
                parentTriggerEl={submenuTriggerEl}
                isOpen={isSubmenuOpen}
                onClose={() => setIsSubmenuOpen(false)}
                width={208}
                maxHeight={200}
              >
                <button
                  onClick={() => handleAssignProject(item.id, null)}
                  className="w-full px-3 py-2 text-xs font-medium text-text-subtle hover:text-text hover:bg-background-elevated text-left flex justify-between items-center cursor-pointer transition-colors"
                >
                  <span>Unassign project</span>
                  {!item.assignedProjectId && (
                    <Check size={12} className="text-primary shrink-0 ml-2" />
                  )}
                </button>
                {allProjects.map((p) => {
                  const memberProjects = Array.isArray(item.projects)
                    ? item.projects
                    : [];
                  const isCurrent =
                    item.assignedProjectId?.id === p.id ||
                    memberProjects.some(
                      (mp) => mp.id === p.id || mp.name === p.name
                    );
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAssignProject(item.id, p.id)}
                      className="w-full px-3 py-2 text-xs font-medium text-text-subtle hover:text-text hover:bg-background-elevated text-left flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="truncate max-w-[130px]">{p.name}</span>
                      {isCurrent && (
                        <Check size={12} className="text-primary shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </ActionSubmenuPortal>
            )}
          </>
        );
      })()}

      {/* Action Confirmation Modal */}
      <TacticalModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />

      {/* User Edit Modal for Team Management */}
      <UserEditModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={({ userId, role }) => {
          updateRoleMutation.mutate(
            { userId, role },
            {
              onSuccess: () => {
                toast.success('User role updated');
                setEditingUser(null);
                fetchData();
              },
              onError: (err) => {
                toast.error(err?.message || 'Failed to update user role');
              },
            }
          );
        }}
        onDeactivate={({ userId, status }) => {
          deactivateMutation.mutate(
            { userId, status },
            {
              onSuccess: () => {
                toast.success(
                  `User successfully ${status === 'Active' ? 'activated' : 'deactivated'}`
                );
                setEditingUser(null);
                fetchData();
              },
              onError: (err) => {
                toast.error(err?.message || 'Failed to update user status');
              },
            }
          );
        }}
      />
    </div>
  );
};

export default Team;
