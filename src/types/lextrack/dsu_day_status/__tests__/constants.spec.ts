import { describe, it, expect } from 'vitest';
import { DSU_DAY_STATUS_VALUES, DSU_DAY_STATUS_LABELS } from '@/types/lextrack/dsu_day_status/constants';

describe('DSU_DAY_STATUS_VALUES', () => {
  it('contains exactly 5 values', () => {
    expect(DSU_DAY_STATUS_VALUES).toHaveLength(5);
  });

  it('includes all expected status codes', () => {
    expect(DSU_DAY_STATUS_VALUES).toContain('sl');
    expect(DSU_DAY_STATUS_VALUES).toContain('vl');
    expect(DSU_DAY_STATUS_VALUES).toContain('holiday');
    expect(DSU_DAY_STATUS_VALUES).toContain('bl');
    expect(DSU_DAY_STATUS_VALUES).toContain('others');
  });
});

describe('DSU_DAY_STATUS_LABELS', () => {
  it('has a label for every status value', () => {
    for (const value of DSU_DAY_STATUS_VALUES) {
      expect(DSU_DAY_STATUS_LABELS[value]).toBeTruthy();
    }
  });

  it('maps sl to Sick Leave', () => {
    expect(DSU_DAY_STATUS_LABELS.sl).toBe('Sick Leave');
  });

  it('maps others to Others', () => {
    expect(DSU_DAY_STATUS_LABELS.others).toBe('Others');
  });
});
