import React, { useState, useEffect } from 'react';
import { Plus, GraduationCap, Calendar, Calculator, PlusCircle } from 'lucide-react';
import { AllowanceItem, AllowanceCategory, PaymentStatus } from '../types';
import { formatSAR, formatPHP, convertPhpToSar } from '../services/currency';
import { calculateAllowancePeriod } from '../services/holidays';

interface AllowancesViewProps {
  allowances: AllowanceItem[];
  onAddAllowance: (item: Omit<AllowanceItem, 'id'>) => void;
  onUpdateAllowance: (item: AllowanceItem) => void;
  onDeleteAllowance: (id: string) => void;
  activeMonth: string;
  exchangeRate: number;
}

const DEFAULT_CATEGORIES: AllowanceCategory[] = [
  { name: 'Meals & Food Allowance', amount: 250 },
  { name: 'Commute / Transportation', amount: 120 },
  { name: 'Mobile Data & Study Materials', amount: 80 },
  { name: 'Hostel & Utility Contribution', amount: 150 },
  { name: 'Emergency Student Fund', amount: 50 },
];

export const AllowancesView: React.FC<AllowancesViewProps> = ({
  allowances,
  onAddAllowance,
  onUpdateAllowance,
  onDeleteAllowance,
  activeMonth,
  exchangeRate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AllowanceItem | null>(null);

  // Form states
  const [studentName, setStudentName] = useState('Mateo Vicente');
  const [allowanceMonth, setAllowanceMonth] = useState(activeMonth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalWorkdays, setTotalWorkdays] = useState<number>(25);
  const [categories, setCategories] = useState<AllowanceCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([
    'Meals & Food Allowance',
    'Commute / Transportation',
    'Mobile Data & Study Materials',
  ]);
  const [status, setStatus] = useState<PaymentStatus>('Pending');
  const [notes, setNotes] = useState('');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  // Auto calculate 26th-25th workdays whenever month changes
  useEffect(() => {
    if (allowanceMonth) {
      const period = calculateAllowancePeriod(allowanceMonth);
      setStartDate(period.startDate);
      setEndDate(period.endDate);
      setTotalWorkdays(period.workdays);
    }
  }, [allowanceMonth]);

  const currentMonthAllowances = allowances.filter((a) =>
    (a.allowanceMonth || '').startsWith(activeMonth)
  );

  const calculateDailyTotal = () => {
    return categories
      .filter((c) => selectedCategoryNames.includes(c.name))
      .reduce((s, c) => s + (c.amount || 0), 0);
  };

  const dailyTotalPHP = calculateDailyTotal();
  const grandTotalPHP = totalWorkdays * dailyTotalPHP;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setStudentName('Mateo Vicente');
    setAllowanceMonth(activeMonth);
    const period = calculateAllowancePeriod(activeMonth);
    setStartDate(period.startDate);
    setEndDate(period.endDate);
    setTotalWorkdays(period.workdays);
    setSelectedCategoryNames([
      'Meals & Food Allowance',
      'Commute / Transportation',
      'Mobile Data & Study Materials',
    ]);
    setStatus('Pending');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AllowanceItem) => {
    setEditingItem(item);
    setStudentName(item.studentName);
    setAllowanceMonth(item.allowanceMonth);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setTotalWorkdays(item.totalWorkdays);
    setSelectedCategoryNames(item.breakdown.map((b) => b.name));
    setStatus(item.status);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleToggleCategory = (catName: string) => {
    if (selectedCategoryNames.includes(catName)) {
      setSelectedCategoryNames(selectedCategoryNames.filter((n) => n !== catName));
    } else {
      setSelectedCategoryNames([...selectedCategoryNames, catName]);
    }
  };

  const handleAddNewCategory = () => {
    const name = prompt('Enter new category name (e.g. Internet, Library Fee):');
    if (!name) return;
    const amountStr = prompt(`Enter daily amount in PHP for ${name}:`, '50');
    if (!amountStr || isNaN(parseFloat(amountStr))) return;

    const newCat: AllowanceCategory = {
      name,
      amount: parseFloat(amountStr),
    };
    setCategories([...categories, newCat]);
    setSelectedCategoryNames([...selectedCategoryNames, name]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const activeBreakdown = categories.filter((c) => selectedCategoryNames.includes(c.name));

    if (editingItem) {
      onUpdateAllowance({
        ...editingItem,
        studentName,
        allowanceMonth,
        startDate,
        endDate,
        totalWorkdays,
        dailyAmountPHP: dailyTotalPHP,
        breakdown: activeBreakdown,
        totalPHP: grandTotalPHP,
        status,
        notes,
      });
    } else {
      onAddAllowance({
        entryDate: new Date().toISOString().split('T')[0],
        studentName,
        allowanceMonth,
        startDate,
        endDate,
        totalWorkdays,
        dailyAmountPHP: dailyTotalPHP,
        breakdown: activeBreakdown,
        totalPHP: grandTotalPHP,
        status,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Student Allowances Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold font-mono">
              26th-25th Calendar Logic
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated workday computation (excluding Sundays &amp; PH holidays) with daily breakdown in PHP
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Allowance</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Coverage Period &amp; Workdays</th>
                <th className="py-3 px-4 font-semibold text-right">Daily Rate (PHP)</th>
                <th className="py-3 px-4 font-semibold text-right">Total (PHP)</th>
                <th className="py-3 px-4 font-semibold text-right">SAR Equivalent</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {currentMonthAllowances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans">
                    <strong className="text-slate-900 dark:text-white block">
                      🎓 {item.studentName}
                    </strong>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {item.breakdown.map((b) => b.name).join(', ')}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{item.totalWorkdays} workdays</span>
                    <span className="text-[11px] text-slate-400 block">
                      {item.startDate} to {item.endDate}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                    {item.dailyAmountPHP} PHP/day
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-sky-600 dark:text-sky-400">
                    {formatPHP(item.totalPHP)} PHP
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                    {formatSAR(item.totalPHP / safeRate)} SAR
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'Paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                        : item.status === 'Cancelled'
                        ? 'bg-slate-100 text-slate-400 line-through'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete allowance for ${item.studentName}?`)) {
                            onDeleteAllowance(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {currentMonthAllowances.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No allowance calculated for {activeMonth}. Click "+ New Allowance" to compute workdays.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Allowance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? `Edit Allowance: ${editingItem.studentName}` : 'Calculate Student Allowance'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Allowance Month
                  </label>
                  <input
                    type="month"
                    required
                    value={allowanceMonth}
                    onChange={(e) => setAllowanceMonth(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Start & End Date (Auto computed 26th-25th) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Date (26th of prev)
                  </label>
                  <input
                    type="date"
                    readOnly
                    value={startDate}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    End Date (25th of target)
                  </label>
                  <input
                    type="date"
                    readOnly
                    value={endDate}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono-numbers"
                  />
                </div>
              </div>

              {/* Workday Adjuster */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Calculated Workdays: {totalWorkdays} Days
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sundays &amp; Philippine official holidays auto-deducted
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono-numbers">
                  <button
                    type="button"
                    onClick={() => setTotalWorkdays(Math.max(1, totalWorkdays - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-teal-600 dark:text-teal-400">
                    {totalWorkdays}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTotalWorkdays(totalWorkdays + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Category Breakdown Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Daily Breakdown Items (PHP)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="text-[11px] font-semibold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                  {categories.map((cat) => {
                    const isChecked = selectedCategoryNames.includes(cat.name);
                    return (
                      <label
                        key={cat.name}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCategory(cat.name)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                          {cat.name}
                        </span>
                        <span className="font-mono-numbers font-semibold text-teal-600 dark:text-teal-400 shrink-0">
                          +{cat.amount}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1 font-mono-numbers">
                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-sans">
                  <span>Daily Allowance Sum:</span>
                  <strong>{dailyTotalPHP} PHP / day</strong>
                </div>
                <div className="flex justify-between text-sm font-bold text-teal-700 dark:text-teal-300">
                  <span>Grand Total ({totalWorkdays} days):</span>
                  <span>{formatPHP(grandTotalPHP)} PHP</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span>Converted to SAR (@ {safeRate.toFixed(2)}):</span>
                  <span>{formatSAR(grandTotalPHP / safeRate)} SAR</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="Pending">Pending (Not yet transferred)</option>
                  <option value="Paid">Paid / Transferred (GCash/Remit)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                >
                  {editingItem ? 'Update Allowance' : 'Save Allowance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
