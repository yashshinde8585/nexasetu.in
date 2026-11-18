import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Save,
  Layout,
  Search,
  X,
  Check,
  ArrowLeft,
  User,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeamBuilderForm = ({
  title = 'Create New Team',
  description = 'Define a new squad, assign team leadership, and select team members.',
  submitLabel = 'Create Team',
  onSubmit,
  users = [],
  initialData = {},
  themeColor = 'primary', // 'primary' for create, 'secondary' for edit
}) => {
  const navigate = useNavigate();

  const [name, setName] = useState(initialData.name || '');
  const [descriptionText, setDescriptionText] = useState(initialData.description || '');
  const [lead, setLead] = useState(initialData.lead || '');
  const [selectedMembers, setSelectedMembers] = useState(
    Array.isArray(initialData.members) ? initialData.members : []
  );
  const [memberSearch, setMemberSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Helper to extract a normalized string ID for a user
  const getUserId = (u) => {
    if (!u) return '';
    if (typeof u === 'string') return u;
    return String(u.id || u._id || '');
  };

  // Sync state if initialData changes (e.g. async edit data)
  useEffect(() => {
    if (initialData.name !== undefined) setName(initialData.name || '');
    if (initialData.description !== undefined) setDescriptionText(initialData.description || '');
    if (initialData.lead !== undefined) setLead(initialData.lead || '');
    if (Array.isArray(initialData.members)) setSelectedMembers(initialData.members);
  }, [initialData]);

  // Business rule: ensure team lead is automatically included in selected members
  const handleLeadChange = (newLeadId) => {
    setLead(newLeadId);
    if (errors.lead) {
      setErrors((prev) => ({ ...prev, lead: null }));
    }
    if (newLeadId && !selectedMembers.includes(newLeadId)) {
      setSelectedMembers((prev) => [...prev, newLeadId]);
    }
  };

  const toggleMember = (userId) => {
    if (!userId) return;

    // If member is the designated lead, notify user that lead must remain in the team
    if (userId === lead && selectedMembers.includes(userId)) {
      toast('The designated team lead must remain a team member.', {
        icon: 'ℹ️',
      });
      return;
    }

    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeMember = (userId) => {
    if (!userId) return;
    if (userId === lead) {
      toast('The designated team lead must remain a team member.', {
        icon: 'ℹ️',
      });
      return;
    }
    setSelectedMembers((prev) => prev.filter((id) => id !== userId));
  };

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const uName = (u.name || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uRole = (u.role || '').toLowerCase();
      return uName.includes(q) || uEmail.includes(q) || uRole.includes(q);
    });
  }, [users, memberSearch]);

  // Resolve selected member user objects for chip display
  const selectedMemberObjects = useMemo(() => {
    return selectedMembers
      .map((id) => users.find((u) => getUserId(u) === id))
      .filter(Boolean);
  }, [selectedMembers, users]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Team name is required.';
    }

    if (!lead) {
      newErrors.lead = 'Please select a technical team lead.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields.');
      return;
    }

    // Ensure lead is in members list
    const finalMembers =
      lead && !selectedMembers.includes(lead)
        ? [...selectedMembers, lead]
        : selectedMembers;

    onSubmit({
      name: name.trim(),
      description: descriptionText.trim(),
      lead,
      members: finalMembers,
    });
  };

  const isPrimary = themeColor === 'primary';

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 space-y-6 bg-background text-text min-h-screen font-sans animate-fade-in">
      {/* Top Breadcrumb & Header */}
      <div className="space-y-2 border-b border-border-subtle pb-4">
        <button
          type="button"
          onClick={() => navigate('/teams?tab=teams')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle hover:text-text cursor-pointer transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to teams</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xs bg-background-elevated border border-border-subtle flex items-center justify-center text-primary">
                <Users size={16} />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                {title}
              </h1>
            </div>
            <p className="text-text-subtle text-xs sm:text-sm font-normal">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-text-subtler font-medium">
              {isPrimary ? 'New team workflow' : 'Editing team'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Team Details (5 cols) */}
          <div className="lg:col-span-5 bg-card border border-border-subtle rounded-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <Layout size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">
                Team details
              </h2>
            </div>

            {/* Team Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-subtle flex items-center justify-between">
                <span>Team Name <span className="text-status-error">*</span></span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Core Engine Squad"
                className={`w-full h-10 bg-background-elevated border ${
                  errors.name ? 'border-status-error' : 'border-border-subtle'
                } rounded-xs px-3.5 text-xs sm:text-sm font-medium text-text focus:border-primary/50 outline-none transition-all placeholder:text-text-subtler`}
              />
              {errors.name && (
                <p className="text-[11px] text-status-error flex items-center gap-1 font-medium">
                  <AlertCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

            {/* Team Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-subtle block">
                Description
              </label>
              <textarea
                rows={3}
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Briefly define the team's primary mission and scope..."
                className="w-full bg-background-elevated border border-border-subtle rounded-xs p-3 text-xs sm:text-sm font-normal text-text focus:border-primary/50 outline-none transition-all resize-none placeholder:text-text-subtler leading-relaxed"
              />
            </div>

            {/* Team Lead Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-subtle flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield size={12} className="text-secondary" />
                  <span>Team Lead <span className="text-status-error">*</span></span>
                </span>
              </label>
              <select
                value={lead}
                onChange={(e) => handleLeadChange(e.target.value)}
                className={`w-full h-10 bg-background-elevated border ${
                  errors.lead ? 'border-status-error' : 'border-border-subtle'
                } rounded-xs px-3 text-xs sm:text-sm font-medium text-text focus:border-primary/50 outline-none transition-all cursor-pointer`}
              >
                <option value="" disabled>
                  Select a team lead...
                </option>
                {users.map((u) => {
                  const uid = getUserId(u);
                  return (
                    <option key={uid} value={uid}>
                      {u.name} — {u.role ? u.role.replace(/_/g, ' ') : 'Developer'}
                    </option>
                  );
                })}
              </select>
              {errors.lead ? (
                <p className="text-[11px] text-status-error flex items-center gap-1 font-medium">
                  <AlertCircle size={11} /> {errors.lead}
                </p>
              ) : (
                <p className="text-[11px] text-text-subtler font-normal">
                  The team lead is automatically assigned as a team member.
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Team Members (7 cols) */}
          <div className="lg:col-span-7 bg-card border border-border-subtle rounded-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-primary" />
                <h2 className="text-sm font-semibold text-text">
                  Team members
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-xs text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
              </span>
            </div>

            {/* Member Search Bar */}
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtler group-focus-within:text-primary transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Search members by name, email, or role..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 pl-9 pr-8 text-xs text-text focus:border-primary/50 outline-none transition-all placeholder:text-text-subtler font-medium"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtler hover:text-text cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Selected Members Chips */}
            {selectedMemberObjects.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-text-subtler block">
                  Selected contributors:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-background-elevated/30 border border-border-subtle/50 rounded-xs">
                  {selectedMemberObjects.map((u) => {
                    const uid = getUserId(u);
                    const isLead = uid === lead;
                    return (
                      <span
                        key={uid}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-xs font-medium border ${
                          isLead
                            ? 'bg-secondary/10 border-secondary/20 text-secondary'
                            : 'bg-background-elevated border-border-subtle text-text'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{u.name}</span>
                        {isLead ? (
                          <span className="text-[10px] font-bold px-1 rounded-xs bg-secondary/20">
                            Lead
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeMember(uid)}
                            title={`Remove ${u.name}`}
                            className="text-text-subtler hover:text-text cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-member Selection List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const uid = getUserId(u);
                  const isSelected = selectedMembers.includes(uid);
                  const isLead = uid === lead;

                  return (
                    <div
                      key={uid}
                      onClick={() => toggleMember(uid)}
                      className={`flex items-center justify-between p-3 rounded-xs border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-primary/5 border-primary/30 text-text'
                          : 'bg-background-elevated/40 border-border-subtle hover:border-border text-text-subtle hover:text-text'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by row container onClick
                          className="accent-primary h-4 w-4 rounded-xs cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-xs bg-background-elevated border border-border-subtle flex items-center justify-center text-xs font-bold text-text uppercase shrink-0">
                          {u.name?.slice(0, 2).toUpperCase() || <User size={13} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-text truncate">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-text-subtler font-normal truncate">
                            {u.role ? u.role.replace(/_/g, ' ') : 'Developer'}
                            {u.email ? ` • ${u.email}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isLead && (
                          <span className="text-[11px] font-semibold text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-xs">
                            Team Lead
                          </span>
                        )}
                        {isSelected && !isLead && (
                          <Check size={14} className="text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center border border-dashed border-border-subtle rounded-xs">
                  <p className="text-xs font-medium text-text-subtler">
                    {users.length === 0
                      ? 'No workspace members found. Add members to your workspace first.'
                      : `No members matched "${memberSearch}".`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Action Buttons (Bottom of Complete Workflow) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle">
          <span className="text-xs text-text-subtler font-medium">
            {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
            {lead ? ' (including Team Lead)' : ''}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/teams?tab=teams')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-background-elevated border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2 bg-primary text-black font-semibold text-xs rounded-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            >
              <Save size={13} />
              <span>{submitLabel}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeamBuilderForm;
