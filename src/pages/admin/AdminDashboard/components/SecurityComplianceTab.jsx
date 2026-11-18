import React from 'react';
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  Clock,
  AlertOctagon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react';

const SecurityComplianceTab = ({
  securityOverview = {},
  pendingApprovals = {},
}) => {
  const totalWorkspaces = securityOverview?.totalWorkspaces || 1;
  const ssoEnforcedWorkspaces = securityOverview?.ssoEnforcedWorkspaces || 0;
  const ssoPercent =
    totalWorkspaces > 0
      ? Math.round((ssoEnforcedWorkspaces / totalWorkspaces) * 100)
      : 0;

  const totalUsers = securityOverview?.totalUsers || 0;
  const mfaEnabledUsers = securityOverview?.mfaEnabledUsers || 0;
  const mfaPercent =
    totalUsers > 0
      ? Math.round((mfaEnabledUsers / totalUsers) * 100)
      : 0;

  const inactiveUsers = securityOverview?.inactiveUsers || 0;
  const suspiciousLogins = securityOverview?.suspiciousLogins || 0;
  const aiAuditLogs = pendingApprovals?.aiLogsCount || 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. SSO & MFA Enforcement */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">Single Sign-On (SSO) & Multi-Factor Authentication (MFA)</h2>
            </div>
            <p className="text-xs text-text-subtle font-normal mt-0.5">
              Enforce enterprise identity provider authentication and secondary credential verification.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-xs bg-status-success/10 text-status-success self-start sm:self-auto">
            Active enforcement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SSO Card */}
          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint size={16} className="text-primary" />
                  <span className="text-xs font-semibold text-text">SSO coverage</span>
                </div>
                <span className="text-xs font-bold text-text">{ssoPercent}%</span>
              </div>
              <p className="text-xs text-text-subtle font-normal leading-relaxed">
                Workspaces enforcing SAML 2.0 / OpenID Connect identity provider sign-in.
              </p>
              <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${ssoPercent}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border-subtle/50 text-xs text-text-subtler flex justify-between items-center">
              <span>Enforced workspaces</span>
              <span className="font-semibold text-text">
                {ssoEnforcedWorkspaces} of {totalWorkspaces}
              </span>
            </div>
          </div>

          {/* MFA Card */}
          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-secondary" />
                  <span className="text-xs font-semibold text-text">MFA compliance</span>
                </div>
                <span className="text-xs font-bold text-text">{mfaPercent}%</span>
              </div>
              <p className="text-xs text-text-subtle font-normal leading-relaxed">
                Active team members with verified hardware key or authenticator app enrollment.
              </p>
              <div className="w-full bg-background-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${mfaPercent}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border-subtle/50 text-xs text-text-subtler flex justify-between items-center">
              <span>Protected accounts</span>
              <span className="font-semibold text-text">
                {mfaEnabledUsers.toLocaleString()} of {totalUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Security Posture & Account Integrity */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm font-semibold text-text">Security posture & account hygiene</h2>
          <p className="text-xs text-text-subtle font-normal mt-0.5">
            Identify stale credentials, suspicious access attempts, and dormancy risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inactive Accounts */}
          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-status-warning" />
                <h3 className="text-xs font-semibold text-text">Inactive accounts (&gt; 90 days)</h3>
              </div>
              <p className="text-xs text-text-subtle font-normal leading-relaxed">
                Accounts with no authenticated session in the last 90 days.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-bold tracking-tight text-text">
                {inactiveUsers}
              </span>
              <div className="text-[11px] font-medium text-text-subtler mt-0.5">
                {inactiveUsers === 0 ? 'Optimal' : 'Review suggested'}
              </div>
            </div>
          </div>

          {/* Suspicious Logins */}
          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className={suspiciousLogins > 0 ? 'text-status-error' : 'text-status-success'} />
                <h3 className="text-xs font-semibold text-text">Suspicious logins (last 30d)</h3>
              </div>
              <p className="text-xs text-text-subtle font-normal leading-relaxed">
                Flagged anomalous IP locations, brute-force patterns, or revoked session tokens.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xl font-bold tracking-tight ${
                  suspiciousLogins > 0 ? 'text-status-error' : 'text-text'
                }`}
              >
                {suspiciousLogins}
              </span>
              <div className="text-[11px] font-medium text-text-subtler mt-0.5">
                {suspiciousLogins === 0 ? 'None detected' : 'Requires audit'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Audit Logging & Compliance Information */}
      <div className="bg-card border border-border-subtle rounded-sm p-5 space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm font-semibold text-text">Relevant audit & compliance information</h2>
          <p className="text-xs text-text-subtle font-normal mt-0.5">
            Immutable audit records tracking administrative, compute, and security operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-xs font-semibold text-text">AI & compute governance logs</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {aiAuditLogs} recorded
              </span>
            </div>
            <p className="text-xs text-text-subtle font-normal leading-relaxed">
              Records tool executions, model queries, prompt interactions, and quota consumption across workspace tasks.
            </p>
          </div>

          <div className="p-4 bg-background-elevated/40 border border-border-subtle rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-status-success" />
                <h3 className="text-xs font-semibold text-text">Security event telemetry</h3>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-xs bg-status-success/10 text-status-success">
                Continuous
              </span>
            </div>
            <p className="text-xs text-text-subtle font-normal leading-relaxed">
              Audit trails capture authentication attempts, privilege escalation, role modifications, and API tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityComplianceTab;
