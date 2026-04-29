import { describe, it, expect } from 'vitest';
import { mapToCreateSupport, mapToUpdateSupport, mapFromRecordSupport } from '@/lib/pocketbase/dsuSupportMapper';
import type { DsuSupports } from '@/types/lextrack/dsu_supports/types';

const baseRecord: DsuSupports = {
  id: 'sup-1', created: '2026-01-01', updated: '2026-01-01',
  collectionId: '', collectionName: 'dsu_supports',
  date: '2026-01-01', title: 'Help desk', link: 'https://example.com', description: undefined,
};

describe('mapToCreateSupport', () => {
  it('includes date, title, link, description', () => {
    const result = mapToCreateSupport(baseRecord);
    expect(result.date).toBe('2026-01-01');
    expect(result.title).toBe('Help desk');
    expect(result.link).toBe('https://example.com');
  });

  it('passes through undefined link', () => {
    const result = mapToCreateSupport({ date: '2026-01-01', title: 'Admin', link: undefined });
    expect(result.link).toBeUndefined();
  });
});

describe('mapToUpdateSupport', () => {
  it('excludes id, created, updated, date', () => {
    const result = mapToUpdateSupport(baseRecord);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('date');
  });

  it('preserves title, link, description', () => {
    const result = mapToUpdateSupport(baseRecord);
    expect(result.title).toBe('Help desk');
    expect(result.link).toBe('https://example.com');
  });
});

describe('mapFromRecordSupport', () => {
  it('returns full record unchanged', () => {
    const result = mapFromRecordSupport(baseRecord);
    expect(result.id).toBe('sup-1');
    expect(result.link).toBe('https://example.com');
  });
});
