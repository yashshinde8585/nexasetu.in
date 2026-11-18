import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Users,
  Settings as SettingsIcon,
  Trash2,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SquadDirectiveTab = ({ teams = [], deleteTeamMutation }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border-subtle rounded-sm p-4 sm:p-5 flex flex-col gap-4 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-secondary" />
            <h2 className="text-sm font-semibold text-text">
              Workspace squads & teams
            </h2>
          </div>
          <p className="text-xs text-text-subtle font-normal">
            Organize contributors into functional units, project squads, and teams.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-text-subtler font-medium">
            Total teams: {teams.length}
          </span>
          <button
            onClick={() => navigate('/admin/teams/create')}
            className="h-9 px-3.5 bg-primary text-black font-semibold text-xs rounded-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={13} />
            <span>Add team</span>
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teams.map((t, idx) => {
            const teamId = t.id || t._id || t.name || `team-${idx}`;
            const teamName = t.name || 'Unnamed Team';
            const membersCount = t.members || 0;

            return (
              <div
                key={teamId}
                className="group p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-3 hover:border-border transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                      {teamName}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs bg-background-elevated border border-border-subtle text-text-subtler shrink-0 flex items-center gap-1">
                      <Users size={11} className="text-primary" />
                      <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                    </span>
                  </div>

                  {t.lead && (
                    <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                      <UserCheck size={12} className="text-secondary shrink-0" />
                      <span>Lead: <strong className="font-medium text-text">{t.lead}</strong></span>
                    </div>
                  )}

                  {t.description && (
                    <p className="text-xs text-text-subtler font-normal line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border-subtle/50">
                  <button
                    onClick={() => navigate(`/admin/teams/edit/${teamId}`)}
                    title="Configure squad details"
                    className="p-1.5 text-text-subtle hover:text-text rounded hover:bg-background-elevated transition-colors cursor-pointer"
                  >
                    <SettingsIcon size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete team ${teamName}?`
                        )
                      ) {
                        deleteTeamMutation.mutate(teamId, {
                          onSuccess: () => {
                            toast.success('Team successfully deleted');
                          },
                          onError: (err) => {
                            toast.error(
                              err?.message || 'Failed to delete team'
                            );
                          },
                        });
                      }
                    }}
                    title="Delete team"
                    className="p-1.5 text-text-subtle hover:text-status-error rounded hover:bg-background-elevated transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center border border-dashed border-border-subtle rounded-sm">
          <span className="text-sm font-medium text-text-subtler">
            No teams registered yet.
          </span>
        </div>
      )}
    </div>
  );
};

export default SquadDirectiveTab;
