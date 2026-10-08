import PocketBase from "pocketbase";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const pb = new PocketBase(baseUrl);

// SSO: on *.delveen.cc the shared .delveen.cc cookie is the source of truth, so
// logout / account switches on the sibling app propagate here. Skipped elsewhere
// (localhost, previews) because the browser rejects that cookie domain there and
// loading would wipe the local session on every reload.
export const onSharedDomain = /(^|\.)delveen\.cc$/.test(location.hostname);

// Read the pb_auth token straight out of document.cookie without mutating the
// auth store. Mirrors the SDK's own exportToCookie encoding (encodeURIComponent).
function cookieToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)pb_auth=([^;]*)/);
  const encoded = match?.[1];
  if (!encoded) return "";
  try {
    return JSON.parse(decodeURIComponent(encoded))?.token ?? "";
  } catch {
    return "";
  }
}

export function syncAuthFromCookie() {
  if (!onSharedDomain) return;
  // loadFromCookie() always calls save() → onChange, and the auth store's
  // onChange unconditionally re-exports the cookie. Bail when the token is
  // unchanged so a route change doesn't rewrite the cookie (and can't downgrade
  // a full record to the 4096-byte trimmed one) on every navigation.
  if (cookieToken() === pb.authStore.token) return;
  pb.authStore.loadFromCookie(document.cookie);
}

syncAuthFromCookie();

// Token expiry is passive — no event fires when the JWT lapses mid-session.
// A 401 from the backend is the authoritative signal that the current token is
// no longer accepted, so clear the auth store. The clear() fires authStore's
// onChange, which reactively flips the navbar to logged-out. Guarded on
// `record` so we only act when there's actually a session to tear down.
// `afterSend` runs before the SDK throws its ClientResponseError, so this does
// not swallow the rejection — callers still see the failed request.
pb.afterSend = (response, data) => {
  if (response.status === 401 && pb.authStore.record) {
    pb.authStore.clear();
  }
  return data;
};
