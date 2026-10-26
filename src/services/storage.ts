import {
  IncomeItem,
  ExpenseItem,
  LoanItem,
  AllowanceItem,
  BillReminderItem,
  CalculationHistoryItem,
  FinancialSummaryMonth,
} from '../types';
import { convertPhpToSar, DEFAULT_PHP_RATE } from './currency';

const STORAGE_KEYS = {
  INCOME: 'pitaka_income_v2',
  EXPENSES: 'pitaka_expenses_v2',
  LOANS: 'pitaka_loans_v2',
  ALLOWANCES: 'pitaka_allowances_v2',
  TODOS: 'pitaka_todos_v2',
  BUDGET_LIMIT: 'pitaka_budget_limit_v2',
  CALC_HISTORY: 'pitaka_calc_history_v2',
  CALC_NOTES: 'pitaka_calc_notes_v2',
  THEME: 'pitaka-theme',
  PRIVACY_BLUR: 'pitakaPrivacyBlur',
};

// Seed dataset representing realistic Saudi Arabia expat personal finances with Philippine remittances & debts
const SEED_INCOME: IncomeItem[] = [
  {
    id: 'inc-1',
    entryDate: '2026-10-25',
    applicableMonth: '2026-10',
    description: 'Aramco Engineering Monthly Base Salary',
    amount: 18500,
    category: 'Salary',
    notes: 'Direct deposit into Al Rajhi Bank',
  },
  {
    id: 'inc-2',
    entryDate: '2026-10-25',
    applicableMonth: '2026-10',
    description: 'Housing Allowance & Remote Stipend',
    amount: 3200,
    category: 'Salary',
    notes: 'Q4 standard housing allocation',
  },
  {
    id: 'inc-3',
    entryDate: '2026-11-25',
    applicableMonth: '2026-11',
    description: 'Aramco Engineering Monthly Base Salary',
    amount: 18500,
    category: 'Salary',
    notes: 'Standard monthly transfer',
  },
  {
    id: 'inc-4',
    entryDate: '2026-11-25',
    applicableMonth: '2026-11',
    description: 'Housing Allowance & Remote Stipend',
    amount: 3200,
    category: 'Salary',
    notes: 'Allocated for apartment rental',
  },
  {
    id: 'inc-5',
    entryDate: '2026-12-25',
    applicableMonth: '2026-12',
    description: 'Aramco Engineering Monthly Base Salary',
    amount: 18500,
    category: 'Salary',
    notes: 'Direct deposit',
  },
  {
    id: 'inc-6',
    entryDate: '2026-12-25',
    applicableMonth: '2026-12',
    description: 'Year-End Performance Bonus',
    amount: 9000,
    category: 'Bonus',
    notes: 'Annual performance milestone payout',
  },
];

