import { computed, onMounted, onUnmounted, ref } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

/**
 * Module-level cached roster read, shared by every consumer the same way
 * `useFileToken` shares its token. PrimeVue mounts every TabPanel without
 * `lazy`, so `BoarderRosterView` here and its Phase 39/40 siblings
 * (`PaymentLog`, `ManagePayment`) can mount in the same tick — collapsing
 * onto one `getFullList` call avoids the SDK's auto-cancellation racing two
 * calls to the same method+path.
 *
 * No `setInterval` polling like `useFileToken`: a roster doesn't expire, it
 * only needs `refresh()` after a write.
 */
const boarders = ref<PaytimeBoarder[]>([]);
let inFlight: Promise<void> | null = null;
let consumers = 0;

function refresh(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      boarders.value = await pb
        .collection("paytime_boarders")
        .getFullList<PaytimeBoarder>({
          // name has no uniqueness constraint, so sort on id too — keeps
          // identically-named boarders in a deterministic order.
          sort: "name,id",
          // Own distinct key — never null, never paytime-payments-list or
          // paytime-report-list. See requestKeys.spec.ts for the assertion.
          requestKey: "paytime-boarders-list",
        });
    } catch (error) {
      toast.error("Failed to load roster.");
      console.warn("useBoarderRoster: getFullList failed", error);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

// A roster belongs to whoever was logged in when it was read.
pb.authStore.onChange(() => {
  boarders.value = [];
  if (consumers > 0 && pb.authStore.isValid) {
    void refresh();
  }
});

export function useBoarderRoster() {
  onMounted(() => {
    consumers += 1;
    void refresh();
  });

  onUnmounted(() => {
    consumers -= 1;
  });

  /**
   * Every boarder resolves through this roster record, linked or unlinked —
   * never through the `users` record. `null` is the expected steady state
   * for anyone with no roster row (D-38-14), not an error.
   */
  const myBoarder = computed<PaytimeBoarder | null>(() => {
    const authId = pb.authStore.record?.id;
    if (!authId) {
      return null;
    }
    return boarders.value.find((boarder) => boarder.user === authId) ?? null;
  });

  return { boarders, myBoarder, refresh };
}
