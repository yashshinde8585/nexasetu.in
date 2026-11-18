import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Rocket, Zap, TrendingUp, Bot, Target } from 'lucide-react';
import DashboardService from '../../api/dashboardApi';

// A performance analytics page that visualizes project velocity, AI integration impact, and individual task scores.
const Velocity = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => DashboardService.getDashboardStats().then((res) => res.data),
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  const {
    personal = { active: 0, completed: 0, total: 0 },
    aiImpact = { ai: 0, manual: 0 },
    projects = [],
  } = dashboardData || {};
  const velocityScore =
    personal.total > 0
      ? ((personal.completed / personal.total) * 100).toFixed(0)
      : 0;

  const aiData = [
    { name: 'AI Augmented', value: aiImpact.ai, color: '#8b5cf6' },
    { name: 'Manual Craft', value: aiImpact.manual, color: '#475569' },
  ];

  const projectExecutionData = projects
    .map((p) => ({
      name: p.name.substring(0, 10),
      completion: p.myPercentage || 0,
      avg: p.percentage || 0,
    }))
    .filter((p) => p.completion > 0 || p.avg > 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border-subtle p-8 sm:p-12 transition-all shadow-sm">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
            <Rocket size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mb-3">
            Performance Velocity
          </h1>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl sm:text-6xl font-extrabold text-primary tracking-tight">
              {velocityScore}%
            </span>
            <div className="text-left">
              <div className="text-status-success font-semibold text-sm flex items-center gap-1">
                <TrendingUp size={16} /> +2.4%
              </div>
              <div className="text-text-subtle text-xs font-medium">
                Performance Baseline
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border-subtle p-6 rounded-xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Bot size={18} className="text-secondary" /> AI Integration Overview
              </h3>
              <p className="text-xs text-text-subtle">
                Task Automation Ratio
              </p>
            </div>
          </div>

          <div className="h-64 relative">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <PieChart>
                <Pie
                  data={aiData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {aiData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated, #18181b)',
                    borderColor: 'var(--color-border-subtle, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    color: 'var(--color-text, #fff)',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-text leading-none">
                {aiImpact.ai}
              </span>
              <span className="text-xs text-text-subtle font-medium mt-1">
                AI Tasks
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-4 border-t border-border-subtle">
            {aiData.map((d) => (
              <div key={d.name} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs font-medium text-text">
                    {d.name}
                  </span>
                </div>
                <div className="text-base font-bold text-text-subtle ml-4">
                  {d.value} <span className="text-xs font-normal">tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border-subtle p-6 rounded-xl space-y-6 shadow-sm">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <Target size={18} className="text-primary" /> Project Completion
            </h3>
            <p className="text-xs text-text-subtle">
              Individual vs Workspace Performance
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart data={projectExecutionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(128,128,128,0.15)"
                />
                <XAxis
                  dataKey="name"
                  stroke="rgba(128,128,128,0.5)"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(128,128,128,0.05)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated, #18181b)',
                    borderColor: 'var(--color-border-subtle, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    color: 'var(--color-text, #fff)',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="completion"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="My Score"
                />
                <Bar
                  dataKey="avg"
                  fill="#3b82f6"
                  opacity={0.4}
                  radius={[4, 4, 0, 0]}
                  name="Workspace Avg"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center items-center gap-6 text-xs font-medium text-text-subtle">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 bg-secondary rounded-sm" /> Individual Performance
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 bg-primary/40 rounded-sm" /> Workspace Average
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border-subtle rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-8 shadow-sm">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-2.5 justify-center sm:justify-start">
            <Target className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-text tracking-tight">
              Delivery Health
            </h2>
          </div>
          <p className="text-text-subtle text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
            Your completion velocity is currently{' '}
            <span className="text-status-success font-semibold">Outstanding</span>.
            You have completed{' '}
            <span className="text-text font-semibold">{personal.completed}</span>{' '}
            tasks this cycle, outperforming the workspace average by{' '}
            <span className="text-secondary font-semibold">12.4%</span>.
          </p>
        </div>
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              {personal.completed}
            </div>
            <div className="text-xs text-text-subtle font-medium mt-0.5">
              Completed
            </div>
          </div>
          <div className="w-px h-10 bg-border-subtle" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              {personal.active}
            </div>
            <div className="text-xs text-text-subtle font-medium mt-0.5">
              Active Tasks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Velocity;
