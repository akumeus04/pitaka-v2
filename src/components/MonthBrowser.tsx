import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthBrowserProps {
  activeMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  onResetToCurrentMonth: () => void;
  currentMonth: string;
}

export const MonthBrowser: React.FC<MonthBrowserProps> = ({
  activeMonth,
  onMonthChange,
  onResetToCurrentMonth,
  currentMonth,
}) => {
  const [yearStr, monthStr] = activeMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const displayDate = new Date(y, m - 1, 1);
  const formattedDisplay = displayDate.toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  });

  const isCurrentMonth = activeMonth === currentMonth;

  const handlePrev = () => {
    let newM = m - 1;
    let newY = y;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNext = () => {
    let newM = m + 1;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm my-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="hidden sm:inline font-medium">Viewing ledger for:</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrev}
          title="Previous Month (ArrowLeft)"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onResetToCurrentMonth}
          title={isCurrentMonth ? "Active month is today's month" : "Click to jump back to current month"}
          className={`px-3 py-1.5 rounded-lg font-bold text-sm tracking-tight transition-all font-mono-numbers ${
            isCurrentMonth
              ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-transparent'
          }`}
        >
          {formattedDisplay}
          {!isCurrentMonth && (
            <span className="ml-1.5 text-[10px] font-normal text-teal-600 dark:text-teal-400 underline">
              (Return to Now)
            </span>
          )}
        </button>

        <button
          onClick={handleNext}
          title="Next Month (ArrowRight)"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
        Use <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]">←</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]">→</kbd> to browse
      </div>
    </div>
  );
};
