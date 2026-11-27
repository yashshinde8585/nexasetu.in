import React, { useState } from 'react';
import { useBilling } from '../../hooks/useBilling';
import { useAuth } from '../../context/AuthContext';
import { getMembers } from '../../api/teamApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Check,
  ArrowRight,
  Loader2,
  FileText,
} from 'lucide-react';

const AdminBilling = () => {
  const { user } = useAuth();
  const {
    plans,
    subscription,
    limits,
    planName,
    usage,
    isLoading,
    selectPlan,
  } = useBilling();

  const [showAllPlans, setShowAllPlans] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState('inr'); // 'inr' | 'usd'

  // Query workspace members to ensure billing seat count matches Team directory exactly
  const teamMembersQuery = useQuery({
    queryKey: ['workspace-members-billing', user?.workspaceId],
    queryFn: () => getMembers({ page: 1, limit: 1 }),
    enabled: !!user?.workspaceId,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlanId = (subscription?.plan || 'free').toLowerCase();
  const currentPlan =
    plans.find((p) => p.id === currentPlanId) ||
    plans.find((p) => p.id === 'free');

  const availableUpgrades = plans.filter(
    (p) => p.price > (currentPlan?.price || 0)
  );
  const featuredUpgrade = availableUpgrades[0];

  // Helper to distinguish unlimited quotas from missing limits
  const isUnlimited = (val) => {
    if (val === Infinity || val === 'Infinity') return true;
    if (currentPlanId === 'enterprise' && (val === null || val === undefined)) {
      return true;
    }
    return false;
  };

  // Seat counts verified against workspace membership
  const totalSeats =
    teamMembersQuery.data?.total ??
    usage?.users ??
    subscription?.usage?.users ??
    1;

  const activeMembersCount =
    usage?.activeUsers ??
    (teamMembersQuery.data?.items
      ? teamMembersQuery.data.items.filter((m) => m.status !== 'Invited').length
      : totalSeats);

  const pendingInvitesCount =
    usage?.pendingInvites ??
    (teamMembersQuery.data?.invitations
      ? teamMembersQuery.data.invitations.length
      : 0);

  const seatLimit = limits?.users ?? currentPlan?.features?.users;
  const isSeatsUnlimited = isUnlimited(seatLimit);

  // Subscription pricing and renewal date formatting
  const planPriceFormatted =
    currentPlan?.price === 0
      ? 'Free'
      : currency === 'inr'
        ? `₹${currentPlan?.price?.toLocaleString() || 0} / month`
        : `$${currentPlan?.globalPrice || 0} / month`;

  const getRenewalDetails = () => {
    if (subscription?.endDate) {
      return `Renews on ${new Date(subscription.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }
    if (subscription?.startDate) {
      const start = new Date(subscription.startDate);
      const nextRenewal = new Date(start);
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      while (nextRenewal < new Date()) {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      }
      return `Renews on ${nextRenewal.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} • Monthly cycle`;
    }
    return currentPlanId === 'free' ? 'No expiration • Free tier' : 'N/A';
  };

  // Usage statistics for resource quotas
  const usedProjects =
    usage?.projects ?? subscription?.usage?.projects ?? 0;
  const usedAI = usage?.aiUsage ?? subscription?.usage?.aiUsage ?? 0;
  const usedSprints =
    usage?.sprints ?? subscription?.usage?.sprints ?? 0;

  const rawLimits = limits || currentPlan?.features;

  const quotaCards = [
    {
      label: 'Projects',
      used: usedProjects,
      totalLimit: rawLimits?.projects,
      isUncapped: isUnlimited(rawLimits?.projects),
      subtext: 'Workspace projects',
    },
    {
      label: 'Sprints',
      used: usedSprints,
      totalLimit: rawLimits?.sprints,
      isUncapped: isUnlimited(rawLimits?.sprints),
      subtext: 'Sprint cycles',
    },
    {
      label: 'AI credits',
      used: usedAI,
      totalLimit: rawLimits?.aiUsage,
      isUncapped: isUnlimited(rawLimits?.aiUsage),
      subtext: 'AI compute usage',
    },
  ];

  const handleUpgrade = async (plan) => {
    setSelectedPlan(plan);
    setIsProvisioning(true);
    setProgress(0);

    const duration = 15000;
    const interval = 100;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 99));
    }, interval);

    try {
      const selectPromise = selectPlan({ plan: plan.id });
      await new Promise((resolve) => setTimeout(resolve, duration));
      await selectPromise;

      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        setIsProvisioning(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Upgrade failed:', err);
      clearInterval(timer);
      setIsProvisioning(false);
      toast.error('Failed to activate plan. Please try again.');
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6 bg-background text-text min-h-screen animate-in fade-in duration-700">
      {/* Upgrade progress overlay */}
      {isProvisioning && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-xs space-y-6 text-center">
            <Loader2 size={28} className="text-primary animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Activating {selectedPlan?.name}
              </h3>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-medium text-white/60">
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-end gap-6 flex-wrap border-b border-border-subtle pb-4">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text">
            Billing
          </h1>
          <p className="text-text-subtle text-sm font-normal max-w-xl">
            Manage your workspace subscription, quota limits, and billing details.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Supported Billing Currencies Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-subtle hidden md:inline">
              Billing currency:
            </span>
            <div className="flex items-center bg-background-elevated border border-border-subtle p-0.5 rounded-lg h-9">
              <button
                onClick={() => setCurrency('inr')}
                title="Supported billing currency: Indian Rupee (₹)"
                className={`px-3 h-full text-xs font-medium transition-all rounded cursor-pointer ${currency === 'inr'
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-text-subtle hover:text-text'
                  }`}
              >
                INR (₹)
              </button>
              <button
                onClick={() => setCurrency('usd')}
                title="Supported billing currency: US Dollar ($)"
                className={`px-3 h-full text-xs font-medium transition-all rounded cursor-pointer ${currency === 'usd'
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-text-subtle hover:text-text'
                  }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowAllPlans(!showAllPlans)}
            className="h-9 px-4 bg-background-elevated border border-border-subtle rounded-lg text-xs font-medium text-text transition-all hover:bg-background-elevated/80 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {showAllPlans ? 'Hide plans' : 'View all plans'}
            <ArrowRight
              size={13}
              className={`${showAllPlans ? 'rotate-90' : ''} transition-transform text-text-subtle`}
            />
          </button>
        </div>
      </div>

      {/* 1. Subscription Overview - Prominent Hero Card */}
      <div className="bg-card border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-colors hover:border-border">
        {/* Subtle top primary accent highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/70" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                {planName || currentPlan?.name || 'Enterprise'}
              </h2>
              <span className="px-2.5 py-0.5 bg-status-success/10 border border-status-success/20 text-status-success text-xs font-semibold rounded-full">
                {subscription?.status
                  ? subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)
                  : 'Active'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                  {planPriceFormatted}
                </span>
                <span className="text-xs text-text-subtle font-medium">
                  • {getRenewalDetails()}
                </span>
              </div>
            </div>

            {currentPlanId === 'enterprise' && (
              <p className="text-xs text-text-subtle font-normal pt-1">
                Confirmed entitlements: Unlimited projects, sprints, team seats, and AI credits with priority support.
              </p>
            )}
          </div>

          {/* Billed seats verified against workspace membership */}
          <div className="md:text-right border-t md:border-t-0 md:border-l border-border-subtle/60 pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0 space-y-1">
            <p className="text-text-subtle text-xs font-medium uppercase tracking-wider">
              Billed seats
            </p>
            <div className="flex md:justify-end items-baseline gap-1.5">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums text-text">
                {totalSeats}
              </p>
              <span className="text-xs text-text-subtle font-medium">
                / {isSeatsUnlimited ? 'Unlimited' : (seatLimit ?? 'N/A')}
              </span>
            </div>
            <p className="text-text-subtle text-xs">
              {activeMembersCount} active
              {pendingInvitesCount > 0 ? ` • ${pendingInvitesCount} invited` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Plan Usage - Unified Section with 3 separated metrics */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-subtle px-1 uppercase tracking-wider">
          Plan Usage
        </h3>
        <div className="bg-card border border-border-subtle rounded-xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle/50">
          {quotaCards.map((stat, i) => (
            <div
              key={i}
              className="py-3 sm:py-0 px-2 sm:px-5 first:pt-0 sm:first:pl-0 last:pb-0 sm:last:pr-0 flex flex-col justify-between gap-1.5"
            >
              <span className="text-xs font-medium text-text-subtle">
                {stat.label}
              </span>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-text">
                  {stat.used}
                </span>
                <span className="text-xs text-text-subtle font-medium">
                  / {stat.isUncapped ? 'Unlimited' : (stat.totalLimit ?? 'N/A')}
                </span>
              </div>

              {/* Quota Progress Bar for capped tiers */}
              {!stat.isUncapped && stat.totalLimit && typeof stat.totalLimit === 'number' ? (
                <div className="h-1.5 w-full bg-background-elevated rounded overflow-hidden mt-1 border border-border-subtle/60">
                  <div
                    className="h-full bg-primary/70 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((stat.used || 0) / stat.totalLimit) * 100)
                      )}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* All Plans Grid */}
      {showAllPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-5 rounded-xl border transition-all ${plan.id === currentPlanId
                ? 'bg-primary/5 border-primary/30'
                : 'bg-card border-border-subtle'
                } space-y-4 flex flex-col`}
            >
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-text-subtle">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-text tracking-tight">
                    {currency === 'inr'
                      ? `₹${plan.price}`
                      : `$${plan.globalPrice || 0}`}
                  </span>
                  <span className="text-xs text-text-subtle font-medium">
                    / month
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 pt-2 border-t border-border-subtle mt-2">
                {Object.entries(plan.features).map(([key, val]) => {
                  const displayVal =
                    val === Infinity || val === null || val === 'Infinity'
                      ? 'Unlimited'
                      : val;
                  const displayKey =
                    key === 'aiUsage'
                      ? 'AI Credits'
                      : key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <li
                      key={key}
                      className="flex items-start gap-2 text-xs text-text-subtle font-medium"
                    >
                      <Check
                        size={14}
                        className="text-primary shrink-0 mt-0.5"
                      />
                      <span>
                        {displayVal} {displayKey}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {plan.id !== currentPlanId ? (
                <button
                  onClick={() => handleUpgrade(plan)}
                  className="w-full h-9 bg-primary text-black hover:bg-primary/90 rounded text-xs font-semibold transition-all active:scale-95 flex items-center justify-center mt-4 cursor-pointer"
                >
                  Select plan
                </button>
              ) : (
                <div className="w-full h-9 border border-border-subtle text-text-subtle text-xs font-semibold rounded flex items-center justify-center gap-2 mt-4 bg-background-elevated">
                  <Check size={13} /> Current plan
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Featured Upgrade Card (Only shown if a higher plan is available, e.g. Free or Pro) */}
      {!showAllPlans && featuredUpgrade && (
        <div className="bg-card border border-border-subtle rounded-xl p-5 space-y-4 group hover:border-border transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-text">
                Upgrade to {featuredUpgrade.name}
              </h2>
              <p className="text-text-subtle text-xs font-normal">
                {currency === 'inr'
                  ? `₹${featuredUpgrade.price}`
                  : `$${featuredUpgrade.globalPrice || 0}`}{' '}
                per month
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowAllPlans(true)}
                className="text-text-subtle hover:text-text text-xs font-medium transition-colors flex-1 sm:flex-initial text-center py-2 px-3 cursor-pointer"
              >
                Compare plans
              </button>
              <button
                onClick={() => handleUpgrade(featuredUpgrade)}
                className="bg-primary hover:bg-primary/90 text-black px-4 h-9 rounded text-xs font-semibold transition-all active:scale-95 flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
              >
                Upgrade now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border-subtle pt-4">
            {Object.entries(featuredUpgrade.features)
              .slice(0, 4)
              .map(([key, val], idx) => {
                const displayVal =
                  val === Infinity || val === null || val === 'Infinity'
                    ? 'Unlimited'
                    : val;
                const displayKey =
                  key === 'aiUsage'
                    ? 'AI Credits'
                    : key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-text-subtle font-medium"
                  >
                    <Check
                      size={14}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span className="truncate">
                      {displayVal} {displayKey}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. Payment Method - Settings-style Information Row */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-subtle px-1 uppercase tracking-wider">
          Payment method
        </h3>
        <div className="bg-card border border-border-subtle rounded-xl p-4 sm:px-5 sm:py-3.5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-border transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            {subscription?.paymentMethod?.last4 ? (
              <>
                <div className="w-11 h-7 bg-background-elevated border border-border-subtle rounded flex items-center justify-center text-xs font-semibold text-text uppercase shrink-0">
                  {subscription.paymentMethod.brand || 'Card'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text">
                    •••• •••• •••• {subscription.paymentMethod.last4}
                    <span className="text-text-subtle font-normal ml-2">
                      (Expires {subscription.paymentMethod.expMonth || 'MM'}/
                      {subscription.paymentMethod.expYear || 'YY'})
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-6 bg-background-elevated border border-border-subtle rounded flex items-center justify-center text-[10px] font-medium text-text-subtle shrink-0">
                  N/A
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text">
                    No payment method on file
                  </p>
                  <p className="text-[11px] text-text-subtle font-normal">
                    Direct sandbox provisioning • No payment method required or billed
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border-subtle/50 pt-2.5 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-text select-all">
                {user?.email || 'N/A'}
              </p>
              <p className="text-[11px] text-text-subtle font-normal">
                Billing contact email
              </p>
            </div>
            <button
              onClick={() => {
                toast(
                  'Direct provisioning is active for this workspace. No card updates required.',
                  {
                    icon: 'ℹ️',
                    style: {
                      borderRadius: '10px',
                      background: 'var(--color-background-elevated)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '13px',
                    },
                  }
                );
              }}
              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer shrink-0"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transaction History - Lightweight Table with Compact Empty State */}
      <div className="space-y-2">
        <div className="px-1 flex justify-between items-center">
          <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
            Transaction history
          </h3>
          <span className="text-xs font-medium text-text-subtle">
            {subscription?.invoices?.length || 0} invoices
          </span>
        </div>

        {subscription?.invoices?.length > 0 ? (
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-background-elevated/40 text-text-subtle">
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                    <th className="py-2.5 px-4 font-semibold">Amount</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {subscription.invoices.map((inv, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-background-elevated/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-text font-medium">{inv.date}</td>
                      <td className="py-3 px-4 text-text-subtle font-mono">{inv.id}</td>
                      <td className="py-3 px-4 text-text font-medium">{inv.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-status-success/10 text-status-success">
                          {inv.status || 'Paid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={inv.pdfUrl || '#'}
                          className="text-primary hover:underline font-medium"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border-subtle rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2.5 text-text-subtle">
              <FileText size={15} className="text-text-subtle shrink-0" />
              <span className="text-text font-medium">
                No billing history recorded
              </span>
            </div>
            <span className="text-[11px] text-text-subtle">
              No payment transactions or invoices have been billed for this workspace yet.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;
