import React, { useMemo } from 'react';
import {
  Activity,
  Clock,
  AlertCircle,
  Package,
  ShieldCheck,
  Shield,
  GitCommit,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

const TLOverviewTab = ({
  sprintProgress = 0,
  storiesCompleted = { completed: 0, total: 0 },
  cycleTime = { value: 0, unit: 'days' },
  deploymentFrequency = { value: 0, unit: 'week' },
  changeFailureRate = { value: 0 },
  codeHealthScore = 0,
  workItemsStatus = {
    done: 0,
    inProgress: 0,
    inReview: 0,
    blocked: 0,
    total: 0,
  },
  burndownData = [],
  topPriorities = [],
  teamVelocity = [],
  codeHealthOverview = { coverage: 0, eslint: 0, security: 0, debtDays: 0 },
  pullRequestMetrics = {
    prCycleTime: '0h',
    prsMerged: 0,
    prsOpen: 0,
    reviewTime: '0h',
    prCycleTimeHistory: [],
    prsMergedHistory: [],
    prReviewTimeHistory: [],
  },
  recentActivity = [],
  crossTeamDependencies = [],
  teamWorkload = [],
  aiInsights = [],
  upcomingDeadlines = [],
  comparisons = null,
  prComparisons = null,
  sparklineDone = [],
  sparklineCycle = [],
  sparklineFreq = [],
  sparklineFailure = [],
  workItemsChartData = [],
  setActiveTab,
}) => {
  // Verification for Code Health Score: require real supporting telemetry data
  const hasCodeHealthData =
    codeHealthScore > 0 &&
    (codeHealthOverview.coverage > 0 ||
      codeHealthOverview.eslint > 0 ||
      codeHealthOverview.security > 0);

  // Check if burndown data has sufficient points to render a meaningful line chart
  const hasBurndownData =
    Array.isArray(burndownData) && burndownData.length > 1;

  // Chart data calculation for Work Items with NexaSetu design tokens
  const computedChartData = useMemo(() => {
    if (workItemsChartData && workItemsChartData.length > 0) {
      return workItemsChartData;
    }
    return [
      {
        name: 'Done',
        value: workItemsStatus.done || 0,
        color: '#10B981',
      },
      {
        name: 'In Progress',
        value: workItemsStatus.inProgress || 0,
        color: '#3B82F6',
      },
      {
        name: 'In Review',
        value: workItemsStatus.inReview || 0,
        color: '#8B5CF6',
      },
      {
        name: 'Blocked',
        value: workItemsStatus.blocked || 0,
        color: '#EF4444',
      },
    ];
  }, [workItemsChartData, workItemsStatus]);

  const activeChartData = computedChartData.filter((item) => item.value > 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* =========================================================================
          GROUP 1: SPRINT AT A GLANCE (Unified telemetry strip with minimal borders)
          ========================================================================= */}
      <section aria-label="Sprint at a Glance">
        <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50 gap-y-4 sm:gap-y-0">
            {/* KPI 1: Sprint Progress */}
            <div className="flex flex-col justify-between sm:px-3.5 first:sm:pl-0 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Sprint Progress
                </span>
                <Activity size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold tracking-tight text-text">
                  {sprintProgress}%
                </span>
                {comparisons?.sprintProgress && (
                  <span
                    className={`text-[11px] font-medium ${
                      comparisons.sprintProgress.direction === 'up'
                        ? 'text-status-success'
                        : 'text-status-error'
                    }`}
                  >
                    {comparisons.sprintProgress.direction === 'up' ? '↑' : '↓'}
                    {Math.abs(comparisons.sprintProgress.diff)}%
                  </span>
                )}
              </div>
              {sprintProgress > 0 ? (
                <div className="w-full bg-background-elevated h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, sprintProgress)}%` }}
                  />
                </div>
              ) : (
                <span className="text-[11px] text-text-subtler mt-2.5 block truncate">
                  No active progress
                </span>
              )}
            </div>

            {/* KPI 2: Stories Completed */}
            <div className="flex flex-col justify-between sm:px-3.5 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Stories Completed
                </span>
                <ShieldCheck size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-text">
                    {storiesCompleted.completed}
                  </span>
                  <span className="text-xs text-text-subtle ml-1 font-normal">
                    / {storiesCompleted.total}
                  </span>
                </div>
                {comparisons?.storiesCompleted && (
                  <span
                    className={`text-[11px] font-medium ${
                      comparisons.storiesCompleted.direction === 'up'
                        ? 'text-status-success'
                        : 'text-status-error'
                    }`}
                  >
                    {comparisons.storiesCompleted.direction === 'up' ? '↑' : '↓'}
                    {Math.abs(comparisons.storiesCompleted.diff)}
                  </span>
                )}
              </div>
              <div className="w-full h-5 mt-2 flex items-center justify-end opacity-70">
                {sparklineDone && sparklineDone.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineDone}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[11px] text-text-subtler truncate">Sprint stories</span>
                )}
              </div>
            </div>

            {/* KPI 3: Avg. Cycle Time */}
            <div className="flex flex-col justify-between sm:px-3.5 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Avg. Cycle Time
                </span>
                <Clock size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-text">
                    {cycleTime.value > 0 ? cycleTime.value : 'N/A'}
                  </span>
                  {cycleTime.value > 0 && (
                    <span className="text-xs text-text-subtle ml-1 font-normal">
                      {cycleTime.unit || 'days'}
                    </span>
                  )}
                </div>
                {comparisons?.cycleTime && (
                  <span
                    className={`text-[11px] font-medium ${
                      comparisons.cycleTime.direction === 'down'
                        ? 'text-status-success'
                        : 'text-status-error'
                    }`}
                  >
                    {comparisons.cycleTime.direction === 'down' ? '↓' : '↑'}
                    {Math.abs(comparisons.cycleTime.diff)}d
                  </span>
                )}
              </div>
              <div className="w-full h-5 mt-2 flex items-center justify-end opacity-70">
                {sparklineCycle && sparklineCycle.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineCycle}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[11px] text-text-subtler truncate">Delivery pace</span>
                )}
              </div>
            </div>

            {/* KPI 4: Deployment Frequency */}
            <div className="flex flex-col justify-between sm:px-3.5 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Deployment Freq
                </span>
                <Package size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold tracking-tight text-text">
                    {deploymentFrequency.value}
                  </span>
                  <span className="text-xs text-text-subtle ml-1 font-normal">
                    / {deploymentFrequency.unit || 'wk'}
                  </span>
                </div>
                {comparisons?.deployCount && (
                  <span
                    className={`text-[11px] font-medium ${
                      comparisons.deployCount.direction === 'up'
                        ? 'text-status-success'
                        : 'text-status-error'
                    }`}
                  >
                    {comparisons.deployCount.direction === 'up' ? '↑' : '↓'}
                    {Math.abs(comparisons.deployCount.diff)}
                  </span>
                )}
              </div>
              <div className="w-full h-5 mt-2 flex items-center justify-end opacity-70">
                {sparklineFreq && sparklineFreq.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineFreq}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[11px] text-text-subtler truncate">Deploy cadence</span>
                )}
              </div>
            </div>

            {/* KPI 5: Change Failure Rate */}
            <div className="flex flex-col justify-between sm:px-3.5 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Change Failure Rate
                </span>
                <AlertCircle size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold tracking-tight text-text">
                  {changeFailureRate.value}%
                </span>
                {comparisons?.failureRate && (
                  <span
                    className={`text-[11px] font-medium ${
                      comparisons.failureRate.direction === 'down'
                        ? 'text-status-success'
                        : 'text-status-error'
                    }`}
                  >
                    {comparisons.failureRate.direction === 'down' ? '↓' : '↑'}
                    {Math.abs(comparisons.failureRate.diff)}%
                  </span>
                )}
              </div>
              <div className="w-full h-5 mt-2 flex items-center justify-end opacity-70">
                {sparklineFailure && sparklineFailure.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineFailure}>
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[11px] text-text-subtler truncate">Release stability</span>
                )}
              </div>
            </div>

            {/* KPI 6: Code Health Score */}
            <div className="flex flex-col justify-between sm:px-3.5 last:sm:pr-0 pt-2 sm:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-subtle truncate">
                  Code Health Score
                </span>
                <Shield size={14} className="text-text-subtle shrink-0" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                {hasCodeHealthData ? (
                  <>
                    <div>
                      <span className="text-2xl font-bold tracking-tight text-text">
                        {codeHealthScore}
                      </span>
                      <span className="text-xs text-text-subtle ml-1 font-normal">
                        / 100
                      </span>
                    </div>
                    <div className="w-6 h-6 relative flex items-center justify-center shrink-0">
                      <PieChart width={24} height={24}>
                        <Pie
                          data={[
                            { value: codeHealthScore },
                            { value: Math.max(0, 100 - codeHealthScore) },
                          ]}
                          dataKey="value"
                          innerRadius={8}
                          outerRadius={11}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="var(--color-border-subtle)" />
                        </Pie>
                      </PieChart>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-text">
                      N/A
                    </span>
                    <span className="text-[11px] text-text-subtler ml-1.5 font-normal">
                      No baseline
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-text-subtler mt-2 block truncate">
                {hasCodeHealthData ? 'Quality telemetry' : 'Requires telemetry'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 2: SPRINT EXECUTION (Daily tasks & active sprint delivery)
          ========================================================================= */}
      <section aria-label="Sprint Execution" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text tracking-tight">
              Sprint Execution
            </h2>
            <p className="text-xs text-text-subtle">
              Active priorities, status distribution, and burndown trajectory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Work Items Status (lg:col-span-3) */}
          <div className="lg:col-span-3 bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text">
                Work Items by Status
              </h3>
              <span className="text-xs font-medium text-text-subtle">
                Total: {workItemsStatus.total ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-center h-36 my-1 relative">
              {activeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={activeChartData}
                      dataKey="value"
                      innerRadius={38}
                      outerRadius={50}
                      paddingAngle={3}
                    >
                      {activeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-20 h-20 rounded-full border border-dashed border-border-subtle flex items-center justify-center text-xs text-text-subtle">
                  No items
                </div>
              )}
              <div className="absolute flex flex-col items-center justify-center leading-none pointer-events-none">
                <span className="text-lg font-bold text-text">
                  {workItemsStatus.total ?? 0}
                </span>
                <span className="text-[10px] text-text-subtle mt-0.5 font-medium">
                  Items
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border-subtle/60">
              {computedChartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-text-subtle truncate">{item.name}</span>
                  <span className="ml-auto font-medium text-text">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Sprint Burndown (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text">
                Sprint Burndown
              </h3>
              {hasBurndownData ? (
                <div className="flex items-center gap-2.5 text-[11px] text-text-subtle">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-gray-400" /> Ideal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-secondary" /> Remaining
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-status-success" /> Completed
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab?.('delivery')}
                  className="text-primary text-xs font-medium hover:underline cursor-pointer bg-transparent border-none"
                >
                  Delivery tab →
                </button>
              )}
            </div>

            <div className="w-full h-44 flex items-center justify-center">
              {hasBurndownData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={burndownData}
                    margin={{ top: 8, right: 8, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-subtler)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-border-subtle)"
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis
                      stroke="var(--color-border-subtle)"
                      tick={{ fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ideal"
                      stroke="var(--color-border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="remaining"
                      stroke="var(--color-secondary)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--color-status-success)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-4 text-xs text-text-subtle max-w-xs leading-relaxed">
                  <Activity size={20} className="mx-auto mb-2 text-text-subtler" />
                  Sprint burndown trend will populate as sprint tasks are completed.
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-border-subtle/60 flex justify-end items-center">
              <button
                onClick={() => setActiveTab?.('delivery')}
                className="text-primary hover:underline cursor-pointer bg-transparent border-none text-xs font-medium"
              >
                View burndown details →
              </button>
            </div>
          </div>

          {/* Card 3: Top Priorities (lg:col-span-5 - Prominent actionable list) */}
          <div className="lg:col-span-5 bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-text">
                  Top Priorities
                </h3>
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <button
                onClick={() => setActiveTab?.('delivery')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer bg-transparent border-none"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-border-subtle/50 flex-1 flex flex-col justify-center">
              {topPriorities && topPriorities.length > 0 ? (
                topPriorities.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1.5 hover:bg-background-elevated/40 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-text leading-snug truncate flex-1">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          item.severity === 'Critical' || item.priority === 'critical'
                            ? 'bg-status-error/10 text-status-error'
                            : 'bg-status-warning/10 text-status-warning'
                        }`}
                      >
                        {item.severity || item.priority || 'High'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-background-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle/40">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-text-subtle font-medium shrink-0">
                        {item.progress || 0}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-subtle">
                  No active priorities logged
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 3: ENGINEERING PERFORMANCE (Quality, Velocity, Code telemetry)
          ========================================================================= */}
      <section aria-label="Engineering Performance" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text tracking-tight">
              Engineering Performance
            </h2>
            <p className="text-xs text-text-subtle">
              Velocity trends, automated repository health, PR metrics, and commit activity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Team Velocity (Bar Chart) */}
          <div className="bg-card border border-border-subtle p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text">
                Team Velocity
              </h3>
              <button
                onClick={() => setActiveTab?.('delivery')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer bg-transparent border-none"
              >
                Delivery report →
              </button>
            </div>

            <div className="w-full h-36 flex items-center justify-center">
              {teamVelocity && teamVelocity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={teamVelocity}
                    margin={{ top: 6, right: 6, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-subtler)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="sprint"
                      stroke="var(--color-border-subtle)"
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis
                      stroke="var(--color-border-subtle)"
                      tick={{ fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="var(--color-status-success)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-text-subtle text-center py-6">
                  No velocity history available
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Pull Request Metrics (Clean flat data rows with sparklines) */}
          <div className="bg-card border border-border-subtle p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text">
                Pull Request Metrics
              </h3>
              <button
                onClick={() => setActiveTab?.('code')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer border-none bg-transparent"
              >
                Code tab →
              </button>
            </div>

            <div className="divide-y divide-border-subtle/50 flex flex-col justify-center flex-1">
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-text-subtle text-[11px] block">
                    Median PR Cycle Time
                  </span>
                  <span className="text-sm font-bold text-text mt-0.5 block">
                    {pullRequestMetrics.prCycleTime || 'N/A'}
                  </span>
                </div>
                <div className="w-12 h-5 opacity-70">
                  {pullRequestMetrics.prCycleTimeHistory && pullRequestMetrics.prCycleTimeHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pullRequestMetrics.prCycleTimeHistory}>
                        <Area
                          type="monotone"
                          dataKey="val"
                          stroke="var(--color-primary)"
                          fill="var(--color-primary)"
                          fillOpacity={0.15}
                          strokeWidth={1}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-text-subtle text-[11px] block">
                    PRs Merged (Sprint)
                  </span>
                  <span className="text-sm font-bold text-status-success mt-0.5 block">
                    {pullRequestMetrics.prsMerged ?? 0}
                  </span>
                </div>
                <div className="w-12 h-5 opacity-70">
                  {pullRequestMetrics.prsMergedHistory && pullRequestMetrics.prsMergedHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pullRequestMetrics.prsMergedHistory}>
                        <Area
                          type="monotone"
                          dataKey="val"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.15}
                          strokeWidth={1}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-text-subtle text-[11px] block">
                    Average Review Time
                  </span>
                  <span className="text-sm font-bold text-text mt-0.5 block">
                    {pullRequestMetrics.reviewTime && pullRequestMetrics.reviewTime !== '0h'
                      ? pullRequestMetrics.reviewTime
                      : 'N/A'}
                  </span>
                </div>
                <div className="w-12 h-5 opacity-70">
                  {pullRequestMetrics.prReviewTimeHistory && pullRequestMetrics.prReviewTimeHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pullRequestMetrics.prReviewTimeHistory}>
                        <Area
                          type="monotone"
                          dataKey="val"
                          stroke="#8B5CF6"
                          fill="#8B5CF6"
                          fillOpacity={0.15}
                          strokeWidth={1}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Recent Activity (Clean commit feed) */}
          <div className="bg-card border border-border-subtle p-4 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text">
                Recent Activity
              </h3>
              <button
                onClick={() => setActiveTab?.('code')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer border-none bg-transparent"
              >
                Code tab →
              </button>
            </div>

            <div className="divide-y divide-border-subtle/50 flex flex-col justify-center flex-1">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 3).map((act, idx) => (
                  <div
                    key={act.id || idx}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <GitCommit size={13} className="text-text-subtle shrink-0" />
                      <div className="truncate">
                        <span className="text-text font-medium block truncate">
                          {act.title}
                        </span>
                        <span className="text-[11px] text-text-subtler block truncate">
                          {act.author || act.user || 'Engineer'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-subtle shrink-0">
                      {act.time || 'recent'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-subtle">
                  No recent commits recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 4: TEAM & PLANNING (Workload, automated insights, upcoming milestones)
          ========================================================================= */}
      <section aria-label="Team & Planning" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text tracking-tight">
              Team & Planning
            </h2>
            <p className="text-xs text-text-subtle">
              Workload distribution, AI-guided suggestions, and delivery milestone targets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Team Workload */}
          <div className="bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text">
                Team Workload
              </h3>
              <button
                onClick={() => setActiveTab?.('team')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer border-none bg-transparent"
              >
                Team capacity →
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1 flex-1 justify-center">
              {teamWorkload && teamWorkload.length > 0 ? (
                teamWorkload.slice(0, 4).map((user, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px]">
                          {user.member?.[0] || 'E'}
                        </div>
                        <span className="text-text font-medium truncate max-w-[150px]">
                          {user.member}
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          user.status === 'Overallocated'
                            ? 'text-status-error'
                            : user.status === 'Committed'
                              ? 'text-status-warning'
                              : 'text-status-success'
                        }`}
                      >
                        {user.load}%
                      </span>
                    </div>
                    <div className="w-full bg-background-elevated h-1 rounded-full overflow-hidden border border-border-subtle/40">
                      <div
                        className={`h-full rounded-full ${
                          user.status === 'Overallocated'
                            ? 'bg-status-error'
                            : user.status === 'Committed'
                              ? 'bg-status-warning'
                              : 'bg-status-success'
                        }`}
                        style={{ width: `${Math.min(100, user.load || 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-subtle">
                  No team allocations registered
                </div>
              )}
            </div>
          </div>

          {/* Card 2: AI Recommendations */}
          <div className="bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text">
                AI Insights & Recommendations
              </h3>
              <button
                onClick={() => setActiveTab?.('insights')}
                className="text-primary text-xs font-medium hover:underline cursor-pointer border-none bg-transparent"
              >
                AI Insights tab →
              </button>
            </div>

            <div className="divide-y divide-border-subtle/50 flex flex-col justify-center flex-1">
              {aiInsights && aiInsights.length > 0 ? (
                aiInsights.slice(0, 3).map((insight, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between hover:bg-background-elevated/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 pr-2 truncate">
                      <span className="text-xs font-semibold text-text truncate">
                        {insight.title}
                      </span>
                      <span className="text-[11px] text-text-subtle truncate">
                        {insight.desc}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        insight.action === 'Positive'
                          ? 'bg-status-success/10 text-status-success'
                          : insight.action === 'Review'
                            ? 'bg-status-warning/10 text-status-warning'
                            : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {insight.action}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-subtle">
                  Not enough sprint telemetry for insights
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Upcoming Deadlines */}
          <div className="bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text">
                Upcoming Deadlines
              </h3>
            </div>

            <div className="divide-y divide-border-subtle/50 flex flex-col justify-center flex-1">
              {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
                  <div
                    key={deadline.id || idx}
                    className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <span className="text-text font-semibold truncate">
                        {deadline.title}
                      </span>
                      <span className="text-[10px] text-text-subtler">
                        {deadline.date}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        deadline.daysLeft <= 3
                          ? 'text-status-error'
                          : deadline.daysLeft <= 7
                            ? 'text-status-warning'
                            : 'text-status-success'
                      }`}
                    >
                      {deadline.daysLeft}d left
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-subtle">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default React.memo(TLOverviewTab);
