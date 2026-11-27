import React from 'react';
import {
  GitBranch,
  RefreshCw,
  Link,
  ExternalLink,
  Activity,
  Check,
  X as CloseIcon,
  Cpu,
} from 'lucide-react';
import Button from '../atoms/Button';

// Panel for Git repository integrations.
const GithubPanel = ({
  project,
  githubConnected,
  githubToken,
  setGithubToken,
  handleConnectGithub,
  repos,
  loadingRepos,
  handleLinkRepo,
  fetchRepos,
  githubSuggestions,
  fetchGithubActivity,
  isFetchingGithub,
  handleApproveGithubTask,
  handleApproveAllGithubTasks,
  setProject,
  setGithubSuggestions,
}) => {
  return (
    <div className="bg-card border border-border-subtle p-6 rounded-xl mb-6 shadow-sm animate-in fade-in duration-300">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background-elevated border border-border-subtle rounded-lg flex items-center justify-center text-primary">
            <GitBranch size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-text">
              Repository Integration
            </h3>
            <p className="text-xs text-text-subtle">
              Synchronize project tasks with GitHub repository activity
            </p>
          </div>
        </div>

        {githubConnected && project?.githubRepo && (
          <Button
            onClick={fetchGithubActivity}
            disabled={isFetchingGithub}
            variant="primary"
            className="h-9 px-4 text-xs font-semibold bg-primary text-background-dark hover:bg-primary/90 transition-colors"
          >
            {isFetchingGithub ? (
              <RefreshCw size={14} className="animate-spin mr-2" />
            ) : (
              <RefreshCw size={14} className="mr-2" />
            )}
            {isFetchingGithub ? 'Syncing...' : 'Sync repository activity'}
          </Button>
        )}
      </div>

      {!githubConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3 text-text">
            <Activity size={16} className="text-primary shrink-0" />
            <p className="text-xs text-text-subtle leading-relaxed">
              Provide a GitHub Personal Access Token (PAT) with repo read access to detect commits and PRs.
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary hover:underline font-medium"
              >
                Generate token
              </a>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              placeholder="Paste GitHub Personal Access Token..."
              className="flex-1 h-10 bg-background-elevated border border-border-subtle text-text rounded-lg px-4 text-xs focus:outline-none focus:border-primary transition-colors placeholder:text-text-subtle"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <Button
              onClick={handleConnectGithub}
              className="h-10 px-6 text-xs font-semibold bg-primary text-background-dark hover:bg-primary/90 transition-colors"
            >
              Link account
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {!project?.githubRepo ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h4 className="text-xs font-semibold text-text">
                  Available Repositories
                </h4>
                <button
                  onClick={fetchRepos}
                  className="text-xs font-medium text-primary hover:underline transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Rescan
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-2">
                {loadingRepos ? (
                  <div className="col-span-full py-12 flex flex-col items-center gap-3 text-text-subtle">
                    <RefreshCw
                      size={24}
                      className="animate-spin text-primary"
                    />
                    <span className="text-xs font-medium">
                      Fetching repositories...
                    </span>
                  </div>
                ) : (
                  repos.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleLinkRepo(r)}
                      className="p-4 text-left bg-background-elevated border border-border-subtle rounded-lg hover:border-primary/50 transition-colors group relative"
                    >
                      <h5 className="text-xs font-semibold text-text mb-1 group-hover:text-primary transition-colors truncate">
                        {r.fullName}
                      </h5>
                      {r.description && (
                        <p className="text-xs text-text-subtle line-clamp-2">
                          {r.description}
                        </p>
                      )}
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link size={14} className="text-primary" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background-elevated border border-border-subtle rounded-xl gap-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-card border border-border-subtle rounded-lg flex items-center justify-center text-primary">
                    <ExternalLink size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-text">
                      {project.githubRepo.fullName}
                    </h4>
                    <span className="text-xs font-medium text-status-success flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-status-success rounded-full" />
                      Repository linked
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setProject({ ...project, githubRepo: null })}
                  className="px-3 py-1.5 text-xs font-medium text-status-error border border-status-error/30 hover:bg-status-error/10 rounded-lg transition-colors whitespace-nowrap"
                >
                  Unlink repository
                </button>
              </div>

              {githubSuggestions.length > 0 && (
                <section className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-primary flex items-center gap-2">
                        <Cpu size={14} /> Git Task Suggestions
                      </h4>
                      <p className="text-xs text-text-subtle">
                        Found {githubSuggestions.length} task updates from Git activity
                      </p>
                    </div>
                    <button
                      onClick={handleApproveAllGithubTasks}
                      className="text-xs font-semibold text-primary hover:underline transition-colors"
                    >
                      Approve all
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {githubSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-card p-4 rounded-xl border border-border-subtle hover:border-primary/40 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h5 className="text-xs font-semibold text-text truncate">
                              {s.title}
                            </h5>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-background-elevated border border-border-subtle text-text-subtle capitalize">
                              {s.type}
                            </span>
                          </div>
                          <div className="p-2.5 bg-background-elevated rounded-lg mb-3">
                            <p className="text-xs text-text-subtle italic line-clamp-2">
                              &ldquo;{s.originalMessage}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle">
                          <button
                            onClick={() => handleApproveGithubTask(s)}
                            className="flex-1 bg-primary text-background-dark text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setGithubSuggestions((prev) =>
                                prev.filter((t) => t.githubId !== s.githubId)
                              )
                            }
                            className="flex-1 bg-background-elevated text-text-subtle text-xs font-medium py-1.5 rounded-lg hover:bg-card hover:text-text transition-colors flex items-center justify-center gap-1.5 border border-border-subtle"
                          >
                            <CloseIcon size={14} /> Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GithubPanel;
