/**
 * Runtime values + label map for the dsu_meetings.duration_unit field.
 * Pairs with the DurationUnit type derived from this tuple.
 */
export const DSU_MEETING_DURATION_UNIT_VALUES = ['minutes', 'hours'] as const;

export type DurationUnit = (typeof DSU_MEETING_DURATION_UNIT_VALUES)[number];

export const DSU_MEETING_DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
    minutes: 'min',
    hours: 'hr',
};
