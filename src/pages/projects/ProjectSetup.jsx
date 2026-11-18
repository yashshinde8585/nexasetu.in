import React, { useState, useMemo } from 'react';
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

  // Available teams: Combine workspace teams from API with default engineering disciplines
  const availableTeams = useMemo(() => {
    const workspaceTeams = adminData?.teams || [];
    if (Array.isArray(workspaceTeams) && workspaceTeams.length > 0) {
      const teamNames = workspaceTeams.map((t) => t.name).filter(Boolean);
      return Array.from(new Set([...teamNames, ...DEFAULT_DISCIPLINES]));
    }
    return DEFAULT_DISCIPLINES;
  }, [adminData?.teams]);

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

  // Duration in days
  const durationDays = useMemo(() => {
    if (!project.timeline.start || !project.timeline.end) return null;
    try {
      const diff = Math.ceil(
        (new Date(project.timeline.end) - new Date(project.timeline.start)) /
        (1000 * 60 * 60 * 24)
      );
      return Math.max(1, diff);
    } catch {
      return null;
    }
  }, [project.timeline.start, project.timeline.end]);

  const toggleTeam = (team) => {
    setProject((prev) => ({
      ...prev,
      teams: prev.teams.includes(team)
        ? prev.teams.filter((t) => t !== team)
        : [...prev.teams, team],
    }));
  };

  const onCreate = async (e, isDraft = false) => {
    if (e) e.preventDefault();

    const validationError = validateProjectForm(project);
    if (validationError) {
      setSubmitError(validationError);
      toast.error(validationError);
      return;
    }

    setSubmitError(null);
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
      navigate('/project-info');
    } catch (error) {
      console.error('Failed to create project:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to create project. Please verify inputs and try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  if (isDashboardLoading || isAdminLoading) return <CenteredLoading />;

  return (
    <div className="min-h-screen bg-background text-text p-3 sm:p-4 lg:p-6 font-sans">
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        {/* Header Breadcrumb & Actions */}
        <header className="space-y-3 pb-4 border-b border-border-subtle">
          <button
            type="button"
            onClick={() => navigate('/project-info')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-subtle hover:text-text cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to sprints</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
                  Create New Project
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-text-subtle">
                Configure your project scope, assign functional squads, and define delivery milestones.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-text-subtler font-medium">
                Workspace project setup
              </span>
            </div>
          </div>
        </header>

        {/* Main Grid: Form (Col 8) + Live Preview (Col 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-card border border-border-subtle rounded-md p-5 sm:p-6 space-y-6">
              {submitError && (
                <div className="p-3.5 bg-status-error/10 border border-status-error/20 rounded-xs flex items-start gap-2.5 animate-fade-in text-xs text-status-error">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{submitError}</span>
                </div>
              )}

              <form onSubmit={(e) => onCreate(e, false)} className="space-y-6">
                {/* 1. Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border-subtler">
                    <FileText size={15} className="text-primary" />
                    <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                      Project Details
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
                          Project Name <span className="text-status-error">*</span>
                        </span>
                        <span className="text-[11px] text-text-subtler font-normal">
                          Min 3 characters
                        </span>
                      </label>
                      <input
                        id="projectName"
                        type="text"
                        required
                        placeholder="e.g. Core Banking Portal"
                        value={project.name}
                        onChange={(e) => {
                          setProject({ ...project, name: e.target.value });
                          if (submitError) setSubmitError(null);
                        }}
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Project Type */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="projectType"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Project Type <span className="text-status-error">*</span>
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

                    {/* Project Priority */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="projectPriority"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Priority Level
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

                    {/* Description / Objective */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="projectObjective"
                        className="text-xs font-semibold text-text-subtle block"
                      >
                        Objective & Scope
                      </label>
                      <textarea
                        id="projectObjective"
                        rows={3}
                        placeholder="Describe key business goals, deliverable scope, and architectural requirements..."
                        value={project.objective}
                        onChange={(e) =>
                          setProject({ ...project, objective: e.target.value })
                        }
                        className="w-full bg-background-elevated border border-border-subtle rounded-xs p-3 text-xs sm:text-sm text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Team Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtler">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-secondary" />
                      <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                        Team Assignment
                      </h2>
                    </div>
                    <span className="text-[11px] text-text-subtle">
                      {project.teams.length} assigned
                    </span>
                  </div>

                  <p className="text-xs text-text-subtle">
                    Select the squads and engineering disciplines collaborating on this project:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {availableTeams.map((team) => {
                      const isSelected = project.teams.includes(team);
                      return (
                        <button
                          key={team}
                          type="button"
                          onClick={() => toggleTeam(team)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold transition-all cursor-pointer border ${isSelected
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

                {/* 3. Timeline & Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border-subtler">
                    <Calendar size={15} className="text-status-success" />
                    <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
                      Timeline & Schedule
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="startDate"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Target Start Date <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        required
                        value={project.timeline.start}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            timeline: {
                              ...project.timeline,
                              start: e.target.value,
                            },
                          })
                        }
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="endDate"
                        className="text-xs font-semibold text-text-subtle"
                      >
                        Target Delivery Date <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        required
                        value={project.timeline.end}
                        onChange={(e) =>
                          setProject({
                            ...project,
                            timeline: {
                              ...project.timeline,
                              end: e.target.value,
                            },
                          })
                        }
                        className="w-full h-9 bg-background-elevated border border-border-subtle rounded-xs px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
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
                    onClick={() => navigate('/project-info')}
                    className="text-xs font-medium text-text-subtler hover:text-text transition-colors py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Reactive Preview */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle">
                <Sparkles size={13} className="text-primary" />
                <span>Live Project Preview</span>
              </div>
              <span className="text-[11px] text-text-subtler font-mono">
                Key: {derivedKey}
              </span>
            </div>

            <div className="bg-card border border-border-subtle rounded-md p-5 space-y-4">
              {/* Header: Project Name & Key */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtler">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xs bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(project.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm text-text truncate">
                      {project.name || 'Untitled Project'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-subtler font-mono">
                    Project Key: <strong className="text-primary font-bold">{derivedKey}</strong> (Task prefix: {derivedKey}-1)
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs bg-status-success/10 text-status-success border border-status-success/20 shrink-0">
                  {project.status || 'Active'}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-text-subtler uppercase tracking-wider">
                  Scope & Deliverables
                </span>
                <p className="text-xs text-text-subtle leading-relaxed line-clamp-3">
                  {project.objective ||
                    'Project description and scope will be displayed here as you type.'}
                </p>
              </div>

              {/* Attributes: Type, Priority, Timeline */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtler text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-text-subtler uppercase tracking-wider block">
                    Type
                  </span>
                  <span className="text-xs font-medium text-text mt-0.5 block">
                    {project.type}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-subtler uppercase tracking-wider block">
                    Priority
                  </span>
                  <span className="text-xs font-medium text-text mt-0.5 block">
                    {project.priority}
                  </span>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-[11px] font-semibold text-text-subtler uppercase tracking-wider block">
                    Timeline
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-text">
                    <Calendar size={12} className="text-secondary shrink-0" />
                    <span>
                      {formatDate(project.timeline.start)} – {formatDate(project.timeline.end)}
                    </span>
                    {durationDays && (
                      <span className="text-text-subtler">
                        ({durationDays} days)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Teams */}
              <div className="pt-3 border-t border-border-subtler space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-text-subtler uppercase tracking-wider">
                  <span>Assigned Squads</span>
                  <span>{project.teams.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.teams.length > 0 ? (
                    project.teams.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-medium px-2 py-0.5 bg-background-elevated border border-border-subtle rounded-xs text-text"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-subtler italic">
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
