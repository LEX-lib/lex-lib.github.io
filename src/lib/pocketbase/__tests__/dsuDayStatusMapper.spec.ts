import { describe, it, expect } from 'vitest';
import { mapToCreateDayStatus, mapFromRecordDayStatus } from '@/lib/pocketbase/dsuDayStatusMapper';
import type { DsuDayStatus } from '@/types/lextrack/dsu_day_status/types';

const baseRecord: DsuDayStatus = {
  id: 'ds-1', created: '2026-01-01', updated: '2026-01-01',
  collectionId: '', collectionName: 'dsu_day_status',
  date: '2026-01-15', status: 'sl',
};

describe('mapToCreateDayStatus', () => {
  it('returns date and status', () => {
    const result = mapToCreateDayStatus({ date: '2026-01-15', status: 'vl' });
    expect(result.date).toBe('2026-01-15');
    expect(result.status).toBe('vl');
  });

  it('excludes extra fields', () => {
    const result = mapToCreateDayStatus({ date: '2026-01-15', status: 'sl' });
    expect(result).not.toHaveProperty('id');
    expect(Object.keys(result)).toEqual(['date', 'status']);
  });
});

describe('mapFromRecordDayStatus', () => {
  it('returns full record unchanged', () => {
    const result = mapFromRecordDayStatus(baseRecord);
    expect(result.id).toBe('ds-1');
    expect(result.status).toBe('sl');
    expect(result.date).toBe('2026-01-15');
  });
});
