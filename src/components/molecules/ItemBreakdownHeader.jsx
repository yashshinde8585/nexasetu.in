import React from 'react';
import PropTypes from 'prop-types';
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const ItemBreakdownHeader = ({ metrics = {}, statsLoading = false }) => {
  const items = [
    {
      label: 'To Do',
      altLabel: 'Open',
      count: metrics?.open ?? 0,
      icon: <AlertCircle size={14} />,
      color: 'text-text-subtle',
      accentColor: 'text-text',
      bg: 'bg-background-elevated border-border-subtle',
      description: 'Tasks ready to be started',
    },
    {
      label: 'In Progress',
      altLabel: 'Active',
      count: metrics?.active ?? 0,
      icon: <Activity size={14} />,
      color: 'text-status-warning',
      accentColor: 'text-status-warning',
      bg: 'bg-status-warning/10 border-status-warning/20',
      description: 'Tasks currently in development',
    },
    {
      label: 'In Review',
      altLabel: 'Review',
      count: metrics?.review ?? 0,
      icon: <Clock size={14} />,
      color: 'text-secondary',
      accentColor: 'text-secondary',
      bg: 'bg-secondary/10 border-secondary/20',
      description: 'Tasks awaiting code review or QA',
    },
    {
      label: 'Done',
      altLabel: 'Completed',
      count: metrics?.completed ?? 0,
      icon: <CheckCircle2 size={14} />,
      color: 'text-status-success',
      accentColor: 'text-status-success',
      bg: 'bg-status-success/10 border-status-success/20',
      description: 'Tasks verified and delivered',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-background-elevated border border-border-subtle rounded-md p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-border transition-colors cursor-default min-w-0"
          title={item.description}
        >
          <div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-1">
            <span className="text-xs font-semibold text-text-subtle truncate">
              {item.label}
              <span className="text-text-subtler text-[11px] font-normal ml-1 hidden sm:inline">
                ({item.altLabel})
              </span>
            </span>
            <div className={`p-1 rounded-md border shrink-0 ${item.bg} ${item.color}`}>
              {item.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg sm:text-xl font-bold ${item.accentColor} ${statsLoading ? 'animate-pulse' : ''}`}
            >
              {typeof item.count === 'number' ? item.count : 'N/A'}
            </span>
            <span className="text-[11px] font-medium text-text-subtler">
              tasks
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

ItemBreakdownHeader.propTypes = {
  metrics: PropTypes.shape({
    open: PropTypes.number,
    active: PropTypes.number,
    review: PropTypes.number,
    completed: PropTypes.number,
    total: PropTypes.number,
  }),
  statsLoading: PropTypes.bool,
};

export default ItemBreakdownHeader;
