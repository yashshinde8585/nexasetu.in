import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Mail,
  Shield,
  FolderKanban,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  Plus,
  Trash2,
  ArrowLeft,
  Copy,
  Check,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectService from '../../api/projectApi';
import TeamService from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, JOB_TITLES } from '../../constants';
import MetricsService from '../../api/metricsApi';
import { sanitizeInput, validateInviteForm, validateEmail } from '../../utils/validation';

/**
 * Returns a human-readable label and style badge for backend system access tiers.
 */
const getRolePermissionBadge = (role) => {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
    case USER_ROLES.WORKSPACE_ADMIN:
      return { label: 'Admin (Full access)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    case USER_ROLES.WORKSPACE_MANAGER:
      return { label: 'Manager (Team & projects)', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    case USER_ROLES.TECH_LEAD:
      return { label: 'Tech Lead (Sprint & tasks)', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    case USER_ROLES.SENIOR_ENGINEER:
    case USER_ROLES.SOFTWARE_ENGINEER:
      return { label: 'Engineer (Tasks & code)', color: 'text-primary bg-primary/10 border-primary/20' };
    case USER_ROLES.INTERN:
      return { label: 'Intern (Contributor)', color: 'text-text-subtle bg-background-elevated border-border-subtle' };
    case USER_ROLES.RESTRICTED:
      return { label: 'Restricted access', color: 'text-status-warning bg-status-warning/10 border-status-warning/20' };
    default:
      return { label: 'Contributor', color: 'text-primary bg-primary/10 border-primary/20' };
  }
};

/**
 * Handles bulk invitations, organizational job title assignment,
 * and project allocations for new workspace members.
 */
const AddTeamMember = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invites, setInvites] = useState([
    {
      name: '',
      email: '',
      role: USER_ROLES.PROJECT_MEMBER,
      jobTitle: 'Software Engineer',
      projectId: '',
    },
  ]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const isTechLead =
    user?.role === USER_ROLES.TECH_LEAD ||
    user?.jobTitle?.toUpperCase().includes('TECH LEAD');

  // Unsaved changes detection
  const isDirty = useMemo(() => {
    if (status === 'success') return false;
    return (
      invites.length > 1 ||
      invites.some(
        (inv) =>
          inv.name.trim() !== '' ||
          inv.email.trim() !== '' ||
          inv.projectId !== '' ||
          inv.jobTitle !== 'Software Engineer'
      )
    );
  }, [invites, status]);

  // Window beforeunload prompt when dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Dynamic job titles including organizational custom roles
  const dynJobTitles = useMemo(() => {
    return [
      ...JOB_TITLES,
      ...(customRoles.some((r) => r.isCustom)
        ? [
            {
              category: 'Organizational Roles',
              roles: customRoles
                .filter((r) => r.isCustom)
                .map((r) => ({
                  title: r.role.replace(/_/g, ' '),
                  role: r.role,
                })),
            },
          ]
        : []),
    ];
  }, [customRoles]);

  // Restrict Tech Leads from assigning Executive/Admin roles
  const filteredJobTitles = useMemo(() => {
    if (!isTechLead) return dynJobTitles;
    return dynJobTitles
      .map((group) => ({
        ...group,
        roles: group.roles.filter((r) =>
          [
            'Senior Engineer',
            'Software Engineer',
            'Junior Engineer',
            'Intern',
            'QA Engineer',
          ].includes(r.title)
        ),
      }))
      .filter((group) => group.roles.length > 0);
  }, [dynJobTitles, isTechLead]);

  const allRoleOptions = useMemo(
    () => dynJobTitles.flatMap((g) => g.roles),
    [dynJobTitles]
  );

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const [projRes, roleRes] = await Promise.all([
          ProjectService.getProjects(),
          TeamService.getRoles(),
        ]);

        const projectArray = Array.isArray(projRes?.data?.projects)
          ? projRes.data.projects
          : projRes?.projects || (Array.isArray(projRes) ? projRes : []);
        setProjects(projectArray);

        if (roleRes?.data?.roles) {
          setCustomRoles(roleRes.data.roles);
        }
      } catch (err) {
        console.error('Failed to load project or role data', err);
      }
    };
    fetchTeamData();
  }, []);

  const addRow = () => {
    setInvites((prev) => [
      ...prev,
      {
        name: '',
        email: '',
        role: USER_ROLES.PROJECT_MEMBER,
        jobTitle: 'Software Engineer',
        projectId: '',
      },
    ]);
  };

  const removeRow = (index) => {
    if (invites.length > 1) {
      setInvites((prev) => prev.filter((_, i) => i !== index));
      // Re-index remaining field errors
      setFieldErrors((prev) => {
        const next = {};
        Object.entries(prev).forEach(([key, val]) => {
          const [rowIdxStr, field] = key.split('-');
          const rowIdx = parseInt(rowIdxStr, 10);
          if (rowIdx < index) {
            next[key] = val;
          } else if (rowIdx > index) {
            next[`${rowIdx - 1}-${field}`] = val;
          }
        });
        return next;
      });
    }
  };

  const updateRow = (index, field, value) => {
    setInvites((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear field-level error when user modifies the value
    setFieldErrors((prev) => {
      if (!prev[`${index}-${field}`]) return prev;
      const next = { ...prev };
      delete next[`${index}-${field}`];
      return next;
    });

    if (error) setError('');
  };

  const handleJobTitleChange = (idx, selectedTitle) => {
    const matched = allRoleOptions.find((o) => o.title === selectedTitle);
    setInvites((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        jobTitle: selectedTitle,
        role: matched?.role || USER_ROLES.PROJECT_MEMBER,
      };
      return updated;
    });

    setFieldErrors((prev) => {
      if (!prev[`${idx}-role`]) return prev;
      const next = { ...prev };
      delete next[`${idx}-role`];
      return next;
    });

    if (error) setError('');
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/teams');
    }
  };

  const handleSendAll = async (e) => {
    e.preventDefault();

    if (status === 'loading') return;

    // Filter non-empty rows or check empty batch
    const validInvites = invites.filter(
      (i) => i.name.trim() !== '' || i.email.trim() !== ''
    );

    if (validInvites.length === 0) {
      const emptyMsg = 'Please provide at least one team member invitation.';
      setError(emptyMsg);
      toast.error(emptyMsg);
      setFieldErrors({
        '0-name': 'Enter a full name.',
        '0-email': 'Enter an email address.',
      });
      document.getElementById('name-0')?.focus();
      return;
    }

    // Comprehensive field validation across all staged rows
    const errors = {};
    const emailMap = new Map();
    let duplicateEmail = null;

    invites.forEach((inv, idx) => {
      const name = inv.name?.trim();
      const rawEmail = inv.email?.trim();
      const normalizedEmail = rawEmail?.toLowerCase();

      // Name validation
      if (!name) {
        errors[`${idx}-name`] = 'Enter a full name.';
      } else if (name.length < 2) {
        errors[`${idx}-name`] = 'Name must contain at least 2 characters.';
      }

      // Email validation
      if (!rawEmail) {
        errors[`${idx}-email`] = 'Enter an email address.';
      } else if (!validateEmail(rawEmail)) {
        errors[`${idx}-email`] = 'Enter a valid email address.';
      } else if (emailMap.has(normalizedEmail)) {
        duplicateEmail = rawEmail;
        errors[`${idx}-email`] = 'This email is already included in the invitation list.';
      } else {
        emailMap.set(normalizedEmail, idx);
      }

      // Role validation
      if (!inv.role) {
        errors[`${idx}-role`] = 'Select a role.';
      }
    });

    if (duplicateEmail) {
      const msg = `Duplicate email found: "${duplicateEmail}". Each invited member must have a unique email.`;
      setError(msg);
      toast.error(msg);
      setFieldErrors(errors);
      // Focus duplicate email field
      const dupIdx = Object.keys(errors).find(
        (k) => k.endsWith('-email') && errors[k].includes('already included')
      );
      if (dupIdx) {
        const [rIdx] = dupIdx.split('-');
        document.getElementById(`email-${rIdx}`)?.focus();
      }
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      const [rIdx, field] = firstKey.split('-');
      document.getElementById(`${field}-${rIdx}`)?.focus();
      const msg = 'Please resolve the errors highlighted below.';
      setError(msg);
      toast.error(msg);
      return;
    }

    // Client-side schema validation via utility
    const schemaError = validateInviteForm(invites);
    if (schemaError) {
      setError(schemaError);
      toast.error(schemaError);
      return;
    }

    const sanitizedInvites = invites.map((inv) => ({
      ...inv,
      name: sanitizeInput(inv.name),
      email: inv.email.trim(),
    }));

    setInvites(sanitizedInvites);
    setStatus('loading');
    setError('');
    setFieldErrors({});

    try {
      const res = await TeamService.inviteBulk({ invites: sanitizedInvites });
      const provisioned =
        res?.provisionedUsers || res?.data?.provisionedUsers || [];
      const failed = res?.failedInvites || res?.data?.failedInvites || [];

      setResults(res);
      setStatus('success');
      MetricsService.trackEvent('invites_sent', { count: sanitizedInvites.length });

      if (failed.length > 0 && provisioned.length > 0) {
        const msg = `${provisioned.length} ${
          provisioned.length === 1 ? 'invitation' : 'invitations'
        } sent. ${failed.length} could not be completed.`;
        toast(msg, { icon: '⚠️' });
      } else if (failed.length > 0 && provisioned.length === 0) {
        toast.error('Unable to send invitations. Please review errors.');
      } else {
        const msg =
          provisioned.length > 1
            ? `${provisioned.length} invitations sent successfully.`
            : 'Invitation sent successfully.';
        toast.success(msg);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Couldn't send invitations. Please try again.";
      setError(message);
      toast.error(message);
      setStatus('error');
    }
  };

  const handleRetryFailed = () => {
    if (failedInvites.length > 0) {
      const failedRows = failedInvites.map((f) => {
        const orig = invites.find(
          (inv) => inv.email.toLowerCase() === f.email?.toLowerCase()
        );
        return {
          name: orig?.name || '',
          email: f.email || '',
          role: orig?.role || USER_ROLES.PROJECT_MEMBER,
          jobTitle: orig?.jobTitle || 'Software Engineer',
          projectId: orig?.projectId || '',
        };
      });
      setInvites(failedRows);
      setStatus('idle');
      setResults(null);
      setFieldErrors({});
      setError('Please review and correct the failed invitation details below.');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setInvites([
      {
        name: '',
        email: '',
        role: USER_ROLES.PROJECT_MEMBER,
        jobTitle: 'Software Engineer',
        projectId: '',
      },
    ]);
    setResults(null);
    setFieldErrors({});
    setError('');
  };

  const provisionedUsers =
    results?.provisionedUsers || results?.data?.provisionedUsers || [];
  const failedInvites =
    results?.failedInvites || results?.data?.failedInvites || [];

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success('Invitation copied to clipboard');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // SUCCESS / PROVISIONED STATE VIEW
  if (status === 'success') {
    return (
      <div className="min-h-[80vh] bg-background text-text p-4 sm:p-6 flex items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-card border border-border-subtle rounded-md p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xs bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                Invitations Processed
              </h2>
              <p className="text-xs text-text-subtle">
                {provisionedUsers.length}{' '}
                {provisionedUsers.length === 1 ? 'member' : 'members'} provisioned for your workspace.
              </p>
            </div>
          </div>

          {/* Warning for failed invitations if any */}
          {failedInvites.length > 0 && (
            <div className="bg-status-warning/10 border border-status-warning/20 rounded-xs p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-status-warning">
                <AlertTriangle size={15} />
                <span>Some invitations could not be completed:</span>
              </div>
              <ul className="list-disc list-inside text-text-subtle space-y-1 pl-1">
                {failedInvites.map((f, idx) => (
                  <li key={idx}>
                    <strong className="text-text">{f.email}</strong>: {f.message || 'Invitation failed'}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleRetryFailed}
                className="mt-1 text-xs font-semibold text-status-warning hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Review and retry failed invitations</span>
              </button>
            </div>
          )}

          {/* Provisioned Members List */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {provisionedUsers.length > 0 ? (
              provisionedUsers.map((member, i) => {
                const inviteText = `Hi ${
                  member.name || 'there'
                },\n\nYou have been invited to join the NexaSetu workspace.\n\nGetting Started:\n• Email: ${
                  member.email
                }\n• Temporary Password: ${member.email}\n• Login: ${
                  window.location.origin
                }/login\n\nFor security reasons, please log in and update your password immediately upon initial access.\n\nBest regards,\nNexaSetu Team`;
                const isCopied = copiedField === `invite-${i}`;

                return (
                  <div
                    key={i}
                    className="bg-background-elevated border border-border-subtle rounded-xs p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text truncate">
                          {member.name || 'Team member'}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-xs bg-primary/10 text-primary border border-primary/20">
                          {member.role ? member.role.replace(/_/g, ' ') : 'Member'}
                        </span>
                      </div>
                      <div className="text-xs text-text-subtle truncate mt-0.5">
                        {member.email}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteText, `invite-${i}`)}
                      className={`h-8 px-3 rounded-xs text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                        isCopied
                          ? 'bg-status-success/10 text-status-success border-status-success/20'
                          : 'bg-card hover:bg-background-elevated border-border-subtle text-text'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-primary" />
                          <span>Copy invitation</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-text-subtle">
                No new members provisioned in this batch.
              </div>
            )}
          </div>

          {/* Security Advisory */}
          <div className="p-3 bg-background-elevated border border-border-subtle rounded-xs text-xs text-text-subtle space-y-1">
            <div>
              <span className="font-semibold text-text">Security Note:</span>{' '}
              Temporary login credentials match each recipient&apos;s registered email address. New members are instructed to change their password on initial login.
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => navigate('/teams')}
              className="w-full sm:flex-1 h-9 px-4 bg-background-elevated hover:bg-card border border-border-subtle text-xs font-semibold text-text rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Return to teams</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:flex-1 h-9 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Invite more members</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD INVITATION FORM VIEW
  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Breadcrumb & Title */}
        <header className="space-y-3 pb-4 border-b border-border-subtle">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle hover:text-text cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to teams</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <UserPlus size={16} />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                  Invite Team Members
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-text-subtle">
                Invite colleagues to your workspace, assign their organizational roles, and allocate projects.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-medium text-text-subtler bg-background-elevated border border-border-subtle px-2.5 py-1 rounded-xs">
                {invites.length} {invites.length === 1 ? 'member' : 'members'} staged
              </span>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <form onSubmit={handleSendAll} className="space-y-6" noValidate>
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-status-error/10 border border-status-error/20 rounded-xs flex items-start gap-2.5 animate-fade-in text-xs text-status-error"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Staged Member Cards */}
          <div className="space-y-4">
            {invites.map((invite, idx) => (
              <div
                key={idx}
                className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-4 relative hover:border-border transition-colors"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-border-subtler">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-xs bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-text">
                      Member {idx + 1}
                      <span className="sr-only">Team Member {idx + 1}</span>
                    </span>
                  </div>

                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-text-subtle hover:text-status-error p-1 rounded-xs transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Remove this member"
                      aria-label={`Remove member ${idx + 1}`}
                    >
                      <Trash2 size={13} />
                      <span className="hidden sm:inline text-[11px]">Remove</span>
                    </button>
                  )}
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`name-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      <span>Full name</span>{' '}
                      <span className="sr-only">Full Name</span>
                      <span className="text-status-error">*</span>
                    </label>
                    <input
                      id={`name-${idx}`}
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={invite.name}
                      onChange={(e) => updateRow(idx, 'name', e.target.value)}
                      aria-invalid={!!fieldErrors[`${idx}-name`]}
                      aria-describedby={
                        fieldErrors[`${idx}-name`] ? `name-error-${idx}` : undefined
                      }
                      className={`w-full h-9 bg-background-elevated border rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors ${
                        fieldErrors[`${idx}-name`]
                          ? 'border-status-error focus:border-status-error'
                          : 'border-border-subtle'
                      }`}
                    />
                    {fieldErrors[`${idx}-name`] && (
                      <p
                        id={`name-error-${idx}`}
                        role="alert"
                        className="text-[11px] text-status-error font-medium flex items-center gap-1 mt-1"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors[`${idx}-name`]}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`email-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      <span>Email address</span>{' '}
                      <span className="sr-only">Email Address</span>
                      <span className="text-status-error">*</span>
                    </label>
                    <input
                      id={`email-${idx}`}
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={invite.email}
                      onChange={(e) => updateRow(idx, 'email', e.target.value)}
                      aria-invalid={!!fieldErrors[`${idx}-email`]}
                      aria-describedby={
                        fieldErrors[`${idx}-email`] ? `email-error-${idx}` : undefined
                      }
                      className={`w-full h-9 bg-background-elevated border rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors ${
                        fieldErrors[`${idx}-email`]
                          ? 'border-status-error focus:border-status-error'
                          : 'border-border-subtle'
                      }`}
                    />
                    {fieldErrors[`${idx}-email`] && (
                      <p
                        id={`email-error-${idx}`}
                        role="alert"
                        className="text-[11px] text-status-error font-medium flex items-center gap-1 mt-1"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors[`${idx}-email`]}</span>
                      </p>
                    )}
                  </div>

                  {/* Job title & role */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`role-${idx}`}
                        className="text-xs font-semibold text-text-subtle block"
                      >
                        <span>Job title & role</span>
                        <span className="sr-only">Role / Job Title</span>{' '}
                        <span className="text-status-error">*</span>
                      </label>
                      {invite.role && (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-xs border ${
                            getRolePermissionBadge(invite.role).color
                          }`}
                        >
                          {getRolePermissionBadge(invite.role).label}
                        </span>
                      )}
                    </div>
                    <select
                      id={`role-${idx}`}
                      value={invite.jobTitle}
                      onChange={(e) => handleJobTitleChange(idx, e.target.value)}
                      aria-invalid={!!fieldErrors[`${idx}-role`]}
                      aria-describedby={
                        fieldErrors[`${idx}-role`] ? `role-error-${idx}` : undefined
                      }
                      className={`w-full h-9 bg-background-elevated border rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer ${
                        fieldErrors[`${idx}-role`]
                          ? 'border-status-error focus:border-status-error'
                          : 'border-border-subtle'
                      }`}
                    >
                      {filteredJobTitles.map((group, gIdx) => (
                        <optgroup key={gIdx} label={group.category}>
                          {group.roles.map((r, rIdx) => (
                            <option key={rIdx} value={r.title}>
                              {r.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {fieldErrors[`${idx}-role`] ? (
                      <p
                        id={`role-error-${idx}`}
                        role="alert"
                        className="text-[11px] text-status-error font-medium flex items-center gap-1 mt-1"
                      >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{fieldErrors[`${idx}-role`]}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-text-subtler">
                        Select the job title to automatically configure platform access permissions.
                      </p>
                    )}
                  </div>

                  {/* Assign to project (optional) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`project-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      <span>Assign to project</span>{' '}
                      <span className="sr-only">Assign to Project</span>
                      <span className="text-text-subtler font-normal">(Optional)</span>
                    </label>
                    <select
                      id={`project-${idx}`}
                      value={invite.projectId || ''}
                      onChange={(e) => updateRow(idx, 'projectId', e.target.value)}
                      className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">No project assigned (General workspace)</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.key ? `(${p.key})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-text-subtler">
                      {invite.projectId
                        ? 'Allocates member directly to this project squad upon onboarding.'
                        : 'General access: member can participate across open workspace initiatives.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={addRow}
              className="w-full sm:w-auto h-9 px-4 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} className="text-primary" />
              <span>Add another member</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 sm:flex-initial h-9 px-4 text-xs font-medium text-text-subtler hover:text-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 sm:flex-initial h-9 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Sending invitations...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>
                      Send {invites.length > 1 ? `(${invites.length}) invitations` : 'invitation'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-card border border-border-subtle rounded-md p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xs bg-status-warning/10 border border-status-warning/20 flex items-center justify-center text-status-warning shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 id="unsaved-modal-title" className="text-sm font-bold text-text">
                  Unsaved Changes
                </h3>
                <p className="text-xs text-text-subtle">
                  You have unsaved changes. Leave without saving?
                </p>
              </div>
            </div>
            <p className="text-xs text-text-subtler">
              Any staged member details entered will be discarded.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtler">
              <button
                type="button"
                onClick={() => setShowUnsavedDialog(false)}
                className="h-8 px-3.5 bg-background-elevated hover:bg-card border border-border-subtle text-xs font-semibold text-text rounded-xs transition-colors cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  navigate('/teams');
                }}
                className="h-8 px-3.5 bg-status-error hover:bg-status-error/90 text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Discard and leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTeamMember;
