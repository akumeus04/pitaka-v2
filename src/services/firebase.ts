/**
 * Firebase Realtime Database & Google Authentication Service
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  push, 
  remove, 
  off,
  Database
} from 'firebase/database';

import { 
  IncomeItem, 
  ExpenseItem, 
  LoanItem, 
  AllowanceItem, 
  BillReminderItem 
} from '../types';
import { backupToGAS } from './gas';
import { DEFAULT_PHP_RATE } from './currency';

export const firebaseConfig = {
  apiKey: "AIzaSyAc46X6MIXI-moZ2oTy2ShiDv6IrjhVQC4",
  authDomain: "finance-app-23309.firebaseapp.com",
  databaseURL: "https://finance-app-23309-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "finance-app-23309",
  storageBucket: "finance-app-23309.firebasestorage.app",
  messagingSenderId: "268979076437",
  appId: "1:268979076437:web:204abafc00e7558f4e83dc",
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db: Database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// SHA-256 Hash of allowed account from original main.js
export const ALLOWED_EMAIL_HASH = "24a8875545b9c0867169cc58a471fd522134a0c8ac795110f4111a9fbdae7d14";

export async function hashEmail(email: string): Promise<string> {
  if (!email) return "";
  try {
    const msgBuffer = new TextEncoder().encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return "";
  }
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<User> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Realtime synchronization listeners from Firebase RTDB
 */
