import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Copy, Trash2, History, RotateCcw } from 'lucide-react';
import { CalculationHistoryItem } from '../types';
import { AppStorage } from '../services/storage';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: number;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  exchangeRate,
}) => {
  const [topAmount, setTopAmount] = useState<string>('1000');
  const [bottomAmount, setBottomAmount] = useState<string>('');
  const [topCur, setTopCur] = useState<'SAR' | 'PHP'>('SAR');

  // Math calculator state
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcPrev, setCalcPrev] = useState<string>('');
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  // Scratchpad & history
  const [scratchNotes, setScratchNotes] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const safeRate = exchangeRate > 0 ? exchangeRate : 14.85;

  useEffect(() => {
    if (isOpen) {
      setScratchNotes(AppStorage.getCalcNotes());
      setHistory(AppStorage.getCalcHistory());
      recalcConverter('1000', topCur);
    }
  }, [isOpen, topCur, safeRate]);

  const recalcConverter = (valStr: string, currentTopCur: 'SAR' | 'PHP') => {
    const cleanNum = parseFloat(valStr.replace(/,/g, ''));
    if (isNaN(cleanNum)) {
      setBottomAmount('');
      return;
    }

    if (currentTopCur === 'SAR') {
      const converted = cleanNum * safeRate;
      setBottomAmount(converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      const converted = cleanNum / safeRate;
      setBottomAmount(converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  const handleTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTopAmount(val);
    recalcConverter(val, topCur);
  };

  const handleSwap = () => {
    const nextCur = topCur === 'SAR' ? 'PHP' : 'SAR';
    setTopCur(nextCur);
    setTopAmount(bottomAmount ? bottomAmount.replace(/,/g, '') : '1000');
    recalcConverter(bottomAmount ? bottomAmount.replace(/,/g, '') : '1000', nextCur);
  };

  const handleChipClick = (amount: number) => {
    setTopAmount(String(amount));
    recalcConverter(String(amount), topCur);
  };

  // Math keypad actions
  const handleInputDigit = (digit: string) => {
    if (justCalculated) {
      setCalcDisplay(digit === '.' ? '0.' : digit);
      setJustCalculated(false);
      return;
    }
    if (digit === '.' && calcDisplay.includes('.')) return;
    if (calcDisplay === '0' && digit !== '.') {
      setCalcDisplay(digit);
    } else {
      setCalcDisplay(calcDisplay + digit);
    }
  };

  const handleClear = () => {
    setCalcDisplay('0');
    setCalcPrev('');
    setCalcOp(null);
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    if (calcDisplay.length > 1) {
      setCalcDisplay(calcDisplay.slice(0, -1));
    } else {
      setCalcDisplay('0');
    }
  };

  const handleOperate = (op: string) => {
    setCalcOp(op);
    setCalcPrev(calcDisplay);
    setCalcDisplay('0');
    setJustCalculated(false);
  };

  const handleCompute = () => {
    if (!calcOp || !calcPrev) return;
    const a = parseFloat(calcPrev);
    const b = parseFloat(calcDisplay);
    let result = 0;

    switch (calcOp) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : 0; break;
    }

    const resStr = String(Math.round(result * 10000) / 10000);
    const newEntry: CalculationHistoryItem = {
      id: String(Date.now()),
      expr: `${a} ${calcOp} ${b}`,
      result: resStr,
      at: Date.now(),
    };

    const nextHistory = [newEntry, ...history.slice(0, 19)];
    setHistory(nextHistory);
    AppStorage.saveCalcHistory(nextHistory);

    setCalcDisplay(resStr);
    setCalcPrev('');
    setCalcOp(null);
    setJustCalculated(true);
  };

  const handleSaveNotes = (val: string) => {
    setScratchNotes(val);
    AppStorage.saveCalcNotes(val);
  };

  const handleCopyResult = () => {
    if (bottomAmount) {
      navigator.clipboard.writeText(bottomAmount.replace(/,/g, ''));
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧮</span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Quick Converter &amp; Calculator
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {/* Currency Converter Section */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Rate: 1 SAR = {safeRate.toFixed(2)} PHP</span>
            <button
              onClick={handleSwap}
              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Swap Currencies</span>
            </button>
          </div>

          <div className="space-y-2 font-mono-numbers">
            {/* Top row */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-xs text-teal-600 dark:text-teal-400 font-sans px-2">
                {topCur}
              </span>
              <input
                type="text"
                value={topAmount}
                onChange={handleTopChange}
                placeholder="0.00"
                className="w-full text-right font-bold text-base bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Bottom converted row */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 font-sans px-2">
                {topCur === 'SAR' ? 'PHP' : 'SAR'}
              </span>
              <div className="text-right font-bold text-base text-emerald-700 dark:text-emerald-300">
                {bottomAmount || '0.00'}
              </div>
            </div>
          </div>

          {/* Preset Quick Chips */}
          <div className="flex gap-1.5 flex-wrap pt-1 font-mono-numbers">
            {(topCur === 'SAR' ? [100, 500, 1000, 5000] : [1000, 5000, 10000, 50000]).map((num) => (
              <button
                key={num}
                onClick={() => handleChipClick(num)}
                className="px-2 py-1 text-[11px] rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:border-teal-500"
              >
                {num.toLocaleString()}
              </button>
            ))}
            <button
              onClick={handleCopyResult}
              className="ml-auto px-2 py-1 text-[11px] font-sans font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Math Display & Keypad */}
        <div className="space-y-2">
          {/* Display */}
          <div className="p-3 bg-slate-900 text-white rounded-xl text-right font-mono-numbers">
            <div className="text-[11px] text-slate-400 h-4">
              {calcPrev} {calcOp}
            </div>
            <div className="text-2xl font-bold tracking-tight truncate">
              {calcDisplay}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-sm font-semibold">
            <button onClick={handleClear} className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200">
              AC
            </button>
            <button onClick={handleBackspace} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
              ⌫
            </button>
            <button onClick={() => handleInputDigit('%')} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">
              %
            </button>
            <button onClick={() => handleOperate('/')} className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200">
              ÷
            </button>

            <button onClick={() => handleInputDigit('7')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">7</button>
            <button onClick={() => handleInputDigit('8')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">8</button>
            <button onClick={() => handleInputDigit('9')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">9</button>
            <button onClick={() => handleOperate('*')} className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200">×</button>

            <button onClick={() => handleInputDigit('4')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">4</button>
            <button onClick={() => handleInputDigit('5')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">5</button>
            <button onClick={() => handleInputDigit('6')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">6</button>
            <button onClick={() => handleOperate('-')} className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200">−</button>

            <button onClick={() => handleInputDigit('1')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">1</button>
            <button onClick={() => handleInputDigit('2')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">2</button>
            <button onClick={() => handleInputDigit('3')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">3</button>
            <button onClick={() => handleOperate('+')} className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200">+</button>

            <button onClick={() => handleInputDigit('0')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white col-span-2">0</button>
            <button onClick={() => handleInputDigit('.')} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">.</button>
            <button onClick={handleCompute} className="p-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700">=</button>
          </div>
        </div>

        {/* Scratchpad */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Local Scratchpad &amp; Notes
          </label>
          <textarea
            rows={2}
            value={scratchNotes}
            onChange={(e) => handleSaveNotes(e.target.value)}
            placeholder="Jot down quick numbers, remittance refs, or calculations..."
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
};
