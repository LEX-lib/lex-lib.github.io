import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const AUTH_STORAGE_KEY = "pocketbase_auth";
const COOKIE_NAME = "pb_auth";

type AuthPayload = { token: string; record: Record<string, unknown> | null };

const record = { id: "user-1", email: "a@example.com" };

function writeLocalSession(payload: AuthPayload) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

function writeCookie(payload: AuthPayload | null) {
  if (payload === null) {
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    return;
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; path=/`;
}

function clearCookies() {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

// Stub the hostname BEFORE importing so the module-level `onSharedDomain`
// constant is computed against it. resetModules gives each case a fresh module.
async function loadPb(hostname: string) {
  vi.resetModules();
  vi.stubGlobal("location", { hostname });
  return import("@/lib/pocketbase");
}

beforeEach(() => {
  window.localStorage.clear();
  clearCookies();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  clearCookies();
});

describe("onSharedDomain", () => {
  const cases: Array<[string, boolean]> = [
    ["delveen.cc", true],
    ["kaheeta.delveen.cc", true],
    ["www.delveen.cc", true],
    ["localhost", false],
    ["127.0.0.1", false],
    ["delveen.cc.evil.com", false],
    ["notdelveen.cc", false],
    ["lex-lib.github.io", false],
  ];

  it.each(cases)("treats %s as shared=%s", async (hostname, expected) => {
    const { onSharedDomain } = await loadPb(hostname);
    expect(onSharedDomain).toBe(expected);
  });
});

describe("syncAuthFromCookie", () => {
  it("is a no-op off the shared domain and ignores a sibling cookie", async () => {
    writeLocalSession({ token: "local-token", record });
    writeCookie({ token: "sibling-token", record });

    const { pb, syncAuthFromCookie } = await loadPb("localhost");
    syncAuthFromCookie();

    expect(pb.authStore.token).toBe("local-token");
  });

  it("adopts the sibling cookie token on the shared domain", async () => {
    writeLocalSession({ token: "local-token", record });
    writeCookie({ token: "sibling-token", record });

    const { pb, syncAuthFromCookie } = await loadPb("kaheeta.delveen.cc");
    syncAuthFromCookie();

    expect(pb.authStore.token).toBe("sibling-token");
  });

  it("clears the session when the sibling deleted the cookie (logout propagation)", async () => {
    writeLocalSession({ token: "local-token", record });
    writeCookie(null);

    const { pb, syncAuthFromCookie } = await loadPb("kaheeta.delveen.cc");
    syncAuthFromCookie();

    expect(pb.authStore.token).toBe("");
    expect(pb.authStore.record).toBeNull();
  });
});
