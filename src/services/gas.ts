/**
 * Google Apps Script (GAS) Integration Service
 * Connects to the user's live Google Sheets & Google Calendar Web Apps
 */

export const MAIN_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbw64YW8x6UyAC-qtCJDQw8znaJ8I4zdyi5MelNPmQj45ElBraYPqbPCChRMODkySsxX0A/exec';

export const ALLOWANCE_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwkjgQREdqRlWtA9r676BjaUQWEoumUbpFlMtjpZS3uTy2baqrEM0D84_cIJehKlu-tRw/exec';

export const CALENDAR_API_URL =
  'https://script.google.com/macros/s/AKfycbz5bRtVHyNUh0BUZ5M-_yLn3ZqFIfNpojdD_2cBy_ikQhISryN0WIYeVTa1Vr1wcDDx4Q/exec';

export const EXPECTED_SECRET = 'My_Super_Secret_Passcode_2026!';

export interface GASAuxiliaryData {
  holidays?: Array<{ date?: string; Date?: string; 'Date (YYYY-MM-DD)'?: string; name?: string }>;
  categories?: Array<{ 'Category Name': string; 'Daily Amount (PHP)': number | string }>;
  students?: Array<{ 'Student Name': string }>;
}

/**
 * Backup an entry to Google Sheets via GAS Web App in the background
 */
export async function backupToGAS(
  sheetName: 'Income' | 'Expenses' | 'Loans' | 'Allowances',
  payload: Record<string, unknown>
): Promise<boolean> {
  const targetURL = sheetName === 'Allowances' ? ALLOWANCE_WEB_APP_URL : MAIN_WEB_APP_URL;

  const dataToSend = {
    ...payload,
    sheetName,
    appSecret: EXPECTED_SECRET,
  };

  try {
    const res = await fetch(targetURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(dataToSend),
    });
    return res.ok;
  } catch (err) {
    console.warn(`GAS Backup for ${sheetName} ran in background:`, err);
    return false;
  }
}

/**
 * Fetch auxiliary categories, holidays, and students from the Allowance GAS endpoint
 */
export async function fetchAuxiliaryDataFromGAS(): Promise<GASAuxiliaryData | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(ALLOWANCE_WEB_APP_URL, { signal: ctrl.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'success' && data.data) {
      return data.data as GASAuxiliaryData;
    }
  } catch (err) {
    console.warn('Could not load auxiliary data from Allowance GAS endpoint:', err);
  }
  return null;
}

/**
 * Fetch calendar events & holidays from Google Calendar Web App
 */
export async function fetchHolidaysFromGAS(): Promise<Array<{ date: string; name: string; country: string }> | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(CALENDAR_API_URL, { signal: ctrl.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Could not fetch calendar from Google Apps Script:', err);
  }
  return null;
}

/**
 * Save and sync a personal calendar event/note to Google Calendar via GAS
 */
export async function syncNoteToGoogleCalendar(payload: {
  date: string;
  title: string;
  notes?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(CALENDAR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('GAS Calendar Sync failed:', err);
    return false;
  }
}
