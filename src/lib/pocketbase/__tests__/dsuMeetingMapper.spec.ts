import { describe, it, expect } from 'vitest';
import {
  mapToCreateMeeting,
  mapToUpdateMeeting,
  mapFromRecordMeeting,
} from '@/lib/pocketbase/dsuMeetingMapper';
import type { DsuMeetings } from '@/types/lextrack/dsu_meetings/types';

const baseRecord: DsuMeetings = {
  id: 'abc',
  created: '2026-01-01',
  updated: '2026-01-01',
  collectionId: '',
  collectionName: 'dsu_meetings',
  date: '2026-01-01',
  title: 'Standup',
  duration_minutes: 30,
  duration_unit: 'minutes',
  description: undefined,
};

describe('mapToCreateMeeting', () => {
  it('defaults duration_unit to minutes when omitted', () => {
    const result = mapToCreateMeeting({
      date: '2026-01-01',
      title: 'Standup',
      duration_minutes: undefined,
      description: undefined,
    });
    expect(result.duration_unit).toBe('minutes');
  });

  it('preserves explicit hours unit', () => {
    const result = mapToCreateMeeting({
      date: '2026-01-01',
      title: 'Standup',
      duration_minutes: 60,
      duration_unit: 'hours',
    });
    expect(result.duration_unit).toBe('hours');
    expect(result.duration_minutes).toBe(60);
  });

  it('includes date and title in output', () => {
    const result = mapToCreateMeeting({ date: '2026-01-15', title: 'Review', duration_minutes: undefined });
    expect(result.date).toBe('2026-01-15');
    expect(result.title).toBe('Review');
  });
});

describe('mapToUpdateMeeting', () => {
  it('excludes id, created, updated from output', () => {
    const result = mapToUpdateMeeting(baseRecord);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('created');
    expect(result).not.toHaveProperty('updated');
  });

  it('excludes date from output', () => {
    const result = mapToUpdateMeeting(baseRecord);
    expect(result).not.toHaveProperty('date');
  });

  it('preserves title, duration_minutes, duration_unit, description', () => {
    const result = mapToUpdateMeeting(baseRecord);
    expect(result.title).toBe('Standup');
    expect(result.duration_minutes).toBe(30);
    expect(result.duration_unit).toBe('minutes');
    expect(result.description).toBeUndefined();
  });
});

describe('mapFromRecordMeeting', () => {
  it('backfills legacy rows missing duration_unit with minutes', () => {
    const legacyRecord = { ...baseRecord, duration_unit: undefined } as unknown as DsuMeetings;
    expect(mapFromRecordMeeting(legacyRecord).duration_unit).toBe('minutes');
  });

  it('preserves explicit duration_unit hours', () => {
    const record = { ...baseRecord, duration_unit: 'hours' as const };
    expect(mapFromRecordMeeting(record).duration_unit).toBe('hours');
  });

  it('returns full record shape', () => {
    const result = mapFromRecordMeeting(baseRecord);
    expect(result.id).toBe('abc');
    expect(result.title).toBe('Standup');
  });
});
