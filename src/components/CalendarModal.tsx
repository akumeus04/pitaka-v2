import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { CalendarEvent, BillReminderItem, LoanItem } from '../types';
import { OFFICIAL_HOLIDAYS } from '../services/holidays';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: BillReminderItem[];
  loans: LoanItem[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  reminders,
  loans,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([
    { id: 'ev-flight-1', date: '2026-12-18', title: 'Flight SV860: Dammam to Manila', type: 'flight', desc: 'Vacation flight home' },
    { id: 'ev-payday-1', date: '2026-10-25', title: 'Monthly Salary Payday', type: 'personal', desc: 'Direct deposit' },
    { id: 'ev-payday-2', date: '2026-11-25', title: 'Monthly Salary Payday', type: 'personal', desc: 'Direct deposit' },
  ]);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calendar math
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const todayStr = new Date().toISOString().split('T')[0];

  // Compile all events on selected day
  const getEventsForDate = (dateStr: string) => {
    const list: { type: string; title: string; desc?: string }[] = [];

    // Holidays
    OFFICIAL_HOLIDAYS.filter((h) => h.date === dateStr).forEach((h) => {
      list.push({
        type: h.country === 'PH' ? '🇵🇭 PH Holiday' : '🇸🇦 Saudi Holiday',
        title: h.name,
      });
    });

    // Reminders
    reminders.filter((r) => r.dueDate === dateStr).forEach((r) => {
      list.push({
        type: '📌 Bill / Debt Due',
        title: `${r.name} (${r.amount} ${r.currency})`,
        desc: r.description,
      });
    });

    // Loans with dueDayOfMonth
    const dayOfMonth = parseInt(dateStr.split('-')[2]);
    loans.filter((l) => l.dueDayOfMonth === dayOfMonth && l.status !== 'Paid').forEach((l) => {
      list.push({
        type: '🏦 Loan Installment',
        title: `${l.description} (${l.monthlyDeductionSAR} SAR)`,
        desc: `Lender: ${l.lender || 'Bank'}`,
      });
    });

    // Personal / flights
    personalEvents.filter((e) => e.date === dateStr).forEach((e) => {
      list.push({
        type: e.type === 'flight' ? '✈️ Flight' : '📌 Personal',
        title: e.title,
        desc: e.desc,
      });
    });

    return list;
  };

  const selectedDayEvents = getEventsForDate(selectedDateStr);

  const handleAddPersonalEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    setPersonalEvents([
      ...personalEvents,
      {
        id: String(Date.now()),
        date: selectedDateStr,
        title: newEventTitle,
        desc: newEventDesc,
        type: 'personal',
      },
    ]);

    setNewEventTitle('');
    setNewEventDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Financial &amp; Holiday Calendar
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-sm text-teal-700 dark:text-teal-300 font-sans">
            {monthName}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-semibold flex-wrap justify-center text-slate-600 dark:text-slate-400">
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            🇵🇭 PH Holiday
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
            🇸🇦 SA Holiday
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
            📌 Debt / Bill Due
          </span>
          <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
            ✈️ Flight / Trip
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono-numbers text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={d} className={`font-sans font-bold text-[11px] py-1 ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9"></div>
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const ds = formatStr(d);
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDateStr;

            const dayEvs = getEventsForDate(ds);
            const hasPH = dayEvs.some((e) => e.type.includes('PH'));
            const hasSA = dayEvs.some((e) => e.type.includes('SA'));
            const hasDebt = dayEvs.some((e) => e.type.includes('Debt') || e.type.includes('Loan'));
            const hasFlight = dayEvs.some((e) => e.type.includes('Flight'));

            let bgClass = 'bg-slate-50 dark:bg-slate-800/60 hover:border-teal-400';
            if (hasPH && hasSA) bgClass = 'bg-amber-100/70 dark:bg-amber-950/60 font-bold border-amber-400';
            else if (hasPH) bgClass = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300';
            else if (hasSA) bgClass = 'bg-orange-50 dark:bg-orange-950/40 border-orange-300';
            else if (hasDebt) bgClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 font-bold';
            else if (hasFlight) bgClass = 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 font-bold';

            return (
              <button
                key={ds}
                onClick={() => setSelectedDateStr(ds)}
                className={`h-9 rounded-lg border flex flex-col items-center justify-center relative transition-all ${bgClass} ${
                  isSelected ? 'ring-2 ring-teal-500 font-bold' : 'border-slate-200 dark:border-slate-700/60'
                } ${isToday ? 'border-2 border-teal-600' : ''}`}
              >
                <span>{d}</span>
                {dayEvs.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 absolute bottom-1"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Inspector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white font-sans flex items-center justify-between">
            <span>Schedule for {selectedDateStr}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {selectedDayEvents.length} event(s)
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {selectedDayEvents.map((ev, i) => (
              <div key={i} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {ev.type}: {ev.title}
                </span>
                {ev.desc && <span className="text-[11px] text-slate-500 block">{ev.desc}</span>}
              </div>
            ))}

            {selectedDayEvents.length === 0 && (
              <div className="text-slate-400 text-xs italic py-2 text-center">
                No events or payments scheduled for this date.
              </div>
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddPersonalEvent} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <input
              type="text"
              placeholder="Add reminder or personal note for this day..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors"
            >
              Add to Calendar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
