import type {
    DsuDayStatus,
    AddDsuDayStatus,
} from '@/types/lextrack/dsu_day_status/types';

/**
 * Transform an AddDsuDayStatus create-payload into the exact shape PocketBase
 * expects when calling `pb.collection('dsu_day_status').create(payload)`.
 *
 * Note: there is no mapToUpdateDayStatus. Day-status semantics are
 * "set status for a date" — Phase 5 will implement this as either
 * (a) fetch-then-create-or-replace, or (b) delete-by-date-then-create.
 * If Phase 5 finds it needs a true update path, this decision (CONTEXT.md
 * D-11) can be revisited.
 */
export function mapToCreateDayStatus(input: AddDsuDayStatus): {
    date: string;
    status: DsuDayStatus['status'];
} {
    return {
        date: input.date,
        status: input.status,
    };
}

/**
 * Normalize a raw PocketBase record into a DsuDayStatus shape.
 * No legacy defaults — this is a brand-new collection (Phase 1) so
 * every record was created with the current schema. The pass-through
 * spread is included for symmetry with the other three mappers (D-12);
 * future field additions plug in here.
 */
export function mapFromRecordDayStatus(record: DsuDayStatus): DsuDayStatus {
    return {
        ...record,
    };
}
