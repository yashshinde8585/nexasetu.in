import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Save,
  UserMinus,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

const UserEditModal = ({ isOpen, onClose, user, onSave, onDeactivate }) => {
  const [role, setRole] = useState(user?.role);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const roles = [
    'SUPER_ADMIN',
    'WORKSPACE_ADMIN',
    'WORKSPACE_MANAGER',
    'VP_ENGINEERING',
    'ENGINEERING_MANAGER',
    'TECH_LEAD',
    'SENIOR_ENGINEER',
    'SOFTWARE_ENGINEER',
    'JUNIOR_ENGINEER',
    'QA_LEAD',
    'HR',
    'INTERN',
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-card border border-border-subtle rounded-sm shadow-2xl overflow-hidden animate-zoom-in">
        {/* Confirmation Overlay for Status Toggle */}
        {showConfirm && (
          <div className="absolute inset-0 z-[110] bg-card/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center text-status-error mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-text mb-2">
              Update account status
            </h3>
            <p className="text-text-subtle text-xs mb-6 max-w-sm">
              Are you sure you want to{' '}
              {user.status === 'Active' ? 'deactivate' : 'reactivate'}{' '}
              <strong className="text-text font-semibold">{user.name}</strong>?
              {user.status === 'Active' &&
                ' This will suspend their workspace access immediately.'}
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xs bg-background-elevated border border-border-subtle text-xs font-semibold text-text hover:bg-background-elevated/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeactivate({
                    userId: user.id || user._id,
                    status: user.status === 'Active' ? 'Deactivated' : 'Active',
                  });
                  setShowConfirm(false);
                  onClose();
                }}
                className={`flex-1 px-4 py-2 rounded-xs text-xs font-semibold transition-all cursor-pointer ${
                  user.status === 'Active'
                    ? 'bg-status-error text-white hover:bg-status-error/90'
                    : 'bg-status-success text-black hover:bg-status-success/90'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xs bg-background-elevated border border-border-subtle flex items-center justify-center text-text font-bold text-xs uppercase shrink-0">
              {user.name?.slice(0, 2).toUpperCase() || <User size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-text tracking-tight">
                {user.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-subtle">
                <span className="font-mono text-[11px] text-text-subtler">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-subtler hover:text-text rounded-xs hover:bg-background-elevated transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-text">
          {/* Role Change */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-subtle flex items-center gap-1.5">
              <Shield size={13} className="text-primary" />
              <span>Workspace role</span>
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-background-elevated border border-border-subtle rounded-xs py-2.5 px-3 text-xs sm:text-sm text-text focus:border-primary/50 outline-none transition-all cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-background-elevated py-1.5">
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-text-subtler font-normal">
              Role changes and capability policies apply immediately upon saving.
            </p>
          </div>

          {/* Account Status / Lifecycle Management */}
          <div className="pt-3 border-t border-border-subtle/50 space-y-2">
            <span className="text-xs font-semibold text-text-subtle block">
              Account status
            </span>
            <div className="p-3.5 bg-background-elevated/40 border border-border-subtle rounded-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {user.status === 'Active' ? (
                  <UserMinus size={16} className="text-status-error shrink-0" />
                ) : (
                  <UserPlus size={16} className="text-status-success shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-text">
                    {user.status === 'Active'
                      ? 'Deactivate account'
                      : 'Reactivate account'}
                  </p>
                  <p className="text-[11px] text-text-subtler font-normal">
                    {user.status === 'Active'
                      ? 'Suspend user access to all projects and repositories.'
                      : 'Restore workspace sign-in and contributor permissions.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className={`px-3 py-1.5 rounded-xs text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                  user.status === 'Active'
                    ? 'border-status-error/30 text-status-error hover:bg-status-error/10'
                    : 'border-status-success/30 text-status-success hover:bg-status-success/10'
                }`}
              >
                {user.status === 'Active' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-background-elevated/20 border-t border-border-subtle flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-subtle hover:text-text rounded-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ userId: user.id || user._id, role });
              onClose();
            }}
            className="px-4 py-2 bg-primary text-black font-semibold text-xs rounded-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Save size={13} />
            <span>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
