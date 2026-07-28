import { onMounted, onUnmounted, ref } from "vue";
import { pb } from "@/lib/pocketbase";

/**
 * Keeps a short-lived PocketBase file token fresh so URLs for `protected`
 * file fields stay valid while the page is open.
 *
 * Prod sets fileToken.duration to 180s, so refresh well inside that window —
 * a refresh interval longer than the server's expiry leaves a dead gap where
 * every attachment URL 403s.
 *
 * State is module-level on purpose. A file token is scoped to the user, not
 * to a record, so every caller wants the same one. PrimeVue renders all Tabs
 * panels unless `lazy` is set, so sibling components mount together — with
 * per-caller state they each fired their own getToken(), and because the SDK
 * derives its auto-cancel key from method+URL, the second call aborted the
 * first ("The request was aborted (most likely autocancelled)").
 */
const RefreshMs = 150 * 1000;

const token = ref("");
let inFlight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let consumers = 0;

function refresh(): Promise<void> {
  // Collapse concurrent callers onto one request rather than letting the
  // SDK's auto-cancellation kill the earlier ones.
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      // requestKey: null opts out of auto-cancellation entirely — token
      // fetches are idempotent, so there is nothing worth cancelling.
      token.value = await pb.files.getToken({ requestKey: null });
    } catch (error) {
      console.warn("useFileToken: getToken failed", error);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// A token belongs to whoever was logged in when it was issued. On login or
// logout, drop it so a stale token can't be appended to file URLs.
pb.authStore.onChange(() => {
  token.value = "";
  if (consumers > 0 && pb.authStore.isValid) {
    void refresh();
  }
});

export function useFileToken() {
  onMounted(() => {
    consumers += 1;
    if (!timer) {
      timer = setInterval(refresh, RefreshMs);
    }
    void refresh();
  });

  onUnmounted(() => {
    consumers -= 1;
    if (consumers <= 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  });

  return { token, refresh };
}
