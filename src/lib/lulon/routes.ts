import type { LocationQuery } from "vue-router";

/** Prefix the pre-rebrand MonitoX routes lived under. */
export const LEGACY_GIFT_EXCHANGE_PREFIX = "/projects/gift-exchange";
/** Prefix the rebranded Lulon routes live under. */
export const LULON_PREFIX = "/projects/lulon";

/**
 * Map a legacy `/projects/gift-exchange*` location to its `/projects/lulon*`
 * equivalent while **preserving the query string**. Shared links carry
 * `?lobby=` and `?code=` — dropping them would strand participants.
 */
export function legacyGiftExchangeRedirect(to: {
  path: string;
  query: LocationQuery;
}): { path: string; query: LocationQuery } {
  return {
    path: to.path.replace(
      new RegExp(`^${LEGACY_GIFT_EXCHANGE_PREFIX}`),
      LULON_PREFIX,
    ),
    query: to.query,
  };
}
