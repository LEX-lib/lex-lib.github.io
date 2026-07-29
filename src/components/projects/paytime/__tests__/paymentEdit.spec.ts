import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import type { PaytimePayment } from "@/types/paytime/payments/types";

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
} as unknown as PaytimePayment;

const create = vi.fn();
const update = vi.fn();

vi.mock("@/lib/pocketbase", () => ({
  pb: {
    collection: () => ({
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
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

// Dialog is NOT stubbed — its default slot and footer must render for the
// buttons to exist. Button is real so the aria-labels/text are clickable.
const mountOptions = (current: PaytimePayment | null) => ({
  props: { visible: true, record: current },
  global: {
    plugins: [PrimeVue],
    // Inline validation text lives in Message's default slot.
    renderStubDefaultSlot: true,
    stubs: {
      // Dialog teleports to body by default, which puts its content outside
      // the wrapper — stub the teleport so it renders in place.
      teleport: true,
      Select: true,
      DatePicker: true,
      InputNumber: true,
      Textarea: true,
      Message: true,
      FileUpload: true,
    },
  },
});

/** Dialog content appears via an appear-transition, so wait for it. */
const waitForText = (wrapper: ReturnType<typeof mount>, text: string) =>
  vi.waitFor(() => expect(wrapper.text()).toContain(text));

const clickByText = async (
  wrapper: ReturnType<typeof mount>,
  text: string,
) => {
  await waitForText(wrapper, text);
  const button = wrapper.findAll("button").find((c) => c.text().includes(text));
  expect(button, `no button matching "${text}"`).toBeTruthy();
  await button!.trigger("click");
};

beforeEach(() => {
  create.mockReset().mockResolvedValue(record);
  update.mockReset().mockResolvedValue(record);
});

describe("ManagePayment", () => {
  it("updates the existing record when opened with one", async () => {
    const ManagePayment = (await import("../ManagePayment.vue")).default;
    const wrapper = mount(ManagePayment, mountOptions(record));

    await waitForText(wrapper, "Edit Payment");
    await clickByText(wrapper, "Update Payment");
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));

    expect(update.mock.calls[0][0]).toBe(record.id);
    expect(create).not.toHaveBeenCalled();
    // Closes itself on success.
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it("creates a new record when opened without one", async () => {
    const ManagePayment = (await import("../ManagePayment.vue")).default;
    const wrapper = mount(ManagePayment, mountOptions(null));

    await waitForText(wrapper, "Log a Payment");
    // Amount is required and defaults to empty, so seed it before saving.
    (wrapper.vm as unknown as { amount: number | null }).amount = 500;
    await wrapper.vm.$nextTick();

    await clickByText(wrapper, "Save Payment");
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(update).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("blocks saving when amount is missing", async () => {
    const ManagePayment = (await import("../ManagePayment.vue")).default;
    const wrapper = mount(ManagePayment, mountOptions(null));

    await clickByText(wrapper, "Save Payment");
    expect(create).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Amount is required.");
    wrapper.unmount();
  });
});
