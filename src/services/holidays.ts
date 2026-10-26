/**
 * Philippine & Saudi Arabia Holidays and Allowance Workdays Math
 */

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
  country: 'PH' | 'SA';
}

export const OFFICIAL_HOLIDAYS: HolidayItem[] = [
  // 2026 Saudi Holidays
  { date: '2026-02-22', name: 'Saudi Founding Day', country: 'SA' },
  { date: '2026-03-20', name: 'Eid al-Fitr Holiday', country: 'SA' },
  { date: '2026-03-21', name: 'Eid al-Fitr Holiday', country: 'SA' },
  { date: '2026-03-22', name: 'Eid al-Fitr Holiday', country: 'SA' },
  { date: '2026-05-27', name: 'Arafat Day', country: 'SA' },
  { date: '2026-05-28', name: 'Eid al-Adha Holiday', country: 'SA' },
  { date: '2026-05-29', name: 'Eid al-Adha Holiday', country: 'SA' },
  { date: '2026-05-30', name: 'Eid al-Adha Holiday', country: 'SA' },
  { date: '2026-09-23', name: 'Saudi National Day', country: 'SA' },

  // 2026 Philippine Holidays
  { date: '2026-01-01', name: "New Year's Day", country: 'PH' },
  { date: '2026-02-17', name: 'Chinese Lunar New Year', country: 'PH' },
  { date: '2026-02-25', name: 'EDSA People Power Revolution', country: 'PH' },
  { date: '2026-04-02', name: 'Maundy Thursday', country: 'PH' },
  { date: '2026-04-03', name: 'Good Friday', country: 'PH' },
  { date: '2026-04-04', name: 'Black Saturday', country: 'PH' },
  { date: '2026-04-09', name: 'Araw ng Kagitingan', country: 'PH' },
  { date: '2026-05-01', name: 'Labor Day', country: 'PH' },
  { date: '2026-06-12', name: 'Philippine Independence Day', country: 'PH' },
  { date: '2026-08-21', name: 'Ninoy Aquino Day', country: 'PH' },
  { date: '2026-08-31', name: 'National Heroes Day', country: 'PH' },
  { date: '2026-11-01', name: "All Saints' Day", country: 'PH' },
  { date: '2026-11-02', name: "All Souls' Day", country: 'PH' },
  { date: '2026-11-30', name: 'Bonifacio Day', country: 'PH' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', country: 'PH' },
  { date: '2026-12-25', name: 'Christmas Day', country: 'PH' },
  { date: '2026-12-30', name: 'Rizal Day', country: 'PH' },
  { date: '2026-12-31', name: 'Last Day of the Year', country: 'PH' },
];

/**
 * Calculates workdays between 26th of previous month and 25th of target month
 * Excludes Sundays (day 0) and Philippine holidays
 */
export function calculateAllowancePeriod(monthStr: string): {
  startDate: string;
  endDate: string;
  workdays: number;
} {
  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);

  // 26th of previous month
  const startDate = new Date(year, month - 2, 26);
  // 25th of current month
  const endDate = new Date(year, month - 1, 25);

  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const phHolidayDates = new Set(
    OFFICIAL_HOLIDAYS.filter(h => h.country === 'PH').map(h => h.date)
  );

  let workdays = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dayOfWeek = cursor.getDay();
    const dateStr = formatLocal(cursor);
    // Exclude Sunday (0) and holidays
    if (dayOfWeek !== 0 && !phHolidayDates.has(dateStr)) {
      workdays++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    startDate: formatLocal(startDate),
    endDate: formatLocal(endDate),
    workdays,
  };
}

export function getDaysUntilPayday(currentDate: Date = new Date()): {
  daysRemaining: number;
  isPayday: boolean;
  paydayDateStr: string;
} {
  const now = new Date(currentDate);
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (day === 25) {
    return {
      daysRemaining: 0,
      isPayday: true,
      paydayDateStr: `${now.toLocaleString('default', { month: 'short' })} 25`,
    };
  }

  let targetPayday: Date;
  if (day < 25) {
    targetPayday = new Date(year, month, 25);
  } else {
    targetPayday = new Date(year, month + 1, 25);
  }

  const todayMidnight = new Date(year, month, day);
  const diffTime = targetPayday.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    daysRemaining: diffDays,
    isPayday: false,
    paydayDateStr: `${targetPayday.toLocaleString('default', { month: 'short' })} 25`,
  };
}
