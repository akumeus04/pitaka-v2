import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Volume2, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { BillReminderItem, Currency, LoanItem } from '../types';
import { formatSAR, formatPHP } from '../services/currency';
import { playReminderChime } from '../services/audio';

interface RemindersViewProps {
  reminders: BillReminderItem[];
  loans: LoanItem[];
  onAddReminder: (reminder: Omit<BillReminderItem, 'id'>) => void;
  onUpdateReminder: (reminder: BillReminderItem) => void;
  onDeleteReminder: (id: string) => void;
  onMarkPaid: (reminder: BillReminderItem) => void;
  exchangeRate: number;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  loans,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onMarkPaid,
  exchangeRate,
}) => {
  const [filter, setFilter] = useState<'all' | 'pastDue' | 'dueSoon' | 'paid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(1900);
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurringMonths, setRecurringMonths] = useState(12);
  const [category, setCategory] = useState<BillReminderItem['category']>('Debt Installment');
  const [relatedLoanId, setRelatedLoanId] = useState<string>('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Categorize reminders
  const categorized = reminders.map((item) => {
    const [y, m, d] = item.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgency: 'overdue' | 'dueToday' | 'dueSoon' | 'upcoming' | 'paid' = 'upcoming';

    if (item.status === 'Paid') {
      urgency = 'paid';
    } else if (diffDays < 0) {
      urgency = 'overdue';
    } else if (diffDays === 0) {
      urgency = 'dueToday';
    } else if (diffDays <= 5) {
      urgency = 'dueSoon';
    }

    return {
      ...item,
      diffDays,
      urgency,
    };
  });

  const overdueList = categorized.filter((r) => r.urgency === 'overdue' || r.urgency === 'dueToday');
  const dueSoonList = categorized.filter((r) => r.urgency === 'dueSoon');
  const upcomingList = categorized.filter((r) => r.urgency === 'upcoming');
  const paidList = categorized.filter((r) => r.urgency === 'paid');

  const filteredList = categorized.filter((r) => {
    if (filter === 'pastDue') return r.urgency === 'overdue' || r.urgency === 'dueToday';
    if (filter === 'dueSoon') return r.urgency === 'dueSoon';
    if (filter === 'paid') return r.urgency === 'paid';
    return true;
  });

  const handleTestSound = () => {
    playReminderChime('urgent');
  };

  const handleSnooze = (item: BillReminderItem, days: number) => {
    const [y, m, d] = item.dueDate.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + days);
    const newDueDateStr = newDate.toISOString().split('T')[0];

    onUpdateReminder({
      ...item,
      dueDate: newDueDateStr,
      snoozedUntil: newDueDateStr,
    });

    playReminderChime('warning');
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReminder({
      name,
      description,
      amount,
      currency,
      dueDate,
      recurringMonths,
      status: 'Pending',
      category,
      relatedLoanId: relatedLoanId || undefined,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Automated Debt &amp; Bill Payment Reminders</span>
            {overdueList.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                {overdueList.length} Action Needed
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time urgency monitoring for debt installments, auto-debits, and recurring obligations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestSound}
            title="Play synthetic reminder chime"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Test Chime</span>
          </button>

          <button
            onClick={() => {
              setName('');
              setDescription('');
              setAmount(1900);
              setCurrency('SAR');
              setDueDate(new Date().toISOString().split('T')[0]);
              setRecurringMonths(12);
              setCategory('Debt Installment');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Reminder</span>
          </button>
        </div>
      </div>

      {/* Urgent Alert Banner if overdue or due today */}
      {overdueList.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-300">
              URGENT: {overdueList.length} Debt Payment(s) Past Due or Due Today!
            </h3>
            <p className="text-rose-800/80 dark:text-rose-300/80">
              Outstanding debt payments require immediate attention to prevent late penalties or negative bank credit score impact.
            </p>
          </div>
        </div>
      )}

      {/* Metric Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-numbers">
        <button
          onClick={() => setFilter('pastDue')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === 'pastDue'
              ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-rose-400'
          }`}
        >
          <span className={`text-[11px] uppercase font-sans font-semibold block ${filter === 'pastDue' ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400'}`}>
            Past Due / Today
          </span>
          <span className="text-2xl font-bold mt-1 block">
            {overdueList.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('dueSoon')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === 'dueSoon'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400'
          }`}
        >
          <span className={`text-[11px] uppercase font-sans font-semibold block ${filter === 'dueSoon' ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
            Due Soon (1-5d)
          </span>
          <span className="text-2xl font-bold mt-1 block">
            {dueSoonList.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === 'all'
              ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-400'
          }`}
        >
          <span className={`text-[11px] uppercase font-sans font-semibold block ${filter === 'all' ? 'text-teal-100' : 'text-slate-500'}`}>
            All Reminders
          </span>
          <span className="text-2xl font-bold mt-1 block">
            {categorized.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('paid')}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === 'paid'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
          }`}
        >
          <span className={`text-[11px] uppercase font-sans font-semibold block ${filter === 'paid' ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
            Paid Off
          </span>
          <span className="text-2xl font-bold mt-1 block">
            {paidList.length}
          </span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const isOverdue = item.urgency === 'overdue';
          const isDueToday = item.urgency === 'dueToday';
          const isDueSoon = item.urgency === 'dueSoon';
          const isPaid = item.urgency === 'paid';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isOverdue || isDueToday
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-sm'
                  : isDueSoon
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
                  : isPaid
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Item Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                  
                  {/* Badges */}
                  {isOverdue && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      Past Due ({Math.abs(item.diffDays)}d ago)
                    </span>
                  )}
                  {isDueToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      Due Today!
                    </span>
                  )}
                  {isDueSoon && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      Due in {item.diffDays} day{item.diffDays > 1 ? 's' : ''}
                    </span>
                  )}
                  {isPaid && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Paid
                    </span>
                  )}

                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono-numbers text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: <strong>{item.dueDate}</strong>
                  </span>
                  {item.snoozedUntil && (
                    <span className="text-amber-600 font-sans">
                      (Snoozed until {item.snoozedUntil})
                    </span>
                  )}
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 font-mono-numbers">
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {item.currency === 'SAR' ? formatSAR(item.amount) : formatPHP(item.amount)} {item.currency}
                  </span>
                  {item.currency === 'PHP' && (
                    <span className="text-[11px] text-slate-400 font-sans block">
                      ≈ {formatSAR(item.amount / exchangeRate)} SAR
                    </span>
                  )}
                </div>

                {/* Fast Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {!isPaid && (
                    <>
                      <button
                        onClick={() => handleSnooze(item, 3)}
                        title="Snooze reminder by 3 days"
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-sans transition-colors"
                      >
                        Snooze 3d
                      </button>

                      <button
                        onClick={() => {
                          onMarkPaid(item);
                          playReminderChime('success');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-sans transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onDeleteReminder(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors text-xs"
                    title="Delete reminder"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">All Clear! No reminders in this filter.</h3>
            <p className="text-xs text-slate-500">
              All debt payments and scheduled bills are up to date.
            </p>
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule New Debt / Bill Reminder
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Rajhi Auto Loan Monthly Installment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Installment details, account number, or debit notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount
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
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="SAR">SAR</option>
                    <option value="PHP">PHP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BillReminderItem['category'])}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="Debt Installment">Debt Installment</option>
                    <option value="Utility">Utility</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Optional Link to Existing Loan */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Link to Active Loan (Optional)
                </label>
                <select
                  value={relatedLoanId}
                  onChange={(e) => setRelatedLoanId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="">-- No linked loan --</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.description} ({l.currency} {l.totalAmount})
                    </option>
                  ))}
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
