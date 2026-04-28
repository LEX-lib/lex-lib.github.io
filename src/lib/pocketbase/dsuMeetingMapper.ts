import type { DsuMeetings, AddDsuMeeting } from '@/types/lextrack/dsu_meetings/types';
import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants';

/**
 * Transform an AddDsuMeeting create-payload into the exact shape PocketBase
 * expects when calling `pb.collection('dsu_meetings').create(payload)`.
 *
 * Defaults `duration_unit` to `'minutes'` when omitted (D-14 / D-15).
 */
export function mapToCreateMeeting(input: AddDsuMeeting): {
    date: string;
    title: string;
    duration_minutes?: number;
    duration_unit: DurationUnit;
    description?: string;
} {
    return {
        date: input.date,
        title: input.title,
        duration_minutes: input.duration_minutes,
        duration_unit: input.duration_unit ?? 'minutes',
        description: input.description,
    };
}

/**
 * Transform a full DsuMeetings record into the update-payload shape PocketBase
 * expects when calling `pb.collection('dsu_meetings').update(id, payload)`.
 * Excludes id, created, updated, date (date is not editable post-creation).
 */
export function mapToUpdateMeeting(meeting: DsuMeetings): {
    title: string;
    duration_minutes?: number;
    duration_unit: DurationUnit;
    description?: string;
} {
    return {
        title: meeting.title,
        duration_minutes: meeting.duration_minutes,
        duration_unit: meeting.duration_unit,
        description: meeting.description,
    };
}

/**
 * Normalize a raw PocketBase record into a DsuMeetings shape.
 * Fills the `duration_unit` legacy default to `'minutes'` for rows that
 * pre-date Phase 1's schema migration (D-10).
 */
export function mapFromRecordMeeting(record: DsuMeetings): DsuMeetings {
    return {
        ...record,
        duration_unit: record.duration_unit ?? 'minutes',
    };
}
