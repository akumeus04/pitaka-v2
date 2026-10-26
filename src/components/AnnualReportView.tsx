import React, { useState, useMemo } from 'react';
import { Search, Calendar, FileSpreadsheet, ArrowLeftRight, Check } from 'lucide-react';
import { ExpenseItem, LoanItem, Currency } from '../types';
import { formatSAR, formatPHP } from '../services/currency';

interface AnnualReportViewProps {
  expenses: ExpenseItem[];
  loans: LoanItem[];
  exchangeRate: number;
}

interface MatrixRow {
  desc: string;
  months: Record<string, number>;
  total: number;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  expenses,
  loans,
  exchangeRate,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCurrency, setActiveCurrency] = useState<Currency>('SAR');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  const MONTHS_KEYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const MONTHS_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Aggregate helper
  const aggregateData = (items: (ExpenseItem | LoanItem)[], curr: Currency): MatrixRow[] => {
    const grouped: Record<string, MatrixRow> = {};
    const yearStr = String(selectedYear);

    items.forEach((item) => {
      if (item.status === 'Cancelled') return;
      if (item.currency !== curr) return;

      const startMonthStr = (item.startMonth || '').trim();
      if (!startMonthStr.startsWith(yearStr)) return;

      const monthNum = startMonthStr.substring(5, 7);

      // Clean description (e.g. "Apartment Compound Rent (1/12)" -> "Apartment Compound Rent")
      let cleanDesc = item.description;
      const descMatch = cleanDesc.match(/(.*?)\s*\(\d+\/\d+\)$/);
      if (descMatch) cleanDesc = descMatch[1].trim();

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = cleanDesc.toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchesDesc && !matchesNotes) return;
      }

      const amount = item.currency === 'SAR' ? item.monthlyDeductionSAR : item.totalAmount;

      if (!grouped[cleanDesc]) {
        grouped[cleanDesc] = {
          desc: cleanDesc,
          months: { '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0, '07': 0, '08': 0, '09': 0, '10': 0, '11': 0, '12': 0 },
          total: 0,
        };
      }

      grouped[cleanDesc].months[monthNum] = (grouped[cleanDesc].months[monthNum] || 0) + (amount || 0);
      grouped[cleanDesc].total += amount || 0;
    });

    let results = Object.values(grouped);
    if (selectedMonth !== 'ALL') {
      results = results.filter((r) => (r.months[selectedMonth] || 0) > 0);
    }

    return results.sort((a, b) => b.total - a.total);
  };

  const expenseMatrix = useMemo(() => aggregateData(expenses, activeCurrency), [expenses, selectedYear, selectedMonth, searchQuery, activeCurrency]);
  const loanMatrix = useMemo(() => aggregateData(loans, activeCurrency), [loans, selectedYear, selectedMonth, searchQuery, activeCurrency]);

  // Compute grand totals
  const computeGrandTotal = (rows: MatrixRow[]) => {
    const totals: Record<string, number> = { '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0, '07': 0, '08': 0, '09': 0, '10': 0, '11': 0, '12': 0, total: 0 };
    rows.forEach((r) => {
      MONTHS_KEYS.forEach((m) => {
        totals[m] += r.months[m] || 0;
      });
      totals.total += r.total;
    });
    return totals;
  };

  const expenseGrandTotals = computeGrandTotal(expenseMatrix);
  const loanGrandTotals = computeGrandTotal(loanMatrix);

  // Search keyword highlight
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-slate-900 dark:text-white rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Annual 12-Month Matrix Report</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold font-mono">
              Spreadsheet View
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full annual grid for expenses and debts with real-time keyword search and monthly totals
          </p>
        </div>

        {/* Currency Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveCurrency('SAR')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeCurrency === 'SAR'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🇸🇦 SAR Ledgers
          </button>
          <button
            onClick={() => setActiveCurrency('PHP')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeCurrency === 'PHP'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🇵🇭 PHP Ledgers
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Search Keyword
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Bank, Car, Rent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Report Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
            <option value={currentYear + 2}>{currentYear + 2}</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Month Focus
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
          >
            <option value="ALL">Show all 12 months</option>
            {MONTHS_NAMES.map((name, idx) => (
              <option key={name} value={MONTHS_KEYS[idx]}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Expenses Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>💸 Expenses Matrix ({selectedYear})</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
              activeCurrency === 'SAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {activeCurrency}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono-numbers">
            {expenseMatrix.length} categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
                <th className="py-2.5 px-3 min-w-[150px]">Description</th>
                {MONTHS_NAMES.map((m) => (
                  <th key={m} className="py-2.5 px-2 text-right">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-right bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                  Year Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {expenseMatrix.map((row) => (
                <tr key={row.desc} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {highlightMatch(row.desc)}
                  </td>
                  {MONTHS_KEYS.map((m) => {
                    const val = row.months[m] || 0;
                    return (
                      <td key={m} className="py-2.5 px-2 text-right">
                        {val > 0 ? (
                          <span className="text-slate-800 dark:text-slate-200">
                            {formatSAR(val)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-bold text-teal-700 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/30">
                    {formatSAR(row.total)}
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/70 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-2.5 px-3 font-sans">EXPENSES TOTAL</td>
                {MONTHS_KEYS.map((m) => {
                  const val = expenseGrandTotals[m] || 0;
                  return (
                    <td key={m} className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400">
                      {val > 0 ? formatSAR(val) : '-'}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 text-right text-teal-700 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-950/60">
                  {formatSAR(expenseGrandTotals.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Loans Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏦 Loans &amp; Debt Matrix ({selectedYear})</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
              activeCurrency === 'SAR' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {activeCurrency}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono-numbers">
            {loanMatrix.length} active loans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
                <th className="py-2.5 px-3 min-w-[150px]">Description</th>
                {MONTHS_NAMES.map((m) => (
                  <th key={m} className="py-2.5 px-2 text-right">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-right bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Year Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {loanMatrix.map((row) => (
                <tr key={row.desc} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                    {highlightMatch(row.desc)}
                  </td>
                  {MONTHS_KEYS.map((m) => {
                    const val = row.months[m] || 0;
                    return (
                      <td key={m} className="py-2.5 px-2 text-right">
                        {val > 0 ? (
                          <span className="text-slate-800 dark:text-slate-200">
                            {formatSAR(val)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-bold text-amber-700 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/30">
                    {formatSAR(row.total)}
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/70 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="py-2.5 px-3 font-sans">LOANS TOTAL</td>
                {MONTHS_KEYS.map((m) => {
                  const val = loanGrandTotals[m] || 0;
                  return (
                    <td key={m} className="py-2.5 px-2 text-right text-amber-600 dark:text-amber-400">
                      {val > 0 ? formatSAR(val) : '-'}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/60">
                  {formatSAR(loanGrandTotals.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
