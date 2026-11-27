import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  User,
  Contrast,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ProfileDropdown - Account & appearance controls.
 * Desktop: Standard floating dropdown menu anchored to avatar.
 * Mobile: Viewport-constrained right-side slide-in drawer matching Sidebar design.
 */
const ProfileDropdown = ({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}) => {
  const { user, logout } = useAuth();
  const { theme, accent, saveTheme } = useTheme();
  const navigate = useNavigate();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'theme'
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const toggleDropdown = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const closeDropdown = () => {
    setActiveTab('main');
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    triggerRef.current?.focus();
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('main');
      return;
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
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

  if (!user) return null;

  const handleLogout = async () => {
    closeDropdown();
    await logout();
    navigate('/login');
  };

  const displayName =
    user.name || user.fullName || user.firstName || user.username || 'User';
  const displayEmail =
    user.email ||
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    '';
  const displayAvatar = user.profilePicture || user.imageUrl;
  const displayTitle =
    user.jobTitle ||
    (user.role && user.role.replace('_', ' ')) ||
    (user.publicMetadata?.role &&
      String(user.publicMetadata.role).replace('_', ' ')) ||
    'Team Member';

  const THEMES = [
    {
      id: 'obsidian',
      name: 'Dark Mode (Obsidian)',
      short: 'Obsidian',
      colors: ['#0B0D10', '#12161C', '#3B82F6'],
    },
    {
      id: 'amber',
      name: 'Amber Mode (Warm Dark)',
      short: 'Amber',
      colors: ['#121212', '#1A1A1A', '#F59E0B'],
    },
    {
      id: 'ghost',
      name: 'Light Mode (Ghost)',
      short: 'Ghost',
      colors: ['#F8FAFC', '#FFFFFF', '#2563EB'],
    },
  ];

  const ACCENTS = [
    { id: 'blue', name: 'Azure Blue', hex: '#3B82F6' },
    { id: 'emerald', name: 'Emerald Green', hex: '#10B981' },
    { id: 'amber', name: 'Golden Amber', hex: '#F59E0B' },
    { id: 'purple', name: 'Royal Purple', hex: '#A855F7' },
    { id: 'rose', name: 'Rose Pink', hex: '#F43F5E' },
  ];

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        aria-label="User profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-lg border border-border-subtle hover:border-border hover:bg-background-elevated transition-colors outline-none cursor-pointer group min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 justify-center"
      >
        <div className="w-8 h-8 rounded-md bg-background-elevated border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            <span className="text-text font-bold text-xs uppercase">
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight pr-1">
          <span className="text-xs sm:text-[13px] font-semibold text-text tracking-wide truncate max-w-[120px]">
            {displayName}
          </span>
          <span className="text-[10px] text-primary font-medium tracking-wide truncate max-w-[120px]">
            {displayTitle}
          </span>
        </div>
      </button>

      {/* 1. Desktop Dropdown Menu (md+ only) */}
      {isOpen && (
        <div
          className="hidden md:block absolute right-0 mt-2 w-64 bg-card border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200"
          role="menu"
          aria-label="Profile options"
        >
          {/* Header */}
          <div className="p-3.5 bg-background-elevated/40 border-b border-border-subtle flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-card border border-border-subtle flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <span className="text-text text-base font-bold uppercase">
                  {displayName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <h3 className="text-xs font-semibold text-text truncate">
                {displayName}
              </h3>
              <p className="text-[11px] text-text-subtle truncate">
                {displayEmail}
              </p>
              <span className="text-[10px] text-primary font-medium truncate mt-0.5">
                {displayTitle}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                closeDropdown();
                navigate('/profile');
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text-subtle hover:text-text hover:bg-background-elevated transition-colors group cursor-pointer text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <User size={15} className="text-text-subtler group-hover:text-primary transition-colors" />
                <span>Profile</span>
              </div>
              <ChevronRight size={13} className="text-text-subtler group-hover:text-text transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => {
                closeDropdown();
                navigate('/theme');
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-text-subtle hover:text-text hover:bg-background-elevated transition-colors group cursor-pointer text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Contrast size={15} className="text-text-subtler group-hover:text-primary transition-colors" />
                <span>Theme</span>
              </div>
              <ChevronRight size={13} className="text-text-subtler group-hover:text-text transition-colors" />
            </button>
          </div>

          <div className="h-[1px] bg-border-subtle/60 mx-2 my-1" />

          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-status-error hover:bg-status-error/10 transition-colors group cursor-pointer text-xs font-medium"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Mobile Profile Drawer (<md only) */}
      {isOpen && (
        <div className="md:hidden">
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeDropdown}
          />

          {/* Slide-in Aside Drawer from the right */}
          <aside
            role="dialog"
            aria-label="Profile and account settings"
            className="fixed inset-y-0 right-0 z-50 w-72 max-w-[calc(100vw-3rem)] sm:w-80 bg-background-dark border-l border-border-subtle flex flex-col shadow-3xl transition-all duration-300 transform translate-x-0"
            style={{
              backgroundColor: 'var(--color-background-dark)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            {/* Drawer Header (matches Sidebar 56px height) */}
            <div
              className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-border-subtle"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              {activeTab === 'main' ? (
                <span className="text-sm font-semibold text-text tracking-wide">
                  Account & Profile
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text hover:text-primary transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Theme & Appearance</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeDropdown}
                className="p-1.5 text-text-subtle hover:text-text hover:bg-background-elevated rounded-md transition-colors cursor-pointer"
                aria-label="Close profile drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {activeTab === 'main' ? (
                <>
                  {/* User Profile Summary Card */}
                  <div className="p-3.5 bg-card border border-border-subtle rounded-xl flex items-center gap-3 shadow-xs">
                    <div className="w-11 h-11 rounded-lg bg-background-elevated border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-text text-base font-bold uppercase">
                          {displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-sm font-semibold text-text truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs text-text-subtle truncate">
                        {displayEmail}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
                        {displayTitle}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdown();
                        navigate('/profile');
                      }}
                      className="w-full flex items-center justify-between px-3.5 h-11 rounded-lg text-text-subtle hover:text-text hover:bg-background-elevated/70 transition-colors text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1 rounded bg-background-elevated text-text-subtler">
                          <User size={15} />
                        </span>
                        <span>My profile</span>
                      </div>
                      <ChevronRight size={14} className="text-text-subtler" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('theme')}
                      className="w-full flex items-center justify-between px-3.5 h-11 rounded-lg text-text-subtle hover:text-text hover:bg-background-elevated/70 transition-colors text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1 rounded bg-background-elevated text-text-subtler">
                          <Contrast size={15} />
                        </span>
                        <span>Theme & appearance</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-background-elevated border border-border-subtle text-text-subtle">
                          {currentThemeObj.short}
                        </span>
                        <ChevronRight size={14} className="text-text-subtler" />
                      </div>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-3 border-t border-border-subtle/60">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 h-11 rounded-lg text-status-error hover:bg-status-error/10 transition-colors text-xs font-medium cursor-pointer"
                    >
                      <span className="p-1 rounded bg-status-error/10 text-status-error">
                        <LogOut size={15} />
                      </span>
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Inline Theme Configuration View */
                <div className="space-y-4">
                  {/* Theme Mode Selector */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                      Select theme
                    </span>
                    <div className="space-y-1.5">
                      {THEMES.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => saveTheme(t.id, accent)}
                            className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-text shadow-xs'
                                : 'bg-card border-border-subtle text-text-subtle hover:text-text hover:bg-background-elevated'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center -space-x-1">
                                {t.colors.map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-3.5 h-3.5 rounded-full border border-border-subtle"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-medium">{t.name}</span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-primary shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent Color Selector */}
                  <div className="space-y-2 pt-2 border-t border-border-subtle/60">
                    <span className="text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                      Accent color
                    </span>
                    <div className="flex items-center justify-between gap-1.5 p-2 bg-card border border-border-subtle rounded-lg">
                      {ACCENTS.map((a) => {
                        const isSelected = accent === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => saveTheme(theme, a.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: a.hex }}
                            title={a.name}
                            aria-label={`Select ${a.name} accent`}
                          >
                            {isSelected && <Check size={12} className="text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Link to full Appearance page */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdown();
                        navigate('/theme');
                      }}
                      className="w-full py-2 text-center text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Advanced appearance settings →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

ProfileDropdown.propTypes = {
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  onClose: PropTypes.func,
};

export default ProfileDropdown;
