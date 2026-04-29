import { computed, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue';
import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants';

export interface UseDurationFieldReturn {
    /** Number shown in the InputNumber (null while empty). Derived from canonical minutes + unit. */
    enteredValue: WritableComputedRef<number | null>;
    /** Currently-selected unit for the toggle. */
    unit: Ref<DurationUnit>;
    /** Canonical minutes — single source of truth; undefined while empty. */
    durationMinutes: ComputedRef<number | undefined>;
    /** maxFractionDigits to bind on InputNumber (2 for hours, 0 for minutes). */
    fractionDigits: ComputedRef<number>;
    /** Re-seed both canonical minutes and unit atomically (e.g., when the v-model'd record is swapped). */
    seed: (savedMinutes: number | undefined, savedUnit: DurationUnit | undefined) => void;
}

/**
 * Encapsulates the bidirectional min/hr conversion for a meeting duration field.
 *
 * Round-trip rules (D-04):
 *   - savedUnit === 'hours'   -> enteredValue = savedMinutes / 60, unit = 'hours'
 *   - savedUnit === 'minutes' -> enteredValue = savedMinutes,      unit = 'minutes'
 *   - savedUnit === undefined -> treated as legacy 'minutes'.
 *
 * Toggle behavior: switching `unit` keeps canonical `durationMinutes` constant
 * and reflows the displayed `enteredValue` (e.g., 1 hr ⇄ 60 min).
 *
 * Forward (UI -> storage) is encoded in the writable computed setter:
 *   - unit === 'hours'   -> minutes = enteredValue * 60
 *   - unit === 'minutes' -> minutes = enteredValue
 *   - enteredValue null  -> minutes = undefined
 */
export function useDurationField(
    savedMinutes: number | undefined,
    savedUnit: DurationUnit | undefined,
): UseDurationFieldReturn {
    const minutes = ref<number | undefined>(savedMinutes ?? undefined);
    const unit = ref<DurationUnit>(savedUnit ?? 'minutes');

    const enteredValue = computed<number | null>({
        get() {
            if (minutes.value === undefined || minutes.value === null) return null;
            return unit.value === 'hours' ? minutes.value / 60 : minutes.value;
        },
        set(v) {
            if (v === null || v === undefined) {
                minutes.value = undefined;
                return;
            }
            minutes.value = unit.value === 'hours' ? v * 60 : v;
        },
    });

    const durationMinutes = computed<number | undefined>(() => minutes.value);
    const fractionDigits = computed<number>(() => (unit.value === 'hours' ? 2 : 0));

    function seed(savedMinutes: number | undefined, savedUnit: DurationUnit | undefined) {
        minutes.value = savedMinutes ?? undefined;
        unit.value = savedUnit ?? 'minutes';
    }

    return { enteredValue, unit, durationMinutes, fractionDigits, seed };
}
