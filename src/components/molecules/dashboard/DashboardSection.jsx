import React from 'react';
import { Activity } from 'lucide-react';

// Dashboard panel layout section.
const DashboardSection = ({
  title,
  icon = <Activity size={14} />,
  children,
  className = '',
}) => {
  const sectionId = React.useId();
  return (
    <section
      aria-labelledby={`heading-${sectionId}`}
      className={`bg-card border border-border-subtle p-3.5 sm:p-5 rounded-xl relative group flex flex-col ${className}`}
    >
      <header className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-background-elevated border border-border-subtle rounded-md group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors text-text-subtle group-hover:text-primary">
          {icon}
        </div>
        <h3
          id={`heading-${sectionId}`}
          className="text-sm font-semibold text-text truncate"
        >
          {title}
        </h3>
      </header>

      <div className="relative z-10 flex-grow">{children}</div>
    </section>
  );
};

export default DashboardSection;
