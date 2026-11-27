import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Loader2,
  Sparkles,
  AlertCircle,
  ListChecks,
  ArrowRight,
} from 'lucide-react';
import LazyMarkdown from '../atoms/LazyMarkdown';
import epiApi from '../../api/epiApi';

const TaskEPIExplanation = ({ taskId, isExpanded, onLoadingChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpData, setHelpData] = useState(null);
  const [error, setError] = useState(null);

  const fetchExplanation = async () => {
    setLoading(true);
    if (onLoadingChange) onLoadingChange(true);
    setError(null);
    try {
      const epiData = await epiApi.getTaskEPI(taskId);
      setData(epiData);
    } catch (err) {
      console.error('Failed to fetch task EPI:', err);
      setError('Intelligence offline');
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const fetchImplementationHelp = async () => {
    setHelpLoading(true);
    try {
      const response = await epiApi.getTaskHelp(taskId);
      setHelpData(response.implementationPlan);
    } catch (err) {
      console.error('Failed to fetch implementation help:', err);
    } finally {
      setHelpLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isExpanded && !data) {
      fetchExplanation();
    }
  }, [taskId, isExpanded]);

  return (
    <div className="mt-6">
      {/* Content */}
      {isExpanded && (
        <div className="animate-in fade-in duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 bg-card border border-border-subtle rounded-xl">
              <Loader2
                size={24}
                className="text-primary animate-spin"
              />
              <p className="text-xs font-medium text-text-subtle">
                Analyzing task requirements...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 bg-card border border-border-subtle rounded-xl text-text-subtle">
              <AlertCircle size={20} className="text-status-warning" />
              <p className="text-xs font-medium text-text">
                AI insights currently unavailable
              </p>
              <button
                type="button"
                onClick={fetchExplanation}
                className="text-xs text-primary hover:underline font-medium mt-1 cursor-pointer"
              >
                Retry analysis
              </button>
            </div>
          ) : (
            data && (
              <div className="bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
                {/* AI Notice Banner */}
                <div className="px-4 py-2 bg-secondary/10 border-b border-border-subtle flex items-center gap-2">
                  <Sparkles size={14} className="text-secondary shrink-0" />
                  <span className="text-xs font-semibold text-text">
                    AI-assisted suggestion
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Analysis */}
                  <div>
                    <h5 className="text-xs font-semibold text-text mb-2.5 flex items-center gap-2">
                      <BrainCircuit size={14} className="text-primary" />
                      <span>AI Analysis & Recommendations</span>
                    </h5>
                    {data.explanation && data.explanation.trim() !== '' ? (
                      <div className="nexa-prose text-xs sm:text-sm text-text leading-relaxed">
                        <LazyMarkdown>{data.explanation}</LazyMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-text-subtle italic">
                        No automated analysis recorded for this task.
                      </p>
                    )}
                  </div>

                  {/* Implementation Strategy */}
                  {!helpData && !helpLoading && (
                    <div className="pt-3 border-t border-border-subtle">
                      <button
                        type="button"
                        onClick={fetchImplementationHelp}
                        className="flex items-center justify-between sm:justify-start gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-background-elevated border border-border-subtle hover:bg-card hover:border-primary/40 text-xs font-medium text-text transition-colors cursor-pointer w-full sm:w-auto min-h-[40px]"
                      >
                        <span className="flex items-center gap-2">
                          <ListChecks size={14} className="text-primary shrink-0" />
                          <span>Request step-by-step implementation plan</span>
                        </span>
                        <ArrowRight size={13} className="text-text-subtle shrink-0 ml-auto sm:ml-1" />
                      </button>
                    </div>
                  )}

                  {helpLoading && (
                    <div className="flex items-center gap-2.5 py-4 text-xs font-medium text-text-subtle pt-3 border-t border-border-subtle">
                      <Loader2 size={16} className="text-primary animate-spin" />
                      <span>Generating implementation plan...</span>
                    </div>
                  )}

                  {helpData && (
                    <div className="pt-4 border-t border-border-subtle space-y-2.5">
                      <h5 className="text-xs font-semibold text-text flex items-center gap-2">
                        <ListChecks size={14} className="text-secondary" />
                        <span>AI-Assisted Implementation Plan</span>
                      </h5>
                      <div className="nexa-prose text-xs sm:text-sm text-text leading-relaxed bg-background-elevated border border-border-subtle p-3.5 sm:p-4 rounded-lg">
                        <LazyMarkdown>{helpData}</LazyMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default TaskEPIExplanation;
