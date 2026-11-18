import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectService from '../../api/projectApi';
import TeamService from '../../api/teamApi';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, JOB_TITLES } from '../../constants';
import MetricsService from '../../api/metricsApi';
import { sanitizeInput, validateInviteForm } from '../../utils/validation';

// Handles bulk invitation and role assignment for new workspace team members
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

  const [projects, setProjects] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const isTechLead =
    user?.role === USER_ROLES.TECH_LEAD ||
    user?.jobTitle?.toUpperCase().includes('TECH LEAD');

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
    }
  };

  const updateRow = (index, field, value) => {
    setInvites((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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
  };

  const handleSendAll = async (e) => {
    e.preventDefault();

    // Filter non-empty rows
    const validInvites = invites.filter((i) => i.email.trim() !== '');
    if (validInvites.length === 0) {
      setError('Please provide at least one team member invitation.');
      toast.error('Please provide at least one team member invitation.');
      return;
    }

    // Check for duplicate emails within the batch
    const emailSet = new Set();
    for (let i = 0; i < validInvites.length; i++) {
      const em = validInvites[i].email.trim().toLowerCase();
      if (emailSet.has(em)) {
        const msg = `Duplicate email found: "${em}". Each invited member must have a unique email.`;
        setError(msg);
        toast.error(msg);
        return;
      }
      emailSet.add(em);
    }

    // Client-side schema validation
    const validationError = validateInviteForm(validInvites);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const sanitizedInvites = validInvites.map((inv) => ({
      ...inv,
      name: sanitizeInput(inv.name),
      email: inv.email.trim(),
    }));

    setInvites(sanitizedInvites);
    setStatus('loading');
    setError('');

    try {
      const res = await TeamService.inviteBulk({ invites: sanitizedInvites });
      setResults(res);
      setStatus('success');
      MetricsService.trackEvent('invites_sent', { count: validInvites.length });
      toast.success('Invitations processed successfully');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to send invitations. Please verify inputs and try again.';
      setError(message);
      toast.error(message);
      setStatus('error');
    }
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

  // SUCCESS STATE VIEW
  if (status === 'success') {
    return (
      <div className="min-h-[80vh] bg-background text-text p-4 sm:p-6 flex items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-card border border-border-subtle rounded-md p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xs bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success">
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                Invitations Processed
              </h2>
              <p className="text-xs text-text-subtle">
                {provisionedUsers.length} {provisionedUsers.length === 1 ? 'member' : 'members'} provisioned for your workspace.
              </p>
            </div>
          </div>

          {/* Warning for failed invitations if any */}
          {failedInvites.length > 0 && (
            <div className="bg-status-warning/10 border border-status-warning/20 rounded-xs p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-status-warning">
                <AlertTriangle size={14} />
                <span>Some invitations could not be completed:</span>
              </div>
              <ul className="list-disc list-inside text-text-subtle space-y-0.5 pl-1">
                {failedInvites.map((f, idx) => (
                  <li key={idx}>
                    <strong className="text-text">{f.email}</strong>: {f.message || 'Invitation failed'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Provisioned Members List */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {provisionedUsers.length > 0 ? (
              provisionedUsers.map((member, i) => {
                const inviteText = `Hi ${member.name || 'there'},\n\nYou have been invited to join the NexaSetu workspace.\n\nGetting Started:\n• Email: ${member.email}\n• Temporary Password: ${member.email}\n• Login: ${window.location.origin}/login\n\nFor security reasons, please log in and update your password immediately upon initial access.\n\nBest regards,\nNexaSetu Team`;
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
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-primary/10 text-primary border border-primary/20">
                          {member.role || 'Member'}
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
          <div className="p-3 bg-background-elevated border border-border-subtle rounded-xs text-xs text-text-subtle">
            <span className="font-semibold text-text">Security Note:</span> Temporary login credentials match each recipient&apos;s registered email address. New members are instructed to change their password on initial login.
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
              onClick={() => {
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
              }}
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
            onClick={() => navigate('/teams')}
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
        <form onSubmit={handleSendAll} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-status-error/10 border border-status-error/20 rounded-xs flex items-start gap-2.5 animate-fade-in text-xs text-status-error">
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
                      Team Member {idx + 1}
                    </span>
                  </div>

                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-text-subtle hover:text-status-error p-1 rounded-xs transition-colors cursor-pointer"
                      title="Remove this member"
                    >
                      <Trash2 size={14} />
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
                      Full Name <span className="text-status-error">*</span>
                    </label>
                    <input
                      id={`name-${idx}`}
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={invite.name}
                      onChange={(e) => updateRow(idx, 'name', e.target.value)}
                      className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`email-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      Email Address <span className="text-status-error">*</span>
                    </label>
                    <input
                      id={`email-${idx}`}
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={invite.email}
                      onChange={(e) => updateRow(idx, 'email', e.target.value)}
                      className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>

                  {/* Role / Job Title */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`role-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      Role / Job Title <span className="text-status-error">*</span>
                    </label>
                    <select
                      id={`role-${idx}`}
                      value={invite.jobTitle}
                      onChange={(e) => handleJobTitleChange(idx, e.target.value)}
                      className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
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
                  </div>

                  {/* Assign to Project */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`project-${idx}`}
                      className="text-xs font-semibold text-text-subtle block"
                    >
                      Assign to Project <span className="text-text-subtler font-normal">(Optional)</span>
                    </label>
                    <select
                      id={`project-${idx}`}
                      value={invite.projectId || ''}
                      onChange={(e) => updateRow(idx, 'projectId', e.target.value)}
                      className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Unassigned (General workspace)</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.key ? `(${p.key})` : ''}
                        </option>
                      ))}
                    </select>
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
                onClick={() => navigate('/teams')}
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
                    <span>Send {invites.length > 1 ? `(${invites.length}) invitations` : 'invitation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamMember;
