/**
 * Runtime values + label map for the dsu_day_status.status field.
 * The 5 values match the live PocketBase schema (see 01-03-SUMMARY.md §Deviations).
 * Phase 5 (Day Status UI) consumes both the values tuple and the labels map.
 */
export const DSU_DAY_STATUS_VALUES = ['sl', 'vl', 'holiday', 'bl', 'others'] as const;

export type DsuDayStatusValue = (typeof DSU_DAY_STATUS_VALUES)[number];

export const DSU_DAY_STATUS_LABELS: Record<DsuDayStatusValue, string> = {
    sl: 'Sick Leave',
    vl: 'Vacation Leave',
    holiday: 'Holiday',
    bl: 'Birthday Leave',
    others: 'Other',
};
