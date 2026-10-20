import React, { useState } from 'react';
import { X, Sparkles, TrendingDown, ArrowRight, RefreshCw, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import { FinanceItem } from '../types/finance';
import { formatINR } from '../utils/formatters';

interface SavingsTip {
  title: string;
  potentialSavings: string;
  category: string;
  advice: string;
  impact: 'high' | 'medium' | 'quick-win';
}

interface CoachResponse {
  coachGreeting: string;
  totalPotentialSavings: string;
  tips: SavingsTip[];
}

interface SavingsCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FinanceItem[];
  budgetLimit: number;
  totalMonthlySpend: number;
  onSelectCategoryFilter: (category: any) => void;
}

export const SavingsCoachModal: React.FC<SavingsCoachModalProps> = ({
  isOpen,
  onClose,
  items,
  budgetLimit,
  totalMonthlySpend,
  onSelectCategoryFilter,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachData, setCoachData] = useState<CoachResponse | null>(null);

  const fetchSavingsTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/savings-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.name,
            type: i.type,
            amount: i.amount,
            billingCycle: i.billingCycle,
            category: i.category,
            paymentMethod: i.paymentMethod,
            isActive: i.isActive,
            notes: i.notes,
          })),
          monthlyBudget: budgetLimit,
          totalMonthlySpend,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate savings coach recommendations');
      }

      const data: CoachResponse = await response.json();
      setCoachData(data);
    } catch (err: any) {
      console.error('Savings Coach fetch error:', err);
      setError(err?.message || 'Unable to connect to AI Savings Coach. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger fetch when opened if no data yet
  React.useEffect(() => {
    if (isOpen && !coachData && !loading) {
      fetchSavingsTips();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getImpactBadge = (impact: SavingsTip['impact']) => {
    switch (impact) {
      case 'high':
        return (
          <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
            High Impact
          </span>
        );
      case 'quick-win':
        return (
          <span className="text-[11px] font-mono font-medium text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
            Quick Win
          </span>
        );
      case 'medium':
      default:
        return (
          <span className="text-[11px] font-mono font-medium text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded">
            Medium Impact
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100 tracking-tight">AI Savings Coach</h2>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Intelligent bill reduction recommendations based on your active spending
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSavingsTips}
              disabled={loading}
              title="Refresh suggestions"
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-4">
          {loading && !coachData ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-medium text-neutral-300">Analyzing your {items.length} subscriptions & expenses...</p>
                <p className="text-[11px] text-neutral-500 mt-1">Cross-referencing Indian plan tiers, bundling opportunities, and overlap</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-rose-400 font-medium">{error}</p>
              <button
                onClick={fetchSavingsTips}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                Retry Analysis
              </button>
            </div>
          ) : coachData ? (
            <div className="space-y-4">
              
              {/* Highlight summary banner */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Coach Assessment</span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                    {coachData.coachGreeting}
                  </p>
                </div>

                <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                  <div className="text-[10px] uppercase font-mono text-neutral-500">Total Potential Relief</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {coachData.totalPotentialSavings}
                  </div>
                </div>
              </div>

              {/* 3 Specific Actionable Tips */}
              <div className="space-y-3">
                {coachData.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                          {tip.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                          {tip.potentialSavings}
                        </span>
                        {getImpactBadge(tip.impact)}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed pl-7">
                      {tip.advice}
                    </p>

                    <div className="pl-7 pt-1 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Category: {tip.category}</span>
                      <button
                        onClick={() => {
                          onSelectCategoryFilter(tip.category);
                          onClose();
                        }}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>Filter {tip.category} in ledger</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Targeting Indian subscription pricing & bundling tiers</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
