import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { Clock, Package, AlertCircle } from 'lucide-react';

const TLDeliveryTab = ({
  burndownData = [],
  teamVelocity = [],
  cycleTime = { value: 0, unit: 'days' },
  deploymentFrequency = { value: 0, unit: 'week' },
  changeFailureRate = { value: 0 },
  comparisons = null,
}) => {
  const hasCycleTime =
    cycleTime?.value !== null &&
    cycleTime?.value !== undefined &&
    cycleTime?.value > 0;

  const hasDeployments =
    deploymentFrequency?.value !== null &&
    deploymentFrequency?.value !== undefined &&
    deploymentFrequency?.value > 0;

  const hasChangeFailureRate =
    changeFailureRate?.value !== null &&
    changeFailureRate?.value !== undefined &&
    (changeFailureRate?.value > 0 || hasDeployments);

  const hasBurndown = Array.isArray(burndownData) && burndownData.length > 0;
  const hasVelocity = Array.isArray(teamVelocity) && teamVelocity.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Unified Delivery & DevOps Metric Strip */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle/50">
        {/* Metric 1: Average Cycle Time */}
        <div className="py-3 md:py-0 px-2 md:px-5 first:pt-0 md:first:pl-0 last:pb-0 md:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Average Cycle Time
            </span>
            <Clock size={15} className="text-text-subtle shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text">
              {hasCycleTime ? (
                <>
                  {cycleTime.value}{' '}
                  <span className="text-xs font-normal text-text-subtle">
                    {cycleTime.unit || 'days'}
                  </span>
                </>
              ) : (
                'N/A'
              )}
            </span>
            {hasCycleTime && comparisons?.cycleTime && (
              <span
                className={`text-xs font-medium ${
                  comparisons.cycleTime.direction === 'down'
                    ? 'text-status-success'
                    : 'text-status-error'
                }`}
              >
                {comparisons.cycleTime.direction === 'down' ? '↓' : '↑'}{' '}
                {Math.abs(comparisons.cycleTime.diff)}d vs last sprint
              </span>
            )}
          </div>
          {!hasCycleTime && (
            <span className="text-[11px] text-text-subtle">
              Requires completed tasks baseline
            </span>
          )}
        </div>

        {/* Metric 2: Deployment Frequency */}
        <div className="py-3 md:py-0 px-2 md:px-5 first:pt-0 md:first:pl-0 last:pb-0 md:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Deployment Frequency
            </span>
            <Package size={15} className="text-text-subtle shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text">
              {deploymentFrequency?.value !== null &&
              deploymentFrequency?.value !== undefined ? (
                <>
                  {deploymentFrequency.value}{' '}
                  <span className="text-xs font-normal text-text-subtle">
                    / {deploymentFrequency.unit || 'week'}
                  </span>
                </>
              ) : (
                'N/A'
              )}
            </span>
            {comparisons?.deployCount && (
              <span
                className={`text-xs font-medium ${
                  comparisons.deployCount.direction === 'up'
                    ? 'text-status-success'
                    : 'text-status-error'
                }`}
              >
                {comparisons.deployCount.direction === 'up' ? '↑' : '↓'}{' '}
                {Math.abs(comparisons.deployCount.diff)} vs last sprint
              </span>
            )}
          </div>
          {deploymentFrequency?.value === 0 && (
            <span className="text-[11px] text-text-subtle">
              No deployments recorded this period
            </span>
          )}
        </div>

        {/* Metric 3: Change Failure Rate */}
        <div className="py-3 md:py-0 px-2 md:px-5 first:pt-0 md:first:pl-0 last:pb-0 md:last:pr-0 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-subtle">
              Change Failure Rate
            </span>
            <AlertCircle
              size={15}
              className={
                hasChangeFailureRate && changeFailureRate.value > 0
                  ? 'text-status-warning shrink-0'
                  : 'text-text-subtle shrink-0'
              }
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                hasChangeFailureRate && changeFailureRate.value > 15
                  ? 'text-status-error'
                  : 'text-text'
              }`}
            >
              {hasChangeFailureRate ? `${changeFailureRate.value}%` : 'N/A'}
            </span>
            {hasChangeFailureRate && comparisons?.failureRate && (
              <span
                className={`text-xs font-medium ${
                  comparisons.failureRate.direction === 'down'
                    ? 'text-status-success'
                    : 'text-status-error'
                }`}
              >
                {comparisons.failureRate.direction === 'down' ? '↓' : '↑'}{' '}
                {Math.abs(comparisons.failureRate.diff)}% vs last sprint
              </span>
            )}
          </div>
          {!hasChangeFailureRate && (
            <span className="text-[11px] text-text-subtle">
              Requires active deployment baseline
            </span>
          )}
        </div>
      </div>

      {/* 2. Detailed Delivery Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Sprint Burndown Schedule */}
        <div className="bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text">
              Sprint Burndown Schedule
            </span>
            {hasBurndown && (
              <div className="flex items-center gap-3 text-[11px] text-text-subtle shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-border-subtle inline-block border-t border-dashed" />
                  Ideal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-secondary rounded-full inline-block" />
                  Remaining
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1 bg-status-success rounded-full inline-block" />
                  Done
                </span>
              </div>
            )}
          </div>

          {hasBurndown ? (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={burndownData}>
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
            </div>
          ) : (
            <div className="py-6 px-4 bg-background-elevated/20 border border-border-subtle/50 rounded-lg text-center flex flex-col items-center justify-center gap-1 text-xs">
              <span className="font-medium text-text">
                No burndown data recorded for current sprint
              </span>
              <span className="text-[11px] text-text-subtle">
                Sprint burndown trend will populate as sprint tasks are completed.
              </span>
            </div>
          )}
        </div>

        {/* Sprint Point Velocity */}
        <div className="bg-card border border-border-subtle p-4 sm:p-5 rounded-xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-text">
              Sprint Point Velocity
            </span>
            {hasVelocity && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-subtle shrink-0">
                <span className="w-2.5 h-2 bg-status-success rounded-xs inline-block" />
                <span>Completed points</span>
              </div>
            )}
          </div>

          {hasVelocity ? (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={teamVelocity}>
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-6 px-4 bg-background-elevated/20 border border-border-subtle/50 rounded-lg text-center flex flex-col items-center justify-center gap-1 text-xs">
              <span className="font-medium text-text">
                No sprint velocity history available
              </span>
              <span className="text-[11px] text-text-subtle">
                Completed story points per sprint will be recorded upon sprint closure.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TLDeliveryTab);
