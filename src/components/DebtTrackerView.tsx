import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  Calendar, 
  Percent, 
  Building2,
  DollarSign,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { LoanItem, Currency, PaymentStatus } from '../types';
import { formatSAR, formatPHP, convertPhpToSar, convertSarToPhp } from '../services/currency';
import { playReminderChime } from '../services/audio';

interface DebtTrackerViewProps {
  loans: LoanItem[];
  onAddLoan: (loan: Omit<LoanItem, 'id'>) => void;
  onUpdateLoan: (loan: LoanItem) => void;
  onDeleteLoan: (id: string) => void;
  exchangeRate: number;
  activeMonth: string;
}

export const DebtTrackerView: React.FC<DebtTrackerViewProps> = ({
  loans,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  exchangeRate,
  activeMonth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [lender, setLender] = useState('');
  const [category, setCategory] = useState<LoanItem['category']>('Personal');
  const [duration, setDuration] = useState(24);
  const [currentPaymentNumber, setCurrentPaymentNumber] = useState(1);
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [totalAmount, setTotalAmount] = useState<number>(36000);
  const [amountSAR, setAmountSAR] = useState<number>(36000);
  const [amountPHP, setAmountPHP] = useState<number>(36000 * exchangeRate);
  const [startMonth, setStartMonth] = useState(activeMonth);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(25);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [status, setStatus] = useState<PaymentStatus>('In-Process');
  const [notes, setNotes] = useState('');

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  // Aggregate metrics
  const activeLoans = loans.filter((l) => l.status !== 'Cancelled');
  const totalMonthlyDeductionsSAR = activeLoans.reduce(
    (sum, l) => sum + (l.monthlyDeductionSAR || 0),
    0
  );

  // Calculate estimated total remaining debt
  const totalEstimatedRemainingDebtSAR = activeLoans.reduce((sum, loan) => {
    if (loan.status === 'Paid') return sum;
    const paid = loan.currentPaymentNumber || 0;
    const remainingPayments = Math.max(0, (loan.duration || 1) - paid);
    return sum + remainingPayments * (loan.monthlyDeductionSAR || 0);
  }, 0);

  const totalEstimatedRemainingDebtPHP = totalEstimatedRemainingDebtSAR * safeRate;

  // Filtered loans
  const filteredLoans = loans.filter((loan) => {
    if (filterCategory !== 'ALL' && loan.category !== filterCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      loan.description.toLowerCase().includes(q) ||
      (loan.lender || '').toLowerCase().includes(q) ||
      (loan.notes || '').toLowerCase().includes(q) ||
      loan.status.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingLoan(null);
    setDescription('');
    setLender('');
    setCategory('Personal');
    setDuration(24);
    setCurrentPaymentNumber(1);
    setCurrency('SAR');
    setTotalAmount(24000);
    setAmountSAR(24000);
    setAmountPHP(24000 * safeRate);
    setStartMonth(activeMonth);
    setDueDayOfMonth(25);
    setInterestRate(3.5);
    setStatus('In-Process');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loan: LoanItem) => {
    setEditingLoan(loan);
    setDescription(loan.description);
    setLender(loan.lender || '');
    setCategory(loan.category || 'Personal');
    setDuration(loan.duration || 1);
    setCurrentPaymentNumber(loan.currentPaymentNumber || 1);
    setCurrency(loan.currency);
    setTotalAmount(loan.totalAmount);
    if (loan.currency === 'SAR') {
      setAmountSAR(loan.totalAmount);
      setAmountPHP(loan.totalAmount * safeRate);
    } else {
      setAmountPHP(loan.totalAmount);
      setAmountSAR(loan.totalAmount / safeRate);
    }
    setStartMonth(loan.startMonth);
    setDueDayOfMonth(loan.dueDayOfMonth || 25);
    setInterestRate(loan.interestRate || 0);
    setStatus(loan.status);
    setNotes(loan.notes || '');
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

    if (editingLoan) {
      onUpdateLoan({
        ...editingLoan,
        description,
        lender,
        category,
        duration,
        currentPaymentNumber,
        currency,
        totalAmount: finalAmount,
        monthlyDeductionSAR: monthlySAR,
        startMonth,
        dueDayOfMonth,
        interestRate,
        status,
        notes,
      });
    } else {
      onAddLoan({
        entryDate: new Date().toISOString().split('T')[0],
        startMonth,
        description,
        lender,
        duration,
        currency,
        totalAmount: finalAmount,
        monthlyDeductionSAR: monthlySAR,
        status,
        notes,
        interestRate,
        currentPaymentNumber,
        dueDayOfMonth,
        category,
      });
    }
    setIsModalOpen(false);
  };

  const handleRecordInstallmentPayment = (loan: LoanItem) => {
    const nextNum = (loan.currentPaymentNumber || 0) + 1;
    const isNowPaid = nextNum >= loan.duration;

    onUpdateLoan({
      ...loan,
      currentPaymentNumber: nextNum,
      status: isNowPaid ? 'Paid' : loan.status,
    });

    playReminderChime('success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Metrics Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Outstanding Debt &amp; Loan Amortization</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold font-mono">
              {activeLoans.length} Active Loans
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track total liabilities, monthly burden, payment installment progression, and debt payoff dates
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Loan</span>
        </button>
      </div>

      {/* Debt Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs uppercase font-semibold tracking-wider">Estimated Remaining Debt</span>
            <CreditCard className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono-numbers text-white">
              {formatSAR(totalEstimatedRemainingDebtSAR)} <span className="text-xs font-sans text-slate-300">SAR</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono-numbers">
              ≈ {formatPHP(totalEstimatedRemainingDebtPHP)} PHP
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Total Monthly Debt Burden</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono-numbers text-amber-600 dark:text-amber-400">
              {formatSAR(totalMonthlyDeductionsSAR)} <span className="text-xs font-sans text-slate-500">SAR / mo</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono-numbers">
              ≈ {formatPHP(totalMonthlyDeductionsSAR * safeRate)} PHP / month
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Average Loan Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            {activeLoans.length > 0 ? (
              <>
                <div className="text-2xl font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
                  {Math.round(
                    activeLoans.reduce(
                      (acc, l) => acc + ((l.currentPaymentNumber || 0) / (l.duration || 1)) * 100,
                      0
                    ) / activeLoans.length
                  )}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Average repayment completion across active debt
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-emerald-600 mt-2">Debt-Free!</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search loans, lenders, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['ALL', 'Vehicle', 'Personal', 'Credit Card', 'Mortgage'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLoans.map((loan) => {
          const currentPay = loan.currentPaymentNumber || 0;
          const totalPay = loan.duration || 1;
          const progressPercent = Math.min(100, Math.round((currentPay / totalPay) * 100));
          const remainingPayments = Math.max(0, totalPay - currentPay);
          const remainingSAR = remainingPayments * (loan.monthlyDeductionSAR || 0);

          return (
            <div
              key={loan.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {loan.description}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {loan.category}
                    </span>
                  </div>
                  {loan.lender && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{loan.lender}</span>
                      {loan.interestRate ? (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span>{loan.interestRate}% APR</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  loan.status === 'Paid'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                    : loan.status === 'Cancelled'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200'
                }`}>
                  {loan.status}
                </span>
              </div>

              {/* Progress Bar & Installment Counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Installment <strong className="text-slate-900 dark:text-white font-mono-numbers">{currentPay}</strong> of <strong className="text-slate-900 dark:text-white font-mono-numbers">{totalPay}</strong>
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono-numbers">
                    {progressPercent}% Paid
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Financial Numbers Matrix */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono-numbers">
                <div>
                  <span className="text-[11px] text-slate-400 font-sans block">Monthly Outflow</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {formatSAR(loan.monthlyDeductionSAR)} SAR
                  </strong>
                  {loan.currency === 'PHP' && (
                    <span className="text-[10px] text-slate-400 block">
                      ({formatPHP(loan.totalAmount / (loan.duration || 1))} PHP)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-sans block">Remaining Balance</span>
                  <strong className="text-rose-600 dark:text-rose-400 text-sm">
                    {formatSAR(remainingSAR)} SAR
                  </strong>
                  <span className="text-[10px] text-slate-400 font-sans block">
                    {remainingPayments} payments left
                  </span>
                </div>
              </div>

              {/* Notes */}
              {loan.notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 italic">
                  "{loan.notes}"
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(loan)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${loan.description}?`)) {
                        onDeleteLoan(loan.id);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {loan.status !== 'Paid' && (
                  <button
                    onClick={() => handleRecordInstallmentPayment(loan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pay Installment (+1)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredLoans.length === 0 && (
          <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No matching loans or debt records</h3>
            <p className="text-xs text-slate-500">
              Add your loans to start tracking debt-free projections and installment countdowns.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
            >
              Add First Loan
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Loan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingLoan ? `Edit Loan: ${editingLoan.description}` : 'Schedule New Loan or Debt'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
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
                    Due Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDayOfMonth}
                    onChange={(e) => setDueDayOfMonth(parseInt(e.target.value) || 25)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Loan Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Rajhi Auto Loan - Toyota Fortuner"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Lender / Bank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al Rajhi, SNB, BPI"
                    value={lender}
                    onChange={(e) => setLender(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LoanItem['category'])}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                    <option value="Personal">Personal Loan</option>
                    <option value="Vehicle">Vehicle / Car Loan</option>
                    <option value="Mortgage">Mortgage / Land</option>
                    <option value="Credit Card">Credit Card SIP</option>
                    <option value="Family">Family Debt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Duration (Mo)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Paid (#)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={duration}
                    required
                    value={currentPaymentNumber}
                    onChange={(e) => setCurrentPaymentNumber(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Interest APR %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono-numbers"
                  />
                </div>
              </div>

              {/* Currency & Dual Calculator Box */}
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
                  1 SAR = {safeRate.toFixed(2)} PHP · Monthly Deduction: <strong>{formatSAR((currency === 'SAR' ? amountSAR : amountPHP / safeRate) / duration)} SAR/mo</strong>
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
                  <option value="In-Process">In-Process (Active Installments)</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Paid">Paid Off (Completed)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context, account number, or auto-debit dates..."
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
                  {editingLoan ? 'Update Loan' : 'Save Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
