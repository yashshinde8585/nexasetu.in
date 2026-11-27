import React, { useState } from 'react';
import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import CenteredLoading from '../../../components/atoms/CenteredLoading';
import DashboardSkeleton from '../../../components/atoms/DashboardSkeleton';
import ErrorBoundary from '../../../components/atoms/ErrorBoundary';
import {
  Layout,
  BarChart2,
  Users,
  Code as CodeIcon,
  Sparkles,
} from 'lucide-react';

// Modular Components
import TLOverviewTab from './TLDashboard/components/TLOverviewTab';
import TLDeliveryTab from './TLDashboard/components/TLDeliveryTab';
import TLTeamTab from './TLDashboard/components/TLTeamTab';
import TLCodeTab from './TLDashboard/components/TLCodeTab';
import TLInsightsTab from './TLDashboard/components/TLInsightsTab';

/**
 * Tech Lead (TL) Dashboard Controller
 * Reduced from monolithic layout to a modular tab panel switcher wrapped in Error Boundaries.
 */
const TLDashboard = () => {
  const { data, isLoading } = useRoleDashboard('tl');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    serviceMap = [],
    sprintProgress = 0,
    storiesCompleted = { completed: 0, total: 0 },
    cycleTime = { value: 0, unit: 'days' },
    deploymentFrequency = { value: 0, unit: 'week' },
    changeFailureRate = { value: 0 },
    codeHealthScore = 0,
    workItemsStatus = {
      done: 0,
      inProgress: 0,
      inReview: 0,
      blocked: 0,
      total: 0,
    },
    burndownData = [],
    topPriorities = [],
    teamVelocity = [],
    codeHealthOverview = { coverage: 0, eslint: 0, security: 0, debtDays: 0 },
    pullRequestMetrics = {
      prCycleTime: '0h',
      prsMerged: 0,
      prsOpen: 0,
      reviewTime: '0h',
      prCycleTimeHistory: [],
      prsMergedHistory: [],
      prReviewTimeHistory: [],
    },
    recentActivity = [],
    crossTeamDependencies = [],
    teamWorkload = [],
    aiInsights = [],
    upcomingDeadlines = [],
    comparisons = null,
    prComparisons = null,
    sparklineDone = [],
    sparklineCycle = [],
    technicalDebt = [],
  } = data || {};

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background text-text p-4 lg:p-6 font-sans selection:bg-primary max-w-screen-2xl mx-auto flex flex-col gap-6">
      <div className="flex border-b border-border-subtle overflow-x-auto scrollbar-none gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: <Layout size={14} /> },
          { id: 'delivery', label: 'Delivery', icon: <BarChart2 size={14} /> },
          { id: 'code', label: 'Code', icon: <CodeIcon size={14} /> },
          { id: 'team', label: 'Team Capacity', icon: <Users size={14} /> },
          {
            id: 'insights',
            label: 'AI Insights',
            icon: <Sparkles size={14} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-secondary text-text bg-background-elevated/60 font-semibold'
                : 'border-transparent text-text-subtle hover:text-text hover:bg-card'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'overview' && (
          <ErrorBoundary scope="component" resetKeys={[activeTab]}>
            <TLOverviewTab
              sprintProgress={sprintProgress}
              storiesCompleted={storiesCompleted}
              cycleTime={cycleTime}
              deploymentFrequency={deploymentFrequency}
              changeFailureRate={changeFailureRate}
              codeHealthScore={codeHealthScore}
              workItemsStatus={workItemsStatus}
              burndownData={burndownData}
              topPriorities={topPriorities}
              teamVelocity={teamVelocity}
              codeHealthOverview={codeHealthOverview}
              pullRequestMetrics={pullRequestMetrics}
              recentActivity={recentActivity}
              crossTeamDependencies={crossTeamDependencies}
              teamWorkload={teamWorkload}
              aiInsights={aiInsights}
              upcomingDeadlines={upcomingDeadlines}
              comparisons={comparisons}
              prComparisons={prComparisons}
              sparklineDone={sparklineDone}
              sparklineCycle={sparklineCycle}
              setActiveTab={setActiveTab}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'delivery' && (
          <ErrorBoundary scope="component" resetKeys={[activeTab]}>
            <TLDeliveryTab
              burndownData={burndownData}
              teamVelocity={teamVelocity}
              storiesCompleted={storiesCompleted}
              cycleTime={cycleTime}
              deploymentFrequency={deploymentFrequency}
              changeFailureRate={changeFailureRate}
              sparklineDone={sparklineDone}
              sparklineCycle={sparklineCycle}
              comparisons={comparisons}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'code' && (
          <ErrorBoundary scope="component" resetKeys={[activeTab]}>
            <TLCodeTab
              pullRequestMetrics={pullRequestMetrics}
              recentActivity={recentActivity}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'team' && (
          <ErrorBoundary scope="component" resetKeys={[activeTab]}>
            <TLTeamTab teamWorkload={teamWorkload} serviceMap={serviceMap} />
          </ErrorBoundary>
        )}

        {activeTab === 'insights' && (
          <ErrorBoundary scope="component" resetKeys={[activeTab]}>
            <TLInsightsTab aiInsights={aiInsights} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default TLDashboard;
