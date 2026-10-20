import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { BillingCycle, Category, ExpenseType, FinanceItem, PaymentMethod } from '../types/finance';
import { CATEGORY_DEFINITIONS, formatINR, calculateMonthlyEquivalent } from '../utils/formatters';
import { POPULAR_INDIAN_PRESETS, PresetService } from '../data/seedData';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<FinanceItem>) => void;
  editingItem: FinanceItem | null;
}

const ALL_CATEGORIES: Category[] = [
  'Entertainment',
  'Cloud & SaaS',
  'Food & Dining',
  'Utilities & Bills',
  'Fitness & Health',
  'Shopping',
  'Transport',
  'Work & Productivity',
  'Education',
  'Personal',
];

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Auto-Debit',
];

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [type, setType] = useState<ExpenseType>('subscription');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<Category>('Entertainment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setName(editingItem.name);
      setAmount(editingItem.amount.toString());
      setBillingCycle(editingItem.billingCycle);
      setCategory(editingItem.category);
      setPaymentMethod(editingItem.paymentMethod);
      setRenewalDate(editingItem.renewalDate);
      setAutoRenew(editingItem.autoRenew ?? true);
      setNotes(editingItem.notes || '');
      setTagsInput(editingItem.tags?.join(', ') || '');
      setErrorMsg('');
    } else {
      // Default reset
      setType('subscription');
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      setCategory('Entertainment');
      setPaymentMethod('UPI');
      setRenewalDate(new Date().toISOString().split('T')[0]);
      setAutoRenew(true);
      setNotes('');
      setTagsInput('');
      setErrorMsg('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: PresetService) => {
    setName(preset.name);
    setAmount(preset.amount.toString());
    setBillingCycle(preset.billingCycle);
    setCategory(preset.category);
    setPaymentMethod(preset.defaultPaymentMethod);
    setNotes(preset.notes);
    setTagsInput(preset.tags.join(', '));
    setType('subscription');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim()) {
      setErrorMsg('Please enter a service or expense name.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount in INR (₹).');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: name.trim(),
      type,
      amount: parsedAmount,
      billingCycle: type === 'daily' ? 'monthly' : billingCycle,
      category,
      paymentMethod,
      renewalDate,
      isActive: editingItem ? editingItem.isActive : true,
      autoRenew: type === 'subscription' ? autoRenew : false,
      notes: notes.trim(),
      tags,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    });

    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const monthlyCalc = calculateMonthlyEquivalent(parsedAmount, billingCycle, type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
              {editingItem ? 'Edit Expense Record' : 'Add Expense or Subscription'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter details in INR (₹) to track on your dashboard and Vibe Check
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popular Indian Presets Carousel (only when creating new subscription) */}
        {!editingItem && (
          <div className="py-3 border-b border-neutral-800">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Popular Indian Presets</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POPULAR_INDIAN_PRESETS.slice(0, 7).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {preset.name.split(' ')[0]} ({formatINR(preset.amount)})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {/* Expense Type Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Entry Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('subscription')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'subscription'
                    ? 'bg-neutral-800 text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                Recurring Subscription
              </button>
              <button
                type="button"
                onClick={() => setType('daily')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'daily'
                    ? 'bg-neutral-800 text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                One-Off / Daily Expense
              </button>
            </div>
          </div>

          {/* Name & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Name / Merchant *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Cult.fit, Swiggy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Amount in INR (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="649"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Cycle & Date Row (Cycle only for subscriptions) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === 'subscription' ? (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (3 months)</option>
                  <option value="yearly">Yearly (Annual)</option>
                  <option value="weekly">Weekly</option>
                </select>
                {parsedAmount > 0 && billingCycle !== 'monthly' && (
                  <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                    Equivalent to {formatINR(monthlyCalc)}/month
                  </span>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Expense Frequency
                </label>
                <input
                  type="text"
                  disabled
                  value="One-off expense this month"
                  className="w-full px-3 py-2 text-xs bg-neutral-950/50 border border-neutral-800/60 rounded-lg text-neutral-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {type === 'subscription' ? 'Next Renewal Date' : 'Date Incurred'}
              </label>
              <input
                type="date"
                required
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Category & Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {ALL_PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags & Auto-Renew */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Streaming, Family, Tools"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {type === 'subscription' && (
              <div className="pt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autoRenewCheck" className="text-xs text-neutral-300 cursor-pointer">
                  Auto-debit mandate enabled
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared with roommates, annual discount"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {editingItem ? 'Save Changes' : 'Add to Tracker'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
