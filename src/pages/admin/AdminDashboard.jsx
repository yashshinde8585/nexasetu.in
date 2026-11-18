import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import CenteredLoading from '../../components/atoms/CenteredLoading';
import ErrorBoundary from '../../components/atoms/ErrorBoundary';
import { ROUTES } from '../../constants';

// Modular Components
import AdminHeader from './AdminDashboard/components/AdminHeader';
import CommandCenterTab from './AdminDashboard/components/CommandCenterTab';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminDashboard();

  // Seamless tab switching with backward-compatibility for direct action links
  const handleTabSwitch = (tabId) => {
    if (tabId === 'users' || tabId === 'directory') {
      navigate('/teams?tab=directory');
    } else if (tabId === 'teams' || tabId === 'team-management') {
      navigate('/teams?tab=teams');
    } else if (tabId === 'roles' || tabId === 'security') {
      navigate(`${ROUTES.SETTINGS}?tab=${tabId}`);
    } else if (tabId === 'settings') {
      navigate(ROUTES.SETTINGS);
    }
  };

  if (isLoading) return <CenteredLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-8 text-center font-mono border border-status-error/20">
        <AlertCircle size={48} className="text-status-error mb-6" />
        <h2 className="text-2xl font-black text-text mb-4 uppercase tracking-tighter">
          Connection Error
        </h2>
        <p className="text-text/40 max-w-md text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">
          We couldn't load the admin dashboard. This might be due to a
          connection issue or an expired session.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 px-8 py-3 bg-white text-black text-[10px] uppercase font-bold tracking-[0.2em] rounded-lg hover:bg-white/80 transition-all active:scale-95 animate-pulse"
        >
          <RefreshCcw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text p-3 lg:p-4 font-sans select-none max-w-screen-2xl mx-auto flex flex-col gap-4">
      <AdminHeader />

      {/* Main Dashboard Content */}
      <div className="flex-1">
        <ErrorBoundary>
          <CommandCenterTab
            data={data}
            setActiveTab={handleTabSwitch}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AdminDashboard;
