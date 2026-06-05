// Single locked currency for v4.0 (D-10). Multi-currency support is deferred to EXP-ADV-03,
// which would migrate this to a user setting or a per-expense field.
export const WALLECX_CURRENCY = 'PHP';
export const WALLECX_CURRENCY_LOCALE = 'en-PH';

const formatter = new Intl.NumberFormat(WALLECX_CURRENCY_LOCALE, {
  style: 'currency',
  currency: WALLECX_CURRENCY,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
