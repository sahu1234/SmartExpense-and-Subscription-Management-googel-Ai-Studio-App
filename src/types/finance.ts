export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ExpenseType = 'subscription' | 'daily';

export type Category = 
  | 'Entertainment'
  | 'Cloud & SaaS'
  | 'Food & Dining'
  | 'Utilities & Bills'
  | 'Fitness & Health'
  | 'Shopping'
  | 'Transport'
  | 'Work & Productivity'
  | 'Education'
  | 'Personal';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Auto-Debit';

export interface FinanceItem {
  id: string;
  userId?: string;
  name: string;
  type: ExpenseType;
  amount: number; // in INR
  billingCycle: BillingCycle; // default 'monthly' for daily
  category: Category;
  paymentMethod: PaymentMethod;
  renewalDate: string; // ISO date YYYY-MM-DD
  isActive: boolean; // applicable to subscriptions
  autoRenew?: boolean;
  notes?: string;
  tags?: string[];
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export interface CategoryMeta {
  name: Category;
  color: string; // hex
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: string;
}

export type VibeState = 'chill' | 'spicy' | 'panic';

export interface VibeAnalysis {
  state: VibeState;
  percentUsed: number;
  totalMonthlySpend: number;
  budgetLimit: number;
  remainingBudget: number;
  daysRemainingInMonth: number;
  safeDailyBurn: number;
  currentDailyAverage: number;
  headline: string;
  subtext: string;
}
