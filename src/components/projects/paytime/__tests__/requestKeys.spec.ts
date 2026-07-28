import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmationService from "primevue/confirmationservice";

const record = {
  amount: 123,
  category: "electricity",
  collectionId: "pbc_1550650043",
  collectionName: "paytime_payments",
  created: "2026-07-28 07:52:35.587Z",
  id: "4fsz8cnwo7s05fu",
  month: "2026-07",
  notes: "",
  payment_date: "2026-07-28 00:00:00.000Z",
  screenshot: "whiteboard_q19696dkv2.png",
  updated: "2026-07-28 07:52:35.587Z",
  user: "4ygxbt0zey088di",
  expand: { user: { id: "4ygxbt0zey088di", name: "Cedrick Jhan Deferia" } },
};

const getFullList = vi.fn();

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: () => ({
      getFullList: (options: unknown) => getFullList(options),
      create: async () => record,
      delete: async () => true,
    }),
    files: {
      getURL: () => "https://example.test/proof.png",
      getToken: async () => "tok",
    },
    authStore: { isValid: true, onChange: () => {} },
  },
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ user: { id: "4ygxbt0zey088di" }, isLoggedIn: true }),
}));

const mountOptions = {
  global: {
    // PaymentLog's delete guard uses useConfirm, which needs the service.
    plugins: [ConfirmationService],
    stubs: {
      Select: true,
      DatePicker: true,
      InputNumber: true,
      Textarea: true,
      Message: true,
      Button: true,
      Tag: true,
    },
  },
};

const keyOf = (call: unknown[]) =>
  (call[0] as { requestKey?: string }).requestKey;

beforeEach(() => {
  getFullList.mockReset();
  getFullList.mockResolvedValue([record]);
});

/**
 * Regression: the SDK's default auto-cancel key is method+path and ignores
 * the query string, so both panels resolved to the same key. PrimeVue mounts
 * every Tabs panel unless `lazy` is set, so the two list calls raced and one
 * was always aborted with "The request was aborted (most likely
 * autocancelled)".
 */
describe("PayTime list request keys", () => {
  it("PaymentLog and MonthlyReport use distinct requestKeys", async () => {
    const PaymentLog = (await import("../PaymentLog.vue")).default;
    const MonthlyReport = (await import("../MonthlyReport.vue")).default;

    const log = mount(PaymentLog, mountOptions);
    const report = mount(MonthlyReport, mountOptions);
    await vi.waitFor(() => expect(getFullList).toHaveBeenCalledTimes(2));

    const keys = getFullList.mock.calls.map(keyOf);
    expect(keys.every(Boolean)).toBe(true);
    expect(new Set(keys).size).toBe(2);

    log.unmount();
    report.unmount();
  });

  it("PaymentLog renders a fetched payment", async () => {
    const PaymentLog = (await import("../PaymentLog.vue")).default;
    const wrapper = mount(PaymentLog, mountOptions);
    await vi.waitFor(() => expect(wrapper.html()).toContain("July 2026"));
    expect(wrapper.html()).toContain("Jul 28, 2026");
    wrapper.unmount();
  });
});
