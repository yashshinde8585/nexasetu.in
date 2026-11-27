import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../constants';
import { Lightbulb, AlertCircle, ChevronRight } from 'lucide-react';
import DashboardSection from './DashboardSection';

const StrategicInsights = () => {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.AI.RECOMMENDATIONS).then((res) => res.data),
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return null;
  }

  const hasRecommendations =
    Array.isArray(recommendations) && recommendations.length > 0;

  return (
    <DashboardSection
      title="Strategic Insights"
      icon={<Lightbulb size={14} className="text-primary" />}
    >
      <div className="pt-1">
        {hasRecommendations ? (
          <div className="divide-y divide-border-subtle/50">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div
                key={i}
                className="py-2.5 first:pt-0 last:pb-0 group hover:bg-background-elevated/40 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-1 rounded-md shrink-0 ${
                      rec.priority === 'high'
                        ? 'bg-status-error/10 text-status-error'
                        : rec.priority === 'medium'
                          ? 'bg-status-warning/10 text-status-warning'
                          : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <AlertCircle size={14} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-text mb-0.5 leading-snug group-hover:text-primary transition-colors">
                      {rec.message}
                    </p>
                    <p className="text-[11px] text-text-subtle font-medium flex items-center gap-1 truncate">
                      <span>Recommendation: {rec.action}</span>
                      <ChevronRight
                        size={11}
                        className="group-hover:translate-x-0.5 transition-transform shrink-0"
                      />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2.5 px-3.5 bg-background-elevated/30 border border-border-subtle/60 rounded-lg text-xs text-text-subtle text-center">
            Not enough data for insights
          </div>
        )}
      </div>
    </DashboardSection>
  );
};

export default StrategicInsights;