const SEED_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    entryDate: '2026-10-01',
    startMonth: '2026-10',
    description: 'Apartment Compound Rent (1/12)',
    duration: 1,
    currency: 'SAR',
    totalAmount: 3800,
    monthlyDeductionSAR: 3800,
    category: 'Housing',
    status: 'Paid',
    notes: 'Khobar Villa Compound flat rental',
    seriesId: 'series-rent',
    installmentIndex: 1,
    installmentTotal: 12,
  },
  {
    id: 'exp-2',
    entryDate: '2026-11-01',
    startMonth: '2026-11',
    description: 'Apartment Compound Rent (2/12)',
    duration: 1,
    currency: 'SAR',
    totalAmount: 3800,
    monthlyDeductionSAR: 3800,
    category: 'Housing',
    status: 'Pending',
    notes: 'Due first week of November',
    seriesId: 'series-rent',
    installmentIndex: 2,
    installmentTotal: 12,
  },
  {
    id: 'exp-3',
    entryDate: '2026-10-05',
    startMonth: '2026-10',
    description: 'SEC Electric & Utilities Bill',
    duration: 1,
    currency: 'SAR',
    totalAmount: 480,
    monthlyDeductionSAR: 480,
    category: 'Utilities',
    status: 'Paid',
    notes: 'AC electricity bill summer peak',
  },
  {
    id: 'exp-4',
    entryDate: '2026-11-05',
    startMonth: '2026-11',
    description: 'SEC Electric & Utilities Bill',
    duration: 1,
    currency: 'SAR',
    totalAmount: 450,
    monthlyDeductionSAR: 450,
    category: 'Utilities',
    status: 'Pending',
    notes: 'Standard bill',
  },
  {
    id: 'exp-5',
    entryDate: '2026-10-10',
    startMonth: '2026-10',
    description: 'Manila Home Fiber Internet (Globe Telecom)',
    duration: 1,
    currency: 'PHP',
    totalAmount: 2899,
    monthlyDeductionSAR: 195.88,
    category: 'Subscriptions',
    status: 'Paid',
    notes: '200 Mbps fiber plan',
  },
  {
    id: 'exp-6',
    entryDate: '2026-11-10',
    startMonth: '2026-11',
    description: 'Manila Home Fiber Internet (Globe Telecom)',
    duration: 1,
    currency: 'PHP',
    totalAmount: 2899,
    monthlyDeductionSAR: 195.88,
    category: 'Subscriptions',
    status: 'Pending',
    notes: 'Auto-debit setup',
  },
  {
    id: 'exp-7',
    entryDate: '2026-10-12',
    startMonth: '2026-10',
    description: 'Tawuniya Health & Vehicle Insurance (1/6)',
    duration: 1,
    currency: 'SAR',
    totalAmount: 620,
    monthlyDeductionSAR: 620,
    category: 'Insurance',
    status: 'Paid',
    notes: 'Comprehensive vehicle & healthcare package',
    installmentIndex: 1,
    installmentTotal: 6,
  },
  {
    id: 'exp-8',
    entryDate: '2026-11-12',
    startMonth: '2026-11',
    description: 'Tawuniya Health & Vehicle Insurance (2/6)',
    duration: 1,
    currency: 'SAR',
    totalAmount: 620,
    monthlyDeductionSAR: 620,
    category: 'Insurance',
    status: 'Pending',
    notes: 'Installment 2 of 6',
    installmentIndex: 2,
    installmentTotal: 6,
  },
];

const SEED_LOANS: LoanItem[] = [
  {
    id: 'loan-car-1',
    entryDate: '2025-06-25',
    startMonth: '2025-06',
    description: 'Al Rajhi Auto Loan - Toyota Fortuner',
    lender: 'Al Rajhi Bank',
    duration: 36,
    currency: 'SAR',
    totalAmount: 68400, // original / remaining
    monthlyDeductionSAR: 1900,
    status: 'In-Process',
    currentPaymentNumber: 17,
    dueDayOfMonth: 27,
    interestRate: 3.2,
    category: 'Vehicle',
    notes: 'Auto-deducted 2 days after payday (27th). Remaining 19 payments.',
  },
  {
    id: 'loan-personal-1',
    entryDate: '2026-01-20',
    startMonth: '2026-01',
    description: 'SNB Personal Consolidation Debt',
    lender: 'Saudi National Bank',
    duration: 24,
    currency: 'SAR',
    totalAmount: 33600,
    monthlyDeductionSAR: 1400,
    status: 'In-Process',
    currentPaymentNumber: 10,
    dueDayOfMonth: 26,
    interestRate: 4.1,
    category: 'Personal',
    notes: 'Debt consolidation plan. On track for early payoff.',
  },
  {
    id: 'loan-bpi-cc',
    entryDate: '2026-08-15',
    startMonth: '2026-08',
    description: 'BPI Gold Visa Card Installment (PHP)',
    lender: 'Bank of the Philippine Islands',
    duration: 12,
    currency: 'PHP',
    totalAmount: 144000,
    monthlyDeductionSAR: 810.81, // 12,000 PHP / 14.8
    status: 'In-Process',
    currentPaymentNumber: 3,
    dueDayOfMonth: 18,
    interestRate: 0.99,
    category: 'Credit Card',
    notes: 'Home renovation appliance 12-month 0% SIP plan (12,000 PHP/mo).',
  },
  {
    id: 'loan-family-lot',
    entryDate: '2026-04-10',
    startMonth: '2026-04',
    description: 'Cavite Subdivision Lot Amortization (PHP)',
    lender: 'Camella Homes Financing',
    duration: 48,
    currency: 'PHP',
    totalAmount: 864000,
    monthlyDeductionSAR: 1216.22, // 18,000 PHP / 14.8
    status: 'In-Process',
    currentPaymentNumber: 7,
    dueDayOfMonth: 20,
    interestRate: 6.5,
    category: 'Mortgage',
    notes: '18,000 PHP monthly amortization for provincial investment lot.',
  },
];

