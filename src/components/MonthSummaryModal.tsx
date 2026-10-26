import React from 'react';
import { X, ArrowRight, ShieldCheck, DollarSign, Wallet } from 'lucide-react';
import { FinancialSummaryMonth, ExpenseItem, LoanItem, AllowanceItem } from '../types';
import { formatCurrency, formatSAR, formatPHP } from '../services/currency';

interface MonthSummaryModalProps {
  monthSummary: FinancialSummaryMonth | null;
  onClose: () => void;
  exchangeRate: number;
  expenses: ExpenseItem[];
  loans: LoanItem[];
  allowances: AllowanceItem[];
}

export const MonthSummaryModal: React.FC<MonthSummaryModalProps> = ({
  monthSummary,
  onClose,
  exchangeRate,
  expenses,
  loans,
  allowances,
}) => {
  if (!monthSummary) return null;

  const targetMonthStr = monthSummary.monthStr;
  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  const parseMonth = (mStr: string) => {
    const [y, m] = mStr.split('-').map(Number);
    return y * 12 + m;
  };
  const targetInt = parseMonth(targetMonthStr);

  const isActiveInMonth = (item: ExpenseItem | LoanItem) => {
    if (item.status === 'Cancelled') return false;
    const rawStart = (item.startMonth || '').trim().substring(0, 7);
    if (!rawStart) return false;
    const startInt = parseMonth(rawStart);
    const duration = item.duration || 1;
    return targetInt >= startInt && targetInt < startInt + duration;
  };

  const activeExpenses = expenses.filter(isActiveInMonth);
  const activeLoans = loans.filter(isActiveInMonth);
  const activeAllowances = allowances.filter(
    (a) => a.status !== 'Cancelled' && (a.allowanceMonth || '').startsWith(targetMonthStr)
  );

  // Separate PHP vs SAR obligations
  let sarObligations = 0;
  let phpObligations = 0;

  activeExpenses.forEach((item) => {
    if (item.currency === 'PHP') {
      phpObligations += item.totalAmount || 0;
    } else {
      sarObligations += item.monthlyDeductionSAR || 0;
    }
  });

  activeLoans.forEach((item) => {
    if (item.currency === 'PHP') {
      phpObligations += item.totalAmount || 0;
    } else {
      sarObligations += item.monthlyDeductionSAR || 0;
    }
  });

  const allowanceTotalPHP = activeAllowances.reduce((sum, a) => sum + (a.totalPHP || 0), 0);
  const totalCombinedPHP = phpObligations + allowanceTotalPHP;
  const totalCombinedPhpInSAR = totalCombinedPHP / safeRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {monthSummary.displayMonth} Financial Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete breakdown of income, SAR/PHP obligations, and debt burden
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Rates & Balances Header Strip */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider block">
                Live Exchange Rate
              </span>
              <span className="text-sm font-bold font-mono-numbers text-teal-600 dark:text-teal-400">
                1 SAR = {safeRate.toFixed(2)} PHP
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider block">
                New Net Balance
              </span>
              <span className={`text-base font-bold font-mono-numbers ${
                monthSummary.netBalanceSAR >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatSAR(monthSummary.netBalanceSAR)} SAR
              </span>
            </div>
          </div>

          {/* PHP Obligations Bucket */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🇵🇭</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Total PHP Obligations
                </span>
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Expenses, Loans & Allowances
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-xs font-mono-numbers">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Amount in Philippine Pesos:</span>
                <strong className="text-rose-600 dark:text-rose-400 text-sm">
                  {formatPHP(totalCombinedPHP)} PHP
                </strong>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Converted to Saudi Riyal (@ {safeRate.toFixed(2)}):</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatSAR(totalCombinedPhpInSAR)} SAR
                </strong>
              </div>
            </div>
          </div>

          {/* SAR Obligations Bucket */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🇸🇦</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Total SAR Obligations
                </span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Saudi Expenses & Loans
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-xs font-mono-numbers">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Direct SAR Deductions:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatSAR(sarObligations)} SAR
                </strong>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Monthly Inflow / Income:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatSAR(monthSummary.incomeSAR)} SAR
                </strong>
              </div>
            </div>
          </div>

          {/* Active Items Roster */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Active Items in {monthSummary.displayMonth} ({activeExpenses.length + activeLoans.length + activeAllowances.length})
            </h4>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      🏦 {loan.description}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">
                      Loan Installment · {loan.currency}
                    </span>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {formatSAR(loan.monthlyDeductionSAR)} SAR
                    </span>
                    {loan.currency === 'PHP' && (
                      <span className="text-[10px] text-slate-400">
                        ({formatPHP(loan.totalAmount)} PHP)
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {activeExpenses.map((exp) => (
                <div key={exp.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      💸 {exp.description}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {exp.category} · {exp.status}
                    </span>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block">
                      {formatSAR(exp.monthlyDeductionSAR)} SAR
                    </span>
                    {exp.currency === 'PHP' && (
                      <span className="text-[10px] text-slate-400">
                        ({formatPHP(exp.totalAmount)} PHP)
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {activeAllowances.map((alw) => (
                <div key={alw.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      🎓 Allowance: {alw.studentName}
                    </span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400">
                      {alw.totalWorkdays} days @ {alw.dailyAmountPHP} PHP/day
                    </span>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {formatSAR(alw.totalPHP / safeRate)} SAR
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({formatPHP(alw.totalPHP)} PHP)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
