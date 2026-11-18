import React from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const ItemBreakdownHeader = ({ metrics = {}, statsLoading = false }) => {
  const items = [
    {
      label: 'Open',
      count: metrics?.open ?? 0,
      icon: <AlertCircle size={14} />,
      color: 'text-status-error',
      bg: 'bg-status-error/10 border-status-error/20',
    },
    {
      label: 'In Progress',
      count: metrics?.active ?? 0,
      icon: <Activity size={14} />,
      color: 'text-status-warning',
      bg: 'bg-status-warning/10 border-status-warning/20',
    },
    {
      label: 'In Review',
      count: metrics?.review ?? 0,
      icon: <Clock size={14} />,
      color: 'text-secondary',
      bg: 'bg-secondary/10 border-secondary/20',
    },
    {
      label: 'Completed',
      count: metrics?.completed ?? 0,
      icon: <CheckCircle2 size={14} />,
      color: 'text-status-success',
      bg: 'bg-status-success/10 border-status-success/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-background-elevated border border-border-subtle rounded-md p-3.5 flex flex-col justify-between hover:border-border transition-all cursor-default"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-subtle">
              {item.label}
            </span>
            <div className={`p-1 rounded-xs border ${item.bg} ${item.color}`}>
              {item.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold ${item.color} ${statsLoading ? 'animate-pulse' : ''}`}
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

export default ItemBreakdownHeader;
