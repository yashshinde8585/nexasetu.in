import React from 'react';
import PropTypes from 'prop-types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

const VelocityIndicator = ({ data = [], statsLoading = false }) => {
  const hasHistory = Array.isArray(data) && data.length > 0;
  const chartData = hasHistory ? data.map((val, i) => ({ value: val, index: i })) : [];
  const latestValue = hasHistory ? data[data.length - 1] : null;

  // Calculate actual trend from the last two data points if available
  const trendInfo = React.useMemo(() => {
    if (!hasHistory || data.length < 2) return null;
    const prev = data[data.length - 2];
    const curr = data[data.length - 1];
    if (typeof prev !== 'number' || typeof curr !== 'number') return null;
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) {
      return { diff: 100, isPositive: true };
    }
    const diff = Math.round(((curr - prev) / prev) * 100);
    return {
      diff: Math.abs(diff),
      isPositive: diff >= 0,
    };
  }, [data, hasHistory]);

  return (
    <div className="bg-background-elevated border border-border-subtle rounded-md p-3 sm:p-4 flex flex-col justify-between h-full relative overflow-hidden group min-w-0">
      <div className="flex justify-between items-start mb-2 sm:mb-3 relative z-10">
        <div>
          <div className="text-xs font-semibold text-text-subtle mb-1">
            Workflow velocity
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`text-xl sm:text-2xl font-bold text-text ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {latestValue !== null ? latestValue : 'N/A'}{' '}
              <span className="text-xs font-normal text-text-subtle lowercase">
                tasks/day
              </span>
            </div>
            {trendInfo && (
              <div
                className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${
                  trendInfo.isPositive
                    ? 'text-status-success bg-status-success/10 border-status-success/20'
                    : 'text-status-error bg-status-error/10 border-status-error/20'
                }`}
                title="Trend compared to previous day"
              >
                {trendInfo.isPositive ? (
                  <TrendingUp size={11} />
                ) : (
                  <TrendingDown size={11} />
                )}
                <span>
                  {trendInfo.isPositive ? '+' : '-'}
                  {trendInfo.diff}%
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-text-subtler mt-0.5">
            Average tasks completed per day over the last 7 days
          </p>
        </div>
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-md border border-primary/20 text-primary shrink-0">
          <Zap size={14} />
        </div>
      </div>

      {hasHistory && data.length > 0 ? (
        <div className="h-12 sm:h-14 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4 mt-2 opacity-75 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={40}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #3B82F6)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary, #3B82F6)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary, #3B82F6)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#velocityGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="pt-2 border-t border-border-subtle/50 text-[11px] text-text-subtler">
          No historical velocity data yet
        </div>
      )}
    </div>
  );
};

VelocityIndicator.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  statsLoading: PropTypes.bool,
};

export default VelocityIndicator;
