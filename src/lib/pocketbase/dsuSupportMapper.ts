import type { DsuSupports, AddDsuSupport } from '@/types/lextrack/dsu_supports/types';

/**
 * Transform an AddDsuSupport create-payload into the exact shape PocketBase
 * expects when calling `pb.collection('dsu_supports').create(payload)`.
 */
export function mapToCreateSupport(input: AddDsuSupport): {
    date: string;
    title: string;
    link?: string;
    description?: string;
} {
    return {
        date: input.date,
        title: input.title,
        link: input.link,
        description: input.description,
    };
}

/**
 * Transform a full DsuSupports record into the update-payload shape PocketBase
 * expects when calling `pb.collection('dsu_supports').update(id, payload)`.
 * Excludes id, created, updated, date (date is not editable post-creation).
 */
export function mapToUpdateSupport(support: DsuSupports): {
    title: string;
    link?: string;
    description?: string;
} {
    return {
        title: support.title,
        link: support.link,
        description: support.description,
    };
}

/**
 * Normalize a raw PocketBase record into a DsuSupports shape.
 * No legacy defaults needed — `link` is genuinely optional and an
 * empty value is "no link" (Phase 1 D-12).
 */
export function mapFromRecordSupport(record: DsuSupports): DsuSupports {
    return {
        ...record,
    };
}
