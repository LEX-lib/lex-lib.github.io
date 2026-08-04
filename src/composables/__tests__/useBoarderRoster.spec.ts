import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import type { PaytimeBoarder } from "@/types/paytime/boarders/types";

const getFullList = vi.fn();
const authOnChange = vi.fn();
/** Mutated per test rather than reassigned as a `let`, so the vi.mock
 * factory's closures always read the current value regardless of hoisting. */
const authState: { isValid: boolean; record: { id: string } | undefined } = {
  isValid: true,
  record: undefined,
};

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: () => ({
      getFullList: (options: unknown) => getFullList(options),
    }),
    authStore: {
      get isValid() {
        return authState.isValid;
      },
      get record() {
        return authState.record;
      },
      onChange: (cb: () => void) => authOnChange(cb),
    },
  },
}));

const boarder = (overrides: Partial<PaytimeBoarder> = {}): PaytimeBoarder =>
  ({
    id: "b1",
    created: "",
    updated: "",
    name: "Probe A",
    tags: [],
    user: "",
    is_active: true,
    ...overrides,
  }) as PaytimeBoarder;

beforeEach(() => {
  getFullList.mockReset();
  authOnChange.mockReset();
  getFullList.mockResolvedValue([]);
  authState.isValid = true;
  authState.record = undefined;
});

/**
 * The composable's state is module-level (shared cache, matching
 * useFileToken's shape), so each test resets the module registry and
 * re-imports it — otherwise the cache from one test would silently satisfy
 * the next and the dedup assertion would pass vacuously.
 */
describe("useBoarderRoster", () => {
  it("collapses simultaneous mounts onto a single request (Pitfall 5)", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    const Host = defineComponent({
      setup() {
        const { boarders } = useBoarderRoster();
        return () => h("div", String(boarders.value.length));
      },
    });

    const first = mount(Host);
    const second = mount(Host);
    await vi.waitFor(() => expect(getFullList).toHaveBeenCalled());
    expect(getFullList).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
  });

  it("registers requestKey paytime-boarders-list, distinct from sibling keys", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    const Host = defineComponent({
      setup() {
        useBoarderRoster();
        return () => h("div");
      },
    });

    const wrapper = mount(Host);
    await vi.waitFor(() => expect(getFullList).toHaveBeenCalled());

    const options = getFullList.mock.calls[0][0] as { requestKey?: string };
    expect(options.requestKey).toBe("paytime-boarders-list");
    expect(options.requestKey).not.toBe("paytime-payments-list");
    expect(options.requestKey).not.toBe("paytime-report-list");

    wrapper.unmount();
  });

  it("empties the roster when pb.authStore fires a change", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    getFullList.mockResolvedValue([boarder()]);

    const Host = defineComponent({
      setup() {
        const { boarders } = useBoarderRoster();
        return () => h("div", String(boarders.value.length));
      },
    });

    const wrapper = mount(Host);
    await vi.waitFor(() => expect(wrapper.text()).toBe("1"));

    expect(authOnChange).toHaveBeenCalled();
    const onAuthChange = authOnChange.mock.calls[0][0] as () => void;
    // Logging out: consumers > 0 but authStore.isValid is now false, so the
    // roster is cleared and NOT refetched for a signed-out visitor.
    authState.isValid = false;
    getFullList.mockClear();
    onAuthChange();

    await vi.waitFor(() => expect(wrapper.text()).toBe("0"));
    expect(getFullList).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("resolves every boarder through the roster record, linked or unlinked, and never falls back to users", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    getFullList.mockResolvedValue([
      boarder({ id: "unlinked", user: "" }),
      boarder({ id: "linked", user: "auth-1" }),
    ]);
    authState.record = { id: "auth-1" };

    const Host = defineComponent({
      setup() {
        const { boarders, myBoarder } = useBoarderRoster();
        return () =>
          h("div", `${boarders.value.length}:${myBoarder.value?.id ?? "null"}`);
      },
    });

    const wrapper = mount(Host);
    // The unlinked row is not filtered out of the roster (assumption-delta
    // promote invariant), and myBoarder resolves the linked row.
    await vi.waitFor(() => expect(wrapper.text()).toBe("2:linked"));
    wrapper.unmount();
  });

  it("returns myBoarder: null when the authenticated id matches no row", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    getFullList.mockResolvedValue([
      boarder({ id: "unlinked", user: "" }),
      boarder({ id: "linked", user: "auth-1" }),
    ]);
    authState.record = { id: "no-match" };

    const Host = defineComponent({
      setup() {
        const { myBoarder } = useBoarderRoster();
        return () => h("div", myBoarder.value?.id ?? "null");
      },
    });

    const wrapper = mount(Host);
    await vi.waitFor(() => expect(wrapper.text()).toBe("null"));
    wrapper.unmount();
  });

  it("returns myBoarder: null with no authStore.record, never matching an unlinked row's empty user", async () => {
    vi.resetModules();
    const { useBoarderRoster } = await import("../useBoarderRoster");
    getFullList.mockResolvedValue([boarder({ id: "unlinked", user: "" })]);
    authState.record = undefined;

    const Host = defineComponent({
      setup() {
        const { myBoarder } = useBoarderRoster();
        return () => h("div", myBoarder.value?.id ?? "null");
      },
    });

    const wrapper = mount(Host);
    await vi.waitFor(() => expect(getFullList).toHaveBeenCalled());
    await vi.waitFor(() => expect(wrapper.text()).toBe("null"));
    wrapper.unmount();
  });
});