export function startFirebaseSync(callbacks: {
  onIncomeChange: (items: IncomeItem[]) => void;
  onExpensesChange: (items: ExpenseItem[]) => void;
  onLoansChange: (items: LoanItem[]) => void;
  onAllowancesChange: (items: AllowanceItem[]) => void;
  onTodosChange: (items: BillReminderItem[]) => void;
  onBudgetLimitChange: (limit: number) => void;
  liveRate?: number;
}) {
  const rate = callbacks.liveRate || DEFAULT_PHP_RATE;

  // 1. Income Listener
  const incomeRef = ref(db, 'income');
  onValue(incomeRef, (snapshot) => {
    const items: IncomeItem[] = [];
    snapshot.forEach((child) => {
      const p = child.val();
      if (p) {
        items.push({
          id: p.id || child.key || `inc-${Date.now()}`,
          entryDate: p.entryDate || p['Entry Date'] || new Date().toISOString().split('T')[0],
          applicableMonth: p.applicableMonth || p['Applicable Month'] || '',
          description: p.description || p['Description'] || '',
          amount: parseFloat(p.amount || p['Amount (SAR)'] || 0),
          category: p.category || 'Salary',
          notes: p.notes || p['Notes'] || '',
        });
      }
    });
    if (items.length > 0) {
      callbacks.onIncomeChange(items);
    }
  });

  // 2. Expenses Listener
  const expRef = ref(db, 'expenses');
  onValue(expRef, (snapshot) => {
    const items: ExpenseItem[] = [];
    snapshot.forEach((child) => {
      const p = child.val();
      if (p) {
        const totalAmount = parseFloat(p.totalAmount || p['Total Amount'] || 0);
        const curr = (p.currency || p['Currency'] || 'SAR') as 'SAR' | 'PHP';
        const monthlySAR = curr === 'SAR' ? totalAmount : totalAmount / rate;

        items.push({
          id: p.id || child.key || `exp-${Date.now()}`,
          entryDate: p.entryDate || p['Entry Date'] || new Date().toISOString().split('T')[0],
          startMonth: p.startMonth || p['Start Month'] || '',
          description: p.description || p['Description'] || '',
          duration: parseInt(p.duration || p['Duration (Months)'] || 1, 10),
          currency: curr,
          totalAmount,
          monthlyDeductionSAR: parseFloat(p.monthlyDeductionSAR || p['Monthly Deduction (SAR)'] || monthlySAR),
          category: p.category || 'Utilities',
          status: p.status || p['Status'] || 'Pending',
          notes: p.notes || p['Notes'] || '',
        });
      }
    });
    if (items.length > 0) {
      callbacks.onExpensesChange(items);
    }
  });

  // 3. Loans Listener
  const loansRef = ref(db, 'loans');
  onValue(loansRef, (snapshot) => {
    const items: LoanItem[] = [];
    snapshot.forEach((child) => {
      const p = child.val();
      if (p) {
        const totalAmount = parseFloat(p.totalAmount || p['Total Amount'] || 0);
        const curr = (p.currency || p['Currency'] || 'SAR') as 'SAR' | 'PHP';
        const monthlySAR = curr === 'SAR' ? totalAmount : totalAmount / rate;

        items.push({
          id: p.id || child.key || `loan-${Date.now()}`,
          entryDate: p.entryDate || p['Entry Date'] || new Date().toISOString().split('T')[0],
          startMonth: p.startMonth || p['Start Month'] || '',
          description: p.description || p['Description'] || '',
          lender: p.lender || '',
          duration: parseInt(p.duration || p['Duration (Months)'] || 1, 10),
          currency: curr,
          totalAmount,
          monthlyDeductionSAR: parseFloat(p.monthlyDeductionSAR || p['Monthly Deduction (SAR)'] || monthlySAR),
          status: p.status || p['Status'] || 'In-Process',
          notes: p.notes || p['Notes'] || '',
          interestRate: p.interestRate ? parseFloat(p.interestRate) : undefined,
          currentPaymentNumber: p.currentPaymentNumber ? parseInt(p.currentPaymentNumber, 10) : 1,
          dueDayOfMonth: p.dueDayOfMonth ? parseInt(p.dueDayOfMonth, 10) : 25,
          category: p.category || 'Personal',
        });
      }
    });
    if (items.length > 0) {
      callbacks.onLoansChange(items);
    }
  });

  // 4. Allowances Listener
  const alwRef = ref(db, 'allowances');
  onValue(alwRef, (snapshot) => {
    const items: AllowanceItem[] = [];
    snapshot.forEach((child) => {
      const p = child.val();
      if (p) {
        let parsedBreakdown = [];
        if (typeof p.breakdown === 'string') {
          try {
            parsedBreakdown = JSON.parse(p.breakdown);
          } catch {
            parsedBreakdown = [];
          }
        } else if (Array.isArray(p.breakdown)) {
          parsedBreakdown = p.breakdown;
        }

        const totalDays = parseInt(p.totalDays || p['Total Workdays'] || 0, 10);
        const dailyAmount = parseFloat(p.dailyAmount || p['Daily Amount (PHP)'] || 0);

        items.push({
          id: p.id || child.key || `alw-${Date.now()}`,
          entryDate: p.entryDate || p['Entry Date'] || new Date().toISOString().split('T')[0],
          allowanceMonth: p.allowanceMonth || p['Allowance Month'] || '',
          studentName: p.studentName || p['Student Name'] || '',
          startDate: p.startDate || p['Start Date'] || '',
          endDate: p.endDate || p['End Date'] || '',
          totalWorkdays: totalDays,
          dailyAmountPHP: dailyAmount,
          breakdown: parsedBreakdown,
          totalPHP: parseFloat(p.totalPHP || p['Total PHP'] || (totalDays * dailyAmount)),
          status: p.status || p['Status'] || 'Pending',
          notes: p.notes || '',
        });
      }
    });
    if (items.length > 0) {
      callbacks.onAllowancesChange(items);
    }
  });

  // 5. Todos & Reminders Listener
  const todoRef = ref(db, 'todos');
  onValue(todoRef, (snapshot) => {
    const items: BillReminderItem[] = [];
    snapshot.forEach((child) => {
      const p = child.val();
      if (p) {
        items.push({
          id: p.id || child.key || `todo-${Date.now()}`,
          name: p.name || p.description || '',
          description: p.description || p.summary || '',
          amount: parseFloat(p.amount || 0),
          currency: (p.currency as 'SAR' | 'PHP') || 'SAR',
          dueDate: p.startDate || p.dueDate || new Date().toISOString().split('T')[0],
          recurringMonths: parseInt(p.duration || p.recurringMonths || 1, 10),
          status: p.status || 'Pending',
          relatedLoanId: p.relatedLoanId,
          category: p.category || 'Debt Installment',
        });
      }
    });
    if (items.length > 0) {
      callbacks.onTodosChange(items);
    }
  });

  // 6. Settings (Budget Limit)
  const budgetRef = ref(db, 'settings/monthlyBudgetLimit');
  onValue(budgetRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null && !isNaN(parseFloat(val))) {
      callbacks.onBudgetLimitChange(parseFloat(val));
    }
  });

  return () => {
    off(incomeRef);
    off(expRef);
    off(loansRef);
    off(alwRef);
    off(todoRef);
    off(budgetRef);
  };
}

/**
 * Dual-save helpers: updates Firebase RTDB immediately and triggers GAS backup
 */

export async function saveItemToFirebaseAndGAS(
  type: 'income' | 'expenses' | 'loans' | 'allowances' | 'todos',
  item: Record<string, unknown>
): Promise<string> {
  const itemRef = item.id ? ref(db, `${type}/${item.id}`) : push(ref(db, type));
  const finalId = (item.id as string) || itemRef.key || `${type}-${Date.now()}`;
  const payload = { ...item, id: finalId };

  // 1. Firebase save
  await set(itemRef, payload);

  // 2. Google Apps Script backup
  const sheetMap: Record<string, 'Income' | 'Expenses' | 'Loans' | 'Allowances'> = {
    income: 'Income',
    expenses: 'Expenses',
    loans: 'Loans',
    allowances: 'Allowances',
  };

  if (sheetMap[type]) {
    backupToGAS(sheetMap[type], payload);
  }

  return finalId;
}

export async function deleteItemFromFirebase(type: string, id: string): Promise<void> {
  const targetRef = ref(db, `${type}/${id}`);
  await remove(targetRef);
}

export async function saveBudgetLimitToFirebase(limit: number): Promise<void> {
  const budgetRef = ref(db, 'settings/monthlyBudgetLimit');
  await set(budgetRef, limit);
}
