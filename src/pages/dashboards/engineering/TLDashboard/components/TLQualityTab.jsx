import React from 'react';
import { Target, AlertTriangle, ShieldCheck, Wrench } from 'lucide-react';

const TLQualityTab = ({
  codeHealthOverview = { coverage: 0, eslint: 0, security: 0, debtDays: 0 },
  technicalDebt = [],
}) => {
  const hasCoverage =
    typeof codeHealthOverview?.coverage === 'number' &&
    codeHealthOverview.coverage > 0;

  const hasCodeHealthData =
    Boolean(codeHealthOverview?.coverage > 0) ||
    Boolean(codeHealthOverview?.eslint > 0) ||
    Boolean(codeHealthOverview?.security > 0) ||
    Boolean(codeHealthOverview?.debtDays > 0);

  const hasTechnicalDebt =
    Array.isArray(technicalDebt) && technicalDebt.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Quality Indicators: Compact Unified Metrics Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-subtle px-1 uppercase tracking-wider">
          Quality Indicators
        </h3>
        <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50">
          {/* Metric 1: Code Coverage */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Code Coverage
              </span>
              <Target size={15} className="text-text-subtle shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  hasCoverage && codeHealthOverview.coverage >= 80
                    ? 'text-status-success'
                    : 'text-text'
                }`}
              >
                {hasCoverage ? `${codeHealthOverview.coverage}%` : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasCoverage
                ? 'Automated unit & integration tests'
                : 'Requires test suite baseline'}
            </span>
          </div>

          {/* Metric 2: Lint Warning Count */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Lint Warning Count
              </span>
              <AlertTriangle
                size={15}
                className={
                  hasCodeHealthData && codeHealthOverview.eslint > 0
                    ? 'text-status-warning shrink-0'
                    : 'text-text-subtle shrink-0'
                }
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  hasCodeHealthData && codeHealthOverview.eslint > 0
                    ? 'text-status-warning'
                    : 'text-text'
                }`}
              >
                {hasCodeHealthData ? codeHealthOverview.eslint : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasCodeHealthData
                ? codeHealthOverview.eslint === 0
                  ? 'No lint violations detected'
                  : 'Static analysis warnings'
                : 'Requires linter telemetry'}
            </span>
          </div>

          {/* Metric 3: Security Issues */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Security Issues
              </span>
              <ShieldCheck
                size={15}
                className={
                  hasCodeHealthData && codeHealthOverview.security > 0
                    ? 'text-status-error shrink-0'
                    : 'text-text-subtle shrink-0'
                }
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  hasCodeHealthData && codeHealthOverview.security > 0
                    ? 'text-status-error'
                    : 'text-text'
                }`}
              >
                {hasCodeHealthData ? codeHealthOverview.security : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasCodeHealthData
                ? codeHealthOverview.security === 0
                  ? 'No vulnerability alerts'
                  : 'Requires security remediation'
                : 'Requires security scan baseline'}
            </span>
          </div>

          {/* Metric 4: Refactor Debt */}
          <div className="py-3 sm:py-0 px-2 sm:px-4 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-subtle truncate">
                Refactor Debt
              </span>
              <Wrench size={15} className="text-text-subtle shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  hasCodeHealthData && codeHealthOverview.debtDays > 5
                    ? 'text-status-warning'
                    : 'text-text'
                }`}
              >
                {hasCodeHealthData
                  ? `${codeHealthOverview.debtDays || 0} days`
                  : 'N/A'}
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              {hasCodeHealthData
                ? 'Estimated remediation effort'
                : 'Requires codebase analysis'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Structural Technical Debt: Clean List with Compact Empty State */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">
            Structural Technical Debt
          </h3>
          <span className="text-xs font-medium text-text-subtle">
            {hasTechnicalDebt
              ? `${technicalDebt.length} ${technicalDebt.length === 1 ? 'module' : 'modules'} identified`
              : '0 modules logged'}
          </span>
        </div>

        {hasTechnicalDebt ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalDebt.map((debt, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-background-elevated/40 border border-border-subtle rounded-lg hover:border-border transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors block truncate">
                    {debt.module}
                  </span>
                  <p className="text-[11px] text-text-subtle font-medium leading-relaxed">
                    {debt.reason}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide shrink-0 ${
                    debt.debtLevel?.toLowerCase() === 'high'
                      ? 'bg-status-error/10 text-status-error border border-status-error/20'
                      : debt.debtLevel?.toLowerCase() === 'medium'
                        ? 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                        : 'bg-background-elevated text-text-subtle border border-border-subtle'
                  }`}
                >
                  {debt.debtLevel} Priority
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 px-4 bg-background-elevated/20 border border-border-subtle/50 rounded-lg text-center flex flex-col items-center justify-center gap-1 text-xs">
            <span className="font-medium text-text">
              No structural technical debt logged
            </span>
            <span className="text-[11px] text-text-subtle">
              Architectural bottlenecks and refactoring obligations will be tracked here when identified during code reviews.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TLQualityTab);
