import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../organisms/Sidebar';
import Navbar from '../organisms/Navbar';
import MagicResults from '../organisms/MagicResults';
import ServerWakeupBanner from '../organisms/ServerWakeupBanner';
import ErrorBoundary from '../atoms/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import DirectiveBanner from '../molecules/dashboard/DirectiveBanner';
import RiskSentinel from '../molecules/dashboard/RiskSentinel';

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (next) setProfileOpen(false);
      return next;
    });
  };

  const closeSidebar = () => setSidebarOpen(false);

  const toggleProfile = () => {
    setProfileOpen((prev) => {
      const next = !prev;
      if (next) setSidebarOpen(false);
      return next;
    });
  };

  const closeProfile = () => setProfileOpen(false);

  // Close mobile drawers on route navigation
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Lock background scroll when a mobile drawer is open (<768px)
  useEffect(() => {
    if (
      (sidebarOpen || profileOpen) &&
      typeof window !== 'undefined' &&
      window.innerWidth < 768
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, profileOpen]);

  useEffect(() => {
    const handleServerDown = () => setServerDown(true);
    const handleSessionExpired = (e) => setSessionExpired(e.detail);

    window.addEventListener('app:server-down', handleServerDown);
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('app:server-down', handleServerDown);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const publicPages = ['/', '/login', '/register', '/join', '/pricing'];
  const isPublicPage = publicPages.includes(location.pathname);

  // Logic for Application Shell Components
  const showSidebar = user && !isPublicPage;
  const noGlobalNavPages = ['/', '/login', '/register'];
  const showNavbar = !noGlobalNavPages.includes(location.pathname); // Hide global nav on auth/landing pages to avoid duplication


  return (
    <div className="bg-background min-h-screen selection:bg-primary/30 flex flex-col">
      {showSidebar && <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />}

      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${showSidebar ? 'md:ml-64' : ''}`}
      >
        {/* <ServerWakeupBanner /> */}

        {serverDown && (
          <div className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center sticky top-0 z-50 animate-[fadeIn_500ms_ease_forwards,slideInFromTop_500ms_ease_forwards]">
            Offline: Connection to server lost
          </div>
        )}

        {sessionExpired && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-background text-text border border-white/10 p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.4em] mb-4">
                Security Session Expired
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest leading-loose mb-8">
                {sessionExpired}
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('auth:logout'));
                  window.location.href = '/login';
                }}
                className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Authenticate Again
              </button>
            </div>
          </div>
        )}

        {showNavbar && (
          <Navbar
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={closeSidebar}
            profileOpen={profileOpen}
            onToggleProfile={toggleProfile}
            onCloseProfile={closeProfile}
          />
        )}

        <div className="flex-1 flex flex-col relative">
          <MagicResults />
          <DirectiveBanner />
          <RiskSentinel />
          <main className="flex-1 overflow-x-hidden">
            <ErrorBoundary scope="page" resetKeys={[location.pathname]}>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
