import React, { useState } from 'react';
import { X, GitBranch, Shield, Zap, Info, AlertCircle } from 'lucide-react';

const ConnectGithubModal = ({
  isOpen,
  onClose,
  onConnect,
  isLoading,
  error,
}) => {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setToken('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-card border border-border-subtle rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background-elevated border border-border-subtle rounded-sm">
              <GitBranch className="text-secondary" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Connect GitHub</h2>
              <p className="text-[11px] text-text-subtler font-medium">
                Workspace developer integration
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-background-elevated rounded-sm text-text-subtler hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-sm p-3 flex gap-2.5 text-status-error animate-in slide-in-from-top-2">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <p className="text-xs font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-sm p-3.5 flex gap-3">
            <Info className="text-primary shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-text-subtle leading-relaxed">
              Link your workspace to GitHub to enable repository synchronization and branch metrics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-subtle px-0.5">
                Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-background-elevated border border-border-subtle rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-text focus:border-primary/50 transition-all outline-none placeholder:text-text-subtler"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-subtle flex items-center gap-1.5 px-0.5">
                <Shield size={13} className="text-primary" /> Required scopes
              </h4>
              <ul className="grid grid-cols-2 gap-2">
                {['repo', 'admin:repo_hook', 'user', 'read:org'].map(
                  (scope) => (
                    <li
                      key={scope}
                      className="flex items-center gap-2 bg-background-elevated/50 border border-border-subtler px-2.5 py-1.5 rounded-xs text-xs text-text-subtle font-medium"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {scope}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-background-elevated/30 border-t border-border-subtle flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-xs font-semibold text-text-subtle hover:text-text bg-background-elevated border border-border-subtle rounded-sm hover:bg-background-elevated/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!token || isLoading}
            onClick={() => onConnect(token)}
            className="flex-1 bg-primary text-black px-4 py-2 rounded-sm text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <Zap className="animate-spin" size={14} />
            ) : (
              <Zap size={14} />
            )}
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectGithubModal;
