import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Layers, 
  Coins, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { FinancialSummaryMonth, ExpenseItem, LoanItem, AllowanceItem } from '../types';
import { formatSAR, formatPHP, formatCurrency } from '../services/currency';

interface VisualAnalyticsViewProps {
  forecast: FinancialSummaryMonth[];
  expenses: ExpenseItem[];
  loans: LoanItem[];
  allowances: AllowanceItem[];
  exchangeRate: number;
  activeMonth: string;
}

export const VisualAnalyticsView: React.FC<VisualAnalyticsViewProps> = ({
  forecast,
  expenses,
  loans,
  allowances,
  exchangeRate,
  activeMonth,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'expenses' | 'loans'>('expenses');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  // 1. Calculate Expenses Category Breakdown
  const expenseCategoriesMap: Record<string, number> = {};
  expenses
    .filter((e) => e.status !== 'Cancelled')
    .forEach((e) => {
      const cat = e.category || 'Other';
      expenseCategoriesMap[cat] = (expenseCategoriesMap[cat] || 0) + (e.monthlyDeductionSAR || 0);
    });

  const expenseCategoryList = Object.entries(expenseCategoriesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalExpenseCategorySAR = expenseCategoryList.reduce((s, i) => s + i.value, 0);

  // 2. Calculate Loan Categories Breakdown
  const loanCategoriesMap: Record<string, number> = {};
  loans
    .filter((l) => l.status !== 'Cancelled')
    .forEach((l) => {
      const cat = l.category || 'Personal';
      loanCategoriesMap[cat] = (loanCategoriesMap[cat] || 0) + (l.monthlyDeductionSAR || 0);
    });

  const loanCategoryList = Object.entries(loanCategoriesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalLoanCategorySAR = loanCategoryList.reduce((s, i) => s + i.value, 0);

  // 3. Currency Split (SAR vs PHP)
  let totalSARCurrencyObligations = 0;
  let totalPHPCurrencyObligationsInSAR = 0;

  expenses
    .filter((e) => e.status !== 'Cancelled')
    .forEach((e) => {
      if (e.currency === 'PHP') {
        totalPHPCurrencyObligationsInSAR += (e.totalAmount || 0) / safeRate;
      } else {
        totalSARCurrencyObligations += e.monthlyDeductionSAR || 0;
      }
    });

  loans
    .filter((l) => l.status !== 'Cancelled')
    .forEach((l) => {
      if (l.currency === 'PHP') {
        totalPHPCurrencyObligationsInSAR += (l.totalAmount || 0) / safeRate;
      } else {
        totalSARCurrencyObligations += l.monthlyDeductionSAR || 0;
      }
    });

  const allowanceTotalPHP = allowances
    .filter((a) => a.status !== 'Cancelled')
    .reduce((s, a) => s + (a.totalPHP || 0), 0);
  totalPHPCurrencyObligationsInSAR += allowanceTotalPHP / safeRate;

  const totalCurrencyBurden = totalSARCurrencyObligations + totalPHPCurrencyObligationsInSAR;
  const sarPercent = totalCurrencyBurden > 0 ? Math.round((totalSARCurrencyObligations / totalCurrencyBurden) * 100) : 50;
  const phpPercent = 100 - sarPercent;

  // 4. Bills Overview: Paid vs Unpaid status counts & totals for current month
  const currentMonthData = forecast.find((f) => f.isCurrentMonth) || forecast[0];
  const paidExpenses = expenses.filter((e) => e.status === 'Paid');
  const pendingExpenses = expenses.filter((e) => e.status === 'Pending' || e.status === 'In-Process');

  const paidLoans = loans.filter((l) => l.status === 'Paid');
  const pendingLoans = loans.filter((l) => l.status === 'Pending' || l.status === 'In-Process');

  const paidCount = paidExpenses.length + paidLoans.length;
  const pendingCount = pendingExpenses.length + pendingLoans.length;

  const paidSAR = [...paidExpenses, ...paidLoans].reduce((sum, item) => sum + (item.monthlyDeductionSAR || 0), 0);
  const pendingSAR = [...pendingExpenses, ...pendingLoans].reduce((sum, item) => sum + (item.monthlyDeductionSAR || 0), 0);

  // 5. SVG Chart Math for 24-Month Forecast
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...forecast.map((f) => Math.max(f.incomeSAR, f.totalObligationsSAR, f.netBalanceSAR, 5000))
  );
  const minVal = Math.min(0, ...forecast.map((f) => f.netBalanceSAR));
  const range = maxVal - minVal || 1;

  const getX = (idx: number) => paddingX + (idx / (forecast.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);

  // Path generators
  const generatePath = (getter: (f: FinancialSummaryMonth) => number) => {
    return forecast.reduce((path, pt, idx) => {
      const x = getX(idx);
      const y = getY(getter(pt));
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  const incomePath = generatePath((f) => f.incomeSAR);
  const obligationsPath = generatePath((f) => f.totalObligationsSAR);
  const netPath = generatePath((f) => f.netBalanceSAR);

  // Color palette for category breakdown
  const PALETTE = ['#0d9488', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>Visual Financial &amp; Debt Analytics</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold font-mono">
            Interactive
          </span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cash flow projection charts, debt amortization decay, currency exposures, and expense distribution
        </p>
      </div>

      {/* 1. Cash Flow & Net Trajectory SVG Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              24-Month Trajectory: Inflow vs Obligations vs Net Balance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hover over points to inspect forecasted values for any month
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-500 rounded"></span>
              Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 rounded"></span>
              Obligations
            </span>
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <span className="w-3 h-0.5 bg-teal-500 rounded"></span>
              Net Balance
            </span>
          </div>
        </div>

        {/* SVG Interactive Chart Canvas */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[680px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 overflow-visible">
              {/* Zero Line */}
              <line
                x1={paddingX}
                y1={getY(0)}
                x2={chartWidth - paddingX}
                y2={getY(0)}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
              />

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1].map((pct) => {
                const val = minVal + pct * range;
                const y = getY(val);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/40"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Data Series Paths */}
              <path d={incomePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              <path d={obligationsPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              <path d={netPath} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />

              {/* Data Interactive Nodes */}
              {forecast.map((pt, idx) => {
                const x = getX(idx);
                const yNet = getY(pt.netBalanceSAR);
                const isHovered = hoveredPoint === idx;

                return (
                  <g key={pt.monthStr} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={chartHeight - paddingY}
                        stroke="#0d9488"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={yNet}
                      r={isHovered ? 5 : 3}
                      className="fill-teal-600 dark:fill-teal-400 stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                      strokeWidth="2"
                    />

                    {/* X-axis Month Label (Every 3 months or hovered) */}
                    {(idx % 3 === 0 || isHovered) && (
                      <text
                        x={x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className={`text-[10px] font-mono ${
                          isHovered ? 'fill-teal-600 dark:fill-teal-400 font-bold' : 'fill-slate-400'
                        }`}
                      >
                        {pt.displayMonth.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hovered Month Inspection Detail */}
        {hoveredPoint !== null && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-numbers animate-fadeIn">
            <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
              📅 {forecast[hoveredPoint].displayMonth}
            </span>
            <div className="flex items-center gap-4">
              <span>
                Income: <strong className="text-emerald-600">{formatSAR(forecast[hoveredPoint].incomeSAR)} SAR</strong>
              </span>
              <span>
                Obligations: <strong className="text-rose-600">{formatSAR(forecast[hoveredPoint].totalObligationsSAR)} SAR</strong>
              </span>
              <span>
                Net: <strong className="text-teal-600 font-bold">{formatSAR(forecast[hoveredPoint].netBalanceSAR)} SAR</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Middle Row: Category Breakdown & Currency Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Expenses vs Loans Switcher) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Burden Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Monthly allocation breakdown in Saudi Riyals
              </p>
            </div>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveCategoryFilter('expenses')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                  activeCategoryFilter === 'expenses'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveCategoryFilter('loans')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                  activeCategoryFilter === 'loans'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Loans
              </button>
            </div>
          </div>

          {/* Category Bar Breakdown List */}
          <div className="space-y-3 pt-1">
            {(activeCategoryFilter === 'expenses' ? expenseCategoryList : loanCategoryList).map((item, idx) => {
              const totalVal = activeCategoryFilter === 'expenses' ? totalExpenseCategorySAR : totalLoanCategorySAR;
              const percent = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0;
              const barColor = PALETTE[idx % PALETTE.length];

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor }}></span>
                      {item.name}
                    </span>
                    <span className="font-mono-numbers font-medium text-slate-900 dark:text-white">
                      {formatSAR(item.value)} SAR <span className="text-slate-400 font-sans">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Currency Exposure & Remittance Split */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dual Currency Allocation (SAR vs PHP)
            </h3>
            <p className="text-xs text-slate-500">
              Proportion of monthly budget dedicated to Saudi domestic costs vs Philippine remittances
            </p>
          </div>

          {/* Visual Currency Proportion Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${sarPercent}%` }}
                title={`SAR Domestic: ${sarPercent}%`}
              />
              <div 
                className="bg-sky-500 h-full transition-all duration-500"
                style={{ width: `${phpPercent}%` }}
                title={`PHP Remittance: ${phpPercent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                🇸🇦 SAR Domestic: {sarPercent}%
              </span>
              <span className="text-sky-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                🇵🇭 PHP Remittances: {phpPercent}%
              </span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 font-mono-numbers">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-sans font-medium block">
                Saudi Local Deductions
              </span>
              <strong className="text-base text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                {formatSAR(totalSARCurrencyObligations)} SAR
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 font-mono-numbers">
              <span className="text-[11px] text-sky-800 dark:text-sky-300 font-sans font-medium block">
                Philippine Obligations
              </span>
              <strong className="text-base text-sky-700 dark:text-sky-400 font-bold block mt-0.5">
                {formatSAR(totalPHPCurrencyObligationsInSAR)} SAR
              </strong>
              <span className="text-[10px] text-slate-500 font-sans block">
                ≈ {formatPHP(totalPHPCurrencyObligationsInSAR * safeRate)} PHP
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Exchange conversion calculated using current exchange rate of 1 SAR = {safeRate.toFixed(2)} PHP
          </div>
        </div>

      </div>

      {/* 3. Bottom Row: Monthly Bills Status Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bills Status Overview ({activeMonth})
            </h3>
            <p className="text-xs text-slate-500">
              Paid vs pending obligation volumes across all active expense and loan entries
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between font-mono-numbers">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-sans font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Completed / Paid Bills
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatSAR(paidSAR)} SAR
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900">
                {paidCount} items
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                ≈ {formatPHP(paidSAR * safeRate)} PHP
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between font-mono-numbers">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-sans font-semibold text-rose-800 dark:text-rose-300 block">
                  Pending / In-Process Bills
                </span>
                <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
                  {formatSAR(pendingSAR)} SAR
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900">
                {pendingCount} items
              </span>
              <span className="text-[10px] text-slate-500 font-sans block mt-1">
                ≈ {formatPHP(pendingSAR * safeRate)} PHP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
