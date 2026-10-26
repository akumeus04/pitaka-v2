export type Currency = 'SAR' | 'PHP';

export type PaymentStatus = 'Pending' | 'In-Process' | 'Paid' | 'Cancelled';

export interface IncomeItem {
  id: string;
  entryDate: string; // YYYY-MM-DD
  applicableMonth: string; // YYYY-MM
  description: string;
  amount: number; // in SAR
  category: 'Salary' | 'Bonus' | 'Freelance' | 'Investment' | 'Other';
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  entryDate: string; // YYYY-MM-DD
  startMonth: string; // YYYY-MM
  description: string;
  duration: number; // in months
  currency: Currency;
  totalAmount: number; // amount in chosen currency
  monthlyDeductionSAR: number;
  category: 'Housing' | 'Utilities' | 'Groceries' | 'Transportation' | 'Healthcare' | 'Education' | 'Entertainment' | 'Insurance' | 'Subscriptions' | 'Other';
  status: PaymentStatus;
  notes?: string;
  seriesId?: string; // for auto-split series
  installmentIndex?: number;
  installmentTotal?: number;
}

export interface LoanItem {
  id: string;
  entryDate: string; // YYYY-MM-DD
  startMonth: string; // YYYY-MM
  description: string; // e.g. "Car Loan"
  lender?: string; // e.g. "Al Rajhi Bank"
  duration: number; // total duration in months
  currency: Currency;
  totalAmount: number; // total loan amount or remaining
  monthlyDeductionSAR: number;
  status: PaymentStatus;
  notes?: string;
  interestRate?: number; // annual percentage rate (e.g. 3.5%)
  currentPaymentNumber?: number; // e.g. 6 out of 24
  dueDayOfMonth?: number; // e.g. 25
  category: 'Personal' | 'Vehicle' | 'Mortgage' | 'Credit Card' | 'Family' | 'Other';
}

export interface AllowanceCategory {
  name: string;
  amount: number; // daily PHP
}

export interface AllowanceItem {
  id: string;
  entryDate: string;
  allowanceMonth: string; // YYYY-MM
  studentName: string;
  startDate: string; // YYYY-MM-DD (typically 26th of prev month)
  endDate: string; // YYYY-MM-DD (typically 25th of curr month)
  totalWorkdays: number;
  dailyAmountPHP: number;
  breakdown: AllowanceCategory[];
  totalPHP: number;
  status: PaymentStatus;
  notes?: string;
}

export interface BillReminderItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: Currency;
  dueDate: string; // YYYY-MM-DD
  recurringMonths: number;
  status: 'Pending' | 'In-Process' | 'Paid';
  relatedLoanId?: string;
  category: 'Debt Installment' | 'Utility' | 'Subscription' | 'Allowance' | 'Other';
  lastNotifiedDate?: string;
  snoozedUntil?: string;
}

export interface FinancialSummaryMonth {
  monthStr: string; // YYYY-MM
  displayMonth: string; // e.g. "Nov 2026"
  incomeSAR: number;
  expensesSAR: number;
  loansSAR: number;
  allowancesSAR: number;
  totalObligationsSAR: number;
  netBalanceSAR: number;
  isOverBudget: boolean;
  isCurrentMonth: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'ph' | 'sa' | 'flight' | 'personal' | 'debt';
  desc?: string;
  amount?: number;
  currency?: Currency;
}

export interface CalculationHistoryItem {
  id: string;
  expr: string;
  result: string;
  at: number;
}
