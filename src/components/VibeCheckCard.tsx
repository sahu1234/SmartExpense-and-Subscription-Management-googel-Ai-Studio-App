import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, Sliders, TrendingDown, ArrowUpRight, Sparkles, PauseCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinanceItem, VibeAnalysis } from '../types/finance';
import { formatINR, calculateMonthlyEquivalent } from '../utils/formatters';

interface VibeCheckCardProps {
  vibe: VibeAnalysis;
  onUpdateBudget: (newBudget: number) => void;
  items: FinanceItem[];
  onToggleStatus: (id: string) => void;
  onOpenCoach?: () => void;
}

export const VibeCheckCard: React.FC<VibeCheckCardProps> = ({
  vibe,
  onUpdateBudget,
  items,
  onToggleStatus,
  onOpenCoach,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(vibe.budgetLimit.toString());

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tempBudget.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateBudget(parsed);
      setIsEditingBudget(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
      });
    } catch {
      // Fallback safe if canvas-confetti is not rendered
    }
  };

  // Find non-essential active subscriptions that could be paused to save money if over or near budget
  const pausableSubscriptions = items
    .filter(i => i.type === 'subscription' && i.isActive && (i.category === 'Entertainment' || i.category === 'Shopping' || i.category === 'Food & Dining'))
    .sort((a, b) => {
      const mA = calculateMonthlyEquivalent(a.amount, a.billingCycle, a.type);
      const mB = calculateMonthlyEquivalent(b.amount, b.billingCycle, b.type);
      return mB - mA;
    });

  const getVibeStyles = () => {
    switch (vibe.state) {
      case 'panic':
        return {
          containerBorder: 'border-rose-900/60 bg-neutral-900/90',
          accentColor: 'text-rose-400',
          barColor: 'bg-rose-500',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
          statusLabel: 'Budget Breach',
          badgeClass: 'text-rose-400 bg-rose-950/60 border border-rose-800/50',
          glowClass: 'shadow-lg shadow-rose-950/30',
        };
      case 'spicy':
        return {
          containerBorder: 'border-amber-900/60 bg-neutral-900/90',
          accentColor: 'text-amber-400',
          barColor: 'bg-amber-500',
          icon: <Flame className="w-5 h-5 text-amber-400 shrink-0" />,
          statusLabel: 'Spicy Threshold',
          badgeClass: 'text-amber-400 bg-amber-950/60 border border-amber-800/50',
          glowClass: 'shadow-lg shadow-amber-950/30',
        };
      case 'chill':
      default:
        return {
          containerBorder: 'border-emerald-900/60 bg-neutral-900/90',
          accentColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          statusLabel: 'Chill Vibe',
          badgeClass: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50',
          glowClass: 'shadow-lg shadow-emerald-950/30',
        };
    }
  };

  const style = getVibeStyles();
  const cappedProgress = Math.min(100, vibe.percentUsed);

  return (
    <div className={`rounded-xl border ${style.containerBorder} ${style.glowClass} p-5 sm:p-6 transition-all duration-300 relative overflow-hidden`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Spending Vibe Check</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${style.badgeClass}`}>
                {style.statusLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live burn-rate vs. your ₹{vibe.budgetLimit.toLocaleString('en-IN')} target
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">₹</span>
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-28 pl-6 pr-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempBudget(vibe.budgetLimit.toString());
                setIsEditingBudget(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800/60 hover:bg-neutral-800 rounded border border-neutral-700/60 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Change Budget</span>
            </button>
          )}

          {onOpenCoach && (
            <button
              onClick={onOpenCoach}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-950/90 rounded border border-emerald-800/50 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Coach Tips</span>
            </button>
          )}

          {vibe.state === 'chill' && (
            <button
              onClick={triggerConfetti}
              title="Celebrate staying in budget"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950/80 rounded border border-emerald-800/40 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Celebrate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Status & Metrics Grid */}
      <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Column: Progress & Status */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-neutral-200">{vibe.headline}</span>
            <span className="font-mono text-sm font-bold text-neutral-100 tabular-nums">
              {vibe.percentUsed}%
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/80">
            <div
              className={`h-full transition-all duration-500 rounded-full ${style.barColor}`}
              style={{ width: `${cappedProgress}%` }}
            />
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {vibe.subtext}
          </p>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-neutral-500">
            <span>Quick presets:</span>
            {[15000, 25000, 35000, 50000].map((preset) => (
              <button
                key={preset}
                onClick={() => onUpdateBudget(preset)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  vibe.budgetLimit === preset
                    ? 'bg-neutral-800 text-neutral-200 font-semibold border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                ₹{(preset / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Key Diagnostic Figures */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 p-3 bg-neutral-950/60 rounded-lg border border-neutral-800/70">
          <div>
            <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Remaining Cap</div>
            <div className="text-base sm:text-lg font-bold font-mono text-neutral-100 tabular-nums mt-0.5">
              {formatINR(vibe.remainingBudget)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {vibe.daysRemainingInMonth} days left in month
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Safe Daily Burn</div>
            <div className={`text-base sm:text-lg font-bold font-mono tabular-nums mt-0.5 ${
              vibe.safeDailyBurn === 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formatINR(vibe.safeDailyBurn)}<span className="text-xs font-normal text-neutral-400">/day</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Daily avg: {formatINR(vibe.currentDailyAverage)}
            </div>
          </div>
        </div>
      </div>

      {/* Guillotine / Cut-to-Save Optimizer when over or near budget */}
      {(vibe.state === 'panic' || vibe.state === 'spicy') && pausableSubscriptions.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-neutral-800/70">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Recommended Cost Savers (Instant Budget Relief)</span>
            </div>
            <span className="text-[11px] text-neutral-500">Pause to instantly recoup budget</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {pausableSubscriptions.slice(0, 3).map((sub) => {
              const monthlyCost = calculateMonthlyEquivalent(sub.amount, sub.billingCycle, sub.type);
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-neutral-200 truncate">{sub.name}</div>
                    <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      {formatINR(monthlyCost)}/mo
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleStatus(sub.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors whitespace-nowrap cursor-pointer"
                    title={`Pause ${sub.name}`}
                  >
                    <PauseCircle className="w-3 h-3 text-amber-400" />
                    <span>Pause</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
