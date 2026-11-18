import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Clock,
  AlertCircle,
  Activity,
  Zap,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import VelocityIndicator from '../molecules/VelocityIndicator';
import ItemBreakdownHeader from '../molecules/ItemBreakdownHeader';

// Detailed sprint analytics card
const SprintDetailsCard = ({
  sprint,
  metrics,
  stats,
  statsLoading,
  showWorkload,
  setShowWorkload,
  onDownload,
  sprints = [],
  onSprintChange,
  onFinalize,
  finalizing,
  canCreate,
}) => {
  if (!sprint) return null;

  const [isSprintDropdownOpen, setIsSprintDropdownOpen] = useState(false);

  // Parse flow efficiency safely
  const flowEfficiencyValue = React.useMemo(() => {
    if (!metrics?.flowEfficiency) return null;
    const num = parseFloat(String(metrics.flowEfficiency).replace('%', ''));
    return isNaN(num) ? null : Math.min(100, Math.max(0, num));
  }, [metrics?.flowEfficiency]);

  // Format dates
  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      return new Date(dateVal).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const sprintDurationDays = React.useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return null;
    try {
      const diff = Math.ceil(
        (new Date(sprint.endDate) - new Date(sprint.startDate)) /
          (1000 * 60 * 60 * 24)
      );
      return Math.max(1, diff);
    } catch {
      return null;
    }
  }, [sprint.startDate, sprint.endDate]);

  const isCompleted = (sprint.status || '').toLowerCase() === 'completed';

  return (
    <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-5 space-y-6">
      {/* 1. Header Overview & Sprint Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        {/* Sprint Switcher Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSprintDropdownOpen(!isSprintDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-2 bg-background-elevated border border-border-subtle hover:border-border text-text rounded-xs text-xs font-semibold transition-all cursor-pointer"
            >
              <Clock size={14} className="text-primary" />
              <span className="text-sm font-bold text-text truncate max-w-[220px]">
                {sprint.name}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-xs border ${
                  isCompleted
                    ? 'bg-status-success/10 text-status-success border-status-success/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}
              >
                {sprint.status || 'Active'}
              </span>
              <ChevronDown
                size={14}
                className={`text-text-subtle transition-transform duration-200 ${
                  isSprintDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {isSprintDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-card border border-border-subtle rounded-md shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-text-subtler uppercase tracking-wider border-b border-border-subtler">
                Select Sprint
              </div>
              <div className="max-h-60 overflow-y-auto">
                {sprints.map((s) => {
                  const sId = s._id || s.id;
                  const isSelected = sId === (sprint._id || sprint.id);
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => {
                        onSprintChange(sId);
                        setIsSprintDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text hover:bg-background-elevated'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-text-subtler uppercase ml-2">
                        {s.status || 'Active'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Metadata & Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-subtle">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-text-subtler" />
            <span className="text-text font-medium">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </span>
          </div>

          {sprintDurationDays && (
            <>
              <span className="text-border-subtle">•</span>
              <span className="text-text-subtle font-medium">
                {sprintDurationDays} days duration
              </span>
            </>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Complete Sprint Action */}
            {canCreate && !isCompleted && (
              <button
                type="button"
                onClick={onFinalize}
                disabled={finalizing}
                className="h-8 px-3 bg-status-success/10 hover:bg-status-success/20 border border-status-success/30 text-status-success rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                <span>{finalizing ? 'Finalizing...' : 'Complete sprint'}</span>
              </button>
            )}

            {/* Export CSV Report */}
            {canCreate && (
              <button
                type="button"
                onClick={onDownload}
                className="h-8 px-2.5 bg-background-elevated hover:bg-card border border-border-subtle hover:border-border text-text rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Sprint CSV Report"
              >
                <FileText size={13} className="text-primary" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Intelligence Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Velocity Indicator Chart */}
        <div className="lg:col-span-4">
          <VelocityIndicator
            data={metrics?.velocitySpark}
            statsLoading={statsLoading}
          />
        </div>

        {/* Right Column: Task Breakdown & Secondary Metrics */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-4">
          <ItemBreakdownHeader metrics={metrics} statsLoading={statsLoading} />

          {/* Secondary Metric Strip: Flow Efficiency, Backlog Tasks, Blocked Tasks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Flow Efficiency */}
            <div className="bg-background-elevated border border-border-subtle rounded-md p-3.5 flex flex-col justify-between">
              <div className="text-xs font-semibold text-text-subtle mb-1.5 flex items-center justify-between">
                <span>Flow efficiency</span>
                <Zap size={13} className="text-secondary" />
              </div>
              <div className="space-y-1.5">
                <div className="text-lg font-bold text-text">
                  {flowEfficiencyValue !== null ? `${flowEfficiencyValue}%` : 'N/A'}
                </div>
                <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${flowEfficiencyValue ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Backlog Tasks */}
            <div className="bg-background-elevated border border-border-subtle rounded-md p-3.5 flex flex-col justify-between">
              <div className="text-xs font-semibold text-text-subtle mb-1.5 flex items-center justify-between">
                <span>Backlog tasks</span>
                <Clock size={13} className="text-status-warning" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-status-warning">
                  {metrics?.overdueCount ?? metrics?.strategicDebt ?? 0}
                </span>
                <span className="text-[11px] font-medium text-text-subtler">
                  tasks
                </span>
              </div>
            </div>

            {/* Blocked Tasks */}
            <div className="bg-background-elevated border border-border-subtle rounded-md p-3.5 flex flex-col justify-between">
              <div className="text-xs font-semibold text-text-subtle mb-1.5 flex items-center justify-between">
                <span>Blocked tasks</span>
                <AlertCircle size={13} className="text-status-error" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-status-error">
                  {metrics?.blockerCount ?? 0}
                </span>
                <span className="text-[11px] font-medium text-text-subtler">
                  impediments
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Team Workload Section */}
      {canCreate && (
        <div className="pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setShowWorkload(!showWorkload)}
            className="flex justify-between items-center w-full px-3.5 py-2.5 bg-background-elevated border border-border-subtle rounded-xs hover:border-border transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users size={14} className="text-primary" />
              <span className="text-xs font-semibold text-text">
                Team workload
              </span>
              <span className="text-[11px] px-1.5 py-0.2 bg-card border border-border-subtle rounded-xs text-text-subtle">
                {metrics?.workload?.length || 0} members
              </span>
            </div>
            {showWorkload ? (
              <ChevronDown size={14} className="text-text-subtle" />
            ) : (
              <ChevronRight size={14} className="text-text-subtle" />
            )}
          </button>

          {showWorkload && (
            <div className="mt-3">
              {metrics?.workload && metrics.workload.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {metrics.workload.map((wp, idx) => {
                    const isOverloaded = (wp.count || 0) > 5;
                    const initial = (wp.name || 'Member').charAt(0).toUpperCase();
                    return (
                      <div
                        key={wp._id || idx}
                        className="bg-background-elevated border border-border-subtle rounded-md px-3.5 py-3 flex items-center gap-3 hover:border-border transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xs bg-card border border-border-subtle flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text truncate">
                            {wp.name}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-text-subtle mt-0.5">
                            <span>{wp.count} active tasks</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOverloaded ? 'bg-status-error' : 'bg-status-success'
                              }`}
                              title={isOverloaded ? 'Overloaded (> 5 tasks)' : 'Balanced'}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-background-elevated/50 border border-border-subtle rounded-md text-xs text-text-subtle">
                  No member assignments recorded for this sprint yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

SprintDetailsCard.propTypes = {
  sprint: PropTypes.object,
  metrics: PropTypes.object,
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
  showWorkload: PropTypes.bool,
  setShowWorkload: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  sprints: PropTypes.array,
  onSprintChange: PropTypes.func.isRequired,
  onFinalize: PropTypes.func.isRequired,
  finalizing: PropTypes.bool,
  canCreate: PropTypes.bool,
};

export default SprintDetailsCard;
