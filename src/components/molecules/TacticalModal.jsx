import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

const TacticalModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRM',
  type = 'warning',
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border-subtle rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-text">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-background-elevated/40">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className={
                type === 'danger' ? 'text-status-error' : 'text-status-warning'
              }
              size={18}
            />
            <h3 className="text-sm font-semibold text-text">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-text transition-colors p-1 rounded cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs sm:text-sm text-text-subtle font-normal leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-background-elevated/30 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="flex-1 h-9 text-xs font-semibold text-text bg-background-elevated hover:bg-card border border-border-subtle rounded-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 h-9 text-xs font-semibold rounded-sm transition-all active:scale-95 cursor-pointer ${
              type === 'danger'
                ? 'bg-status-error hover:bg-status-error/90 text-white'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TacticalModal;
