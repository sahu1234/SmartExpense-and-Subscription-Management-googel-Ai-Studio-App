import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Download, Pause, Play, Edit3, Trash2, Calendar, CreditCard, Tag } from 'lucide-react';
import { Category, ExpenseType, FinanceItem } from '../types/finance';
import { formatINR, calculateMonthlyEquivalent, formatCycleLabel, getCategoryMeta } from '../utils/formatters';

interface ItemListProps {
  items: FinanceItem[];
  onToggleStatus: (id: string) => void;
  onEditItem: (item: FinanceItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenAddModal: () => void;
  selectedCategoryFilter?: Category | null;
  onClearCategoryFilter?: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  onToggleStatus,
  onEditItem,
  onDeleteItem,
  onOpenAddModal,
  selectedCategoryFilter,
  onClearCategoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'subscription' | 'daily'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'date' | 'name'>('highest');

  // Filter & sort
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter from drill-down
      if (selectedCategoryFilter && item.category !== selectedCategoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) ?? false;
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesName && !matchesCategory && !matchesNotes && !matchesTags) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && item.type === 'subscription' && !item.isActive) {
        return false;
      }
      if (statusFilter === 'paused' && item.type === 'subscription' && item.isActive) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'highest') {
        const costA = calculateMonthlyEquivalent(a.amount, a.billingCycle, a.type);
        const costB = calculateMonthlyEquivalent(b.amount, b.billingCycle, b.type);
        return costB - costA;
      }
      if (sortBy === 'lowest') {
        const costA = calculateMonthlyEquivalent(a.amount, a.billingCycle, a.type);
        const costB = calculateMonthlyEquivalent(b.amount, b.billingCycle, b.type);
        return costA - costB;
      }
      if (sortBy === 'date') {
        return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [items, searchQuery, typeFilter, statusFilter, sortBy, selectedCategoryFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Type', 'Amount (INR)', 'Billing Cycle', 'Monthly Equivalent', 'Category', 'Payment Method', 'Renewal/Date', 'Status', 'Notes'];
    const rows = filteredItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.type,
      item.amount,
      item.billingCycle,
      calculateMonthlyEquivalent(item.amount, item.billingCycle, item.type),
      item.category,
      item.paymentMethod,
      item.renewalDate,
      item.type === 'subscription' ? (item.isActive ? 'Active' : 'Paused') : 'Paid',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subtrack_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 sm:p-6 transition-all">
      {/* Header with Title and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Ledger & Subscription Records</h2>
            {selectedCategoryFilter && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                <span>Category: {selectedCategoryFilter}</span>
                <button
                  onClick={onClearCategoryFilter}
                  className="hover:text-emerald-200 ml-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage active commitments, adjust billing details, or pause items
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
          title="Export current view to CSV"
        >
          <Download className="w-3.5 h-3.5 text-neutral-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, tag, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Type Filter */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'all' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('subscription')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'subscription' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setTypeFilter('daily')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'daily' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Daily
            </button>
          </div>

          {/* Status Filter */}
          {typeFilter !== 'daily' && (
            <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === 'all' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === 'active' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('paused')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === 'paused' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Paused
              </button>
            </div>
          )}

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-neutral-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="highest">Highest Spend</option>
              <option value="lowest">Lowest Spend</option>
              <option value="date">Due Date</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table / Item List */}
      <div className="mt-4 overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-xs text-neutral-400 font-medium">No expenses or subscriptions match your criteria.</p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              Add New Record
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60 border-t border-neutral-800/60">
            {filteredItems.map((item) => {
              const monthlyCost = calculateMonthlyEquivalent(item.amount, item.billingCycle, item.type);
              const meta = getCategoryMeta(item.category);
              const isPaused = item.type === 'subscription' && !item.isActive;

              return (
                <div
                  key={item.id}
                  className={`py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-950/40 rounded transition-colors ${
                    isPaused ? 'opacity-55' : ''
                  }`}
                >
                  {/* Left Column: Item details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                        title={item.category}
                      />
                      <h3 className="text-sm font-semibold text-neutral-100 truncate">
                        {item.name}
                      </h3>
                      {item.type === 'subscription' && (
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {isPaused ? '(Paused)' : '(Active)'}
                        </span>
                      )}
                    </div>

                    {/* Unboxed Metadata with Typographic Separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{item.category}</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span>{item.paymentMethod}</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span>
                        {item.type === 'subscription' ? 'Renews ' : 'Logged '}
                        {new Date(item.renewalDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <>
                          <span aria-hidden="true" className="text-neutral-600">·</span>
                          <span className="text-neutral-500">{item.tags.join(', ')}</span>
                        </>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Pricing & Quick Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/40">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-bold font-mono text-neutral-100 tabular-nums">
                        {formatINR(item.amount)}
                        <span className="text-xs font-normal text-neutral-500 font-sans">
                          {item.type === 'subscription' ? formatCycleLabel(item.billingCycle) : ''}
                        </span>
                      </div>
                      {item.type === 'subscription' && item.billingCycle !== 'monthly' && (
                        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                          ≈ {formatINR(monthlyCost)}/mo
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {item.type === 'subscription' && (
                        <button
                          onClick={() => onToggleStatus(item.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            item.isActive
                              ? 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800'
                              : 'text-amber-400 hover:text-emerald-400 hover:bg-neutral-800'
                          }`}
                          title={item.isActive ? 'Pause Subscription' : 'Resume Subscription'}
                        >
                          {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
