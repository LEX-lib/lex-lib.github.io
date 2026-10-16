/**
 * MonitoX lobby-code session memory.
 *
 * The lobby code is a *shared* group code — every participant in the exchange
 * knows it — so remembering it for the browser session is safe and saves people
 * from re-typing it as they move between the join and draw pages.
 *
 * A code present in the URL always wins and is persisted; otherwise the last
 * known code is restored. Backed by `sessionStorage`: it survives in-app
 * navigation and same-tab reloads, and is discarded when the tab closes.
 */

const STORAGE_KEY = "monitox.lobby_code";

/** Uppercase + trim so `abcd`, ` ABCD ` and `ABCD` all match one another. */
export function normalizeLobbyCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

/** Persist the lobby code for the rest of the browser session. */
export function saveLobbyCode(code: string | null | undefined): void {
  const normalized = normalizeLobbyCode(code);
  if (!normalized) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Storage can be unavailable (private mode) or full — non-fatal.
  }
}

/** The lobby code remembered for this session, or `""` when there is none. */
export function getSavedLobbyCode(): string {
  try {
    return normalizeLobbyCode(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return "";
  }
}

/** Forget the remembered code — e.g. once the lobby turns out to be invalid. */
export function clearSavedLobbyCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Non-fatal, see saveLobbyCode.
  }
}

/**
 * Resolve the lobby code for a page: `?lobby=` from the URL wins and is saved
 * for later pages, otherwise the previously saved code is restored.
 */
export function resolveLobbyCode(
  search: string = window.location.search,
): string {
  const fromUrl = normalizeLobbyCode(new URLSearchParams(search).get("lobby"));
  if (fromUrl) {
    saveLobbyCode(fromUrl);
    return fromUrl;
  }
  return getSavedLobbyCode();
}
