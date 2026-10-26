import React from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Calendar as CalendarIcon, 
  Calculator, 
  BarChart3, 
  Shield, 
  ShieldAlert,
  Coins,
  RefreshCw,
  LogOut,
  User,
  CloudCheck,
  Check
} from 'lucide-react';
import { getDaysUntilPayday } from '../services/holidays';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  privacyBlur: boolean;
  onTogglePrivacyBlur: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  overdueCount: number;
  dueSoonCount: number;
  onOpenReminders: () => void;
  onOpenCalendar: () => void;
  onOpenCalculator: () => void;
  onRefreshRate: () => void;
  isRefreshingRate: boolean;
  exchangeRate: number;
  userEmail: string | null;
  onLogout: () => void;
  onSyncAll: () => void;
  isSyncingAll: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  privacyBlur,
  onTogglePrivacyBlur,
  darkMode,
  onToggleDarkMode,
  overdueCount,
  dueSoonCount,
  onOpenReminders,
  onOpenCalendar,
  onOpenCalculator,
  onRefreshRate,
  isRefreshingRate,
  exchangeRate,
  userEmail,
  onLogout,
  onSyncAll,
  isSyncingAll,
}) => {
  const paydayInfo = getDaysUntilPayday();

  const navItems = [
    { id: 'dashboard', label: '24-Mo Forecast' },
    { id: 'debt', label: 'Debt Tracker' },
    { id: 'analytics', label: 'Visual Analytics' },
    { id: 'reminders', label: 'Debt Reminders' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'loans', label: 'Loans' },
    { id: 'income', label: 'Income' },
    { id: 'allowance', label: 'Allowances' },
    { id: 'report', label: 'Annual Matrix' },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                💳
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Pitaka
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                    SAR/PHP
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-none">
                  Expenses & Debt Tracking
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean, single-line text tabs) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                  {item.id === 'reminders' && (overdueCount > 0 || dueSoonCount > 0) && (
                    <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      overdueCount > 0 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {overdueCount > 0 ? overdueCount : dueSoonCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Functional Utilities & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Payday Counter Pill */}
            <div 
              title="Payday is on the 25th of each month"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                paydayInfo.isPayday
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 animate-bounce'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{paydayInfo.isPayday ? '🎉' : '⏳'}</span>
              <span className="font-semibold tabular-nums">
                {paydayInfo.isPayday ? "It's Payday!" : `${paydayInfo.daysRemaining}d to Payday`}
              </span>
            </div>

            {/* Cloud Sync (Firebase + GAS) button */}
            <button
              onClick={onSyncAll}
              title="Sync live Firebase Realtime Database and Google Sheets / Calendar"
              className="p-2 rounded-lg text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors"
              aria-label="Sync Cloud Data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            {/* Live Exchange Rate Indicator */}
            <button
              onClick={onRefreshRate}
              title={`Live rate: 1 SAR = ${exchangeRate.toFixed(2)} PHP. Click to refresh.`}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400 transition-colors group"
            >
              <Coins className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="font-mono-numbers text-[11px] font-semibold">
                1 SAR = {exchangeRate.toFixed(2)} PHP
              </span>
              <RefreshCw className={`w-3 h-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 ${isRefreshingRate ? 'animate-spin' : ''}`} />
            </button>

            {/* Quick Calculator Shortcut */}
            <button
              onClick={onOpenCalculator}
              title="Open Quick Currency Converter & Calculator"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Calendar Shortcut */}
            <button
              onClick={onOpenCalendar}
              title="Open Financial Calendar (PH & SA Holidays, Debt Due Dates)"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Calendar"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>

            {/* Automated Reminders Bell */}
            <button
              onClick={onOpenReminders}
              title={
                overdueCount > 0 
                  ? `⚠️ ${overdueCount} debt payment(s) PAST DUE!` 
                  : dueSoonCount > 0 
                    ? `⏳ ${dueSoonCount} payment(s) due soon` 
                    : 'Debt Payment Reminders'
              }
              className={`relative p-2 rounded-lg border transition-colors ${
                overdueCount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse'
                  : dueSoonCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              aria-label="Debt Reminders"
            >
              <Bell className="w-4 h-4" />
              {(overdueCount > 0 || dueSoonCount > 0) && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${
                  overdueCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
                }`}>
                  {overdueCount > 0 ? overdueCount : dueSoonCount}
                </span>
              )}
            </button>

            {/* Privacy Blur Toggle */}
            <button
              onClick={onTogglePrivacyBlur}
              title={privacyBlur ? 'Privacy blur is ON (Amounts blurred when mouse leaves)' : 'Privacy blur is OFF'}
              className={`p-2 rounded-lg border transition-colors ${
                privacyBlur
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              aria-label="Toggle Privacy Blur"
            >
              {privacyBlur ? <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <ShieldAlert className="w-4 h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
              <span 
                className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate" 
                title={userEmail ? `Logged in as ${userEmail}` : 'Guest / Demo Mode'}
              >
                {userEmail ? userEmail.split('@')[0] : 'Guest'}
              </span>
              <button
                onClick={onLogout}
                title={userEmail ? `Log out (${userEmail})` : 'Switch account / Login'}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile secondary navigation strip */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentView === item.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
              {item.id === 'reminders' && overdueCount > 0 && (
                <span className="ml-1 text-[10px] text-rose-300 font-bold">({overdueCount})</span>
              )}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
