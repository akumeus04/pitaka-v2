import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { ExpenseItem, Currency, PaymentStatus } from '../types';
import { formatSAR, formatPHP } from '../services/currency';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  exchangeRate: number;
  activeMonth: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  exchangeRate,
  activeMonth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [activeNoteModal, setActiveNoteModal] = useState<string | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(1);
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [totalAmount, setTotalAmount] = useState<number>(450);
  const [amountSAR, setAmountSAR] = useState<number>(450);
  const [amountPHP, setAmountPHP] = useState<number>(450 * exchangeRate);
  const [startMonth, setStartMonth] = useState(activeMonth);
  const [category, setCategory] = useState<ExpenseItem['category']>('Utilities');
  const [status, setStatus] = useState<PaymentStatus>('Pending');
  const [notes, setNotes] = useState('');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  const parseMonth = (mStr: string) => {
    const [y, m] = mStr.split('-').map(Number);
    return y * 12 + m;
  };
  const targetInt = parseMonth(activeMonth);

  // Filter active in current selected month
  let filtered = expenses.filter((exp) => {
    const rawStart = (exp.startMonth || '').trim().substring(0, 7);
    if (!rawStart) return false;
    const startInt = parseMonth(rawStart);
    const dur = exp.duration || 1;
    return targetInt >= startInt && targetInt < startInt + dur;
  });

  if (!showCancelled) {
    filtered = filtered.filter((exp) => exp.status !== 'Cancelled');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((exp) =>
      exp.description.toLowerCase().includes(q) ||
      (exp.notes || '').toLowerCase().includes(q) ||
      exp.category.toLowerCase().includes(q) ||
      exp.status.toLowerCase().includes(q)
    );
  }

  // Status priority sort matching expenses.js (Pending: 1, In-Process: 2, Paid: 3, Cancelled: 4)
  const statusPriority: Record<PaymentStatus, number> = {
    'Pending': 1,
    'In-Process': 2,
    'Paid': 3,
    'Cancelled': 4,
  };

  filtered.sort((a, b) => {
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
  });

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setDescription('');
    setDuration(1);
    setCurrency('SAR');
    setTotalAmount(450);
    setAmountSAR(450);
    setAmountPHP(450 * safeRate);
    setStartMonth(activeMonth);
    setCategory('Utilities');
    setStatus('Pending');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setDescription(exp.description);
    setDuration(exp.duration || 1);
    setCurrency(exp.currency);
    setTotalAmount(exp.totalAmount);
    if (exp.currency === 'SAR') {
      setAmountSAR(exp.totalAmount);
      setAmountPHP(exp.totalAmount * safeRate);
    } else {
      setAmountPHP(exp.totalAmount);
      setAmountSAR(exp.totalAmount / safeRate);
    }
    setStartMonth(exp.startMonth);
    setCategory(exp.category);
    setStatus(exp.status);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleCurrencyChange = (newCurr: Currency) => {
    setCurrency(newCurr);
    if (newCurr === 'SAR') {
      setTotalAmount(amountSAR);
    } else {
      setTotalAmount(amountPHP);
    }
  };

  const handleAmountSARChange = (val: number) => {
    setAmountSAR(val);
    setAmountPHP(val * safeRate);
    if (currency === 'SAR') setTotalAmount(val);
  };

  const handleAmountPHPChange = (val: number) => {
    setAmountPHP(val);
    setAmountSAR(val / safeRate);
    if (currency === 'PHP') setTotalAmount(val);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = currency === 'SAR' ? amountSAR : amountPHP;
    const monthlySAR = currency === 'SAR' ? finalAmount / duration : (finalAmount / safeRate) / duration;

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        description,
        duration,
        currency,
        totalAmount: finalAmount,
        monthlyDeductionSAR: monthlySAR,
        startMonth,
        category,
        status,
        notes,
      });
    } else {
      // Auto-split multi-month expenses just like original
      if (duration > 1) {
        const [y, m] = startMonth.split('-').map(Number);
        for (let i = 0; i < duration; i++) {
          let nextM = m + i;
          let nextY = y;
          while (nextM > 12) {
            nextM -= 12;
            nextY += 1;
          }
          const targetMStr = `${nextY}-${String(nextM).padStart(2, '0')}`;
          onAddExpense({
            entryDate: new Date().toISOString().split('T')[0],
            startMonth: targetMStr,
            description: `${description} (${i + 1}/${duration})`,
            duration: 1,
            currency,
            totalAmount: finalAmount / duration,
            monthlyDeductionSAR: monthlySAR,
            category,
            status,
            notes,
            installmentIndex: i + 1,
            installmentTotal: duration,
          });
        }
      } else {
        onAddExpense({
          entryDate: new Date().toISOString().split('T')[0],
          startMonth,
          description,
          duration: 1,
          currency,
          totalAmount: finalAmount,
          monthlyDeductionSAR: monthlySAR,
          category,
          status,
          notes,
        });
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Expenses Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono">
              {filtered.length} entries for {activeMonth}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage single and multi-month split expenses with automatic dual-currency valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            {showCancelled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="🔍 Search descriptions, notes, categories, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">SAR / Mo</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-numbers">
              {filtered.map((exp) => {
                const isCancelled = exp.status === 'Cancelled';
                const isPaid = exp.status === 'Paid';

                return (
                  <tr
                    key={exp.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isCancelled ? 'opacity-40 bg-slate-50/50 dark:bg-slate-900/50' : isPaid ? 'opacity-70' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-sans">
                      <strong className={`text-slate-900 dark:text-white block ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                        {exp.description}
                      </strong>
                      <span className="text-[11px] text-slate-400 font-sans">
                        {exp.duration > 1 ? `${exp.duration} mo(s) series` : 'One-time monthly'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <strong className={`font-bold block ${isCancelled ? 'line-through text-slate-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatSAR(exp.monthlyDeductionSAR)} SAR
                      </strong>
                      {exp.currency === 'PHP' && (
                        <span className="text-[10px] text-slate-400 block">
                          ({formatPHP(exp.totalAmount)} PHP)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        exp.status === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : exp.status === 'Cancelled'
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : exp.status === 'In-Process'
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                      }`}>
                        {exp.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {exp.notes ? (
                        <button
                          onClick={() => setActiveNoteModal(exp.notes || '')}
                          className="max-w-[140px] truncate block text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500 border border-transparent transition-all"
                          title="Click to read full note"
                        >
                          {exp.notes}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        >
                          View / Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${exp.description}?`)) {
                              onDeleteExpense(exp.id);
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
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No matching expenses found for {activeMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Inspection Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📝</span> Note Details
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {activeNoteModal}
            </div>
            <button
              onClick={() => setActiveNoteModal(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? `Edit Expense: ${editingExpense.description}` : 'Schedule New Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Month
                  </label>
                  <input
                    type="month"
                    required
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={!!editingExpense}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers disabled:opacity-50"
                  />
                  {duration > 1 && !editingExpense && (
                    <span className="text-[10px] text-teal-600 block mt-0.5">
                      Auto-splits into {duration} separate monthly entries
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEC Electric Bill, Villa Maintenance"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="Housing">Housing / Rent</option>
                    <option value="Utilities">Utilities &amp; Electric</option>
                    <option value="Groceries">Groceries &amp; Food</option>
                    <option value="Transportation">Transportation &amp; Gas</option>
                    <option value="Healthcare">Healthcare &amp; Meds</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Subscriptions">Subscriptions &amp; Fiber</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
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
                    <option value="Pending">Pending</option>
                    <option value="In-Process">In-Process</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Currency & Converter Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Primary Currency
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange('SAR')}
                      className={`px-2.5 py-1 text-xs rounded font-bold ${
                        currency === 'SAR' ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      SAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencyChange('PHP')}
                      className={`px-2.5 py-1 text-xs rounded font-bold ${
                        currency === 'PHP' ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      PHP
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono-numbers">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Amount in SAR</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountSAR}
                      onChange={(e) => handleAmountSARChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Amount in PHP</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPHP}
                      onChange={(e) => handleAmountPHPChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 text-center pt-1">
                  Rate: 1 SAR = {safeRate.toFixed(2)} PHP · Monthly Deduction: <strong>{formatSAR((currency === 'SAR' ? amountSAR : amountPHP / safeRate) / duration)} SAR</strong>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Receipt number, payment channel, etc."
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
                  {editingExpense ? 'Update Record' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
