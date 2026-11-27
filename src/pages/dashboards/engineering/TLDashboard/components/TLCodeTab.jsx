import React from 'react';
import {
  GitPullRequest,
  GitMerge,
  GitBranch,
  Clock,
  Package,
  XCircle,
  Activity,
} from 'lucide-react';

const TLCodeTab = ({
  pullRequestMetrics = {
    prCycleTime: '0h',
    prsMerged: 0,
    prsOpen: 0,
    reviewTime: '0h',
  },
  recentActivity = [],
}) => {
  const hasPrCycleTime =
    pullRequestMetrics?.prCycleTime &&
    pullRequestMetrics.prCycleTime !== '0h' &&
    pullRequestMetrics.prCycleTime !== '0d' &&
    pullRequestMetrics.prCycleTime !== '0m';

  const hasReviewTime =
    pullRequestMetrics?.reviewTime &&
    pullRequestMetrics.reviewTime !== '0h' &&
    pullRequestMetrics.reviewTime !== '0d' &&
    pullRequestMetrics.reviewTime !== '0m';

  const hasPRData =
    Boolean(pullRequestMetrics?.prsOpen > 0) ||
    Boolean(pullRequestMetrics?.prsMerged > 0) ||
    hasPrCycleTime ||
    hasReviewTime;

  const hasActivity =
    Array.isArray(recentActivity) && recentActivity.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Code Execution Indicators: Compact Unified Metrics Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-subtle px-1 uppercase tracking-wider">
          Code Execution Indicators
        </h3>
        <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50">
          {/* Metric 1: Median PR Cycle Time */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Median PR Cycle Time
              </span>
              <Clock size={15} className="text-text-subtle shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-text">
                {hasPrCycleTime ? pullRequestMetrics.prCycleTime : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasPrCycleTime
                ? 'From first commit to merge'
                : 'Requires merged PR baseline'}
            </span>
          </div>

          {/* Metric 2: PRs Merged (Today) */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                PRs Merged (Today)
              </span>
              <GitMerge
                size={15}
                className={
                  pullRequestMetrics?.prsMerged > 0
                    ? 'text-status-success shrink-0'
                    : 'text-text-subtle shrink-0'
                }
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  pullRequestMetrics?.prsMerged > 0
                    ? 'text-status-success'
                    : 'text-text'
                }`}
              >
                {pullRequestMetrics?.prsMerged ?? 0}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {pullRequestMetrics?.prsMerged > 0
                ? `${pullRequestMetrics.prsMerged} pull requests closed`
                : 'No pull requests merged today'}
            </span>
          </div>

          {/* Metric 3: PRs Open */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                PRs Open
              </span>
              <GitPullRequest size={15} className="text-text-subtle shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-text">
                {pullRequestMetrics?.prsOpen ?? 0}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {pullRequestMetrics?.prsOpen === 1
                ? '1 active pull request'
                : pullRequestMetrics?.prsOpen > 1
                  ? `${pullRequestMetrics.prsOpen} active pull requests`
                  : 'No open pull requests'}
            </span>
          </div>

          {/* Metric 4: Review Duration (Avg) */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Review Duration (Avg)
              </span>
              <GitBranch size={15} className="text-text-subtle shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-text">
                {hasReviewTime ? pullRequestMetrics.reviewTime : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasReviewTime
                ? 'Time to approve code review'
                : 'Requires review baseline'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Recent Activity: Clean Chronological List */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">
            Recent Activity
          </h3>
          <span className="text-xs font-medium text-text-subtle">
            {hasActivity
              ? `${recentActivity.length} ${recentActivity.length === 1 ? 'event' : 'events'} logged`
              : '0 events'}
          </span>
        </div>

        {hasActivity ? (
          <div className="divide-y divide-border-subtle/50">
            {recentActivity.map((activity, idx) => {
              const isGitMerge = activity.type === 'pr_merge';
              const isDeploy = activity.type === 'deploy';
              const isGitPrOpen = activity.type === 'pr_open';
              const isBuildFail = activity.type === 'build_fail';

              return (
                <div
                  key={activity.id || idx}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs group hover:bg-background-elevated/30 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 p-1 rounded-md bg-background-elevated border border-border-subtle shrink-0 text-text-subtle group-hover:text-primary transition-colors">
                      {isGitMerge && (
                        <GitMerge size={14} className="text-status-success" />
                      )}
                      {isDeploy && (
                        <Package size={14} className="text-primary" />
                      )}
                      {isGitPrOpen && (
                        <GitPullRequest size={14} className="text-secondary" />
                      )}
                      {isBuildFail && (
                        <XCircle size={14} className="text-status-error" />
                      )}
                      {!isGitMerge &&
                        !isDeploy &&
                        !isGitPrOpen &&
                        !isBuildFail && <Activity size={14} />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors truncate">
                          {activity.title}
                        </span>
                        {(activity.author || activity.user) && (
                          <span className="text-[11px] text-text-subtle font-normal shrink-0">
                            by {activity.author || activity.user}
                          </span>
                        )}
                      </div>
                      {activity.desc && (
                        <p className="text-[11px] text-text-subtle leading-relaxed line-clamp-2">
                          {activity.desc}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-text-subtle font-normal shrink-0 pt-0.5">
                    {activity.time}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 px-4 bg-background-elevated/20 border border-border-subtle/50 rounded-lg text-center flex flex-col items-center justify-center gap-1 text-xs">
            <span className="font-medium text-text">
              No recent activity recorded
            </span>
            <span className="text-[11px] text-text-subtle">
              Repository commits, pull requests, and workspace workflow events will populate here as actions occur.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TLCodeTab);
