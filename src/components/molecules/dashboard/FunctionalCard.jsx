import React from 'react';

// Functional card component for executive team monitoring
const FunctionalCard = ({ title, metrics = [], id, onClick }) => (
  <div
    id={id}
    onClick={onClick}
    className="bg-card border border-border-subtle p-3.5 sm:p-5 rounded-xl hover:border-border transition-colors group cursor-pointer flex flex-col gap-2.5 sm:gap-3 shadow-xs"
  >
    <header className="flex justify-between items-center">
      <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
        {title}
      </h3>
    </header>

    <div className="grid grid-cols-2 gap-3 pt-1">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`flex flex-col gap-0.5 ${i % 2 !== 0 ? 'border-l border-border-subtle/50 pl-3' : 'pr-2'}`}
        >
          <span className="text-xs font-medium text-text-subtle truncate">
            {m.label}
          </span>
          <span
            className={`text-base sm:text-lg font-bold tracking-tight ${m.color || 'text-text'}`}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default FunctionalCard;
