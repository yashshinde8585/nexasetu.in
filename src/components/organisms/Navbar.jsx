import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import NotificationTray from './NotificationTray';
import {
  Menu,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import MagicBar from './MagicBar';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import { ROUTES } from '../../constants/routes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../../api/projectApi';

const Navbar = ({
  onToggleSidebar,
  sidebarOpen,
  profileOpen,
  onToggleProfile,
  onCloseProfile,
}) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const location = useLocation();
  const path = location.pathname;
  const isTeamProjectPage = path.startsWith('/team/project/');
  const projectId = isTeamProjectPage ? path.split('/team/project/')[1] : null;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      ProjectService.getProject(projectId).then((res) => res.data?.project),
    enabled: !!projectId && projectId !== 'unassigned',
  });

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-black border-b border-white/10"
      style={{
        backgroundColor: 'var(--color-background-dark)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {user ? (
        <>
          <div className="flex items-center gap-4 shrink-0 px-2 h-9">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 text-white/60 hover:text-white md:hidden transition-colors"
              style={{ color: 'var(--color-text-subtle)' }}
              aria-label="Toggle Sidebar"
              aria-expanded={Boolean(sidebarOpen)}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
            <div
              className="text-sm font-semibold text-white flex items-center h-full"
              style={{ color: 'var(--color-text)' }}
            >
              <span
                className="text-white uppercase tracking-wider"
                style={{ color: 'var(--color-text)' }}
              >
                {(() => {
                  const breadcrumbMap = {
                    [ROUTES.DASHBOARD]: 'Home',
                    [ROUTES.COMMAND_CENTER]: 'Dashboard',
                    [ROUTES.EXECUTION_COMMANDER]: 'Operations',
                    [ROUTES.TEAM_COMMAND_CENTER]: 'Dashboard',
                    [ROUTES.SYSTEM_HEALTH_CONTROL]: 'Dashboard',
                    [ROUTES.QUALITY_COMMAND]: 'Quality',
                    [ROUTES.HR]: 'Dashboard',
                    [ROUTES.QUALITY_STRATEGY]: 'Strategy',
                    [ROUTES.QUALITY_CONTROL]: 'Audit',
                    [ROUTES.EXECUTION_CONTROL]: 'Dashboard',
                    [ROUTES.GUIDED_WORK_ASSISTANT]: 'Tasks',
                    [ROUTES.LEARNING_WORKSPACE]: 'Hub',
                    [ROUTES.ADMIN_PANEL]: 'Dashboard',
                    [ROUTES.SUPER_ADMIN]: 'Super Admin',
                    [ROUTES.PERSONAL_WORK_CONSOLE]: 'Workbench',
                    [ROUTES.PORTFOLIO || '/portfolio']: 'Portfolio',
                    [ROUTES.TEAMS]: 'Teams',
                    '/team/add': 'Invite Team Members',
                    [ROUTES.SPRINTS]: 'Sprints',
                    '/project-info': 'Sprints',
                    '/project-setup': 'Create Project',
                    [ROUTES.MY_TASKS]: 'Tasks',
                    '/velocity': 'Velocity',
                    [ROUTES.PROFILE || '/profile']: 'Profile',
                    [ROUTES.PRICING]: 'Account',
                    [ROUTES.SETTINGS]: 'Settings',
                    '/admin/settings': 'Settings',
                    '/theme': 'Themes',
                  };

                  if (breadcrumbMap[path]) return breadcrumbMap[path];

                  if (isTeamProjectPage) {
                    const projectName =
                      project?.name ||
                      (projectId === 'unassigned' ? 'Unassigned' : '');
                    if (!projectName) return 'Team';

                    return (
                      <span className="flex items-center gap-2">
                        <Link
                          to={ROUTES.TEAMS}
                          className="hover:text-primary transition-colors"
                        >
                          Team
                        </Link>
                        <span className="text-white/20">/</span>
                        <span className="text-white">{projectName}</span>
                      </span>
                    );
                  }

                  if (path.match(/^\/project\/[^/]+\/settings$/))
                    return 'Project Settings';
                  if (path.startsWith('/project/')) return 'Task Board';
                  if (path.startsWith('/task/')) return 'Task Detail';
                  return '';
                })()}
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 justify-center max-w-4xl px-8">
            {location.pathname === '/dashboard' &&
              hasPermission(PERMISSIONS.USE_MAGIC_BAR) && <MagicBar />}
          </div>

          <div className="flex items-center gap-4 shrink-0 h-9">
            {path === ROUTES.HR && (
              <button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                }
                className="hidden lg:flex items-center gap-2 px-3 h-8 bg-background-elevated border border-border-subtle text-xs font-semibold uppercase tracking-wider text-text-subtle hover:text-text hover:bg-card transition-all group rounded-md cursor-pointer"
              >
                <RefreshCw
                  size={12}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
                Sync Team Activity
              </button>
            )}
            <NotificationTray />
            <ProfileDropdown
              isOpen={profileOpen}
              onToggle={onToggleProfile}
              onClose={onCloseProfile}
            />
          </div>
        </>
      ) : (
        <>
          <Link to="/" className="flex items-center group/logo relative" aria-label="NexaSetu Home">
            <img
              src="/Logo.svg"
              alt="NexaSetu"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>

          <div className="flex gap-4 sm:gap-6 items-center">
            {location.pathname !== ROUTES.LOGIN && (
              <Link
                to={ROUTES.LOGIN}
                className="text-xs sm:text-sm font-semibold text-white/70 hover:text-white uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            )}
            {location.pathname !== ROUTES.REGISTER && (
              <Link
                to={ROUTES.REGISTER}
                className="text-xs sm:text-sm font-bold bg-white hover:bg-white/90 text-black h-9 px-4 sm:px-6 flex items-center justify-center rounded uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap"
              >
                Get Started
              </Link>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

Navbar.propTypes = {
  onToggleSidebar: PropTypes.func,
};

export default Navbar;
