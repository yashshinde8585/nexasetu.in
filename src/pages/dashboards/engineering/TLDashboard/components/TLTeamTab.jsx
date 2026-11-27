import React from 'react';
import PropTypes from 'prop-types';
import { Users, Layers } from 'lucide-react';

/**
 * Helper to determine workload status display, distinguishing 0% unassigned from verified capacity.
 */
const getWorkloadState = (load, rawStatus) => {
  const numericLoad = typeof load === 'number' ? load : Number(load) || 0;

  // Distinguish 0% assigned workload from confirmed availability
  if (numericLoad === 0) {
    return {
      label: '0% Assigned',
      badgeClass: 'text-text-subtle bg-background-elevated/70 border-border-subtle',
      barClass: 'bg-border-subtle/60',
      textClass: 'text-text-subtle',
      isUnassigned: true,
    };
  }

  if (numericLoad > 85 || rawStatus === 'Overallocated') {
    return {
      label: 'Overloaded',
      badgeClass: 'text-status-error bg-status-error/10 border-status-error/20',
      barClass: 'bg-status-error',
      textClass: 'text-status-error',
    };
  }

  if (numericLoad >= 60 || rawStatus === 'Committed') {
    return {
      label: 'Approaching capacity',
      badgeClass: 'text-status-warning bg-status-warning/10 border-status-warning/20',
      barClass: 'bg-status-warning',
      textClass: 'text-status-warning',
    };
  }

  return {
    label: 'Balanced',
    badgeClass: 'text-status-success bg-status-success/10 border-status-success/20',
    barClass: 'bg-status-success',
    textClass: 'text-status-success',
  };
};

const TLTeamTab = ({ teamWorkload = [], serviceMap = [] }) => {
  const hasWorkload = Array.isArray(teamWorkload) && teamWorkload.length > 0;
  const hasStructure = Array.isArray(serviceMap) && serviceMap.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Section 1: Team Workload */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle/50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text">Team Workload</h2>
          </div>
          {hasWorkload && (
            <span className="text-xs text-text-subtle font-medium">
              {teamWorkload.length} {teamWorkload.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>

        {hasWorkload ? (
          <div className="flex flex-col divide-y divide-border-subtle/40">
            {teamWorkload.map((user, idx) => {
              const state = getWorkloadState(user.load, user.status);
              const initial = (user.member?.[0] || 'U').toUpperCase();
              const displayLoad = Math.min(100, Math.max(0, user.load || 0));

              return (
                <div key={user.member || idx} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {initial}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-text truncate">
                          {user.member}
                        </span>
                        <span className="text-[11px] text-text-subtle">
                          {state.isUnassigned ? 'No active tasks' : `${displayLoad}% allocated`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${state.badgeClass}`}>
                        {state.label}
                      </span>
                      <span className={`text-xs font-semibold tabular-nums ${state.textClass}`}>
                        {displayLoad}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-background-elevated h-1.5 rounded-full overflow-hidden border border-border-subtle/40">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${state.barClass}`}
                      style={{ width: `${displayLoad}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5 text-text-subtle flex-1">
            <Users size={24} className="text-text-subtle/40 mb-1" />
            <p className="text-xs font-medium text-text">No team workload data available</p>
            <p className="text-[11px] text-text-subtle max-w-xs">
              Sprint assignments and capacity allocations will populate here once tasks are assigned.
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Team Structure */}
      <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle/50">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-secondary" />
            <h2 className="text-sm font-semibold text-text">Team Structure</h2>
          </div>
          {hasStructure && (
            <span className="text-xs text-text-subtle font-medium">
              {serviceMap.length} {serviceMap.length === 1 ? 'module' : 'modules'}
            </span>
          )}
        </div>

        {hasStructure ? (
          <div className="flex flex-col divide-y divide-border-subtle/40">
            {serviceMap.map((s, idx) => {
              const ownerName = s.owner || 'Unassigned';
              const initial = (ownerName[0] || 'M').toUpperCase();
              const depCount = Array.isArray(s.dependencies) ? s.dependencies.length : 0;

              return (
                <div
                  key={s.id || idx}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {initial}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-text truncate">
                        {s.name || `Module ${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-text-subtle flex items-center gap-1.5 truncate">
                        <span>Owner:</span>
                        <span className="text-text font-medium">{ownerName}</span>
                      </span>
                    </div>
                  </div>

                  {depCount > 0 && (
                    <span className="text-[11px] text-text-subtle bg-background-elevated px-2 py-0.5 rounded border border-border-subtle/60 shrink-0">
                      {depCount} {depCount === 1 ? 'dependency' : 'dependencies'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5 text-text-subtle flex-1">
            <Layers size={24} className="text-text-subtle/40 mb-1" />
            <p className="text-xs font-medium text-text">No team structure recorded</p>
            <p className="text-[11px] text-text-subtle max-w-xs">
              Module ownership and team hierarchy relationships will populate as services are configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

TLTeamTab.propTypes = {
  teamWorkload: PropTypes.arrayOf(
    PropTypes.shape({
      member: PropTypes.string,
      load: PropTypes.number,
      status: PropTypes.string,
    })
  ),
  serviceMap: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      owner: PropTypes.string,
      dependencies: PropTypes.array,
    })
  ),
};

export default TLTeamTab;
