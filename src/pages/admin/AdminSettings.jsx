import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Shield,
  Lock,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import GithubService from '../../api/githubApi';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import ErrorBoundary from '../../components/atoms/ErrorBoundary';

// Modular Components & Modals
import RolesAccessTab from './AdminDashboard/components/RolesAccessTab';
import WorkspaceSettingsTab from './AdminDashboard/components/WorkspaceSettingsTab';
import SecurityComplianceTab from './AdminDashboard/components/SecurityComplianceTab';
import WorkspaceSettingsModal from '../../components/organisms/admin/WorkspaceSettingsModal';
import RolePermissionsModal from '../../components/organisms/admin/RolePermissionsModal';
import CreateRoleModal from '../../components/organisms/admin/CreateRoleModal';
import ConnectGithubModal from '../../components/organisms/admin/ConnectGithubModal';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data,
    isLoading,
    error,
    updateSettingsMutation,
    updateRolePermissionsMutation,
    createRoleMutation,
  } = useAdminDashboard();

  // Tab State: 'workspace' | 'roles' | 'security'
  const tabParam = searchParams.get('tab');
  const validTabs = ['workspace', 'roles', 'security'];
  const activeSubTab = validTabs.includes(tabParam) ? tabParam : 'workspace';

  const handleSubTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Modal States
  const [activeSetting, setActiveSetting] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [connectingIntegration, setConnectingIntegration] = useState(null);

  const connectMutation = useMutation({
    mutationFn: (token) => GithubService.connectGithub(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setConnectingIntegration(null);
      toast.success('GitHub connected successfully');
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to connect GitHub');
    },
  });

  const handleConnect = (tool) => {
    if (tool.name === 'GitHub') {
      setConnectingIntegration(tool);
    } else {
      toast.error(`${tool.name} integration is currently in pilot phase.`);
    }
  };

  if (isLoading) return <CenteredLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-8 text-center font-mono border border-status-error/20">
        <AlertCircle size={48} className="text-status-error mb-6" />
        <h2 className="text-2xl font-bold text-text mb-4">
          Connection Error
        </h2>
        <p className="text-text-subtle max-w-md text-xs mb-8 leading-relaxed">
          We couldn&apos;t load the workspace settings. Please check your connection or session.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <RefreshCcw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const {
    roles: rawRoles = [],
    availablePermissions: rawAvailablePermissions = [],
    integrations: rawIntegrations = [],
    settings: rawSettings = {},
  } = data || {};

  const roles = Array.isArray(rawRoles) ? rawRoles.filter(Boolean) : [];
  const availablePermissions = Array.isArray(rawAvailablePermissions)
    ? rawAvailablePermissions.filter(Boolean)
    : [];
  const integrations = Array.isArray(rawIntegrations)
    ? rawIntegrations.filter(Boolean)
    : [];
  const settings =
    rawSettings && typeof rawSettings === 'object' ? rawSettings : {};

  return (
    <div className="min-h-screen bg-background text-text p-3 lg:p-6 font-sans max-w-screen-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border-subtle pb-4">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
          Settings
        </h1>
        <p className="text-text-subtle text-sm font-normal">
          Manage workspace settings, role assignments, and security compliance.
        </p>
      </div>

      {/* Sub-Navigation: Workspace Settings, Roles & Access, Security & Compliance */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-border-subtle/50 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleSubTabChange('workspace')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-xs whitespace-nowrap ${
            activeSubTab === 'workspace'
              ? 'bg-background-elevated text-text border border-border-subtle font-semibold shadow-xs'
              : 'text-text-subtle hover:text-text hover:bg-background-elevated/50 border border-transparent'
          }`}
        >
          <SettingsIcon
            size={14}
            className={activeSubTab === 'workspace' ? 'text-primary' : 'text-text-subtler'}
          />
          <span>Workspace settings</span>
        </button>

        <button
          onClick={() => handleSubTabChange('roles')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-xs whitespace-nowrap ${
            activeSubTab === 'roles'
              ? 'bg-background-elevated text-text border border-border-subtle font-semibold shadow-xs'
              : 'text-text-subtle hover:text-text hover:bg-background-elevated/50 border border-transparent'
          }`}
        >
          <Shield
            size={14}
            className={activeSubTab === 'roles' ? 'text-primary' : 'text-text-subtler'}
          />
          <span>Roles & access</span>
        </button>

        <button
          onClick={() => handleSubTabChange('security')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-xs whitespace-nowrap ${
            activeSubTab === 'security'
              ? 'bg-background-elevated text-text border border-border-subtle font-semibold shadow-xs'
              : 'text-text-subtle hover:text-text hover:bg-background-elevated/50 border border-transparent'
          }`}
        >
          <Lock
            size={14}
            className={activeSubTab === 'security' ? 'text-status-warning' : 'text-text-subtler'}
          />
          <span>Security & compliance</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1">
        <ErrorBoundary>
          {activeSubTab === 'workspace' && (
            <WorkspaceSettingsTab
              settings={settings}
              integrations={integrations}
              setActiveSetting={setActiveSetting}
              handleConnect={handleConnect}
            />
          )}

          {activeSubTab === 'roles' && (
            <RolesAccessTab
              roles={roles}
              setEditingRole={setEditingRole}
              setIsCreateRoleModalOpen={setIsCreateRoleModalOpen}
              pendingApprovals={data?.pendingApprovals}
            />
          )}

          {activeSubTab === 'security' && (
            <SecurityComplianceTab
              securityOverview={data?.securityOverview}
              pendingApprovals={data?.pendingApprovals}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Modals and Overlay Actions */}
      <WorkspaceSettingsModal
        isOpen={!!activeSetting}
        onClose={() => setActiveSetting(null)}
        setting={activeSetting}
        currentValue={activeSetting ? settings[activeSetting.key] : ''}
        onSave={(newVal) => {
          updateSettingsMutation.mutate(
            { ...settings, [activeSetting.key]: newVal },
            {
              onSuccess: () => {
                toast.success('Workspace setting updated');
                setActiveSetting(null);
              },
              onError: (err) => {
                toast.error(err?.message || 'Failed to update setting');
              },
            }
          );
        }}
        isLoading={updateSettingsMutation.isLoading}
      />

      <RolePermissionsModal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        role={editingRole}
        availablePermissions={availablePermissions}
        onSave={(updatedPerms) => {
          updateRolePermissionsMutation.mutate(
            {
              roleId: editingRole.id || editingRole._id,
              permissions: updatedPerms,
            },
            {
              onSuccess: () => {
                toast.success('Role permissions updated');
                setEditingRole(null);
              },
              onError: (err) => {
                toast.error(err?.message || 'Failed to update permissions');
              },
            }
          );
        }}
        isLoading={updateRolePermissionsMutation.isLoading}
      />

      <CreateRoleModal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        availablePermissions={availablePermissions}
        onCreate={(roleData) => {
          createRoleMutation.mutate(roleData, {
            onSuccess: () => {
              toast.success('New role created successfully');
              setIsCreateRoleModalOpen(false);
            },
            onError: (err) => {
              toast.error(err?.message || 'Failed to create role');
            },
          });
        }}
        isLoading={createRoleMutation.isLoading}
      />

      <ConnectGithubModal
        isOpen={!!connectingIntegration}
        onClose={() => setConnectingIntegration(null)}
        onConnect={(token) => connectMutation.mutate(token)}
        isLoading={connectMutation.isLoading}
      />
    </div>
  );
};

export default AdminSettings;
