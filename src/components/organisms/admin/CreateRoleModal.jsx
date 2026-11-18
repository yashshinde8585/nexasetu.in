import React, { useState } from 'react';
import { X, Shield, CheckCircle } from 'lucide-react';

const CreateRoleModal = ({
  isOpen,
  onClose,
  availablePermissions,
  onCreate,
}) => {
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  if (!isOpen) return null;

  const togglePermission = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = async () => {
    if (!roleName.trim()) return alert('Role name is required');
    await onCreate({ roleName, permissions: selectedPermissions });
    setRoleName('');
    setSelectedPermissions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card border border-border-subtle rounded-md w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm text-primary">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Create new role</h2>
              <p className="text-xs text-text-subtle font-normal mt-0.5">
                Design a custom organizational role with specific access controls
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

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-subtle px-0.5">
              Role name
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Lead Research Engineer"
              className="w-full bg-background-elevated border border-border-subtle rounded-sm px-3.5 py-2.5 text-xs sm:text-sm text-text focus:outline-none focus:border-primary/50 transition-all placeholder:text-text-subtler"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-text-subtle px-0.5">
              Assign permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {availablePermissions.map((perm) => {
                const isActive = selectedPermissions.includes(perm);
                return (
                  <div
                    key={perm}
                    onClick={() => togglePermission(perm)}
                    className={`
                      p-3 rounded-sm border transition-all cursor-pointer group
                      ${
                        isActive
                          ? 'bg-primary/10 border-primary/50'
                          : 'bg-background-elevated/40 border-border-subtle/60 hover:border-border hover:bg-background-elevated'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs sm:text-sm font-semibold ${isActive ? 'text-primary' : 'text-text'}`}
                      >
                        {perm.replace(/_/g, ' ')}
                      </p>
                      <div
                        className={`
                        w-4 h-4 rounded-full border flex items-center justify-center
                        ${isActive ? 'bg-primary border-primary text-black' : 'border-border-subtle text-transparent'}
                      `}
                      >
                        <CheckCircle size={10} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-background-elevated/30 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-semibold text-text-subtle hover:text-text bg-background-elevated border border-border-subtle hover:bg-background-elevated/80 transition-colors cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 bg-primary text-black rounded-sm text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            Create role
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;
