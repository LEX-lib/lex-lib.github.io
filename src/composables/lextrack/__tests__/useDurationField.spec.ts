import { describe, it, expect } from 'vitest';
import { useDurationField } from '@/composables/lextrack/useDurationField';

describe('useDurationField', () => {
  it('seeds minutes unit and shows value as-is', () => {
    const { enteredValue, unit, durationMinutes } = useDurationField(30, 'minutes');
    expect(unit.value).toBe('minutes');
    expect(enteredValue.value).toBe(30);
    expect(durationMinutes.value).toBe(30);
  });

  it('seeds hours unit and converts minutes to hours', () => {
    const { enteredValue, unit, durationMinutes } = useDurationField(90, 'hours');
    expect(unit.value).toBe('hours');
    expect(enteredValue.value).toBe(1.5);
    expect(durationMinutes.value).toBe(90);
  });

  it('defaults undefined savedUnit to minutes', () => {
    const { unit } = useDurationField(30, undefined);
    expect(unit.value).toBe('minutes');
  });

  it('converts entered hours to canonical minutes', () => {
    const { enteredValue, durationMinutes } = useDurationField(undefined, 'hours');
    enteredValue.value = 2;
    expect(durationMinutes.value).toBe(120);
  });

  it('null enteredValue produces undefined durationMinutes', () => {
    const { enteredValue, durationMinutes } = useDurationField(undefined, 'minutes');
    enteredValue.value = null;
    expect(durationMinutes.value).toBeUndefined();
  });

  it('seed() atomically replaces minutes and unit', () => {
    const { seed, unit, enteredValue } = useDurationField(30, 'minutes');
    seed(120, 'hours');
    expect(unit.value).toBe('hours');
    expect(enteredValue.value).toBe(2);
  });

  it('fractionDigits is 2 for hours, 0 for minutes', () => {
    const { unit, fractionDigits } = useDurationField(60, 'minutes');
    expect(fractionDigits.value).toBe(0);
    unit.value = 'hours';
    expect(fractionDigits.value).toBe(2);
  });
});
