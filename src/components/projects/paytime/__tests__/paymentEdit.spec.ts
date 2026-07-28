import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmationService from "primevue/confirmationservice";
import PrimeVue from "primevue/config";

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
};

const create = vi.fn();
const update = vi.fn();

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: () => ({
      getFullList: async () => [record],
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
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

// Button is left unstubbed so the real <button> elements (and their
// aria-labels) exist to click.
const mountOptions = {
  global: {
    plugins: [PrimeVue, ConfirmationService],
    stubs: {
      Select: true,
      DatePicker: true,
      InputNumber: true,
      Textarea: true,
      Message: true,
      Tag: true,
    },
  },
};

const clickByLabel = async (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper
    .findAll("button")
    .find(
      (candidate) =>
        candidate.attributes("aria-label")?.includes(text) ||
        candidate.text().includes(text),
    );
  expect(button, `no button matching "${text}"`).toBeTruthy();
  await button!.trigger("click");
};

beforeEach(() => {
  create.mockReset().mockResolvedValue(record);
  update.mockReset().mockResolvedValue(record);
});

describe("PaymentLog edit flow", () => {
  it("updates the existing row instead of creating a new one", async () => {
    const PaymentLog = (await import("../PaymentLog.vue")).default;
    const wrapper = mount(PaymentLog, mountOptions);
    await vi.waitFor(() => expect(wrapper.html()).toContain("July 2026"));

    expect(wrapper.text()).toContain("Log a Payment");

    await clickByLabel(wrapper, "Edit");
    expect(wrapper.text()).toContain("Edit Payment");
    expect(wrapper.text()).toContain("Update Payment");

    await clickByLabel(wrapper, "Update Payment");
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));

    expect(update.mock.calls[0][0]).toBe(record.id);
    expect(create).not.toHaveBeenCalled();

    // Back to create mode once the update lands.
    await vi.waitFor(() => expect(wrapper.text()).toContain("Log a Payment"));
    wrapper.unmount();
  });

  it("cancelling edit returns to create mode without saving", async () => {
    const PaymentLog = (await import("../PaymentLog.vue")).default;
    const wrapper = mount(PaymentLog, mountOptions);
    await vi.waitFor(() => expect(wrapper.html()).toContain("July 2026"));

    await clickByLabel(wrapper, "Edit");
    expect(wrapper.text()).toContain("Edit Payment");

    await clickByLabel(wrapper, "Cancel");
    expect(wrapper.text()).toContain("Log a Payment");
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
