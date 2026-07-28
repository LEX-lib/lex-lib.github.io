export interface SubMeterReading {
  label: string;
  readingFrom: number;
  readingTo: number;
}

export interface SubMeterShare {
  label: string;
  kwh: number;
  amount: number;
}

export interface ElectricityShares {
  pricePerKwh: number;
  subMeters: SubMeterShare[];
  group1Kwh: number;
  group1Amount: number;
  perPersonAmount: number;
}

/**
 * Splits a shared electricity bill between the main group and sub-metered
 * groups. Price per kWh is derived from the total bill; each sub-meter pays
 * (readingTo - readingFrom) * price; the main group divides the remainder
 * per head. Returns null when totals are not positive numbers.
 */
export function calculateShares(
  totalKwh: number,
  totalAmount: number,
  subMeters: SubMeterReading[],
  group1People: number,
): ElectricityShares | null {
  if (!(totalKwh > 0) || !(totalAmount > 0)) {
    return null;
  }

  const pricePerKwh = totalAmount / totalKwh;

  const subMeterShares = subMeters.map((meter) => {
    const kwh = meter.readingTo - meter.readingFrom;
    return {
      label: meter.label,
      kwh,
      amount: kwh * pricePerKwh,
    };
  });

  const subMeterTotalKwh = subMeterShares.reduce(
    (sum, share) => sum + share.kwh,
    0,
  );
  const group1Kwh = totalKwh - subMeterTotalKwh;
  const group1Amount = group1Kwh * pricePerKwh;
  const perPersonAmount =
    group1People > 0 ? group1Amount / group1People : group1Amount;

  return {
    pricePerKwh,
    subMeters: subMeterShares,
    group1Kwh,
    group1Amount,
    perPersonAmount,
  };
}
