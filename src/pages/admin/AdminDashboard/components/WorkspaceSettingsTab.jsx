import React from 'react';
import {
  Globe,
  Clock,
  Bell,
  Zap,
  GitBranch,
  MessageSquare,
  Link as LinkIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

const WorkspaceSettingsTab = ({
  settings = {},
  integrations = [],
  setActiveSetting,
  handleConnect,
}) => {
  const workspaceConfigItems = [
    {
      label: 'Timezone',
      key: 'timezone',
      value: settings?.timezone || 'UTC +5:30 (IST)',
      description: 'Default time standard for sprint schedules, milestones, and daily standups.',
      icon: <Globe size={18} className="text-primary" />,
    },
    {
      label: 'Working hours',
      key: 'workingHours',
      value: settings?.workingHours || '09:00 - 18:00',
      description: 'Standard team operational hours for notification routing and availability.',
      icon: <Clock size={18} className="text-secondary" />,
    },
    {
      label: 'Notification policies',
      key: 'notificationRules',
      value: settings?.notificationRules || 'Email & Slack (All)',
      description: 'Configure delivery channels for mentions, reviews, and critical alerts.',
      icon: <Bell size={18} className="text-status-warning" />,
    },
    {
      label: 'Sprint defaults',
      key: 'projectDefaults',
      value: settings?.projectDefaults || 'Sprint: 14 days (Bi-weekly)',
      description: 'Default cadence duration and planning cycle for newly created sprints.',
      icon: <Zap size={18} className="text-primary" />,
    },
  ];

  // Map known tools with fallback definitions
  const displayedIntegrations = [
    {
      name: 'GitHub',
      icon: 'github',
      description: 'Sync repositories, pull requests, and commit activity telemetry.',
      status: integrations.find((i) => i.name?.toLowerCase() === 'github')?.status || 'connected',
    },
    {
      name: 'Slack',
      icon: 'slack',
      description: 'Automate notifications, sprint digests, and delivery channel alerts.',
      status: integrations.find((i) => i.name?.toLowerCase() === 'slack')?.status || 'offline',
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. General Workspace Preferences */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm font-semibold text-text">General workspace settings</h2>
          <p className="text-xs text-text-subtle font-normal mt-0.5">
            Configure default scheduling, operational parameters, and alert policies across the workspace.
          </p>
        </div>

        <div className="divide-y divide-border-subtle/50">
          {workspaceConfigItems.map((item) => (
            <div
              key={item.key}
              className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-sm bg-background-elevated border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-text">
                    {item.label}
                  </h3>
                  <p className="text-xs text-text-subtle font-normal">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-xs font-medium px-2.5 py-1 bg-background-elevated border border-border-subtle rounded-xs text-text">
                  {item.value}
                </span>
                <button
                  onClick={() => setActiveSetting(item)}
                  className="px-3 py-1 text-xs font-semibold bg-background-elevated border border-border-subtle hover:bg-primary hover:text-black hover:border-primary text-text rounded-xs transition-colors cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Developer & Messaging Integrations */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-text">Integrations</h2>
            <p className="text-xs text-text-subtle font-normal mt-0.5">
              Connect external developer tools and messaging channels to enable unified workflow telemetry.
            </p>
          </div>
          <span className="text-xs text-text-subtler font-medium self-start sm:self-auto">
            {displayedIntegrations.filter((i) => i.status === 'connected').length} of {displayedIntegrations.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedIntegrations.map((tool) => {
            const isConnected = tool.status === 'connected';

            return (
              <div
                key={tool.name}
                className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-4 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-sm bg-background-elevated border border-border-subtle flex items-center justify-center shrink-0">
                      {tool.icon === 'github' ? (
                        <GitBranch size={20} className="text-text" />
                      ) : tool.icon === 'slack' ? (
                        <MessageSquare size={20} className="text-secondary" />
                      ) : (
                        <LinkIcon size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text">{tool.name}</h3>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-xs flex items-center gap-1.5 ${
                            isConnected
                              ? 'bg-status-success/10 text-status-success'
                              : 'bg-background-elevated text-text-subtler border border-border-subtle'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-status-success' : 'bg-text-subtler'
                            }`}
                          />
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <p className="text-xs text-text-subtle font-normal leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 text-xs">
                  <span className="text-text-subtler">
                    {isConnected ? 'Telemetry syncing' : 'Setup required'}
                  </span>
                  <button
                    onClick={() => handleConnect(tool)}
                    className={`px-3 py-1.5 font-semibold rounded-xs transition-all cursor-pointer ${
                      isConnected
                        ? 'bg-background-elevated border border-border-subtle text-text hover:bg-background-elevated/80'
                        : 'bg-primary text-black hover:bg-primary/90'
                    }`}
                  >
                    {isConnected ? 'Configure' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsTab;
