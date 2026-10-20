import React from 'react';
import { Calendar, CheckCircle2, Clock, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { FinanceItem } from '../types/finance';
import { formatINR, calculateDaysUntil, formatCycleLabel, getCategoryMeta } from '../utils/formatters';

interface RenewalsTimelineProps {
  items: FinanceItem[];
  onRenewItem: (id: string) => void;
  onEditItem: (item: FinanceItem) => void;
}

export const RenewalsTimeline: React.FC<RenewalsTimelineProps> = ({
  items,
  onRenewItem,
  onEditItem,
}) => {
  // Only active subscriptions sorted by renewal date
  const upcomingRenewals = items
    .filter((i) => i.type === 'subscription' && i.isActive)
    .map((item) => ({
      ...item,
      daysUntil: calculateDaysUntil(item.renewalDate),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const getUrgencyBadge = (days: number) => {
    if (days < 0) {
      return (
        <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-900/60 px-2 py-0.5 rounded">
          Overdue ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="text-xs font-mono text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded animate-pulse font-semibold">
          Due Today
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-medium">
          Due in {days} {days === 1 ? 'day' : 'days'}
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="text-xs font-mono text-yellow-300 bg-yellow-950/40 border border-yellow-800/40 px-2 py-0.5 rounded">
          Due in {days} days
        </span>
      );
    }
    return (
      <span className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
        In {days} days
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div>
          <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Renewal Schedule & Auto-Debits</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Upcoming debits ordered by calendar due date
          </p>
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Next 30 Days Forecast</span>
        </div>
      </div>

      {upcomingRenewals.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          No upcoming active subscription renewals.
        </div>
      ) : (
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingRenewals.map((sub) => {
            const meta = getCategoryMeta(sub.category);
            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-neutral-400 font-medium truncate">
                      {sub.category}
                    </span>
                    {getUrgencyBadge(sub.daysUntil)}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-neutral-100 truncate pr-2">
                      {sub.name}
                    </h3>
                    <div className="text-sm font-bold font-mono text-neutral-100 tabular-nums shrink-0">
                      {formatINR(sub.amount)}
                      <span className="text-[11px] font-normal text-neutral-500 font-sans">
                        {formatCycleLabel(sub.billingCycle)}
                      </span>
                    </div>
                  </div>

                  {sub.notes && (
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
                      {sub.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{sub.paymentMethod}</span>
                  </div>

                  <button
                    onClick={() => onRenewItem(sub.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 rounded transition-colors cursor-pointer"
                    title="Mark as paid and advance to next renewal cycle"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Mark Paid</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
