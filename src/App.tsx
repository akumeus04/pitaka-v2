import React, { useState, useEffect, useCallback } from 'react';
import { 
  FinancialSummaryMonth, 
  IncomeItem, 
  ExpenseItem, 
  LoanItem, 
  AllowanceItem, 
  BillReminderItem 
} from './types';
import { AppStorage } from './services/storage';
import { fetchLiveExchangeRate, DEFAULT_PHP_RATE } from './services/currency';
import { 
  auth, 
  startFirebaseSync, 
  saveItemToFirebaseAndGAS, 
  deleteItemFromFirebase, 
  saveBudgetLimitToFirebase,
  logoutUser
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { fetchAuxiliaryDataFromGAS, fetchHolidaysFromGAS, backupToGAS } from './services/gas';
import { playReminderChime } from './services/audio';

import { Header } from './components/Header';
import { MonthBrowser } from './components/MonthBrowser';
import { DashboardView } from './components/DashboardView';
import { DebtTrackerView } from './components/DebtTrackerView';
import { VisualAnalyticsView } from './components/VisualAnalyticsView';
import { RemindersView } from './components/RemindersView';
import { ExpensesView } from './components/ExpensesView';
import { IncomeView } from './components/IncomeView';
import { AllowancesView } from './components/AllowancesView';
import { AnnualReportView } from './components/AnnualReportView';
import { MonthSummaryModal } from './components/MonthSummaryModal';
import { CalculatorModal } from './components/CalculatorModal';
import { CalendarModal } from './components/CalendarModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const todayDate = new Date();
  const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;

  // View state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeMonth, setActiveMonth] = useState<string>(currentMonthStr);
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_PHP_RATE);
  const [isRefreshingRate, setIsRefreshingRate] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('pitaka_guest_mode') === '1';
  });

  // Data states from AppStorage
  const [income, setIncome] = useState<IncomeItem[]>(() => AppStorage.getIncome());
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => AppStorage.getExpenses());
  const [loans, setLoans] = useState<LoanItem[]>(() => AppStorage.getLoans());
  const [allowances, setAllowances] = useState<AllowanceItem[]>(() => AppStorage.getAllowances());
  const [todos, setTodos] = useState<BillReminderItem[]>(() => AppStorage.getTodos());
  const [budgetLimit, setBudgetLimit] = useState<number>(() => AppStorage.getBudgetLimit());

  // Privacy & Theme
  const [privacyBlur, setPrivacyBlur] = useState<boolean>(() => {
    return localStorage.getItem('pitakaPrivacyBlur') === '1';
  });
  const [isBlurredAway, setIsBlurredAway] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pitaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modals state
  const [selectedMonthSummary, setSelectedMonthSummary] = useState<FinancialSummaryMonth | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Initialize storage once
  useEffect(() => {
    AppStorage.init();
  }, []);

  // Monitor Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (user) {
        setIsGuestMode(false);
        localStorage.removeItem('pitaka_guest_mode');
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    // Only subscribe if authenticated or if Firebase is active
    let unsubscribeSync: (() => void) | undefined;

    if (currentUser) {
      unsubscribeSync = startFirebaseSync({
        onIncomeChange: (items) => {
          setIncome(items);
          AppStorage.saveIncome(items);
        },
        onExpensesChange: (items) => {
          setExpenses(items);
          AppStorage.saveExpenses(items);
        },
        onLoansChange: (items) => {
          setLoans(items);
          AppStorage.saveLoans(items);
        },
        onAllowancesChange: (items) => {
          setAllowances(items);
          AppStorage.saveAllowances(items);
        },
        onTodosChange: (items) => {
          setTodos(items);
          AppStorage.saveTodos(items);
        },
        onBudgetLimitChange: (limit) => {
          setBudgetLimit(limit);
          AppStorage.saveBudgetLimit(limit);
        },
        liveRate: exchangeRate,
      });
    }

    return () => {
      if (unsubscribeSync) unsubscribeSync();
    };
  }, [currentUser, exchangeRate]);

  // Sync theme to root class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('pitaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('pitaka-theme', 'light');
    }
  }, [darkMode]);

  // Sync privacy blur setting
  useEffect(() => {
    localStorage.setItem('pitakaPrivacyBlur', privacyBlur ? '1' : '0');
  }, [privacyBlur]);

  // Fetch live exchange rate
  const handleRefreshExchangeRate = useCallback(async () => {
    setIsRefreshingRate(true);
    const res = await fetchLiveExchangeRate();
    setExchangeRate(res.rate);
    setIsRefreshingRate(false);
  }, []);

  useEffect(() => {
    handleRefreshExchangeRate();
  }, [handleRefreshExchangeRate]);

  // Sync with Google Apps Script
  const handleSyncAll = useCallback(async () => {
    setIsSyncingAll(true);
    try {
      await Promise.allSettled([
        handleRefreshExchangeRate(),
        fetchAuxiliaryDataFromGAS(),
        fetchHolidaysFromGAS(),
      ]);
    } finally {
      setIsSyncingAll(false);
    }
  }, [handleRefreshExchangeRate]);

  // Privacy mouseleave & focus detection
  useEffect(() => {
    if (!privacyBlur) {
      setIsBlurredAway(false);
      return;
    }

    const handleMouseLeave = () => setIsBlurredAway(true);
    const handleMouseEnter = () => setIsBlurredAway(false);
    const handleBlur = () => setIsBlurredAway(true);
    const handleFocus = () => setIsBlurredAway(false);

    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [privacyBlur]);

  // Compute 24-Month Rolling Forecast
  const forecast = AppStorage.computeForecast(exchangeRate);

  // Calculate Overdue & Due Soon counts for header bell
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let overdueCount = 0;
  let dueSoonCount = 0;

  todos.forEach((todo) => {
    if (todo.status !== 'Paid') {
      const [y, m, d] = todo.dueDate.split('-').map(Number);
      const due = new Date(y, m - 1, d);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diff <= 0) {
        overdueCount++;
      } else if (diff <= 5) {
        dueSoonCount++;
      }
    }
  });

  // Keyboard Shortcuts (Alt+1..9, ESC, ArrowLeft/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        setSelectedMonthSummary(null);
        setIsCalculatorOpen(false);
        setIsCalendarOpen(false);
        return;
      }

      if (isInput) return;

      if (e.altKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setCurrentView('dashboard'); break;
          case '2': e.preventDefault(); setCurrentView('debt'); break;
          case '3': e.preventDefault(); setCurrentView('analytics'); break;
          case '4': e.preventDefault(); setCurrentView('reminders'); break;
          case '5': e.preventDefault(); setCurrentView('expenses'); break;
          case '6': e.preventDefault(); setCurrentView('loans'); break;
          case '7': e.preventDefault(); setCurrentView('income'); break;
          case '8': e.preventDefault(); setCurrentView('allowance'); break;
          case '9': e.preventDefault(); setCurrentView('report'); break;
          case 'p':
          case 'P':
            e.preventDefault();
            setPrivacyBlur((prev) => !prev);
            break;
        }
      } else {
        if (e.key === 'ArrowLeft') {
          const [y, m] = activeMonth.split('-').map(Number);
          let newM = m - 1;
          let newY = y;
          if (newM < 1) { newM = 12; newY--; }
          setActiveMonth(`${newY}-${String(newM).padStart(2, '0')}`);
        } else if (e.key === 'ArrowRight') {
          const [y, m] = activeMonth.split('-').map(Number);
          let newM = m + 1;
          let newY = y;
          if (newM > 12) { newM = 1; newY++; }
          setActiveMonth(`${newY}-${String(newM).padStart(2, '0')}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMonth]);

  // Dual-Save CRUD Handlers: Firebase Realtime Database + Google Apps Script
  const handleAddExpense = async (newExp: Omit<ExpenseItem, 'id'>) => {
    const tempId = `exp-${Date.now()}`;
    const item: ExpenseItem = { ...newExp, id: tempId };
    const next = [...expenses, item];
    setExpenses(next);
    AppStorage.saveExpenses(next);

    try {
      await saveItemToFirebaseAndGAS('expenses', item as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual save to Firebase/GAS logged:', e);
    }
  };

  const handleUpdateExpense = async (updatedExp: ExpenseItem) => {
    const next = expenses.map((e) => (e.id === updatedExp.id ? updatedExp : e));
    setExpenses(next);
    AppStorage.saveExpenses(next);

    try {
      await saveItemToFirebaseAndGAS('expenses', updatedExp as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual update to Firebase/GAS logged:', e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    AppStorage.saveExpenses(next);

    try {
      await deleteItemFromFirebase('expenses', id);
    } catch (e) {
      console.warn('Firebase delete logged:', e);
    }
  };

  const handleAddLoan = async (newLoan: Omit<LoanItem, 'id'>) => {
    const tempId = `loan-${Date.now()}`;
    const item: LoanItem = { ...newLoan, id: tempId };
    const next = [...loans, item];
    setLoans(next);
    AppStorage.saveLoans(next);

    try {
      await saveItemToFirebaseAndGAS('loans', item as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual save to Firebase/GAS logged:', e);
    }
  };

  const handleUpdateLoan = async (updatedLoan: LoanItem) => {
    const next = loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l));
    setLoans(next);
    AppStorage.saveLoans(next);

    try {
      await saveItemToFirebaseAndGAS('loans', updatedLoan as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual update to Firebase/GAS logged:', e);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    const next = loans.filter((l) => l.id !== id);
    setLoans(next);
    AppStorage.saveLoans(next);

    try {
      await deleteItemFromFirebase('loans', id);
    } catch (e) {
      console.warn('Firebase delete logged:', e);
    }
  };

  const handleAddIncome = async (newInc: Omit<IncomeItem, 'id'>) => {
    const tempId = `inc-${Date.now()}`;
    const item: IncomeItem = { ...newInc, id: tempId };
    const next = [...income, item];
    setIncome(next);
    AppStorage.saveIncome(next);

    try {
      await saveItemToFirebaseAndGAS('income', item as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual save to Firebase/GAS logged:', e);
    }
  };

  const handleUpdateIncome = async (updatedInc: IncomeItem) => {
    const next = income.map((i) => (i.id === updatedInc.id ? updatedInc : i));
    setIncome(next);
    AppStorage.saveIncome(next);

    try {
      await saveItemToFirebaseAndGAS('income', updatedInc as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual update to Firebase/GAS logged:', e);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    const next = income.filter((i) => i.id !== id);
    setIncome(next);
    AppStorage.saveIncome(next);

    try {
      await deleteItemFromFirebase('income', id);
    } catch (e) {
      console.warn('Firebase delete logged:', e);
    }
  };

  const handleDuplicateAllIncomeToNextMonth = async () => {
    const currentList = income.filter((inc) => (inc.applicableMonth || '').startsWith(activeMonth));
    if (currentList.length === 0) {
      alert('There are no income entries in this month to duplicate!');
      return;
    }

    const [y, m] = activeMonth.split('-').map(Number);
    let nextM = m + 1;
    let nextY = y;
    if (nextM > 12) { nextM = 1; nextY++; }
    const nextMonthStr = `${nextY}-${String(nextM).padStart(2, '0')}`;

    const proceed = confirm(`Copy ${currentList.length} income entries from ${activeMonth} into ${nextMonthStr}?`);
    if (!proceed) return;

    const duplicated: IncomeItem[] = currentList.map((inc, i) => ({
      ...inc,
      id: `inc-${Date.now()}-${i}`,
      applicableMonth: nextMonthStr,
      entryDate: todayDate.toISOString().split('T')[0],
    }));

    const next = [...income, ...duplicated];
    setIncome(next);
    AppStorage.saveIncome(next);
    setActiveMonth(nextMonthStr);

    for (const item of duplicated) {
      saveItemToFirebaseAndGAS('income', item as unknown as Record<string, unknown>);
    }
  };

  const handleAddAllowance = async (newAlw: Omit<AllowanceItem, 'id'>) => {
    const tempId = `alw-${Date.now()}`;
    const item: AllowanceItem = { ...newAlw, id: tempId };
    const next = [...allowances, item];
    setAllowances(next);
    AppStorage.saveAllowances(next);

    try {
      await saveItemToFirebaseAndGAS('allowances', {
        ...item,
        breakdown: JSON.stringify(item.breakdown),
      } as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual save to Firebase/GAS logged:', e);
    }
  };

  const handleUpdateAllowance = async (updatedAlw: AllowanceItem) => {
    const next = allowances.map((a) => (a.id === updatedAlw.id ? updatedAlw : a));
    setAllowances(next);
    AppStorage.saveAllowances(next);

    try {
      await saveItemToFirebaseAndGAS('allowances', {
        ...updatedAlw,
        breakdown: JSON.stringify(updatedAlw.breakdown),
      } as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual update to Firebase/GAS logged:', e);
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    const next = allowances.filter((a) => a.id !== id);
    setAllowances(next);
    AppStorage.saveAllowances(next);

    try {
      await deleteItemFromFirebase('allowances', id);
    } catch (e) {
      console.warn('Firebase delete logged:', e);
    }
  };

  const handleAddReminder = async (newRem: Omit<BillReminderItem, 'id'>) => {
    const tempId = `todo-${Date.now()}`;
    const item: BillReminderItem = { ...newRem, id: tempId };
    const next = [...todos, item];
    setTodos(next);
    AppStorage.saveTodos(next);

    try {
      await saveItemToFirebaseAndGAS('todos', item as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual save to Firebase/GAS logged:', e);
    }
  };

  const handleUpdateReminder = async (updatedRem: BillReminderItem) => {
    const next = todos.map((t) => (t.id === updatedRem.id ? updatedRem : t));
    setTodos(next);
    AppStorage.saveTodos(next);

    try {
      await saveItemToFirebaseAndGAS('todos', updatedRem as unknown as Record<string, unknown>);
    } catch (e) {
      console.warn('Dual update to Firebase/GAS logged:', e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const next = todos.filter((t) => t.id !== id);
    setTodos(next);
    AppStorage.saveTodos(next);

    try {
      await deleteItemFromFirebase('todos', id);
    } catch (e) {
      console.warn('Firebase delete logged:', e);
    }
  };

  const handleMarkReminderPaid = async (reminder: BillReminderItem) => {
    const updated = { ...reminder, status: 'Paid' as const };
    await handleUpdateReminder(updated);

    if (reminder.relatedLoanId) {
      const targetLoan = loans.find((l) => l.id === reminder.relatedLoanId);
      if (targetLoan) {
        const nextNum = (targetLoan.currentPaymentNumber || 0) + 1;
        await handleUpdateLoan({
          ...targetLoan,
          currentPaymentNumber: nextNum,
          status: nextNum >= targetLoan.duration ? 'Paid' : targetLoan.status,
        });
      }
    }
  };

  const handleUpdateBudgetLimit = async (limit: number) => {
    setBudgetLimit(limit);
    AppStorage.saveBudgetLimit(limit);
    try {
      await saveBudgetLimitToFirebase(limit);
    } catch (e) {
      console.warn('Budget limit firebase sync logged:', e);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out of your wallet?')) {
      await logoutUser();
      setCurrentUser(null);
      setIsGuestMode(false);
      localStorage.removeItem('pitaka_guest_mode');
    }
  };

  // If auth has not resolved yet or user is neither logged in nor in guest mode, show Login Screen
  const showLogin = authChecked && !currentUser && !isGuestMode;

  return (
    <div className={`min-h-screen flex flex-col ${privacyBlur && isBlurredAway ? 'select-none' : ''}`}>
      
      {/* Restored Google Login Screen */}
      {showLogin && (
        <LoginScreen
          onSuccess={() => {
            setIsGuestMode(false);
            localStorage.removeItem('pitaka_guest_mode');
          }}
          onContinueAsGuest={() => {
            setIsGuestMode(true);
            localStorage.setItem('pitaka_guest_mode', '1');
          }}
        />
      )}

      {/* Privacy Blur Overlay Screen */}
      {privacyBlur && isBlurredAway && (
        <div 
          onClick={() => setIsBlurredAway(false)}
          className="fixed inset-0 z-[100] backdrop-blur-2xl bg-slate-900/40 flex items-center justify-center p-4 cursor-pointer text-center text-white"
        >
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl max-w-sm space-y-2">
            <span className="text-3xl block">🙈</span>
            <h3 className="font-bold text-base">Privacy Shield Active</h3>
            <p className="text-xs text-slate-300">
              Numbers hidden while cursor is away. Move mouse back or click anywhere to unblur.
            </p>
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        privacyBlur={privacyBlur}
        onTogglePrivacyBlur={() => setPrivacyBlur(!privacyBlur)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
        onOpenReminders={() => setCurrentView('reminders')}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onRefreshRate={handleRefreshExchangeRate}
        isRefreshingRate={isRefreshingRate}
        exchangeRate={exchangeRate}
        userEmail={currentUser?.email || (isGuestMode ? 'Guest Mode' : null)}
        onLogout={handleLogout}
        onSyncAll={handleSyncAll}
        isSyncingAll={isSyncingAll}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Month Browser (Hidden on Dashboard, Analytics, Annual Report) */}
        {currentView !== 'dashboard' && currentView !== 'analytics' && currentView !== 'report' && (
          <MonthBrowser
            activeMonth={activeMonth}
            onMonthChange={setActiveMonth}
            onResetToCurrentMonth={() => setActiveMonth(currentMonthStr)}
            currentMonth={currentMonthStr}
          />
        )}

        {/* View Switcher */}
        {currentView === 'dashboard' && (
          <DashboardView
            forecast={forecast}
            budgetLimit={budgetLimit}
            onUpdateBudgetLimit={handleUpdateBudgetLimit}
            onSelectMonthSummary={setSelectedMonthSummary}
            expenses={expenses}
            loans={loans}
            allowances={allowances}
            onNavigateToView={setCurrentView}
          />
        )}

        {currentView === 'debt' && (
          <DebtTrackerView
            loans={loans}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            exchangeRate={exchangeRate}
            activeMonth={activeMonth}
          />
        )}

        {currentView === 'analytics' && (
          <VisualAnalyticsView
            forecast={forecast}
            expenses={expenses}
            loans={loans}
            allowances={allowances}
            exchangeRate={exchangeRate}
            activeMonth={activeMonth}
          />
        )}

        {currentView === 'reminders' && (
          <RemindersView
            reminders={todos}
            loans={loans}
            onAddReminder={handleAddReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
            onMarkPaid={handleMarkReminderPaid}
            exchangeRate={exchangeRate}
          />
        )}

        {currentView === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            exchangeRate={exchangeRate}
            activeMonth={activeMonth}
          />
        )}

        {currentView === 'loans' && (
          <DebtTrackerView
            loans={loans}
            onAddLoan={handleAddLoan}
            onUpdateLoan={handleUpdateLoan}
            onDeleteLoan={handleDeleteLoan}
            exchangeRate={exchangeRate}
            activeMonth={activeMonth}
          />
        )}

        {currentView === 'income' && (
          <IncomeView
            income={income}
            onAddIncome={handleAddIncome}
            onUpdateIncome={handleUpdateIncome}
            onDeleteIncome={handleDeleteIncome}
            onDuplicateAllToNextMonth={handleDuplicateAllIncomeToNextMonth}
            activeMonth={activeMonth}
            exchangeRate={exchangeRate}
          />
        )}

        {currentView === 'allowance' && (
          <AllowancesView
            allowances={allowances}
            onAddAllowance={handleAddAllowance}
            onUpdateAllowance={handleUpdateAllowance}
            onDeleteAllowance={handleDeleteAllowance}
            activeMonth={activeMonth}
            exchangeRate={exchangeRate}
          />
        )}

        {currentView === 'report' && (
          <AnnualReportView
            expenses={expenses}
            loans={loans}
            exchangeRate={exchangeRate}
          />
        )}

      </main>

      {/* Floating Modals */}
      <MonthSummaryModal
        monthSummary={selectedMonthSummary}
        onClose={() => setSelectedMonthSummary(null)}
        exchangeRate={exchangeRate}
        expenses={expenses}
        loans={loans}
        allowances={allowances}
      />

      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        exchangeRate={exchangeRate}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        reminders={todos}
        loans={loans}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Pitaka Wallet</span>
            <span>· Dual-Currency Financial Ledger &amp; Debt Amortization Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const json = AppStorage.exportJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pitaka-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="hover:text-teal-600 transition-colors"
            >
              Export JSON Backup
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (confirm('Reset all records to initial realistic demo data?')) {
                  AppStorage.resetToSeed();
                  window.location.reload();
                }
              }}
              className="hover:text-rose-600 transition-colors"
            >
              Reset Sample Data
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
