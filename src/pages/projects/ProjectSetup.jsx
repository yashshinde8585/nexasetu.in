import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  AlertCircle,
  Calendar,
  FileText,
  ArrowLeft,
  Check,
  FolderKanban,
  Flag,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '../../constants';
import { useDashboard } from '../../hooks/useDashboard';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useAuth } from '../../context/AuthContext';
import MetricsService from '../../api/metricsApi';
import { sanitizeInput, validateProjectForm } from '../../utils/validation';
import CenteredLoading from '../../components/atoms/CenteredLoading';

const DEFAULT_DISCIPLINES = [
  'Backend',
  'Frontend',
  'QA',
  'DevOps',
  'UI/UX',
  'Mobile',
];

const ProjectSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleCreateProject, isLoading: isDashboardLoading } = useDashboard();
  const { data: adminData, isLoading: isAdminLoading } = useAdminDashboard();

  const [project, setProject] = useState({
    name: '',
    type: 'Product Development',
    objective: '',
    teams: ['Backend', 'Frontend'],
    priority: 'Medium',
    timeline: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState(null); // 'active' | 'draft'
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Workspace-specific teams configured in the workspace
  const workspaceTeams = useMemo(() => {
    const raw = adminData?.teams || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((t) => t.name).filter(Boolean);
    }
    return [];
  }, [adminData?.teams]);

  // Combined available teams maintaining backward compatibility
  const availableTeams = useMemo(() => {
    if (workspaceTeams.length > 0) {
      return Array.from(new Set([...workspaceTeams, ...DEFAULT_DISCIPLINES]));
    }
    return DEFAULT_DISCIPLINES;
  }, [workspaceTeams]);

  // Derived Project Key matching backend algorithm
  const derivedKey = useMemo(() => {
    if (!project.name?.trim()) return 'PRJ';
    const clean = project.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    return (clean + 'XXX').substring(0, 3);
  }, [project.name]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'TBD';
    }
  };

  // Duration in calendar days
  const durationDays = useMemo(() => {
    if (!project.timeline.start || !project.timeline.end) return null;
    try {
      const start = new Date(project.timeline.start);
      const end = new Date(project.timeline.end);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    } catch {
      return null;
    }
  }, [project.timeline.start, project.timeline.end]);

  // Track if user made modifications to protect against accidental navigation
  const isDirty = useMemo(() => {
    return (
      project.name.trim() !== '' ||
      project.objective.trim() !== '' ||
      project.type !== 'Product Development' ||
      project.priority !== 'Medium' ||
      project.teams.length !== 2
    );
  }, [project]);

  const toggleTeam = (team) => {
    setProject((prev) => ({
      ...prev,
      teams: prev.teams.includes(team)
        ? prev.teams.filter((t) => t !== team)
        : [...prev.teams, team],
    }));
  };

  // Validate form with field-specific mapping
  const validateForm = useCallback(() => {
    const errors = {};
    const globalError = validateProjectForm(project);

    const cleanName = sanitizeInput(project.name);
    if (!cleanName || cleanName.length === 0) {
      errors.name = 'Enter a project name.';
    } else if (cleanName.length < 3) {
      errors.name = 'Project name must be at least 3 characters long.';
    }

    if (!project.type) {
      errors.type = 'Select a project type.';
    }

    if (project.timeline.start && project.timeline.end) {
      const start = new Date(project.timeline.start);
      const end = new Date(project.timeline.end);
      if (end < start) {
        errors.end = 'Target delivery date cannot be before the start date.';
      }
    }

    return {
      isValid: !globalError && Object.keys(errors).length === 0,
      globalError,
      fieldErrors: errors,
    };
  }, [project]);

  const onCreate = async (e, isDraft = false) => {
    if (e) e.preventDefault();

    const { isValid, globalError, fieldErrors: validationErrors } = validateForm();
    if (!isValid) {
      const errorMessage =
        validationErrors.name ||
        validationErrors.end ||
        validationErrors.type ||
        globalError ||
        'Please correct form errors before continuing.';
      setSubmitError(errorMessage);
      setFieldErrors(validationErrors);
      toast.error(errorMessage);
      return;
    }

    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    setSubmitMode(isDraft ? 'draft' : 'active');

    try {
      const sanitizedProject = {
        ...project,
        name: sanitizeInput(project.name),
        objective: sanitizeInput(project.objective),
      };

      setProject(sanitizedProject);

      const result = await handleCreateProject({
        ...sanitizedProject,
        status: isDraft ? 'draft' : 'active',
      });

      const projectId = result?._id || result?.id || result?.data?.project?._id;
      if (projectId) {
        MetricsService.trackProjectCreated(projectId, sanitizedProject.name);
      }

      toast.success(
        isDraft ? 'Project saved as draft' : 'Project created successfully'
      );
      navigate(ROUTES.SPRINTS);
    } catch (error) {
      console.error('Failed to create project:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Couldn't create the project. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  const onCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Leave without saving?'
      );
      if (!confirmed) return;
    }
    navigate(ROUTES.SPRINTS);
  };

  if (isDashboardLoading || isAdminLoading) return <CenteredLoading />;

  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 font-sans">
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        {/* Header Breadcrumb & Actions */}
        <header className="space-y-3 pb-4 border-b border-border-subtle">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle hover:text-text cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to sprints</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                  Create Project
                </h1>
                <span className="text-xs font-semibold text-text-subtle bg-background-elevated border border-border-subtle px-2 py-0.5 rounded-xs">
                  Create New Project
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-subtle">
                Set up your project, assign teams, and define its timeline.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-text-subtle font-medium">
                Workspace project setup
              </span>
            </div>
          </div>
        </header>

        {/* Main Grid: Form (Col 7-8) + Live Preview (Col 4-5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-card border border-border-subtle rounded-md p-5 sm:p-6 space-y-6">
              {submitError && Object.keys(fieldErrors).length === 0 && (
                <div
                  role="alert"
                  className="p-3.5 bg-status-error/10 border border-status-error/20 rounded-xs flex items-start gap-2.5 animate-fade-in text-xs text-status-error"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{submitError}</span>
                </div>
              )}

              <form onSubmit={(e) => onCreate(e, false)} className="space-y-6">
                {/* AREA A: Project Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
                    <FileText size={15} className="text-primary" />
                    <h2 className="text-xs font-semibold text-text">
                      Project details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="projectName"
                        className="text-xs font-semibold text-text-subtle flex items-center justify-between"
                      >
                        <span>
                          Project name <span className="text-status-error">*</span>
                        </span>
                        <span className="text-[11px] text-text-subtle font-normal">
                          Min 3 characters
                        </span>
                      </label>
                      <input
                        id="projectName"
                        type="text"
                        required
                        aria-required="true"
                        aria-invalid={!!fieldErrors.name}
                        aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                        placeholder="e.g. Payment Gateway"
                        value={project.name}
                        onChange={(e) => {
                          setProject({ ...project, name: e.target.value });
                          if (submitError) setSubmitError(null);
                          if (fieldErrors.name) {
                            setFieldErrors((prev) => ({ ...prev, name: null }));
                          }
                        }}
                        className={`w-full h-9 bg-background-elevated border rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtle focus:border-primary/50 outline-none transition-colors ${
                          fieldErrors.name ? 'border-status-error' : 'border-border-subtle'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p id="name-error" className="text-xs text-status-error font-medium mt-1">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Project Type */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="projectType"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Project type <span className="text-status-error">*</span>
                      </label>
                      <select
                        id="projectType"
                        value={project.type}
                        onChange={(e) =>
                          setProject({ ...project, type: e.target.value })
                        }
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
                      >
                        <option value="Product Development">
                          Product Development
                        </option>
                        <option value="Internal Tool">Internal Tool</option>
                        <option value="Client Project">Client Project</option>
                        <option value="Research / POC">Research / POC</option>
                      </select>
                    </div>

                    {/* Priority Level */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="projectPriority"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Priority<span className="sr-only"> Level</span>
                      </label>
                      <select
                        id="projectPriority"
                        value={project.priority}
                        onChange={(e) =>
                          setProject({ ...project, priority: e.target.value })
                        }
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    {/* Objective & Scope */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="projectObjective"
                        className="text-xs font-semibold text-text-subtle block"
                      >
                        Objective & scope{' '}
                        <span className="text-[11px] text-text-subtle font-normal">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id="projectObjective"
                        rows={3}
                        placeholder="Describe the project's goals and expected deliverables."
                        value={project.objective}
                        onChange={(e) =>
                          setProject({ ...project, objective: e.target.value })
                        }
                        className="w-full bg-background-elevated border border-border-subtle rounded-xs p-3 text-xs sm:text-sm text-text placeholder:text-text-subtle focus:border-primary/50 outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* AREA B: Team Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-secondary" />
                      <h2 className="text-xs font-semibold text-text">
                        Team assignment
                      </h2>
                    </div>
                    <span className="text-xs text-text-subtle">
                      {project.teams.length} assigned
                    </span>
                  </div>

                  <p className="text-xs text-text-subtle">
                    Select the squads and engineering disciplines collaborating on this project:
                  </p>

                  {/* Group B1: Workspace Teams (if any configured) */}
                  {workspaceTeams.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-text-subtle">
                        Workspace squads
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {workspaceTeams.map((team) => {
                          const isSelected = project.teams.includes(team);
                          return (
                            <button
                              key={team}
                              type="button"
                              onClick={() => toggleTeam(team)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-xs'
                                  : 'bg-background-elevated border-border-subtle text-text-subtle hover:border-border hover:text-text'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={2.5} />}
                              <span>{team}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group B2: Functional Engineering Disciplines */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-text-subtle">
                      Engineering disciplines
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_DISCIPLINES.map((discipline) => {
                        const isSelected = project.teams.includes(discipline);
                        return (
                          <button
                            key={discipline}
                            type="button"
                            onClick={() => toggleTeam(discipline)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background-elevated border-border-subtle text-text-subtle hover:border-border hover:text-text'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={2.5} />}
                            <span>{discipline}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* AREA C: Project Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-status-success" />
                      <h2 className="text-xs font-semibold text-text">
                        Project timeline
                      </h2>
                    </div>
                    {durationDays && (
                      <span className="text-xs text-text-subtle">
                        Duration: {durationDays} calendar days
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="startDate"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Start date <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        required
                        value={project.timeline.start}
                        onChange={(e) => {
                          setProject({
                            ...project,
                            timeline: {
                              ...project.timeline,
                              start: e.target.value,
                            },
                          });
                          if (fieldErrors.end) {
                            setFieldErrors((prev) => ({ ...prev, end: null }));
                          }
                        }}
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="endDate"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Target delivery date <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        required
                        aria-invalid={!!fieldErrors.end}
                        aria-describedby={fieldErrors.end ? 'end-error' : undefined}
                        value={project.timeline.end}
                        onChange={(e) => {
                          setProject({
                            ...project,
                            timeline: {
                              ...project.timeline,
                              end: e.target.value,
                            },
                          });
                          if (fieldErrors.end) {
                            setFieldErrors((prev) => ({ ...prev, end: null }));
                          }
                        }}
                        className={`w-full h-9 bg-background-elevated border rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors ${
                          fieldErrors.end ? 'border-status-error' : 'border-border-subtle'
                        }`}
                      />
                      {fieldErrors.end && (
                        <p id="end-error" className="text-xs text-status-error font-medium mt-1">
                          {fieldErrors.end}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle">
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial h-9 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting && submitMode === 'active' ? (
                        <span>Creating project...</span>
                      ) : (
                        <span>Create Project</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onCreate(e, true)}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial h-9 px-4 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting && submitMode === 'draft' ? (
                        <span>Saving draft...</span>
                      ) : (
                        <span>Save as Draft</span>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-medium text-text-subtle hover:text-text transition-colors py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Project Preview */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle">
                <Sparkles size={13} className="text-primary" />
                <span>Live Project Preview</span>
              </div>
              <span className="text-xs text-text-subtle font-mono">
                Proposed Key: <strong className="text-primary font-bold">{derivedKey}</strong>
              </span>
            </div>

            <div className="bg-card border border-border-subtle rounded-md p-5 space-y-4">
              {/* Header: Project Name & Key */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(project.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm text-text truncate">
                      {project.name || 'Untitled Project'}
                    </span>
                  </div>
                  <p className="text-xs text-text-subtle font-mono">
                    Proposed Key: <strong className="text-primary font-bold">{derivedKey}</strong> (Task prefix: {derivedKey}-1)
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-xs bg-status-success/10 text-status-success border border-status-success/20 shrink-0">
                  {submitMode === 'draft' ? 'Draft' : 'Active'}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-subtle">
                  Objective & scope
                </span>
                <p className="text-xs text-text-subtle leading-relaxed line-clamp-3">
                  {project.objective ||
                    "Describe the project's goals and expected deliverables."}
                </p>
              </div>

              {/* Attributes: Type, Priority, Timeline */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle text-xs">
                <div>
                  <span className="text-xs font-semibold text-text-subtle block">
                    Project type
                  </span>
                  <span className="text-xs font-medium text-text mt-0.5 block">
                    {project.type}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-subtle block">
                    Priority
                  </span>
                  <span className="text-xs font-medium text-text mt-0.5 block">
                    {project.priority}
                  </span>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-xs font-semibold text-text-subtle block">
                    Project timeline
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-text">
                    <Calendar size={12} className="text-secondary shrink-0" />
                    <span>
                      {formatDate(project.timeline.start)} – {formatDate(project.timeline.end)}
                    </span>
                    {durationDays && (
                      <span className="text-text-subtle">
                        ({durationDays} days)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Teams */}
              <div className="pt-3 border-t border-border-subtle space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-text-subtle">
                  <span>Assigned teams</span>
                  <span>{project.teams.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.teams.length > 0 ? (
                    project.teams.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium px-2 py-0.5 bg-background-elevated border border-border-subtle rounded-xs text-text"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-subtle italic">
                      No teams selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;
