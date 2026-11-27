import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Rocket,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';
import { formatTime } from '../../utils/formatTime';

/**
 * NotificationTray - Operational alerts panel providing real-time workspace updates.
 * Mobile-first, fully accessible, theme-consistent, and viewport-safe.
 */
const NotificationTray = () => {
  const [isOpen, setIsOpen] = useState(false);
  const trayRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications = [],
    loading = false,
    isError = false,
    refetch,
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
  } = useNotifications();

  // Handle closing when clicking or tapping outside the tray component
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (trayRef.current && !trayRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead && markAsRead) {
      await markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <User size={14} className="text-primary" />;
      case 'TASK_UPDATED':
        return <Rocket size={14} className="text-secondary" />;
      case 'COMMENT_ADDED':
        return <MessageSquare size={14} className="text-status-warning" />;
      default:
        return <AlertCircle size={14} className="text-text-subtle" />;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative h-full flex items-center" ref={trayRef}>
      {/* Trigger Button with Dynamic unread badge counts */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Operational alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && refresh) refresh();
        }}
        className="relative min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] p-2 rounded-lg text-text-subtle hover:text-text hover:bg-background-elevated transition-colors flex items-center justify-center cursor-pointer"
      >
        <Bell
          size={18}
          className={unreadCount > 0 ? 'animate-pulse text-primary' : ''}
          aria-hidden="true"
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-background-dark text-[10px] font-bold rounded-full flex items-center justify-center border border-background shadow-xs z-10 pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Expanded Notifications Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Operational alerts"
          className="fixed top-15 left-3 right-3 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:absolute sm:top-[calc(100%+8px)] sm:left-auto sm:right-0 sm:w-96 bg-card border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 z-50 flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[500px]"
        >
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-border-subtle flex items-center justify-between bg-background-elevated/40 gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-text truncate">
                Operational alerts
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCircle2 size={12} />
                  <span className="hidden xs:inline">Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-text-subtler hover:text-status-error transition-colors cursor-pointer"
                  title="Clear all alerts"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-text-subtle hover:text-text hover:bg-background-elevated rounded-md transition-colors cursor-pointer ml-1"
                aria-label="Close operational alerts"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Alert Content List / States */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 no-scrollbar">
            {loading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-primary" />
                <p className="text-xs text-text-subtle font-medium">Loading alerts...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <AlertCircle size={22} className="text-status-error" />
                <p className="text-xs font-semibold text-text">Unable to load alerts</p>
                <p className="text-[11px] text-text-subtle">
                  Could not retrieve recent workspace notifications.
                </p>
                <button
                  type="button"
                  onClick={() => (refetch ? refetch() : refresh && refresh())}
                  className="mt-2 px-3 py-1 bg-background-elevated border border-border-subtle hover:border-border rounded-md text-xs font-medium text-text transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 sm:p-3.5 flex gap-3 cursor-pointer transition-colors relative group hover:bg-background-elevated/60 ${
                    !notif.isRead ? 'bg-primary/5' : 'opacity-70'
                  }`}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" />
                  )}

                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      !notif.isRead
                        ? 'bg-primary/10 border border-primary/20 text-primary'
                        : 'bg-background-elevated border border-border-subtle text-text-subtler'
                    }`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !notif.isRead ? 'text-text' : 'text-text-subtle'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-text-subtler whitespace-nowrap shrink-0">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        !notif.isRead ? 'text-text-subtle' : 'text-text-subtler'
                      }`}
                    >
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 bg-background-elevated rounded-full flex items-center justify-center text-text-subtle border border-border-subtle mb-1">
                  <CheckCircle2 size={18} className="text-status-success" />
                </div>
                <p className="text-xs font-semibold text-text">No active alerts</p>
                <p className="text-[11px] text-text-subtle">
                  New workspace alerts will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 sm:p-2.5 bg-background-elevated/40 border-t border-border-subtle text-center shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-1.5 text-xs font-medium text-text-subtle hover:text-text hover:bg-background-elevated rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTray;
