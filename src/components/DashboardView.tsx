import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  DollarSign, 
  CreditCard, 
  HelpCircle,
  Flag,
  Calendar,
  Layers
} from 'lucide-react';
import { FinancialSummaryMonth, ExpenseItem, LoanItem, AllowanceItem } from '../types';
import { formatSAR, formatCurrency } from '../services/currency';

interface DashboardViewProps {
  forecast: FinancialSummaryMonth[];
  budgetLimit: number;
  onUpdateBudgetLimit: (limit: number) => void;
  onSelectMonthSummary: (month: FinancialSummaryMonth) => void;
  expenses: ExpenseItem[];
  loans: LoanItem[];
  allowances: AllowanceItem[];
  onNavigateToView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  forecast,
  budgetLimit,
  onUpdateBudgetLimit,
  onSelectMonthSummary,
  expenses,
  loans,
  allowances,
  onNavigateToView,
}) => {
  const currentMonthData = forecast.find((f) => f.isCurrentMonth) || forecast[1] || forecast[0];

  const totalMonthlyIncome = currentMonthData ? currentMonthData.incomeSAR : 0;
  const totalMonthlyObligations = currentMonthData ? currentMonthData.totalObligationsSAR : 0;
  const netMonthlyBalance = currentMonthData ? currentMonthData.netBalanceSAR : 0;
  const debtBurdenSAR = currentMonthData ? currentMonthData.loansSAR : 0;
  
  // Debt-to-Income (DTI)
  const dtiRatio = totalMonthlyIncome > 0 
    ? Math.round((debtBurdenSAR / totalMonthlyIncome) * 100) 
    : 0;

  // Active debt items count
  const activeLoansCount = loans.filter((l) => l.status !== 'Cancelled' && l.status !== 'Paid').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Section: Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Income Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Month Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
              {formatSAR(totalMonthlyIncome)} <span className="text-xs font-semibold text-slate-500 font-sans">SAR</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>Aramco base & stipends</span>
            </p>
          </div>
        </div>

        {/* Total Monthly Obligations */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Obligations</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-rose-600 dark:text-rose-400">
              {formatSAR(totalMonthlyObligations)} <span className="text-xs font-semibold text-slate-500 font-sans">SAR</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Expenses + Loans + Allowances
            </p>
          </div>
        </div>

        {/* Debt-to-Income / Active Debt */}
        <div 
          onClick={() => onNavigateToView('debt')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-teal-500 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Monthly Debt Burden
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
              {formatSAR(debtBurdenSAR)} <span className="text-xs font-semibold text-slate-500 font-sans">SAR</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 text-slate-500">
              <span>{activeLoansCount} active loans</span>
              <span className={`font-semibold ${dtiRatio <= 35 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                {dtiRatio}% DTI
              </span>
            </div>
          </div>
        </div>

        {/* Net Discretionary Balance */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Net Balance</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netMonthlyBalance >= 0 
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              {netMonthlyBalance >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold font-mono-numbers ${
              netMonthlyBalance >= 0 
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatSAR(netMonthlyBalance)} <span className="text-xs font-semibold text-slate-500 font-sans">SAR</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {netMonthlyBalance >= 0 ? 'Surplus ready for savings/investments' : 'Deficit - adjustments needed'}
            </p>
          </div>
        </div>

      </div>

      {/* 24-Month Rolling Forecast Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Toolbar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>24-Month Rolling Cashflow Forecast</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold font-mono">
                SAR
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any month row to view the full SAR &amp; PHP currency breakdown and obligations inspector
            </p>
          </div>

          {/* Budget Limit Threshold Setting */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Flag className="w-4 h-4 text-rose-500 shrink-0" />
            <label htmlFor="budgetLimitInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Budget Alert Limit:
            </label>
            <div className="flex items-center gap-1">
              <input
                id="budgetLimitInput"
                type="number"
                value={budgetLimit}
                onChange={(e) => onUpdateBudgetLimit(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 px-2 py-1 text-xs font-bold font-mono-numbers text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md outline-none text-right focus:border-rose-500"
              />
              <span className="text-[11px] font-semibold text-slate-500">SAR</span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Month</th>
                <th className="py-3 px-4 font-semibold text-right">Income (SAR)</th>
                <th className="py-3 px-4 font-semibold text-right text-rose-600 dark:text-rose-400">Expenses (SAR)</th>
                <th className="py-3 px-4 font-semibold text-right text-amber-600 dark:text-amber-400">Loans &amp; Debt (SAR)</th>
                <th className="py-3 px-4 font-semibold text-right text-sky-600 dark:text-sky-400">Allowances (SAR)</th>
                <th className="py-3 px-4 font-semibold text-right text-slate-700 dark:text-slate-300">Total Outflow</th>
                <th className="py-3 px-4 font-semibold text-right text-teal-700 dark:text-teal-300 border-l border-slate-200 dark:border-slate-800">
                  New Balance (SAR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {forecast.map((row) => {
                const isOverBudget = row.totalObligationsSAR > budgetLimit;
                return (
                  <tr
                    key={row.monthStr}
                    onClick={() => onSelectMonthSummary(row)}
                    className={`cursor-pointer transition-colors group ${
                      row.isCurrentMonth
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40'
                        : isOverBudget
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                    title={isOverBudget ? '⚠️ Spending exceeds configured budget limit! Click for details.' : 'Click to inspect month summary'}
                  >
                    {/* Month Cell */}
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                      <span>{row.displayMonth}</span>
                      {row.isCurrentMonth && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold font-sans">
                          Current
                        </span>
                      )}
                      {isOverBudget && (
                        <span title="Exceeds budget limit threshold" className="text-sm">🚩</span>
                      )}
                    </td>

                    {/* Total Income */}
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatSAR(row.incomeSAR)}
                    </td>

                    {/* Active Expenses */}
                    <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                      {formatSAR(row.expensesSAR)}
                    </td>

                    {/* Active Loans */}
                    <td className="py-3.5 px-4 text-right text-amber-600 dark:text-amber-400">
                      {formatSAR(row.loansSAR)}
                    </td>

                    {/* Active Allowances */}
                    <td className="py-3.5 px-4 text-right text-sky-600 dark:text-sky-400">
                      {formatSAR(row.allowancesSAR)}
                    </td>

                    {/* Total Outflow */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatSAR(row.totalObligationsSAR)}
                    </td>

                    {/* Net Balance */}
                    <td className={`py-3.5 px-4 text-right font-bold border-l border-slate-200 dark:border-slate-800 ${
                      row.netBalanceSAR >= 0
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatSAR(row.netBalanceSAR)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Guidance */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Current Month Highlight</span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
            <span className="text-rose-500 font-bold">🚩</span>
            <span>Budget Exceeded (&gt; {budgetLimit.toLocaleString()} SAR)</span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px]">
            Formula: Net = Income - (Expenses + Loans + Allowances)
          </span>
        </div>

      </div>
    </div>
  );
};
