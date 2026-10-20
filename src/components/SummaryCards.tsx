import React from 'react';
import { CalendarClock, CreditCard, TrendingUp, Layers, PieChart } from 'lucide-react';
import { FinanceItem } from '../types/finance';
import { formatINR, calculateMonthlyEquivalent, calculateDaysUntil } from '../utils/formatters';

interface SummaryCardsProps {
  items: FinanceItem[];
  totalMonthlySpend: number;
  budgetLimit: number;
  onFilterUpcoming: () => void;
  onFilterSubscriptions: () => void;
  onFilterExpenses: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  items,
  totalMonthlySpend,
  budgetLimit,
  onFilterUpcoming,
  onFilterSubscriptions,
  onFilterExpenses,
}) => {
  // Subscriptions metrics
  const subscriptions = items.filter((i) => i.type === 'subscription');
  const activeSubs = subscriptions.filter((i) => i.isActive);
  const pausedSubsCount = subscriptions.length - activeSubs.length;
  const recurringMonthlyCommitment = activeSubs.reduce(
    (acc, curr) => acc + calculateMonthlyEquivalent(curr.amount, curr.billingCycle, curr.type),
    0
  );
  const annualRunRate = recurringMonthlyCommitment * 12;

  // Daily expenses metrics
  const dailyExpenses = items.filter((i) => i.type === 'daily');
  const dailyExpensesTotal = dailyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Upcoming in next 7 days
  const upcomingIn7Days = activeSubs.filter((i) => {
    const days = calculateDaysUntil(i.renewalDate);
    return days >= 0 && days <= 7;
  });
  const upcomingCost = upcomingIn7Days.reduce((acc, curr) => acc + curr.amount, 0);

  // Highest spending category
  const categoryTotals: Record<string, number> = {};
  items.forEach((item) => {
    if (item.type === 'subscription' && !item.isActive) return;
    const monthlyVal = calculateMonthlyEquivalent(item.amount, item.billingCycle, item.type);
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + monthlyVal;
  });

  let topCategory = 'None';
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amt;
    }
  });

  const topCategoryPercent = totalMonthlySpend > 0 ? Math.round((topCategoryAmount / totalMonthlySpend) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Monthly Spend */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Monthly Spend</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-100 tabular-nums">
              {formatINR(totalMonthlySpend)}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/mo</span>
          </div>
        </div>
        
        <div className="mt-3.5 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Annualized rate:</span>
          <span className="font-mono text-neutral-300 font-medium tabular-nums">
            {formatINR(annualRunRate)}/yr
          </span>
        </div>
      </div>

      {/* 2. Active Subscriptions */}
      <div 
        onClick={onFilterSubscriptions}
        className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between cursor-pointer group"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">
              Active Subscriptions
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-100 tabular-nums">
              {activeSubs.length}
            </span>
            <span className="text-xs text-neutral-500">
              services ({formatINR(recurringMonthlyCommitment)}/mo)
            </span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Status split:</span>
          <span className="text-neutral-300">
            {activeSubs.length} active <span className="text-neutral-600">·</span> {pausedSubsCount} paused
          </span>
        </div>
      </div>

      {/* 3. Upcoming Renewals (Next 7 Days) */}
      <div 
        onClick={onFilterUpcoming}
        className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between cursor-pointer group"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">
              Upcoming Renewals
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-100 tabular-nums">
              {upcomingIn7Days.length}
            </span>
            <span className="text-xs text-neutral-500">
              due in ≤ 7 days
            </span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Upcoming debit:</span>
          <span className="font-mono text-amber-300 font-medium tabular-nums">
            {formatINR(upcomingCost)}
          </span>
        </div>
      </div>

      {/* 4. Top Category Spend */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Top Spend Category</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <PieChart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-neutral-100 truncate">
              {topCategory}
            </span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Category share:</span>
          <span className="font-mono text-violet-300 font-medium tabular-nums">
            {topCategoryPercent}% ({formatINR(topCategoryAmount)})
          </span>
        </div>
      </div>
    </div>
  );
};