const SEED_ALLOWANCES: AllowanceItem[] = [
  {
    id: 'alw-1',
    entryDate: '2026-10-26',
    allowanceMonth: '2026-10',
    studentName: 'Mateo Vicente (College)',
    startDate: '2026-09-26',
    endDate: '2026-10-25',
    totalWorkdays: 26,
    dailyAmountPHP: 450,
    breakdown: [
      { name: 'Meals & Food Allowance', amount: 250 },
      { name: 'Commute / LRT Transit', amount: 120 },
      { name: 'Mobile Data & Study Materials', amount: 80 },
    ],
    totalPHP: 11700,
    status: 'Paid',
    notes: 'Sent via GCash transfer on Oct 25 payday',
  },
  {
    id: 'alw-2',
    entryDate: '2026-11-26',
    allowanceMonth: '2026-11',
    studentName: 'Mateo Vicente (College)',
    startDate: '2026-10-26',
    endDate: '2026-11-25',
    totalWorkdays: 25,
    dailyAmountPHP: 450,
    breakdown: [
      { name: 'Meals & Food Allowance', amount: 250 },
      { name: 'Commute / LRT Transit', amount: 120 },
      { name: 'Mobile Data & Study Materials', amount: 80 },
    ],
    totalPHP: 11250,
    status: 'Pending',
    notes: 'Scheduled for November 25 payday',
  },
];

const SEED_TODOS: BillReminderItem[] = [
  {
    id: 'todo-1',
    name: 'Al Rajhi Car Loan Monthly Installment',
    description: 'Toyota Fortuner payment #17 of 36',
    amount: 1900,
    currency: 'SAR',
    dueDate: '2026-10-27', // Due today or near!
    recurringMonths: 36,
    status: 'Pending',
    relatedLoanId: 'loan-car-1',
    category: 'Debt Installment',
  },
  {
    id: 'todo-2',
    name: 'SNB Personal Consolidation Debt Payment',
    description: 'Installment #10 of 24 to SNB',
    amount: 1400,
    currency: 'SAR',
    dueDate: '2026-10-26', // Due today
    recurringMonths: 24,
    status: 'Pending',
    relatedLoanId: 'loan-personal-1',
    category: 'Debt Installment',
  },
  {
    id: 'todo-3',
    name: 'BPI Credit Card Installment (Manila)',
    description: '12,000 PHP due date via BPI Online Remittance',
    amount: 12000,
    currency: 'PHP',
    dueDate: '2026-11-05',
    recurringMonths: 12,
    status: 'Pending',
    relatedLoanId: 'loan-bpi-cc',
    category: 'Debt Installment',
  },
  {
    id: 'todo-4',
    name: 'Khobar Apartment Rent November',
    description: 'Handover cheque to landlord management office',
    amount: 3800,
    currency: 'SAR',
    dueDate: '2026-11-01',
    recurringMonths: 12,
    status: 'Pending',
    category: 'Utility',
  },
  {
    id: 'todo-5',
    name: 'Cavite Lot Amortization (Camella)',
    description: '18,000 PHP due date for parcel lot',
    amount: 18000,
    currency: 'PHP',
    dueDate: '2026-11-20',
    recurringMonths: 48,
    status: 'Pending',
    relatedLoanId: 'loan-family-lot',
    category: 'Debt Installment',
  },
];

