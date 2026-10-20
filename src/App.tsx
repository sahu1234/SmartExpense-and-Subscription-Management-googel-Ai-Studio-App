import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
  subscribeToUserExpenses,
  subscribeToUserProfile,
  saveExpenseItem,
  deleteExpenseItem,
  saveUserProfile,
  seedUserInitialData,
} from './services/expenseFirestore';
import { TopNav } from './components/TopNav';
import { SummaryCards } from './components/SummaryCards';
import { VibeCheckCard } from './components/VibeCheckCard';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RenewalsTimeline } from './components/RenewalsTimeline';
import { ItemList } from './components/ItemList';
import { AddEditModal } from './components/AddEditModal';
import { CategoryDetailModal } from './components/CategoryDetailModal';
import { SavingsCoachModal } from './components/SavingsCoachModal';
import { Category, FinanceItem } from './types/finance';
import { INITIAL_FINANCE_ITEMS } from './data/seedData';
import { calculateMonthlyEquivalent, analyzeVibe, formatINR } from './utils/formatters';
import { RotateCcw, Cloud, CloudOff, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'subtrack_finance_items_v1';
const STORAGE_KEY_BUDGET = 'subtrack_budget_limit_v1';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local fallback state
  const [items, setItems] = useState<FinanceItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_FINANCE_ITEMS;
  });

  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (stored) return parseInt(stored, 10);
    } catch {
      // ignore
    }
    return 25000;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscriptions' | 'expenses' | 'renewals'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  // 1. Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync when User is Logged In
  useEffect(() => {
    if (!user) {
      // Save to localStorage when logged out
      try {
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
        localStorage.setItem(STORAGE_KEY_BUDGET, budgetLimit.toString());
      } catch {
        // ignore
      }
      return;
    }

    setSyncStatus('syncing');

    // Subscribe to user's private expenses collection in Firestore
    const unsubExpenses = subscribeToUserExpenses(
      user.uid,
      async (remoteItems) => {
        if (remoteItems.length === 0) {
          // If first time login, seed their cloud database with initial sample items so they aren't blank
          await seedUserInitialData(user.uid);
        } else {
          setItems(remoteItems);
          setSyncStatus('saved');
        }
      },
      (err) => {
        console.error('Error fetching expenses from Firestore:', err);
        setSyncStatus('error');
        setErrorMessage('Failed to sync expenses with cloud database.');
      }
    );

    // Subscribe to user's profile and budget preferences in Firestore
    const unsubProfile = subscribeToUserProfile(
      user.uid,
      async (profile) => {
        if (profile && profile.budgetLimit) {
          setBudgetLimit(profile.budgetLimit);
        } else {
          // Save default profile
          await saveUserProfile(user.uid, {
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            budgetLimit: budgetLimit || 25000,
          });
        }
      },
      (err) => {
        console.error('Error fetching user profile:', err);
      }
    );

    return () => {
      unsubExpenses();
      unsubProfile();
    };
  }, [user]);

  // Compute total monthly spend
  const totalMonthlySpend = useMemo(() => {
    return items.reduce((acc, curr) => {
      if (curr.type === 'subscription' && !curr.isActive) return acc;
      return acc + calculateMonthlyEquivalent(curr.amount, curr.billingCycle, curr.type);
    }, 0);
  }, [items]);

  // Vibe Analysis computation
  const vibe = useMemo(() => {
    return analyzeVibe(totalMonthlySpend, budgetLimit);
  }, [totalMonthlySpend, budgetLimit]);

  // Handlers for Authentication
  const handleSignInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      setErrorMessage(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Initialize or update user profile in Firestore
        await saveUserProfile(result.user.uid, {
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          budgetLimit: budgetLimit,
        });
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err?.message || 'Could not sign in with Google. Please try again.');
      setSyncStatus('idle');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSyncStatus('idle');
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  // Handlers for Database & State
  const handleSaveItem = async (savedData: Partial<FinanceItem>) => {
    setSyncStatus('syncing');
    const now = new Date().toISOString();
    
    if (editingItem) {
      const updated: FinanceItem = {
        ...editingItem,
        ...savedData,
        userId: user?.uid,
        updatedAt: now,
      } as FinanceItem;

      if (user) {
        await saveExpenseItem(user.uid, updated);
      } else {
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
        setSyncStatus('saved');
      }
    } else {
      const newItem: FinanceItem = {
        ...savedData,
        id: savedData.id || `item-${Date.now()}`,
        userId: user?.uid,
        createdAt: now,
        updatedAt: now,
      } as FinanceItem;

      if (user) {
        await saveExpenseItem(user.uid, newItem);
      } else {
        setItems((prev) => [newItem, ...prev]);
        setSyncStatus('saved');
      }
    }
    setEditingItem(null);
  };

  const handleToggleStatus = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updated = { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() };
    if (user) {
      await saveExpenseItem(user.uid, updated);
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (user) {
      await deleteExpenseItem(user.uid, id);
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleRenewItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const current = new Date(item.renewalDate);
    if (item.billingCycle === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (item.billingCycle === 'quarterly') {
      current.setMonth(current.getMonth() + 3);
    } else if (item.billingCycle === 'yearly') {
      current.setFullYear(current.getFullYear() + 1);
    } else {
      current.setMonth(current.getMonth() + 1);
    }

    const updated = {
      ...item,
      renewalDate: current.toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    if (user) {
      await saveExpenseItem(user.uid, updated);
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setBudgetLimit(newBudget);
    if (user) {
      await saveUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        budgetLimit: newBudget,
      });
    }
  };

  const handleResetToSampleData = async () => {
    if (window.confirm('Reset tracker to default sample data?')) {
      if (user) {
        // Re-seed cloud database
        await seedUserInitialData(user.uid);
        await saveUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          budgetLimit: 25000,
        });
      } else {
        setItems(INITIAL_FINANCE_ITEMS);
        setBudgetLimit(25000);
      }
      setSelectedCategoryFilter(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleEditItem = (item: FinanceItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Strict 3-Zone Top Navigation with Google Auth */}
      <TopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'subscriptions' || tab === 'expenses') {
            setSelectedCategoryFilter(null);
          }
        }}
        onOpenAddModal={handleOpenAddModal}
        totalMonthlySpend={totalMonthlySpend}
        budgetLimit={budgetLimit}
        user={user}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
        authLoading={authLoading}
      />

      {/* Cloud Sync Status Strip */}
      <div className="bg-neutral-900/50 border-b border-neutral-800/60 py-1.5 px-4 sm:px-6 lg:px-8 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {user ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Connected to Cloud Database · Signed in as <strong className="text-neutral-200">{user.email}</strong>
              </span>
              <span className="text-neutral-600 hidden sm:inline">·</span>
              <span className="text-neutral-400 hidden sm:inline">Changes save privately across all your devices</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-neutral-400">
                <CloudOff className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>Operating in Local Storage mode.</span>
                <span className="text-neutral-500 hidden sm:inline">Sign in to save and access your expenses anywhere.</span>
              </div>
              <button
                onClick={handleSignInWithGoogle}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer ml-2 whitespace-nowrap"
              >
                Sign in with Google →
              </button>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono self-start sm:self-auto">
              {syncStatus === 'syncing' && <span>Syncing...</span>}
              {syncStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  Synced
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error banner if any */}
      {errorMessage && (
        <div className="bg-rose-950/70 border-b border-rose-800 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Workspace Sub-header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400 font-mono tracking-wide uppercase">
              Financial Control Panel · {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight mt-1">
              Smart Subscription & Expense Tracker
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCoachOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 text-xs font-semibold transition-all shadow-sm shadow-emerald-950/50 hover:shadow-emerald-900/50 active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Savings Coach</span>
            </button>

            {/* Quick tab switcher on mobile/tablet */}
            <div className="flex md:hidden items-center p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs font-medium overflow-x-auto scrollbar-none">
              {(['dashboard', 'subscriptions', 'expenses', 'renewals'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer capitalize ${
                    activeTab === tab
                      ? 'bg-neutral-800 text-neutral-100 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top Summary Stat Dashboard */}
        <SummaryCards
          items={items}
          totalMonthlySpend={totalMonthlySpend}
          budgetLimit={budgetLimit}
          onFilterUpcoming={() => setActiveTab('renewals')}
          onFilterSubscriptions={() => setActiveTab('subscriptions')}
          onFilterExpenses={() => setActiveTab('expenses')}
        />

        {/* 'Vibe Check' Card */}
        <VibeCheckCard
          vibe={vibe}
          onUpdateBudget={handleUpdateBudget}
          items={items}
          onToggleStatus={handleToggleStatus}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        {/* Primary Workspace Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <CategoryBreakdown
              items={items}
              onSelectCategory={(cat) => setSelectedCategoryForDetail(cat)}
            />

            <RenewalsTimeline
              items={items}
              onRenewItem={handleRenewItem}
              onEditItem={handleEditItem}
            />

            <ItemList
              items={items}
              onToggleStatus={handleToggleStatus}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onOpenAddModal={handleOpenAddModal}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
            />
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-8">
            <RenewalsTimeline
              items={items}
              onRenewItem={handleRenewItem}
              onEditItem={handleEditItem}
            />
            <ItemList
              items={items.filter((i) => i.type === 'subscription')}
              onToggleStatus={handleToggleStatus}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onOpenAddModal={handleOpenAddModal}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-8">
            <CategoryBreakdown
              items={items.filter((i) => i.type === 'daily')}
              onSelectCategory={(cat) => setSelectedCategoryForDetail(cat)}
            />
            <ItemList
              items={items.filter((i) => i.type === 'daily')}
              onToggleStatus={handleToggleStatus}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onOpenAddModal={handleOpenAddModal}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
            />
          </div>
        )}

        {activeTab === 'renewals' && (
          <div className="space-y-8">
            <RenewalsTimeline
              items={items}
              onRenewItem={handleRenewItem}
              onEditItem={handleEditItem}
            />
            <ItemList
              items={items.filter((i) => i.type === 'subscription' && i.isActive)}
              onToggleStatus={handleToggleStatus}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onOpenAddModal={handleOpenAddModal}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>SubTrack India</span>
            <span aria-hidden="true">·</span>
            <span>All amounts in INR (₹)</span>
            <span aria-hidden="true">·</span>
            <span>{user ? 'Google Cloud Firestore Real-time Sync' : 'Local Storage Mode'}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetToSampleData}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              title="Reset tracker to initial sample Indian subscriptions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Add / Edit Item Modal */}
      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Category Drill-down Detail Modal */}
      <CategoryDetailModal
        category={selectedCategoryForDetail}
        items={items}
        totalMonthlySpend={totalMonthlySpend}
        onClose={() => setSelectedCategoryForDetail(null)}
        onFilterLedger={(cat) => {
          setSelectedCategoryFilter(cat);
          setActiveTab('dashboard');
        }}
        onToggleStatus={handleToggleStatus}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* AI Savings Coach Modal */}
      <SavingsCoachModal
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        items={items}
        budgetLimit={budgetLimit}
        totalMonthlySpend={totalMonthlySpend}
        onSelectCategoryFilter={(cat) => {
          setSelectedCategoryFilter(cat);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
}
