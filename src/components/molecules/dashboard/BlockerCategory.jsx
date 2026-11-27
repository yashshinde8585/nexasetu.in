import React from 'react';

// Blocker category list component
const BlockerCategory = ({ label, items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-text-subtle">
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-xs font-medium flex items-start gap-2 bg-status-error/10 border border-status-error/20 p-2.5 rounded-lg hover:border-status-error/40 transition-colors text-text"
          >
            <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-status-error" />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlockerCategory;
