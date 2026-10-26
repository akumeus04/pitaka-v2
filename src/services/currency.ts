/**
 * Currency conversion and formatting utilities for SAR and PHP
 */

export const DEFAULT_PHP_RATE = 14.85;

export interface ExchangeRateInfo {
  rate: number;
  lastUpdated: string;
  source: 'live' | 'cached' | 'fallback';
}

export async function fetchLiveExchangeRate(): Promise<ExchangeRateInfo> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/SAR');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && data.rates && typeof data.rates.PHP === 'number') {
      const liveRate = data.rates.PHP;
      const info: ExchangeRateInfo = {
        rate: liveRate,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'live'
      };
      try {
        localStorage.setItem('pitaka_live_rate', JSON.stringify(info));
      } catch {
        // ignore
      }
      return info;
    }
  } catch (error) {
    console.warn('Could not fetch live rate, attempting cache/fallback', error);
  }

  // Check cached
  try {
    const cached = localStorage.getItem('pitaka_live_rate');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.rate === 'number') {
        return {
          rate: parsed.rate,
          lastUpdated: parsed.lastUpdated || 'Earlier today',
          source: 'cached'
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    rate: DEFAULT_PHP_RATE,
    lastUpdated: 'Default standard',
    source: 'fallback'
  };
}

export function formatCurrency(amount: number, currency: 'SAR' | 'PHP' = 'SAR'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

export function formatSAR(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPHP(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function convertSarToPhp(amountSAR: number, rate: number): number {
  return amountSAR * (rate > 0 ? rate : DEFAULT_PHP_RATE);
}

export function convertPhpToSar(amountPHP: number, rate: number): number {
  const safeRate = rate > 0 ? rate : DEFAULT_PHP_RATE;
  return amountPHP / safeRate;
}
