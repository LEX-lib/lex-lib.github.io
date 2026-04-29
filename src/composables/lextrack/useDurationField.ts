import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants';

export interface UseDurationFieldReturn {
    /** Number shown in the InputNumber (null while empty). */
    enteredValue: Ref<number | null>;
    /** Currently-selected unit for the toggle. */
    unit: Ref<DurationUnit>;
    /** Canonical minutes derived from enteredValue + unit; undefined while empty. */
    durationMinutes: ComputedRef<number | undefined>;
    /** maxFractionDigits to bind on InputNumber (2 for hours, 0 for minutes). */
    fractionDigits: ComputedRef<number>;
}

/**
 * Encapsulates the bidirectional min/hr conversion for a meeting duration field.
 *
 * Round-trip rules (D-04):
 *   - savedUnit === 'hours'   -> enteredValue = savedMinutes / 60, unit = 'hours'
 *   - savedUnit === 'minutes' -> enteredValue = savedMinutes,      unit = 'minutes'
 *   - savedUnit === undefined -> treated as legacy 'minutes' (mapper layer normalizes,
 *                                but defend in depth here too)
 *
 * Forward (UI -> storage):
 *   - unit === 'hours'   -> duration_minutes = enteredValue * 60
 *   - unit === 'minutes' -> duration_minutes = enteredValue
 *   - enteredValue null  -> duration_minutes = undefined
 */
export function useDurationField(
    savedMinutes: number | undefined,
    savedUnit: DurationUnit | undefined,
): UseDurationFieldReturn {
    const initialUnit: DurationUnit = savedUnit ?? 'minutes';
    const initialEntered: number | null =
        savedMinutes === undefined || savedMinutes === null
            ? null
            : initialUnit === 'hours'
              ? savedMinutes / 60
              : savedMinutes;

    const enteredValue = ref<number | null>(initialEntered);
    const unit = ref<DurationUnit>(initialUnit);

    const durationMinutes = computed<number | undefined>(() => {
        if (enteredValue.value === null || enteredValue.value === undefined) return undefined;
        return unit.value === 'hours' ? enteredValue.value * 60 : enteredValue.value;
    });

    const fractionDigits = computed<number>(() => (unit.value === 'hours' ? 2 : 0));

    return { enteredValue, unit, durationMinutes, fractionDigits };
}
