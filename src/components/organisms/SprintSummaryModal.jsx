import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle2, TrendingUp, Sparkles, Award } from 'lucide-react';

// Modal component that presents sprint completion retrospective and key metrics
const SprintSummaryModal = ({ finalSummary, setFinalSummary }) => {
  useEffect(() => {
    if (!finalSummary) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFinalSummary(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [finalSummary, setFinalSummary]);

  if (!finalSummary) return null;

  const metrics = finalSummary.metrics || {};
  const stats = [
    {
      label: 'Velocity (Completed)',
      value: metrics.velocity ?? 0,
      color: 'text-primary',
      description: 'Tasks successfully finished in this sprint',
    },
    {
      label: 'Retention Rate',
      value: `${(metrics.retention || 0).toFixed(1)}%`,
      color: 'text-status-success',
      description: 'Scope retained without unexpected churn',
    },
    {
      label: 'Spillover (Pending)',
      value: metrics.spillover ?? 0,
      color: 'text-status-warning',
      description: 'Tasks carrying over to the next sprint',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retrospective-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => setFinalSummary(null)}
    >
      <div
        className="bg-card w-full max-w-2xl rounded-md border border-border-subtle shadow-2xl overflow-hidden space-y-6 p-6 sm:p-7 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xs bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h2 id="retrospective-modal-title" className="text-base font-bold text-text">
                Sprint Retrospective Summary
              </h2>
              <p className="text-xs text-text-subtle">
                {finalSummary.sprint || 'Sprint'} completed iteration metrics and insights
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFinalSummary(null)}
            aria-label="Close dialog"
            className="w-7 h-7 flex items-center justify-center text-text-subtle hover:text-text rounded-xs transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-background-elevated p-3.5 rounded-md border border-border-subtle text-center space-y-1"
              title={stat.description}
            >
              <p className="text-xs font-semibold text-text-subtle truncate">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color} tracking-tight`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* AI Strategic Analysis / Retrospective */}
        {finalSummary.summary && (
          <div className="bg-background-elevated border border-border-subtle rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles size={13} />
              <span>AI Retrospective Analysis</span>
            </div>
            <div className="text-xs text-text-subtle leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-1">
              {finalSummary.summary}
            </div>
          </div>
        )}

        {/* Top Contributors */}
        {finalSummary.topContributors && finalSummary.topContributors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle">
              <Award size={13} className="text-secondary" />
              <span>Top Contributors</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {finalSummary.topContributors.map((c, idx) => (
                <div
                  key={c._id || idx}
                  className="bg-background-elevated border border-border-subtle rounded-xs px-3 py-2 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-text truncate">
                    {c.name || 'Member'}
                  </span>
                  <span className="text-[11px] text-text-subtle font-semibold">
                    {c.count} tasks
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setFinalSummary(null)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Close retrospective
          </button>
        </div>
      </div>
    </div>
  );
};

SprintSummaryModal.propTypes = {
  finalSummary: PropTypes.shape({
    sprint: PropTypes.string,
    metrics: PropTypes.shape({
      velocity: PropTypes.number,
      retention: PropTypes.number,
      spillover: PropTypes.number,
    }),
    summary: PropTypes.string,
    topContributors: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        count: PropTypes.number,
      })
    ),
  }),
  setFinalSummary: PropTypes.func.isRequired,
};

export default SprintSummaryModal;
