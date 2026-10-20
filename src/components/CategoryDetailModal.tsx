import React from 'react';
import { X, ExternalLink, Pause, Play, Edit3, Trash2 } from 'lucide-react';
import { Category, FinanceItem } from '../types/finance';
import { CATEGORY_DEFINITIONS, formatINR, calculateMonthlyEquivalent, formatCycleLabel } from '../utils/formatters';

interface CategoryDetailModalProps {
  category: Category | null;
  items: FinanceItem[];
  totalMonthlySpend: number;
  onClose: () => void;
  onFilterLedger: (cat: Category) => void;
  onToggleStatus: (id: string) => void;
  onEditItem: (item: FinanceItem) => void;
  onDeleteItem: (id: string) => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  category,
  items,
  totalMonthlySpend,
  onClose,
  onFilterLedger,
  onToggleStatus,
  onEditItem,
  onDeleteItem,
}) => {
  if (!category) return null;

  const categoryItems = items.filter((item) => item.category === category);
  const meta = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS['Personal'];

  const categoryTotalMonthly = categoryItems.reduce((acc, curr) => {
    if (curr.type === 'subscription' && !curr.isActive) return acc;
    return acc + calculateMonthlyEquivalent(curr.amount, curr.billingCycle, curr.type);
  }, 0);

  const percentOfTotal = totalMonthlySpend > 0 ? (categoryTotalMonthly / totalMonthlySpend) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            <div>
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                {category} Breakdown
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'} in this category
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Stat Banner */}
        <div className="py-4 my-2 grid grid-cols-2 gap-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
          <div>
            <div className="text-[11px] font-medium text-neutral-400 uppercase">Monthly Total</div>
            <div className="text-lg font-bold font-mono text-neutral-100 tabular-nums mt-0.5">
              {formatINR(categoryTotalMonthly)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-neutral-400 uppercase">Share of Total Spend</div>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
              {percentOfTotal.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Item List in this category */}
        <div className="mt-4 max-h-[320px] overflow-y-auto divide-y divide-neutral-800/80 pr-1">
          {categoryItems.map((item) => {
            const isPaused = item.type === 'subscription' && !item.isActive;
            const monthlyCost = calculateMonthlyEquivalent(item.amount, item.billingCycle, item.type);

            return (
              <div
                key={item.id}
                className={`py-3 flex items-center justify-between gap-3 ${
                  isPaused ? 'opacity-50' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-200 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                    <span>{item.paymentMethod}</span>
                    <span className="text-neutral-600">·</span>
                    <span>{item.type === 'subscription' ? 'Cycle: ' + item.billingCycle : 'One-off'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-neutral-100 tabular-nums">
                      {formatINR(item.amount)}
                      <span className="text-[10px] font-normal text-neutral-500 font-sans">
                        {item.type === 'subscription' ? formatCycleLabel(item.billingCycle) : ''}
                      </span>
                    </div>
                    {item.type === 'subscription' && item.billingCycle !== 'monthly' && (
                      <div className="text-[10px] font-mono text-neutral-400 tabular-nums">
                        ≈ {formatINR(monthlyCost)}/mo
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {item.type === 'subscription' && (
                      <button
                        onClick={() => onToggleStatus(item.id)}
                        className="p-1 text-neutral-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                        title={item.isActive ? 'Pause' : 'Resume'}
                      >
                        {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        onEditItem(item);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-200 rounded transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => {
              onFilterLedger(category);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Filter main ledger for this category</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
