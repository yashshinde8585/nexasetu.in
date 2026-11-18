import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  Sliders,
  UserCheck,
  UserX,
  Mail,
  ChevronRight,
  Lock,
} from 'lucide-react';

const RolesAccessTab = ({
  roles = [],
  setEditingRole,
  setIsCreateRoleModalOpen,
  pendingApprovals = {},
}) => {
  const navigate = useNavigate();

  const accessRequests = [
    {
      title: 'Pending access requests',
      count: pendingApprovals?.pendingActionRequests || 0,
      description: 'Role elevation or elevated permission requests awaiting administrator sign-off.',
      icon: <Lock size={16} className="text-primary" />,
      actionText: 'Review requests',
      onClick: () => {},
    },
    {
      title: 'Pending invitations',
      count: pendingApprovals?.pendingInvitations || 0,
      description: 'Collaborators invited with predefined access levels who have not yet accepted.',
      icon: <Mail size={16} className="text-status-warning" />,
      actionText: 'View invitations',
      onClick: () => navigate('/teams?status=invited'),
    },
    {
      title: 'Deactivated accounts',
      count: pendingApprovals?.deactivatedUsersCount || 0,
      description: 'Suspended user memberships with restricted workspace role access.',
      icon: <UserX size={16} className="text-text-subtler" />,
      actionText: 'Review in directory',
      onClick: () => navigate('/teams?status=deactivated'),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Organizational Roles Management */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-subtle gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">Role management & permissions</h2>
            </div>
            <p className="text-xs text-text-subtle font-normal mt-0.5">
              Define access boundaries, grant capabilities, and configure custom workspace roles.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs text-text-subtler font-medium">
              {roles.length} {roles.length === 1 ? 'role defined' : 'roles defined'}
            </span>
            <button
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black text-xs font-semibold rounded-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={13} />
              <span>+ Add role</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {roles.map((r, idx) => {
            const roleName = r.role || '';
            const permissions = Array.isArray(r.permissions) ? r.permissions : [];
            const stableKey = roleName || r.id || r._id || `role-${idx}`;
            const isFullAccess = permissions.includes('*');

            return (
              <div
                key={stableKey}
                className="group p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-3.5 hover:border-border transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                      {roleName.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-xs bg-background-elevated border border-border-subtle text-text-subtler shrink-0">
                      {r.isCustom ? 'Custom role' : 'System default'}
                    </span>
                  </div>

                  {/* Permissions Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {isFullAccess ? (
                      <span className="text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-xs">
                        Full Administrator Access (*)
                      </span>
                    ) : (
                      <>
                        {permissions.slice(0, 3).map((perm) => (
                          <span
                            key={perm}
                            className="text-[11px] font-medium bg-background-elevated text-text-subtle px-2 py-0.5 border border-border-subtle rounded-xs"
                          >
                            {perm.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        ))}
                        {permissions.length > 3 && (
                          <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 border border-primary/20 rounded-xs">
                            +{permissions.length - 3} more
                          </span>
                        )}
                        {permissions.length === 0 && (
                          <span className="text-[11px] text-text-subtler font-normal italic">
                            No granular permissions assigned
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle/50 pt-2.5 mt-1">
                  <span className="text-xs text-text-subtler">
                    {isFullAccess ? 'Unrestricted' : `${permissions.length} capabilities`}
                  </span>
                  <button
                    onClick={() => setEditingRole(r)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Configure</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Pending Access & Governance Requests */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm font-semibold text-text">Pending access & governance</h2>
          <p className="text-xs text-text-subtle font-normal mt-0.5">
            Monitor pending privilege upgrades, registration invitations, and suspended memberships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accessRequests.map((item) => (
            <div
              key={item.title}
              className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <h3 className="text-xs font-semibold text-text">{item.title}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    {item.count}
                  </span>
                </div>
                <p className="text-xs text-text-subtle font-normal leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-border-subtle/50 flex justify-end">
                <button
                  onClick={item.onClick}
                  disabled={item.count === 0}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer flex items-center gap-1"
                >
                  <span>{item.actionText}</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RolesAccessTab;
