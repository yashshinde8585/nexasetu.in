import React from 'react';

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background p-4 lg:p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto animate-pulse">
    {/* Header row */}
    <div className="flex items-center justify-between gap-4">
      <div className="h-6 w-48 bg-background-elevated rounded border border-border-subtle" />
      <div className="flex gap-2">
        <div className="h-8 w-32 bg-background-elevated rounded border border-border-subtle" />
        <div className="h-8 w-24 bg-background-elevated rounded border border-border-subtle" />
        <div className="h-8 w-56 bg-background-elevated rounded border border-border-subtle" />
      </div>
    </div>

    {/* Metrics strip — 5 cards */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-24 bg-card border border-border-subtle rounded-sm"
        />
      ))}
    </div>

    {/* Tab bar */}
    <div className="flex gap-1 border-b border-border-subtle pb-0">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 w-20 bg-background-elevated rounded-t border-t border-x border-border-subtle" />
      ))}
    </div>

    {/* Tab panel — 3-column card grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
      <div className="lg:col-span-5 min-h-[420px] bg-card border border-border-subtle rounded-md" />
      <div className="lg:col-span-4 min-h-[420px] bg-card border border-border-subtle rounded-md" />
      <div className="lg:col-span-3 min-h-[420px] bg-card border border-border-subtle rounded-md" />
    </div>
  </div>
);

export default DashboardSkeleton;
