import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Target,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';

// Project status and sprint allocation listing component (Section C: Projects & Assignments)
const ProjectStatusList = ({
  projects = [],
  selectedSprintId = null,
  onLinkProject,
  onCreateTask,
  createTaskLoading = false,
  canManage = false,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTicketProjectId, setQuickTicketProjectId] = useState(null);
  const [quickTicketTitle, setQuickTicketTitle] = useState('');
  const [linkingProjectId, setLinkingProjectId] = useState(null);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.key?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const assignedCount = useMemo(() => {
    if (!selectedSprintId || !projects) return 0;
    return projects.filter(
      (p) =>
        (p.sprint?._id || p.sprint)?.toString() === selectedSprintId?.toString()
    ).length;
  }, [projects, selectedSprintId]);

  const handleQuickTaskSubmit = async (e, projectId) => {
    e.preventDefault();
    if (!quickTicketTitle.trim() || !onCreateTask) return;
    try {
      await onCreateTask({
        title: quickTicketTitle.trim(),
        project: projectId,
        sprint: selectedSprintId,
      });
      setQuickTicketTitle('');
      setQuickTicketProjectId(null);
    } catch (err) {
      console.error('Failed to create quick task:', err);
    }
  };

  const handleLink = async (projectId) => {
    if (!onLinkProject || !selectedSprintId) return;
    setLinkingProjectId(projectId);
    try {
      await onLinkProject(projectId);
    } finally {
      setLinkingProjectId(null);
    }
  };

  return (
    <div className="bg-card border border-border-subtle rounded-md p-3 sm:p-5 space-y-3 sm:space-y-4">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-border-subtle">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <FolderKanban size={15} className="text-primary shrink-0" />
            <h2 className="text-sm font-semibold text-text">
              Project inventory
            </h2>
            <span className="text-xs font-medium text-text-subtle px-2 py-0.5 bg-background-elevated border border-border-subtle rounded-md">
              {selectedSprintId ? (
                <>
                  <span className="sm:hidden">{assignedCount} assigned • {projects.length} total</span>
                  <span className="hidden sm:inline">{assignedCount} assigned to this sprint • {projects.length} total in workspace</span>
                </>
              ) : (
                `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} in workspace`
              )}
            </span>
          </div>
          <p className="text-xs text-text-subtle hidden sm:block">
            Workspace projects and deliverable completion status
          </p>
        </div>

        {/* Search input if projects exist */}
        {projects.length > 2 && (
          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 bg-background-elevated border border-border-subtle rounded-md text-xs text-text placeholder:text-text-subtle focus:border-primary/50 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-2 sm:space-y-2.5">
          {filteredProjects.map((project) => {
            const isAssigned =
              selectedSprintId &&
              (project.sprint?._id || project.sprint)?.toString() ===
                selectedSprintId?.toString();
            const progress =
              typeof project.percentage === 'number'
                ? Math.min(100, Math.max(0, project.percentage))
                : typeof project.progress === 'number'
                  ? Math.min(100, Math.max(0, project.progress))
                  : 0;

            const isHealthy = progress >= 80;
            const isWarning = progress >= 40 && progress < 80;

            return (
              <div
                key={project._id}
                className="bg-background-elevated border border-border-subtle rounded-md p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 hover:border-border transition-colors"
              >
                {/* Project Identity: Name prioritized, status visible, technical ID secondary */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 lg:w-1/3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-card border border-border-subtle flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(project.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/project/${project._id}`)}
                        className="text-xs font-semibold text-text hover:text-primary transition-colors truncate text-left cursor-pointer"
                        title={project.name}
                      >
                        {project.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/project/${project._id}`)}
                        className="text-text-subtle hover:text-primary transition-colors cursor-pointer shrink-0"
                        title="View project workspace"
                        aria-label={`View ${project.name} workspace`}
                      >
                        <ExternalLink size={11} />
                      </button>
                      {project.key && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-card border border-border-subtle rounded text-text-subtle shrink-0">
                          {project.key}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                          isAssigned
                            ? 'bg-status-success/10 text-status-success border-status-success/20'
                            : 'bg-card text-text-subtle border-border-subtle'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAssigned ? 'bg-status-success' : 'bg-text-subtle'
                          }`}
                        />
                        {isAssigned ? 'Assigned to sprint' : 'Not in this sprint'}
                      </span>
                      {!project.key && project._id && (
                        <span className="text-[10px] font-mono text-text-subtler">
                          {project._id.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full lg:flex-1 lg:px-6">
                  <div className="flex justify-between items-center text-xs font-medium text-text-subtle mb-1">
                    <span>Deliverable completion</span>
                    <span
                      className={`font-semibold ${
                        isHealthy
                          ? 'text-status-success'
                          : isWarning
                            ? 'text-status-warning'
                            : 'text-status-error'
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-card border border-border-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isHealthy
                          ? 'bg-status-success'
                          : isWarning
                            ? 'bg-status-warning'
                            : 'bg-status-error'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions: Assign / Quick Task */}
                <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                  {isAssigned ? (
                    <div className="w-full sm:w-auto">
                      {quickTicketProjectId === project._id ? (
                        <form
                          onSubmit={(e) =>
                            handleQuickTaskSubmit(e, project._id)
                          }
                          className="flex items-center gap-1.5 w-full sm:w-auto"
                        >
                          <input
                            type="text"
                            placeholder="New task title..."
                            value={quickTicketTitle}
                            onChange={(e) => setQuickTicketTitle(e.target.value)}
                            autoFocus
                            className="h-8 px-2.5 bg-card border border-primary/50 text-xs text-text placeholder:text-text-subtle rounded-md outline-none flex-1 min-w-0 sm:w-56"
                          />
                          <button
                            type="submit"
                            disabled={createTaskLoading || !quickTicketTitle.trim()}
                            className="h-8 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {createTaskLoading ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickTicketProjectId(null);
                              setQuickTicketTitle('');
                            }}
                            className="h-8 w-8 flex items-center justify-center text-text-subtle hover:text-text cursor-pointer shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        canManage && (
                          <button
                            type="button"
                            onClick={() => setQuickTicketProjectId(project._id)}
                            className="h-8 px-3 bg-card hover:bg-background-elevated border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus size={13} className="text-primary" />
                            <span>Quick task</span>
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    canManage &&
                    selectedSprintId && (
                      <button
                        type="button"
                        onClick={() => handleLink(project._id)}
                        disabled={linkingProjectId === project._id}
                        className="h-8 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Target size={13} />
                        <span>
                          {linkingProjectId === project._id
                            ? 'Assigning...'
                            : 'Assign to sprint'}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-text-subtle space-y-2">
          <p>
            {searchQuery
              ? 'No projects match your search.'
              : 'No projects available in this workspace.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-primary hover:underline text-xs font-medium cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

ProjectStatusList.propTypes = {
  projects: PropTypes.array,
  selectedSprintId: PropTypes.string,
  onLinkProject: PropTypes.func,
  onCreateTask: PropTypes.func,
  createTaskLoading: PropTypes.bool,
  canManage: PropTypes.bool,
};

export default ProjectStatusList;
