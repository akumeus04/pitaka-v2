import React, { useState } from 'react';
import { Plus, Copy, TrendingUp, Calendar, FileText } from 'lucide-react';
import { IncomeItem } from '../types';
import { formatSAR, formatPHP } from '../services/currency';

interface IncomeViewProps {
  income: IncomeItem[];
  onAddIncome: (item: Omit<IncomeItem, 'id'>) => void;
  onUpdateIncome: (item: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
  onDuplicateAllToNextMonth: () => void;
  activeMonth: string;
  exchangeRate: number;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  income,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onDuplicateAllToNextMonth,
  activeMonth,
  exchangeRate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(18500);
  const [applicableMonth, setApplicableMonth] = useState(activeMonth);
  const [category, setCategory] = useState<IncomeItem['category']>('Salary');
  const [notes, setNotes] = useState('');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  const currentMonthIncome = income.filter(
    (inc) => (inc.applicableMonth || '').trim().startsWith(activeMonth)
  );

  const totalCurrentIncome = currentMonthIncome.reduce((s, i) => s + (i.amount || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDescription('');
    setAmount(18500);
    setApplicableMonth(activeMonth);
    setCategory('Salary');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IncomeItem) => {
    setEditingItem(item);
    setDescription(item.description);
    setAmount(item.amount);
    setApplicableMonth(item.applicableMonth);
    setCategory(item.category);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateIncome({
        ...editingItem,
        description,
        amount,
        applicableMonth,
        category,
        notes,
      });
    } else {
      onAddIncome({
        entryDate: new Date().toISOString().split('T')[0],
        applicableMonth,
        description,
        amount,
        category,
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
            <span>Income &amp; Inflow Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
              Total: {formatSAR(totalCurrentIncome)} SAR
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage base salary, allowances, overtime, and bonuses for {activeMonth}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicateAllToNextMonth}
            title="Duplicate all income entries in this month into the next month"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate to Next Mo</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (SAR)</th>
                <th className="py-3 px-4 font-semibold text-right">PHP Equivalent</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {currentMonthIncome.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                    {item.description}
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {item.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatSAR(item.amount)} SAR
                  </td>

                  <td className="py-3 px-4 text-right text-slate-500">
                    ≈ {formatPHP(item.amount * safeRate)} PHP
                  </td>

                  <td className="py-3 px-4 font-sans text-slate-500">
                    {item.notes || '-'}
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
                          if (confirm(`Delete ${item.description}?`)) {
                            onDeleteIncome(item.id);
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

              {currentMonthIncome.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No income records found for {activeMonth}. Use "+ Add Income" or "Duplicate to Next Mo".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Income Entry' : 'Add New Income'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Month
                </label>
                <input
                  type="month"
                  required
                  value={applicableMonth}
                  onChange={(e) => setApplicableMonth(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aramco Monthly Base Salary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncomeItem['category'])}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Deposit account or remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
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
                  {editingItem ? 'Update Record' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
