import React from 'react';
import { Plus, Wallet, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { formatINR } from '../utils/formatters';

interface TopNavProps {
  activeTab: 'dashboard' | 'subscriptions' | 'expenses' | 'renewals';
  onTabChange: (tab: 'dashboard' | 'subscriptions' | 'expenses' | 'renewals') => void;
  onOpenAddModal: () => void;
  totalMonthlySpend: number;
  budgetLimit: number;
  user: User | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  authLoading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  totalMonthlySpend,
  budgetLimit,
  user,
  onSignInWithGoogle,
  onSignOut,
  authLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <a 
              href="#dashboard" 
              onClick={(e) => { e.preventDefault(); onTabChange('dashboard'); }}
              className="text-lg font-bold tracking-tight text-neutral-100 hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <span>SubTrack</span>
              <span className="text-xs font-normal text-neutral-500 tracking-normal hidden sm:inline">· Cloud Sync</span>
            </a>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-white border-emerald-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onTabChange('subscriptions')}
              className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'text-white border-emerald-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => onTabChange('expenses')}
              className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'expenses'
                  ? 'text-white border-emerald-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Daily Expenses
            </button>
            <button
              onClick={() => onTabChange('renewals')}
              className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'renewals'
                  ? 'text-white border-emerald-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Renewal Timeline
            </button>
          </nav>

          {/* Zone 3: 1 primary action button + Auth controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Monthly Spend Indicator */}
            <div className="hidden xl:flex items-center text-xs text-neutral-400 gap-2 pr-2">
              <span className="text-neutral-500">Spend:</span>
              <span className="font-mono text-neutral-200 font-semibold tabular-nums">{formatINR(totalMonthlySpend)}</span>
              <span className="text-neutral-600">/</span>
              <span className="font-mono text-neutral-400 tabular-nums">{formatINR(budgetLimit)}</span>
            </div>

            {/* Auth Profile or Sign-in button */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-neutral-300 font-medium max-w-[100px] truncate hidden sm:inline">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={onSignOut}
                      title="Sign out of account"
                      className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onSignInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </button>
              )
            )}
            
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-lg transition-all shadow-sm shadow-emerald-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
