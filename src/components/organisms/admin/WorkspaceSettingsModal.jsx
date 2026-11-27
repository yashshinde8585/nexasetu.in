import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Globe,
  Clock,
  Bell,
  Settings as SettingsIcon,
  Check,
} from 'lucide-react';

const WorkspaceSettingsModal = ({
  isOpen,
  onClose,
  onSave,
  setting,
  currentValue,
}) => {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    if (isOpen) {
      setValue(currentValue);
    }
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  const optionsMap = {
    timezone: [
      'UTC +5:30 (IST)',
      'UTC +0:00 (GMT)',
      'UTC -5:00 (EST)',
      'UTC +1:00 (CET)',
      'UTC +8:00 (SGT)',
    ],
    workingHours: [
      '09:00 - 18:00',
      '10:00 - 19:00',
      '08:00 - 17:00',
      'Flexible / No fixed hours',
      '24/7 Operational',
    ],
    notificationRules: [
      'Email Only',
      'Slack Only',
      'Email & Slack (All)',
      'Critical Alerts Only (Slack)',
      'Muted / No Notifications',
    ],
    projectDefaults: [
      'Sprint: 7 days',
      'Sprint: 14 days (Bi-weekly)',
      'Sprint: 30 days (Monthly)',
      'Kanban (Continuous)',
      'Custom Lifecycle',
    ],
  };

  const getIcon = () => {
    switch (setting?.key) {
      case 'timezone':
        return <Globe className="text-primary" size={24} />;
      case 'workingHours':
        return <Clock className="text-secondary" size={24} />;
      case 'notificationRules':
        return <Bell className="text-status-warning" size={24} />;
      default:
        return <SettingsIcon className="text-white/40" size={24} />;
    }
  };

  const options = optionsMap[setting?.key] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-card border border-border-subtle rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background-elevated border border-border-subtle rounded-sm">{getIcon()}</div>
            <div>
              <h2 className="text-base font-bold text-text">
                Update {setting?.label}
              </h2>
              <p className="text-[11px] text-text-subtler font-medium">
                Workspace configuration
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

        {/* Options List */}
        <div className="p-5 space-y-2">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => setValue(opt)}
              className={`flex items-center justify-between p-3 rounded-sm border cursor-pointer transition-all ${
                value === opt
                  ? 'bg-primary/10 border-primary text-text font-semibold'
                  : 'bg-background-elevated/40 border-border-subtle/60 text-text-subtle hover:bg-background-elevated hover:text-text'
              }`}
            >
              <span className="text-xs sm:text-sm font-medium">{opt}</span>
              {value === opt && <Check size={16} className="text-primary shrink-0" />}
            </div>
          ))}

          {options.length === 0 && (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-background-elevated border border-border-subtle rounded-sm py-2.5 px-3 text-xs sm:text-sm text-text focus:border-primary/50 transition-all outline-none"
              placeholder="Custom value..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-background-elevated/30 border-t border-border-subtle flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-semibold text-text-subtle hover:text-text bg-background-elevated border border-border-subtle rounded-sm hover:bg-background-elevated/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(value);
              onClose();
            }}
            className="flex-1 bg-primary text-black px-4 py-2 rounded-sm text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={15} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;
