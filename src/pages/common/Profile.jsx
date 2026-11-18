import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Calendar,
  Settings,
  LogOut,
  Lock,
  Key,
  BadgeCheck,
  Clock,
  ChevronRight,
  Camera,
  Loader2,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { ChangePasswordModal } from '../../components/organisms/SettingsDecks';

/**
 * Clean and professional Profile page for NexaSetu.
 * Focuses on clarity, high contrast, and structured information layouts.
 */
const Profile = () => {
  const { user, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploading(true);
      await updateAvatar(formData);
    } catch (err) {
      console.error('[AVATAR_UPLOAD_FAILURE]:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

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

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Simple Professional Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle pb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-md bg-background-elevated border border-border-subtle flex items-center justify-center relative cursor-pointer group overflow-hidden"
              onClick={handleAvatarClick}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <span className="text-xl font-bold text-text-subtle">
                  {displayName.charAt(0)}
                </span>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              )}

              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 backdrop-blur-[2px]">
                <Camera size={16} className="text-white" />
              </div>

              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background-elevated border border-border-subtle rounded-full flex items-center justify-center text-primary z-30">
                <ShieldCheck size={11} />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text mb-0.5">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 text-text-subtle">
                <span className="text-primary text-xs font-semibold">
                  {displayTitle}
                </span>
                <span className="w-1 h-1 bg-border-subtle rounded-full" />
                <span className="text-xs font-medium text-text-subtler">
                  {(user._id || user.id || 'N/A').slice(-8)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={handleLogout}
              className="h-9 px-4 rounded text-xs font-semibold bg-status-error hover:bg-status-error/90 text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Informational Layout */}
        <div className="space-y-6">
          {/* Account Details Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
              Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border-subtle border border-border-subtle rounded-md overflow-hidden">
              <InfoRow
                label="Full Name"
                value={displayName}
                icon={<User size={13} />}
              />
              <InfoRow
                label="Email Address"
                value={displayEmail || 'N/A'}
                icon={<Mail size={13} />}
              />
              <InfoRow
                label="Account Role"
                value={displayTitle}
                icon={<Shield size={13} />}
              />
              <InfoRow
                label="Joined Workspace"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'
                }
                icon={<Calendar size={13} />}
              />
              <InfoRow
                label="Current Status"
                value="Active"
                icon={<Clock size={13} />}
                status="active"
              />
              <InfoRow
                label="Workspace ID"
                value={(user._id || user.id || 'N/A').slice(0, 12)}
                icon={<Key size={13} />}
              />
            </div>
          </section>

          {/* Account Security Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
              Account Security
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="w-full p-3.5 bg-card border border-border-subtle hover:border-border rounded-md flex items-center justify-between group transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-background-elevated border border-border-subtle flex items-center justify-center text-text-subtle group-hover:text-primary transition-colors shrink-0">
                  <Lock size={14} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-text">
                    Change Password
                  </h4>
                  <p className="text-xs text-text-subtle font-normal mt-0.5">
                    Regularly update your credentials to keep your account secure.
                  </p>
                </div>
              </div>
              <ChevronRight
                size={14}
                className="text-text-subtler group-hover:text-text group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </button>
          </section>
        </div>

        {showModal && (
          <ChangePasswordModal onClose={() => setShowModal(false)} />
        )}
      </div>
    </div>
  );
};

// Sub-components for a structured, clean UI
const InfoRow = ({ label, value, icon, status }) => (
  <div className="bg-card p-3.5 sm:p-4 flex flex-col gap-1">
    <span className="text-xs font-medium text-text-subtle flex items-center gap-1.5">
      {icon} {label}
    </span>
    <span className="text-xs sm:text-sm font-semibold text-text flex items-center gap-2 mt-0.5">
      {status === 'active' && (
        <div className="w-1.5 h-1.5 bg-status-success rounded-full shrink-0" />
      )}
      <span className="truncate">{value}</span>
    </span>
  </div>
);

const ActionTile = ({ icon, title, desc, badge }) => (
  <div className="p-3.5 sm:p-4 bg-card border border-border-subtle rounded-md flex items-center justify-between hover:border-border transition-all cursor-pointer group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-background-elevated border border-border-subtle flex items-center justify-center text-text-subtle group-hover:text-primary transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-white truncate">
            {title}
          </h4>
          {badge && (
            <span className="text-[7px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 truncate">
          {desc}
        </p>
      </div>
    </div>
    <ChevronRight
      size={14}
      className="text-white/20 group-hover:text-white transition-transform transform group-hover:translate-x-1 shrink-0"
    />
  </div>
);

const PreferenceToggle = ({ label, active }) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
      {label}
    </span>
    <div
      className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-primary' : 'bg-white/10'}`}
    >
      <div
        className={`absolute top-[2px] w-3 h-3 rounded-full transition-all ${active ? 'right-[2px] bg-black' : 'left-[2px] bg-white/40'}`}
      />
    </div>
  </div>
);

export default Profile;
