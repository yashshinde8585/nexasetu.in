import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart3,
  TrendingDown,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  History,
  FileSpreadsheet,
} from 'lucide-react';

const SprintReportsTab = ({
  sprint,
  tasks = [],
  burndown,
  burndownLoading,
  allSprints = [],
  onSelectSprint,
  onExportCsv,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeAllSprints = Array.isArray(allSprints) ? allSprints : [];

  const [metricType, setMetricType] = useState('points'); // 'points' | 'tasks'

  const completedSprints = useMemo(() => {
    return safeAllSprints.filter((s) => s.status === 'completed');
  }, [safeAllSprints]);

  const burndownDays = burndown?.days || [];

  // Determine SVG coordinates for Burndown Chart
  const chartData = useMemo(() => {
    if (!burndownDays || burndownDays.length === 0) return null;

    const maxVal = Math.max(
      ...burndownDays.map((d) =>
        metricType === 'points'
          ? Math.max(d.idealRemaining || 0, d.actualRemaining || 0, d.totalPoints || 0)
          : Math.max(d.idealTasksRemaining || 0, d.actualTasksRemaining || 0, d.totalTasks || 0)
      ),
      10
    );

    const width = 640;
    const height = 240;
    const padding = 36;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const count = burndownDays.length;
    const getX = (index) => padding + (index / Math.max(1, count - 1)) * chartW;
    const getY = (val) => height - padding - (val / maxVal) * chartH;

    // Ideal points
    const idealPoints = burndownDays
      .map((d, i) => `${getX(i)},${getY(metricType === 'points' ? d.idealRemaining : d.idealTasksRemaining)}`)
      .join(' ');

    // Actual points (only for days that have valid numeric actualRemaining)
    const validActual = burndownDays
      .map((d, i) => {
        const rawVal = metricType === 'points' ? d.actualRemaining : (d.actualTasksRemaining ?? d.actualRemaining);
        const val = typeof rawVal === 'number' && !isNaN(rawVal) ? rawVal : null;
        return val !== null ? { x: getX(i), y: getY(val), val, day: d.day } : null;
      })
      .filter(Boolean);

    const actualPoints = validActual.map((p) => `${p.x},${p.y}`).join(' ');

    return {
      width,
      height,
      padding,
      maxVal,
      idealPoints,
      actualPoints,
      validActual,
      days: burndownDays,
      getX,
      getY,
    };
  }, [burndownDays, metricType]);

  // Overall metrics summary
  const committedPoints = sprint?.committedPoints || burndown?.sprint?.committedPoints || 0;
  const currentPoints =
    safeTasks.reduce(
      (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
      0
    );
  const completedPoints =
    safeTasks
      .filter((t) => t.status === 'done')
      .reduce(
        (sum, t) => sum + (typeof t.storyPoints === 'number' ? t.storyPoints : 0),
        0
      );
  const completedTasksCount = safeTasks.filter((t) => t.status === 'done').length;
  const scopeChange = currentPoints - committedPoints;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border-subtle rounded-md p-4">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <span>Sprint Burndown & Delivery Velocity</span>
          </h3>
          <p className="text-xs text-text-subtle">
            Ideal vs actual remaining trajectory across the sprint duration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Points vs Tasks Toggle */}
          <div className="flex rounded-xs border border-border-subtle bg-background overflow-hidden p-0.5">
            <button
              type="button"
              onClick={() => setMetricType('points')}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                metricType === 'points'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-subtle hover:text-text'
              }`}
            >
              Story Points
            </button>
            <button
              type="button"
              onClick={() => setMetricType('tasks')}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                metricType === 'tasks'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-subtle hover:text-text'
              }`}
            >
              Task Count
            </button>
          </div>

          {/* Export Report Action */}
          <button
            type="button"
            onClick={onExportCsv}
            className="h-8 px-3.5 bg-background-elevated hover:bg-background-elevated/80 border border-border-subtle rounded-xs text-xs font-semibold text-text flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Burndown Chart Container */}
      <div className="bg-card border border-border-subtle rounded-md p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-text-subtler" />
              <span className="text-text-subtle">Ideal Guideline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary" />
              <span className="text-primary font-semibold">Actual Remaining</span>
            </div>
          </div>

          <span className="text-text-subtler font-mono text-[11px]">
            Unit: {metricType === 'points' ? 'Story Points' : 'Tasks'}
          </span>
        </div>

        {chartData ? (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-56 sm:h-64 select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y =
                  chartData.height -
                  chartData.padding -
                  pct * (chartData.height - chartData.padding * 2);
                const val = Math.round(pct * chartData.maxVal);
                return (
                  <g key={idx}>
                    <line
                      x1={chartData.padding}
                      y1={y}
                      x2={chartData.width - chartData.padding}
                      y2={y}
                      stroke="currentColor"
                      className="text-border-subtle/40"
                      strokeWidth="1"
                    />
                    <text
                      x={chartData.padding - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-text-subtler font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Ideal Guideline */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-text-subtler/60"
                strokeWidth="1.5"
                points={chartData.idealPoints}
              />

              {/* Actual Remaining Line */}
              {chartData.actualPoints && (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartData.actualPoints}
                />
              )}

              {/* Actual Data Points */}
              {chartData.validActual.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  className="fill-primary stroke-background"
                  strokeWidth="1.5"
                />
              ))}

              {/* X-axis day labels */}
              {chartData.days.map((d, i) => {
                if (
                  chartData.days.length > 10 &&
                  i % Math.ceil(chartData.days.length / 7) !== 0 &&
                  i !== chartData.days.length - 1
                ) {
                  return null;
                }
                const x = chartData.getX(i);
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartData.height - 12}
                    textAnchor="middle"
                    className="text-[10px] fill-text-subtle font-mono"
                  >
                    {d.day}
                  </text>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="h-56 flex flex-col items-center justify-center text-xs text-text-subtle space-y-1">
            <Clock size={20} className="text-text-subtler mb-1" />
            <p>Burndown chart will populate as sprint timeline progresses.</p>
          </div>
        )}
      </div>

      {/* 3. Committed vs Completed Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Story Points Comparison */}
        <div className="bg-card border border-border-subtle rounded-md p-4 space-y-2">
          <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider block">
            Committed vs Completed Points
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-status-success tracking-tight">
              {completedPoints}
            </span>
            <span className="text-xs text-text-subtle">
              / {committedPoints} committed pts ({currentPoints} current)
            </span>
          </div>
          <p className="text-xs text-text-subtle">
            {committedPoints > 0
              ? `${Math.round((completedPoints / committedPoints) * 100)}% of committed story points delivered`
              : 'No points baseline established'}
          </p>
        </div>

        {/* Task Velocity */}
        <div className="bg-card border border-border-subtle rounded-md p-4 space-y-2">
          <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider block">
            Task Throughput
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text tracking-tight">
              {completedTasksCount}
            </span>
            <span className="text-xs text-text-subtle">
              / {tasks.length} total tasks
            </span>
          </div>
          <p className="text-xs text-text-subtle">
            {tasks.length > 0
              ? `${Math.round((completedTasksCount / tasks.length) * 100)}% total tasks marked Done`
              : 'Zero tasks in sprint'}
          </p>
        </div>

        {/* Scope Change */}
        <div className="bg-card border border-border-subtle rounded-md p-4 space-y-2">
          <span className="text-xs font-semibold text-text-subtle uppercase tracking-wider block">
            Scope Change
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                scopeChange > 0
                  ? 'text-status-warning'
                  : scopeChange < 0
                  ? 'text-primary'
                  : 'text-text'
              }`}
            >
              {scopeChange > 0 ? `+${scopeChange}` : scopeChange}
            </span>
            <span className="text-xs text-text-subtle">pts scope drift</span>
          </div>
          <p className="text-xs text-text-subtle">
            {scopeChange > 0
              ? 'Work added to sprint after start'
              : scopeChange < 0
              ? 'Work removed from sprint scope'
              : 'Sprint scope remained strictly stable'}
          </p>
        </div>
      </div>

      {/* 4. Completed Sprint History */}
      <div className="bg-card border border-border-subtle rounded-md overflow-hidden space-y-0">
        <div className="p-3 sm:p-4 bg-background-elevated/60 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-text">
              Completed Sprint History
            </h3>
            <span className="text-xs font-semibold text-text-subtle px-2 py-0.5 bg-background border border-border-subtle rounded">
              {completedSprints.length} past cycles
            </span>
          </div>
        </div>

        {completedSprints.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {completedSprints.map((cs) => {
              const isSelected = (cs._id || cs.id) === (sprint?._id || sprint?.id);
              const snapshot = cs.completionSnapshot || {};

              return (
                <div
                  key={cs._id || cs.id}
                  onClick={() => onSelectSprint(cs._id || cs.id)}
                  className={`p-3.5 hover:bg-background-elevated/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text hover:text-primary transition-colors">
                        {cs.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-status-success/10 text-status-success border border-status-success/20">
                        Completed
                      </span>
                    </div>

                    <div className="text-[11px] text-text-subtle flex items-center gap-2">
                      <span>
                        {cs.startDate ? new Date(cs.startDate).toLocaleDateString() : ''} -{' '}
                        {cs.endDate ? new Date(cs.endDate).toLocaleDateString() : ''}
                      </span>
                      {cs.project?.name && (
                        <>
                          <span>•</span>
                          <span className="text-text-subtler">{cs.project.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-right">
                      <span className="text-text-subtle block text-[11px]">
                        Delivered
                      </span>
                      <span className="font-semibold text-status-success">
                        {cs.completedPoints || snapshot.completedPoints || 0} pts
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-text-subtle block text-[11px]">
                        Rollover
                      </span>
                      <span className="font-semibold text-status-warning">
                        {snapshot.incompleteTasksCount || 0} tasks
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-semibold rounded-xs border border-border-subtle bg-background hover:bg-background-elevated transition-colors"
                    >
                      {isSelected ? 'Viewing' : 'Inspect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-subtle">
            No completed sprints recorded yet in this workspace.
          </div>
        )}
      </div>
    </div>
  );
};

SprintReportsTab.propTypes = {
  sprint: PropTypes.object,
  tasks: PropTypes.array,
  burndown: PropTypes.object,
  burndownLoading: PropTypes.bool,
  allSprints: PropTypes.array,
  onSelectSprint: PropTypes.func.isRequired,
  onExportCsv: PropTypes.func.isRequired,
};

export default SprintReportsTab;
