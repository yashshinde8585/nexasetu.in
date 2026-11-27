import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getProjects } from '../../api/projectApi';
import { ROUTES } from '../../constants';
import { ChangePasswordModal } from '../../components/organisms/SettingsDecks';

/**
 * Clean, flat, content-first User Profile page for NexaSetu.
 * Structured using the Seven C's of Effective Communication.
 */
const Profile = () => {
  const { user, logout, updateAvatar } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState(null); // { type: 'error' | 'success', message: string }
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef(null);

  // Safely fetch accessible projects to resolve assigned project name
  const { data: projectList = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const res = await getProjects();
        return res?.data?.projects || res?.projects || [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(user?.assignedProjectId),
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleAvatarClick = () => {
    if (isUploading) return;
    setInlineFeedback(null);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isUploading) return;

    setInlineFeedback(null);

    // Validate supported image MIME type (matching backend multer configuration)
    if (!file.type.startsWith('image/')) {
      const msg = 'Please choose a valid image file (JPEG, PNG, WebP, or GIF).';
      setInlineFeedback({ type: 'error', message: msg });
      showError(msg);
      return;
    }

    // Validate file size (2 MB limit)
    if (file.size > 2 * 1024 * 1024) {
      const msg = 'Choose an image smaller than 2 MB.';
      setInlineFeedback({ type: 'error', message: msg });
      showError(msg);
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploading(true);
      await updateAvatar(formData);
      const successMsg = 'Profile photo updated.';
      setInlineFeedback({ type: 'success', message: successMsg });
      showSuccess(successMsg);
    } catch (err) {
      console.error('[AVATAR_UPLOAD_FAILURE]:', err);
      const errMsg =
        err?.response?.data?.message ||
        "Couldn't update your profile photo. Try again.";
      setInlineFeedback({ type: 'error', message: errMsg });
      showError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyWorkspaceId = async () => {
    if (!user?.workspaceId || copiedId) return;
    const idToCopy =
      typeof user.workspaceId === 'object'
        ? user.workspaceId._id || user.workspaceId.id
        : String(user.workspaceId);
    if (!idToCopy) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(idToCopy);
      }
      setCopiedId(true);
      showSuccess('Workspace ID copied to clipboard.');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(true);
      showSuccess('Workspace ID copied to clipboard.');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!user) return null;

  // Formatting helper for system roles
  const formatRole = (role) => {
    if (!role) return 'Project Member';
    const roleMap = {
      SUPER_ADMIN: 'Super Admin',
      WORKSPACE_ADMIN: 'Workspace Admin',
      WORKSPACE_MANAGER: 'Workspace Manager',
      TECH_LEAD: 'Tech Lead',
      SENIOR_ENGINEER: 'Senior Engineer',
      SOFTWARE_ENGINEER: 'Software Engineer',
      PROJECT_MEMBER: 'Project Member',
      RESTRICTED: 'Restricted',
      INTERN: 'Intern',
      ADMIN: 'Admin',
    };
    return (
      roleMap[role] ||
      role
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  // Verified user properties
  const displayName =
    user.name || user.fullName || user.firstName || user.username || 'User';
  const displayEmail =
    user.email ||
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    '';
  const displayAvatar = user.profilePicture || user.imageUrl;
  const jobTitle = user.jobTitle || 'Software Engineer';
  const systemRole = formatRole(user.role);
  const department = user.department || 'Engineering';

  // Account creation date formatting
  const accountCreatedDate = useMemo(() => {
    if (!user.createdAt) return 'Not available';
    try {
      return new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Not available';
    }
  }, [user.createdAt]);

  // Safe resolution of workspace details
  const workspaceName = useMemo(() => {
    if (user.workspaceName) return user.workspaceName;
    if (typeof user.workspaceId === 'object' && user.workspaceId?.name) {
      return user.workspaceId.name;
    }
    return 'Primary Workspace';
  }, [user.workspaceName, user.workspaceId]);

  const workspaceIdDisplay = useMemo(() => {
    if (!user.workspaceId) return 'Not assigned';
    if (typeof user.workspaceId === 'object') {
      return (
        user.workspaceId._id || user.workspaceId.id || 'Active Workspace'
      );
    }
    return String(user.workspaceId);
  }, [user.workspaceId]);

  // Safe resolution of assigned project name
  const assignedProjectInfo = useMemo(() => {
    if (!user.assignedProjectId) return null;
    if (
      typeof user.assignedProjectId === 'object' &&
      user.assignedProjectId?.name
    ) {
      return {
        id: user.assignedProjectId._id || user.assignedProjectId.id,
        name: user.assignedProjectId.name,
      };
    }
    const targetId = String(user.assignedProjectId);
    const matched = projectList.find(
      (p) => String(p._id || p.id) === targetId
    );
    return {
      id: targetId,
      name:
        matched?.name ||
        matched?.title ||
        `Project (${targetId.slice(-6)})`,
    };
  }, [user.assignedProjectId, projectList]);

  // Account status badge with accurate semantic coloring
  const accountStatus =
    user.status || (user.isActive !== false ? 'Active' : 'Deactivated');

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-success">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          Active
        </span>
      );
    }
    if (s === 'invited') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          Invited
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-error">
        <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
        {status || 'Deactivated'}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 font-sans">
      {/* Page Title & Context Header */}
      <div className="pb-5 border-b border-border-subtle">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Account Profile
        </h1>
        <p className="text-sm text-text-subtle mt-1">
          Personal identity details, workspace assignments, and credentials.
        </p>
      </div>

      {/* 1. Identity Header Section (Flat & Open) */}
      <section
        aria-label="Profile Header"
        className="pb-7 border-b border-border-subtle"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          {/* Avatar with Subtle Camera Indicator and Hover Trigger */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              aria-label="Change profile photo"
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-background-elevated border border-border-subtle flex items-center justify-center relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 transition-all cursor-pointer hover:border-primary/50 group"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-text-subtle uppercase">
                  {displayName.charAt(0)}
                </span>
              )}

              {/* Uploading Spinner */}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-20">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}

              {/* Hover Overlay */}
              {!isUploading && (
                <div className="absolute inset-0 bg-background-dark/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-10 backdrop-blur-xs text-white">
                  <Camera size={18} />
                  <span className="text-[10px] font-medium tracking-wide">
                    Update
                  </span>
                </div>
              )}
            </button>

            {/* Subtle Permanent Camera Badge */}
            {!isUploading && (
              <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-background-elevated border border-border-subtle shadow-xs flex items-center justify-center text-text-subtle group-hover:text-primary group-hover:border-primary/50 transition-colors pointer-events-none"
                title="Upload photo"
              >
                <Camera size={12} />
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="Profile photo file input"
            />
          </div>

          {/* User Primary Identity Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text truncate">
                {displayName}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {systemRole}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-subtle mt-1.5">
              {/* Only show jobTitle in subtitle if it differs from the system role badge */}
              {jobTitle && jobTitle.toLowerCase() !== systemRole.toLowerCase() && (
                <>
                  <span className="font-medium text-text">{jobTitle}</span>
                  <span className="text-text-subtler">•</span>
                </>
              )}
              <span className="flex items-center gap-1.5 truncate">
                <Mail size={14} className="text-text-subtler shrink-0" />
                <span className="truncate">{displayEmail || 'No email configured'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Accessible Inline Feedback Banner */}
        {inlineFeedback && (
          <div
            role={inlineFeedback.type === 'error' ? 'alert' : 'status'}
            className={`mt-4 p-3 rounded-lg text-xs flex items-start justify-between gap-2 transition-all ${
              inlineFeedback.type === 'error'
                ? 'bg-status-error/10 border border-status-error/20 text-status-error'
                : 'bg-status-success/10 border border-status-success/20 text-status-success'
            }`}
          >
            <div className="flex items-center gap-2">
              {inlineFeedback.type === 'error' ? (
                <AlertCircle size={15} className="shrink-0" />
              ) : (
                <CheckCircle2 size={15} className="shrink-0" />
              )}
              <span>{inlineFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setInlineFeedback(null)}
              className="text-xs font-semibold hover:underline opacity-80 hover:opacity-100 cursor-pointer ml-2"
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {/* 2 & 3. Balanced Two-Column Details (Flat & Content-First) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 pb-8 border-b border-border-subtle">
        {/* Left Column: Personal Information */}
        <section aria-labelledby="personal-info-heading" className="space-y-2">
          <h3
            id="personal-info-heading"
            className="text-base font-semibold text-text mb-3"
          >
            Personal Information
          </h3>

          <dl className="space-y-0">
            <DetailRow label="Full Name" value={displayName} />
            <DetailRow
              label="Email Address"
              value={displayEmail || 'Not configured'}
            />
            <DetailRow label="Job Title" value={jobTitle} />
            <DetailRow label="Department" value={department} />
            <DetailRow label="Account Created" value={accountCreatedDate} />
          </dl>
        </section>

        {/* Right Column: Workspace Details */}
        <section aria-labelledby="workspace-details-heading" className="space-y-2">
          <h3
            id="workspace-details-heading"
            className="text-base font-semibold text-text mb-3"
          >
            Workspace & Role
          </h3>

          <dl className="space-y-0">
            <DetailRow label="Workspace" value={workspaceName} />
            <DetailRow label="System Role" value={systemRole} />
            <DetailRow label="Account Status">
              {renderStatusBadge(accountStatus)}
            </DetailRow>
            <DetailRow label="Assigned Project">
              {assignedProjectInfo ? (
                <Link
                  to={`/project/${assignedProjectInfo.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline group"
                >
                  <span className="truncate">{assignedProjectInfo.name}</span>
                  <ExternalLink
                    size={13}
                    className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ) : (
                <span className="text-sm text-text-subtle font-normal">
                  No project assigned
                </span>
              )}
            </DetailRow>
          </dl>

          {/* Secondary Details Area: Workspace ID with Copy Action */}
          <div className="pt-3 border-t border-border-subtle/25 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-text-subtle">
            <span className="text-text-subtle">Workspace Membership ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-subtle select-all">
                {workspaceIdDisplay}
              </span>
              {user?.workspaceId && (
                <button
                  type="button"
                  onClick={handleCopyWorkspaceId}
                  aria-label="Copy Workspace ID"
                  className="p-1 rounded text-text-subtle hover:text-text hover:bg-background-elevated transition-colors cursor-pointer"
                  title="Copy Workspace ID"
                >
                  {copiedId ? (
                    <Check size={13} className="text-status-success" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 4. Account Security Section (Clean Action Rows) */}
      <section aria-labelledby="security-heading" className="space-y-3">
        <h3
          id="security-heading"
          className="text-base font-semibold text-text mb-3"
        >
          Account Security
        </h3>

        <div className="divide-y divide-border-subtle/30">
          {/* Change Password Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-text">Password</div>
              <div className="text-xs text-text-subtle mt-0.5">
                Change your password to maintain account security.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="h-9 px-4 rounded-lg text-xs font-medium bg-background-elevated hover:bg-background-elevated/80 border border-border-subtle hover:border-border text-text transition-colors cursor-pointer self-start sm:self-auto shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[40px] sm:min-h-0 flex items-center justify-center"
            >
              Change Password
            </button>
          </div>

          {/* Sign Out Row */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-text">Active Session</div>
              <div className="text-xs text-text-subtle mt-0.5">
                Sign out of your active session on this device.
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 px-4 rounded-lg text-xs font-medium text-status-error hover:bg-status-error/10 border border-status-error/20 hover:border-status-error/40 transition-colors cursor-pointer self-start sm:self-auto shrink-0 focus:outline-none focus:ring-2 focus:ring-status-error/40 min-h-[40px] sm:min-h-0 flex items-center justify-center"
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

/**
 * Reusable, clean detail row component for flat SaaS layouts.
 * Responsive: stacks label above value on mobile, splits across on desktop.
 */
const DetailRow = ({ label, value, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 py-3 border-b border-border-subtle/25 last:border-b-0">
    <dt className="text-xs text-text-subtle shrink-0 sm:w-40 font-normal">
      {label}
    </dt>
    <dd className="text-sm font-medium text-text break-words sm:text-right flex-1 min-w-0">
      {children || value || 'Not specified'}
    </dd>
  </div>
);

export default Profile;
