import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectPlan from '../../components/billing/SelectPlan';
import { useBilling } from '../../hooks/useBilling';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import { Shield, Zap, Globe } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isLoading } = useBilling();

  return (
    <div className="min-h-screen bg-background text-text pt-16 pb-20 px-4 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-[40%] h-[400px] bg-primary/5 blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[400px] bg-primary/5 blur-[100px] -z-10"></div>

      <div className="max-w-6xl mx-auto">
        {/* Compact Header Section */}
        <div className="mb-8 border-b border-border-subtle pb-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              Pricing & Plans
            </h1>
            <p className="text-text-subtle text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              Select a capacity tier to finalize your workspace deployment.
              Instant activation. Zero setup fees.
            </p>
          </div>
        </div>

        {/* The Core Selection Component */}
        <div className="relative z-10">
          <SelectPlan />
        </div>

        {/* Minimal Footer Info */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium uppercase tracking-wider text-text-subtle">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-primary" /> Enterprise Grade Security
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Instant Provisioning
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-primary" /> Global Distribution
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