export class AppStorage {
  private static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // Init storage with seeds if first load
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.INCOME)) {
      this.set(STORAGE_KEYS.INCOME, SEED_INCOME);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      this.set(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) {
      this.set(STORAGE_KEYS.LOANS, SEED_LOANS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALLOWANCES)) {
      this.set(STORAGE_KEYS.ALLOWANCES, SEED_ALLOWANCES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TODOS)) {
      this.set(STORAGE_KEYS.TODOS, SEED_TODOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUDGET_LIMIT)) {
      this.set(STORAGE_KEYS.BUDGET_LIMIT, 7500); // 7,500 SAR monthly threshold
    }
  }

  // Income
  public static getIncome(): IncomeItem[] {
    return this.get<IncomeItem[]>(STORAGE_KEYS.INCOME, SEED_INCOME);
  }
  public static saveIncome(items: IncomeItem[]): void {
    this.set(STORAGE_KEYS.INCOME, items);
  }

  // Expenses
  public static getExpenses(): ExpenseItem[] {
    return this.get<ExpenseItem[]>(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
  }
  public static saveExpenses(items: ExpenseItem[]): void {
    this.set(STORAGE_KEYS.EXPENSES, items);
  }

  // Loans
  public static getLoans(): LoanItem[] {
    return this.get<LoanItem[]>(STORAGE_KEYS.LOANS, SEED_LOANS);
  }
  public static saveLoans(items: LoanItem[]): void {
    this.set(STORAGE_KEYS.LOANS, items);
  }

  // Allowances
  public static getAllowances(): AllowanceItem[] {
    return this.get<AllowanceItem[]>(STORAGE_KEYS.ALLOWANCES, SEED_ALLOWANCES);
  }
  public static saveAllowances(items: AllowanceItem[]): void {
    this.set(STORAGE_KEYS.ALLOWANCES, items);
  }

  // Todos & Bill Reminders
  public static getTodos(): BillReminderItem[] {
    return this.get<BillReminderItem[]>(STORAGE_KEYS.TODOS, SEED_TODOS);
  }
  public static saveTodos(items: BillReminderItem[]): void {
    this.set(STORAGE_KEYS.TODOS, items);
  }

  // Budget Limit
  public static getBudgetLimit(): number {
    return this.get<number>(STORAGE_KEYS.BUDGET_LIMIT, 7500);
  }
  public static saveBudgetLimit(limit: number): void {
    this.set(STORAGE_KEYS.BUDGET_LIMIT, limit);
  }

  // Calculation History
  public static getCalcHistory(): CalculationHistoryItem[] {
    return this.get<CalculationHistoryItem[]>(STORAGE_KEYS.CALC_HISTORY, []);
  }
  public static saveCalcHistory(items: CalculationHistoryItem[]): void {
    this.set(STORAGE_KEYS.CALC_HISTORY, items);
  }

  // Scratchpad
  public static getCalcNotes(): string {
    return localStorage.getItem(STORAGE_KEYS.CALC_NOTES) || '';
  }
  public static saveCalcNotes(notes: string): void {
    localStorage.setItem(STORAGE_KEYS.CALC_NOTES, notes);
  }

  // Reset to default
  public static resetToSeed(): void {
    this.set(STORAGE_KEYS.INCOME, SEED_INCOME);
    this.set(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
    this.set(STORAGE_KEYS.LOANS, SEED_LOANS);
    this.set(STORAGE_KEYS.ALLOWANCES, SEED_ALLOWANCES);
    this.set(STORAGE_KEYS.TODOS, SEED_TODOS);
    this.set(STORAGE_KEYS.BUDGET_LIMIT, 7500);
  }

  // Export full JSON backup
  public static exportJSON(): string {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      income: this.getIncome(),
      expenses: this.getExpenses(),
      loans: this.getLoans(),
      allowances: this.getAllowances(),
      todos: this.getTodos(),
      budgetLimit: this.getBudgetLimit(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import JSON backup
  public static importJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.income)) this.saveIncome(data.income);
      if (Array.isArray(data.expenses)) this.saveExpenses(data.expenses);
      if (Array.isArray(data.loans)) this.saveLoans(data.loans);
      if (Array.isArray(data.allowances)) this.saveAllowances(data.allowances);
      if (Array.isArray(data.todos)) this.saveTodos(data.todos);
      if (typeof data.budgetLimit === 'number') this.saveBudgetLimit(data.budgetLimit);
      return true;
    } catch (e) {
      console.error('Failed to parse import JSON:', e);
      return false;
    }
  }

  /**
   * Exact 24-Month Rolling Forecast Calculation Engine matching dashboard.js
   */
  public static computeForecast(rate: number = DEFAULT_PHP_RATE): FinancialSummaryMonth[] {
    const incomeList = this.getIncome();
    const expensesList = this.getExpenses();
    const loansList = this.getLoans();
    const allowancesList = this.getAllowances();
    const budgetLimit = this.getBudgetLimit();

    const parseMonth = (mStr: string) => {
      const [y, m] = mStr.split('-').map(Number);
      return y * 12 + m;
    };

    // Calculate active burden helper matching calculateActiveBurden()
    const calcBurden = (items: (ExpenseItem | LoanItem)[], targetMonthStr: string): number => {
      const targetInt = parseMonth(targetMonthStr);
      let total = 0;

      items.forEach(item => {
        if (item.status === 'Cancelled') return;
        const rawStart = (item.startMonth || '').trim().substring(0, 7);
        if (!rawStart) return;

        const startInt = parseMonth(rawStart);
        const duration = item.duration || 1;

        if (targetInt >= startInt && targetInt < startInt + duration) {
          total += item.monthlyDeductionSAR || 0;
        }
      });

      return total;
    };

    const results: FinancialSummaryMonth[] = [];
    const dateCursor = new Date();
    dateCursor.setMonth(dateCursor.getMonth() - 1); // Start from last month

    const todayDate = new Date();
    const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;

    for (let i = 0; i < 24; i++) {
      const y = dateCursor.getFullYear();
      const m = String(dateCursor.getMonth() + 1).padStart(2, '0');
      const monthStr = `${y}-${m}`;

      // Income in target month
      const monthIncome = incomeList
        .filter(inc => (inc.applicableMonth || '').trim().startsWith(monthStr))
        .reduce((sum, inc) => sum + (inc.amount || 0), 0);

      // Active expenses and loans
      const monthExp = calcBurden(expensesList, monthStr);
      const monthLoan = calcBurden(loansList, monthStr);

      // Allowances active in month
      const monthAlw = allowancesList
        .filter(alw => {
          if (alw.status === 'Cancelled') return false;
          const raw = (alw.allowanceMonth || '').trim();
          return raw.startsWith(monthStr);
        })
        .reduce((sum, alw) => {
          const totalPHP = alw.totalPHP || 0;
          const sar = convertPhpToSar(totalPHP, rate);
          return sum + sar;
        }, 0);

      const totalObligations = monthExp + monthLoan + monthAlw;
      const netBalance = monthIncome - totalObligations;
      const displayMonth = dateCursor.toLocaleString('default', { month: 'short', year: 'numeric' });

      results.push({
        monthStr,
        displayMonth,
        incomeSAR: monthIncome,
        expensesSAR: monthExp,
        loansSAR: monthLoan,
        allowancesSAR: monthAlw,
        totalObligationsSAR: totalObligations,
        netBalanceSAR: netBalance,
        isOverBudget: totalObligations > budgetLimit,
        isCurrentMonth: monthStr === currentMonthStr,
      });

      dateCursor.setMonth(dateCursor.getMonth() + 1);
    }

    return results;
  }
}
