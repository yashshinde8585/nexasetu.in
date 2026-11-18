import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Target,
  Activity,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';

// Project status and sprint allocation listing component
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

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.key?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

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
    <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-4">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text">
              Project inventory
            </h2>
            <span className="text-[11px] font-semibold text-text-subtler px-2 py-0.5 bg-background-elevated border border-border-subtle rounded-xs">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <p className="text-xs text-text-subtle">
            Overview of workspace projects and iteration assignment
          </p>
        </div>

        {/* Search input if more than 3 projects */}
        {projects.length > 3 && (
          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtler"
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-background-elevated border border-border-subtle rounded-xs text-xs text-text placeholder:text-text-subtler focus:border-primary/50 outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-2.5">
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
                className="bg-background-elevated border border-border-subtle rounded-md p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-border transition-colors"
              >
                {/* Project Identity */}
                <div className="flex items-center gap-3 min-w-0 lg:w-1/3">
                  <div className="w-9 h-9 rounded-xs bg-card border border-border-subtle flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(project.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
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
                        className="text-text-subtler hover:text-primary transition-colors cursor-pointer"
                        title="View project details"
                      >
                        <ExternalLink size={11} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-text-subtler font-mono">
                        {project.key || `ID: ${project._id?.slice(-6)}`}
                      </span>
                      <span className="text-border-subtle">•</span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border ${
                          isAssigned
                            ? 'bg-status-success/10 text-status-success border-status-success/20'
                            : 'bg-background-elevated text-text-subtler border-border-subtle'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAssigned ? 'bg-status-success' : 'bg-text-subtler'
                          }`}
                        />
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 lg:px-6">
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
                <div className="flex items-center justify-end gap-2 shrink-0">
                  {isAssigned ? (
                    <div>
                      {quickTicketProjectId === project._id ? (
                        <form
                          onSubmit={(e) =>
                            handleQuickTaskSubmit(e, project._id)
                          }
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            placeholder="New task title..."
                            value={quickTicketTitle}
                            onChange={(e) => setQuickTicketTitle(e.target.value)}
                            autoFocus
                            className="h-8 px-2.5 bg-card border border-primary/50 text-xs text-text placeholder:text-text-subtler rounded-xs outline-none w-44 sm:w-56"
                          />
                          <button
                            type="submit"
                            disabled={createTaskLoading || !quickTicketTitle.trim()}
                            className="h-8 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {createTaskLoading ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickTicketProjectId(null);
                              setQuickTicketTitle('');
                            }}
                            className="h-8 w-8 flex items-center justify-center text-text-subtle hover:text-text cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        canManage && (
                          <button
                            type="button"
                            onClick={() => setQuickTicketProjectId(project._id)}
                            className="h-8 px-3 bg-card hover:bg-background-elevated border border-border-subtle hover:border-border text-xs font-semibold text-text rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        className="h-8 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="py-8 text-center text-xs text-text-subtle">
          {searchQuery
            ? 'No projects match your search.'
            : 'No projects available in this workspace.'}
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
