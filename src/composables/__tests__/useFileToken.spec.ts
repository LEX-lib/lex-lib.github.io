import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";

const getToken = vi.fn();
const onChange = vi.fn();

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    files: { getToken: () => getToken() },
    authStore: { isValid: true, onChange: (cb: () => void) => onChange(cb) },
  },
}));

const { useFileToken } = await import("../useFileToken");

const Host = defineComponent({
  setup() {
    const { token } = useFileToken();
    return () => h("span", token.value);
  },
});

beforeEach(() => {
  getToken.mockReset();
  getToken.mockResolvedValue("tok-1");
});

describe("useFileToken", () => {
  it("fetches a token on mount", async () => {
    const wrapper = mount(Host);
    await vi.waitFor(() => expect(wrapper.text()).toBe("tok-1"));
    wrapper.unmount();
  });

  // Regression: two sibling components mounting together used to issue two
  // getToken() calls, and the SDK auto-cancelled the first.
  it("collapses simultaneous mounts onto a single request", async () => {
    let release: (value: string) => void = () => {};
    getToken.mockImplementation(
      () => new Promise<string>((resolve) => (release = resolve)),
    );

    const first = mount(Host);
    const second = mount(Host);
    release("tok-shared");

    await vi.waitFor(() => expect(first.text()).toBe("tok-shared"));
    expect(second.text()).toBe("tok-shared");
    expect(getToken).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
  });

  // A transient failure must not blank a working token, or every attachment
  // URL on screen would start 403ing until the next successful refresh.
  it("keeps the previous token when a refresh fails", async () => {
    getToken.mockResolvedValue("tok-good");
    const seeded = mount(Host);
    await vi.waitFor(() => expect(seeded.text()).toBe("tok-good"));
    seeded.unmount();

    getToken.mockRejectedValue(new Error("boom"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(Host);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    expect(wrapper.text()).toBe("tok-good");
    wrapper.unmount();
    warn.mockRestore();
  });
});
