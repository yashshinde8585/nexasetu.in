import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle } from 'lucide-react';

const RolePermissionsModal = ({
  isOpen,
  onClose,
  role,
  availablePermissions,
  onSave,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions || []);
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const togglePermission = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    await onSave(role.role, selectedPermissions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card border border-border-subtle rounded-md w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm text-primary">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">
                Manage access: {role.role}
              </h2>
              <p className="text-xs text-text-subtle font-normal mt-0.5">
                Define permissions for this organizational role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-background-elevated rounded-sm text-text-subtler hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availablePermissions.map((perm) => {
              const isActive = selectedPermissions.includes(perm);
              const isSuper = role.role === 'WORKSPACE_ADMIN' && perm === '*';

              return (
                <div
                  key={perm}
                  onClick={() => !isSuper && togglePermission(perm)}
                  className={`
                    p-3.5 rounded-sm border transition-all cursor-pointer group
                    ${
                      isActive
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-background-elevated/40 border-border-subtle/60 hover:border-border hover:bg-background-elevated'
                    }
                    ${isSuper ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs sm:text-sm font-semibold mb-0.5 ${isActive ? 'text-primary' : 'text-text'}`}
                      >
                        {perm.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-text-subtler uppercase tracking-wider font-mono">
                        {perm}
                      </p>
                    </div>
                    <div
                      className={`
                      w-5 h-5 rounded-full border flex items-center justify-center transition-all
                      ${
                        isActive
                          ? 'bg-primary border-primary text-black'
                          : 'border-border-subtle text-transparent'
                      }
                    `}
                    >
                      <CheckCircle size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 bg-background-elevated/30 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-subtle">
            <span className="text-primary font-bold">
              {selectedPermissions.length}
            </span>{' '}
            permissions assigned
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-xs font-semibold text-text-subtle hover:text-text bg-background-elevated border border-border-subtle hover:bg-background-elevated/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-primary text-black rounded-sm text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
            >
              Save permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsModal;
