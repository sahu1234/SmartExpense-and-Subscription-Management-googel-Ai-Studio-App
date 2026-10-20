import { BillingCycle, Category, CategoryMeta, ExpenseType, FinanceItem, VibeAnalysis } from '../types/finance';

export const CATEGORY_DEFINITIONS: Record<Category, CategoryMeta> = {
  'Entertainment': {
    name: 'Entertainment',
    color: '#8b5cf6', // Violet
    bgClass: 'bg-violet-950/40',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-800/40',
    icon: 'Film',
  },
  'Cloud & SaaS': {
    name: 'Cloud & SaaS',
    color: '#06b6d4', // Cyan
    bgClass: 'bg-cyan-950/40',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-800/40',
    icon: 'Cloud',
  },
  'Food & Dining': {
    name: 'Food & Dining',
    color: '#f97316', // Orange
    bgClass: 'bg-orange-950/40',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-800/40',
    icon: 'Utensils',
  },
  'Utilities & Bills': {
    name: 'Utilities & Bills',
    color: '#eab308', // Amber/Yellow
    bgClass: 'bg-amber-950/40',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-800/40',
    icon: 'Zap',
  },
  'Fitness & Health': {
    name: 'Fitness & Health',
    color: '#10b981', // Emerald
    bgClass: 'bg-emerald-950/40',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-800/40',
    icon: 'Activity',
  },
  'Shopping': {
    name: 'Shopping',
    color: '#ec4899', // Pink
    bgClass: 'bg-pink-950/40',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-800/40',
    icon: 'ShoppingBag',
  },
  'Transport': {
    name: 'Transport',
    color: '#3b82f6', // Blue
    bgClass: 'bg-blue-950/40',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-800/40',
    icon: 'Car',
  },
  'Work & Productivity': {
    name: 'Work & Productivity',
    color: '#6366f1', // Indigo
    bgClass: 'bg-indigo-950/40',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-800/40',
    icon: 'Briefcase',
  },
  'Education': {
    name: 'Education',
    color: '#14b8a6', // Teal
    bgClass: 'bg-teal-950/40',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-800/40',
    icon: 'GraduationCap',
  },
  'Personal': {
    name: 'Personal',
    color: '#94a3b8', // Slate
    bgClass: 'bg-slate-900/50',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-800/40',
    icon: 'User',
  },
};

/**
 * Format number into Indian Rupee format (e.g. ₹1,499 or ₹1,25,000)
 */
export function formatINR(val: number, showDecimals: boolean = false): string {
  if (isNaN(val)) return '₹0';
  const rounded = showDecimals ? Math.round(val * 100) / 100 : Math.round(val);
  
  // Use Intl.NumberFormat with en-IN
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rounded);
}

/**
 * Normalizes any billing cycle or expense into monthly equivalent
 */
export function calculateMonthlyEquivalent(amount: number, cycle: BillingCycle, type: ExpenseType): number {
  if (type === 'daily') {
    return amount;
  }
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
}

/**
 * Calculate days remaining in the current calendar month
 */
export function calculateDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(1, lastDay - currentDay + 1);
}

/**
 * Calculate total days in current month
 */
export function getTotalDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

/**
 * Returns difference in days between now and the target date
 */
export function calculateDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  // Set both to midnight for pure day comparison
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the spending "Vibe" based on current monthly spend vs budget
 */
export function analyzeVibe(totalMonthlySpend: number, budgetLimit: number): VibeAnalysis {
  const safeLimit = Math.max(1, budgetLimit);
  const percentUsed = Math.round((totalMonthlySpend / safeLimit) * 100);
  const remainingBudget = Math.max(0, budgetLimit - totalMonthlySpend);
  const daysRemaining = calculateDaysRemainingInMonth();
  const safeDailyBurn = remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;
  const currentDailyAverage = Math.round(totalMonthlySpend / Math.max(1, new Date().getDate()));

  if (percentUsed >= 100) {
    const overBudgetAmount = totalMonthlySpend - budgetLimit;
    return {
      state: 'panic',
      percentUsed,
      totalMonthlySpend,
      budgetLimit,
      remainingBudget: 0,
      daysRemainingInMonth: daysRemaining,
      safeDailyBurn: 0,
      currentDailyAverage,
      headline: `Financial Panic: Over Budget by ${formatINR(overBudgetAmount)}`,
      subtext: `You have spent ${percentUsed}% of your ₹${budgetLimit.toLocaleString('en-IN')} limit with ${daysRemaining} days left. Time to pause non-essential subscriptions!`,
    };
  }

  if (percentUsed >= 75) {
    return {
      state: 'spicy',
      percentUsed,
      totalMonthlySpend,
      budgetLimit,
      remainingBudget,
      daysRemainingInMonth: daysRemaining,
      safeDailyBurn,
      currentDailyAverage,
      headline: `Caution Zone: ${percentUsed}% of Budget Burned`,
      subtext: `You have ${formatINR(remainingBudget)} left for the remaining ${daysRemaining} days (safe pace: ${formatINR(safeDailyBurn)}/day). Watch out for auto-debits.`,
    };
  }

  return {
    state: 'chill',
    percentUsed,
    totalMonthlySpend,
    budgetLimit,
    remainingBudget,
    daysRemainingInMonth: daysRemaining,
    safeDailyBurn,
    currentDailyAverage,
    headline: `Chill Vibe: Well Within Monthly Budget`,
    subtext: `Only ${percentUsed}% spent. You still have ${formatINR(remainingBudget)} unspent budget (${formatINR(safeDailyBurn)}/day safe capacity). Looking clean!`,
  };
}

/**
 * Get category metadata safely
 */
export function getCategoryMeta(cat: Category): CategoryMeta {
  return CATEGORY_DEFINITIONS[cat] || CATEGORY_DEFINITIONS['Personal'];
}

/**
 * Formats a cycle string for UI presentation
 */
export function formatCycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly': return '/week';
    case 'monthly': return '/month';
    case 'quarterly': return '/quarter';
    case 'yearly': return '/year';
  }
}
