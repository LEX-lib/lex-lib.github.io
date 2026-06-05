import dayjs, { type Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

// CRITICAL: dayjs().startOf('quarter') / .endOf('quarter') / .format('[Q]Q')
// silently return the input UNCHANGED without this plugin. Verified via Node REPL
// 2026-05-22 — see 26-RESEARCH.md §dayjs period math (Pitfall 1).
// dayjs.extend is idempotent; safe at module top.
dayjs.extend(quarterOfYear);

export type Period = 'this-month' | 'this-quarter' | 'this-year' | 'custom';

export const VALID_PERIODS: readonly Period[] =
  ['this-month', 'this-quarter', 'this-year', 'custom'] as const;

export const PERIOD_STORAGE_KEY = 'wallecx:expense-period';
export const PERIOD_FROM_STORAGE_KEY = 'wallecx:expense-period-from';
export const PERIOD_TO_STORAGE_KEY = 'wallecx:expense-period-to';

export function isValidPeriod(value: unknown): value is Period {
  return typeof value === 'string' && (VALID_PERIODS as readonly string[]).includes(value);
}

/**
 * Returns the [from, to] Dayjs range for the selected period.
 * For 'custom', if either customFrom or customTo is null, falls back to today's
 * startOf/endOf day (does NOT throw). Caller (ExpensesReportsView) typically
 * gates this behind a validation check, but the helper is defensive.
 */
export function getPeriodRange(
  period: Period,
  customFrom: Date | null,
  customTo: Date | null,
): { from: Dayjs; to: Dayjs } {
  const now = dayjs();
  switch (period) {
    case 'this-month':   return { from: now.startOf('month'),   to: now.endOf('month') };
    case 'this-quarter': return { from: now.startOf('quarter'), to: now.endOf('quarter') };
    case 'this-year':    return { from: now.startOf('year'),    to: now.endOf('year') };
    case 'custom': {
      const from = customFrom ? dayjs(customFrom).startOf('day') : now.startOf('day');
      const to   = customTo   ? dayjs(customTo).endOf('day')     : now.endOf('day');
      return { from, to };
    }
  }
}

/**
 * Returns the human-friendly period label per UI-SPEC §Copywriting Contract.
 * Separator for custom ranges is the en-dash (U+2013) with surrounding spaces:
 * " – " — NOT hyphen-minus.
 */
export function formatPeriodLabel(
  period: Period,
  customFrom: Date | null,
  customTo: Date | null,
): string {
  const now = dayjs();
  switch (period) {
    case 'this-month':   return now.format('MMMM YYYY');
    // NOTE: dayjs/plugin/quarterOfYear patches .quarter() / .startOf('quarter') etc.
    // but does NOT extend the format() token grammar — `now.format('[Q]Q YYYY')`
    // produces "QQ 2026" not "Q2 2026". Use .quarter() accessor + interpolation.
    case 'this-quarter': return `Q${now.quarter()} ${now.format('YYYY')}`;
    case 'this-year':    return now.format('YYYY');
    case 'custom': {
      if (!customFrom || !customTo) return '—';
      const from = dayjs(customFrom);
      const to = dayjs(customTo);
      if (from.isSame(to, 'day')) return from.format('MMM D, YYYY');
      if (from.year() !== to.year()) {
        return `${from.format('MMM D, YYYY')} – ${to.format('MMM D, YYYY')}`;
      }
      if (from.month() !== to.month()) {
        return `${from.format('MMM D')} – ${to.format('MMM D, YYYY')}`;
      }
      return `${from.format('MMM D')} – ${to.format('D, YYYY')}`;
    }
  }
}
