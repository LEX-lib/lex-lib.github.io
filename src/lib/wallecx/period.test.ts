import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  VALID_PERIODS,
  PERIOD_STORAGE_KEY,
  PERIOD_FROM_STORAGE_KEY,
  PERIOD_TO_STORAGE_KEY,
  isValidPeriod,
  getPeriodRange,
  formatPeriodLabel,
} from './period';

describe('period.ts', () => {
  describe('VALID_PERIODS + storage keys', () => {
    it('VALID_PERIODS lists the 4 periods in order', () => {
      expect([...VALID_PERIODS]).toEqual(['this-month', 'this-quarter', 'this-year', 'custom']);
    });
    it('storage keys are namespaced', () => {
      expect(PERIOD_STORAGE_KEY).toBe('wallecx:expense-period');
      expect(PERIOD_FROM_STORAGE_KEY).toBe('wallecx:expense-period-from');
      expect(PERIOD_TO_STORAGE_KEY).toBe('wallecx:expense-period-to');
    });
  });

  describe('isValidPeriod', () => {
    it('accepts the 4 valid strings', () => {
      for (const p of VALID_PERIODS) expect(isValidPeriod(p)).toBe(true);
    });
    it('rejects garbage', () => {
      for (const v of ['this-week', '', 'CUSTOM', null, undefined, 0, {}]) {
        expect(isValidPeriod(v)).toBe(false);
      }
    });
  });

  describe('getPeriodRange — quarterOfYear plugin sanity', () => {
    it('this-quarter returns a calendar quarter start (NOT today) — fails silently if quarterOfYear plugin is missing', () => {
      const { from } = getPeriodRange('this-quarter', null, null);
      const startMonthDay = from.format('MM-DD');
      expect(['01-01', '04-01', '07-01', '10-01']).toContain(startMonthDay);
    });
    it('this-month: from is day 1; to is last day of month', () => {
      const { from, to } = getPeriodRange('this-month', null, null);
      expect(from.date()).toBe(1);
      expect(to.date()).toBe(from.daysInMonth());
    });
    it('this-year: 01-01 to 12-31', () => {
      const { from, to } = getPeriodRange('this-year', null, null);
      expect(from.format('MM-DD')).toBe('01-01');
      expect(to.format('MM-DD')).toBe('12-31');
    });
    it('custom with both dates uses startOf/endOf day', () => {
      const f = new Date(2026, 3, 1);  // Apr 1, 2026 local time
      const t = new Date(2026, 4, 15); // May 15, 2026
      const { from, to } = getPeriodRange('custom', f, t);
      expect(from.format('YYYY-MM-DD HH:mm:ss')).toBe('2026-04-01 00:00:00');
      expect(to.format('YYYY-MM-DD HH:mm:ss')).toBe('2026-05-15 23:59:59');
    });
    it('custom with nulls falls back to today (does not throw)', () => {
      expect(() => getPeriodRange('custom', null, null)).not.toThrow();
      const { from, to } = getPeriodRange('custom', null, null);
      expect(from.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));
      expect(to.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));
    });
  });

  describe('formatPeriodLabel', () => {
    it('this-month → MMMM YYYY', () => {
      expect(formatPeriodLabel('this-month', null, null)).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    });
    it('this-quarter → Q[1-4] YYYY (requires quarterOfYear plugin)', () => {
      expect(formatPeriodLabel('this-quarter', null, null)).toMatch(/^Q[1-4] \d{4}$/);
    });
    it('this-year → YYYY', () => {
      expect(formatPeriodLabel('this-year', null, null)).toMatch(/^\d{4}$/);
    });
    it('custom different years uses en-dash and renders both years', () => {
      const label = formatPeriodLabel(
        'custom',
        new Date(2025, 11, 15),  // Dec 15, 2025
        new Date(2026, 0, 14),   // Jan 14, 2026
      );
      expect(label).toContain('–');  // en-dash U+2013, NOT hyphen-minus
      expect(label).toContain('2025');
      expect(label).toContain('2026');
    });
    it('custom same day → no en-dash, single date with year', () => {
      const d = new Date(2026, 4, 21);
      const label = formatPeriodLabel('custom', d, d);
      expect(label).not.toContain('–');
      expect(label).toMatch(/2026/);
    });
    it('custom with null From returns —', () => {
      expect(formatPeriodLabel('custom', null, new Date())).toBe('—');
    });
    it('custom with null To returns —', () => {
      expect(formatPeriodLabel('custom', new Date(), null)).toBe('—');
    });
  });
});
