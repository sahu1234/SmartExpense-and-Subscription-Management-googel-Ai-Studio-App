import React, { useState } from 'react';
import { PieChart, BarChart2, ChevronRight, Layers } from 'lucide-react';
import { Category, ExpenseType, FinanceItem } from '../types/finance';
import { CATEGORY_DEFINITIONS, formatINR, calculateMonthlyEquivalent } from '../utils/formatters';

interface CategoryBreakdownProps {
  items: FinanceItem[];
  onSelectCategory: (category: Category) => void;
}

interface CategoryStat {
  category: Category;
  totalMonthly: number;
  count: number;
  percentage: number;
  color: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  items,
  onSelectCategory,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'subscription' | 'daily'>('all');
  const [chartMode, setChartMode] = useState<'donut' | 'bar'>('donut');
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

  // Filter items according to scope
  const filteredItems = items.filter((item) => {
    if (item.type === 'subscription' && !item.isActive) return false;
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  // Calculate totals per category
  const categoryMap: Partial<Record<Category, { total: number; count: number }>> = {};
  let overallTotal = 0;

  filteredItems.forEach((item) => {
    const monthlyVal = calculateMonthlyEquivalent(item.amount, item.billingCycle, item.type);
    overallTotal += monthlyVal;
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { total: 0, count: 0 };
    }
    categoryMap[item.category]!.total += monthlyVal;
    categoryMap[item.category]!.count += 1;
  });

  const categoryStats: CategoryStat[] = Object.entries(categoryMap)
    .map(([cat, val]) => {
      const category = cat as Category;
      const totalMonthly = val?.total || 0;
      const count = val?.count || 0;
      const percentage = overallTotal > 0 ? (totalMonthly / overallTotal) * 100 : 0;
      const color = CATEGORY_DEFINITIONS[category]?.color || '#94a3b8';
      return { category, totalMonthly, count, percentage, color };
    })
    .sort((a, b) => b.totalMonthly - a.totalMonthly);

  // SVG Donut calculation
  const radius = 70;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const donutSlices = categoryStats.map((stat) => {
    const strokeDasharray = `${(stat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
    cumulativeAngle += stat.percentage;

    const isHovered = hoveredCategory === stat.category;

    return {
      ...stat,
      strokeDasharray,
      strokeDashoffset,
      isHovered,
    };
  });

  const activeFocusStat = hoveredCategory
    ? categoryStats.find((s) => s.category === hoveredCategory)
    : null;

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 sm:p-6 transition-all">
      {/* Header with Title and Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div>
          <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Category Breakdown</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Normalized monthly distribution across spending verticals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Type Segmented Control */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800/80 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Spend
            </button>
            <button
              onClick={() => setFilterType('subscription')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'subscription'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Recurring
            </button>
            <button
              onClick={() => setFilterType('daily')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'daily'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Daily
            </button>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800/80 text-neutral-400">
            <button
              onClick={() => setChartMode('donut')}
              title="Donut View"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartMode === 'donut' ? 'bg-neutral-800 text-neutral-100' : 'hover:text-neutral-200'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('bar')}
              title="Bar Chart View"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartMode === 'bar' ? 'bg-neutral-800 text-neutral-100' : 'hover:text-neutral-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart and Category Listing */}
      {categoryStats.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          No items found for the selected filter.
        </div>
      ) : (
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Interactive Chart Area */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center min-h-[220px]">
            {chartMode === 'donut' ? (
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                    className="opacity-25"
                  />
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.category}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={slice.isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer origin-center"
                      style={{
                        opacity: hoveredCategory && !slice.isHovered ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => onSelectCategory(slice.category)}
                    />
                  ))}
                </svg>

                {/* Center Insight Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  {activeFocusStat ? (
                    <>
                      <span className="text-[11px] font-medium text-neutral-400 truncate max-w-[120px]">
                        {activeFocusStat.category}
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono text-neutral-100 tabular-nums">
                        {formatINR(activeFocusStat.totalMonthly)}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                        {activeFocusStat.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-neutral-400 font-medium">Total Tracked</span>
                      <span className="text-base sm:text-lg font-bold font-mono text-neutral-100 tabular-nums">
                        {formatINR(overallTotal)}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {filteredItems.length} active items
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Bar mode view */
              <div className="w-full space-y-3 py-2">
                <div className="text-xs text-neutral-400 font-medium pb-1 flex justify-between">
                  <span>Relative Volume</span>
                  <span>Share</span>
                </div>
                {categoryStats.slice(0, 5).map((stat) => (
                  <div 
                    key={stat.category} 
                    className="space-y-1 cursor-pointer"
                    onClick={() => onSelectCategory(stat.category)}
                    onMouseEnter={() => setHoveredCategory(stat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-200 font-medium truncate">{stat.category}</span>
                      <span className="font-mono text-neutral-300 tabular-nums">{formatINR(stat.totalMonthly)}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-neutral-500 mt-2 text-center">
              Click any category to filter and inspect items
            </div>
          </div>

          {/* Category List & Percentage Bars */}
          <div className="lg:col-span-7 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {categoryStats.map((stat) => {
              const isHovered = hoveredCategory === stat.category;
              return (
                <div
                  key={stat.category}
                  onMouseEnter={() => setHoveredCategory(stat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory(stat.category)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-neutral-800/80 border-neutral-700 shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800/60 hover:bg-neutral-900/80 hover:border-neutral-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-200 truncate">
                        {stat.category}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {stat.count} {stat.count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-neutral-100 tabular-nums">
                        {formatINR(stat.totalMonthly)}
                        <span className="text-[10px] font-normal text-neutral-500 font-sans">/mo</span>
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {stat.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};
