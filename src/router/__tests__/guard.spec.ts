import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent } from "vue";
import { setActivePinia, createPinia } from "pinia";

// vi.mock MUST appear before any named imports that use the mocked modules.
// Vitest hoists vi.mock calls but only processes them in module scope — place at top.
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(),
}));
// Mock PocketBase so the auth store module does not try to connect on import
vi.mock("@/lib/pocketbase", () => ({
  pb: { authStore: { record: null, onChange: vi.fn(), isValid: false } },
}));

import { useAuthStore } from "@/stores/auth";

type AuthStore = ReturnType<typeof useAuthStore>;

/** Configure the mocked auth store with only the fields a guard case needs. */
function mockAuth(state: Partial<AuthStore>) {
  (useAuthStore as MockedFunction<typeof useAuthStore>).mockReturnValue(
    state as AuthStore,
  );
}

// Minimal stub component — guard tests do not need real component rendering
const Stub = defineComponent({ template: "<div />" });

/**
 * Build a fresh test router for each test case.
 * Uses createMemoryHistory (not createWebHistory) — required for jsdom.
 * Routes mirror the production routes relevant to the guard under test.
 * DO NOT import src/router/index.ts here.
 */
function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Stub },
      { path: "/login", name: "login", component: Stub },
      { path: "/projects/lulon", name: "lulon", component: Stub },
      {
        path: "/projects/wallecx",
        name: "wallecx",
        component: Stub,
        meta: { requiresAuth: true },
      },
      {
        path: "/projects/manage",
        name: "manage",
        component: Stub,
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  });
}

/**
 * Re-registers the beforeEach guard on the test router.
 * Logic mirrors src/router/index.ts router.beforeEach exactly.
 * Separate function so tests can opt into the guard explicitly.
 */
function addGuard(router: ReturnType<typeof buildRouter>) {
  router.beforeEach((to, _from, next) => {
    const auth = (useAuthStore as MockedFunction<typeof useAuthStore>)();
    if (to.matched.some((r) => r.meta?.requiresAuth)) {
      if (!auth.isLoggedIn) {
        next({ name: "login", query: { redirect: to.fullPath } });
        return;
      }
    }
    if (to.matched.some((r) => r.meta?.requiresAdmin)) {
      if (!auth.isAdmin) {
        next({ name: "lulon" });
        return;
      }
    }
    next();
  });
}

describe("requiresAuth guard — /projects/wallecx", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("redirects to /login when not authenticated", async () => {
    mockAuth({ isLoggedIn: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/wallecx");
    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/projects/wallecx");
  });

  it("preserves query string in redirect when not authenticated", async () => {
    mockAuth({ isLoggedIn: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/wallecx?action=add-expense");
    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe(
      "/projects/wallecx?action=add-expense",
    );
  });

  it("allows navigation when authenticated", async () => {
    mockAuth({ isLoggedIn: true });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/wallecx");
    expect(router.currentRoute.value.name).toBe("wallecx");
  });

  it("allows unauthenticated access to non-guarded routes", async () => {
    mockAuth({ isLoggedIn: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/");
    expect(router.currentRoute.value.name).toBe("home");
  });
});

describe("requiresAdmin guard — /projects/manage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("redirects a logged-in non-admin to /projects/lulon", async () => {
    mockAuth({ isLoggedIn: true, isAdmin: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/manage");
    expect(router.currentRoute.value.name).toBe("lulon");
  });

  it("redirects an unauthenticated visitor to /login", async () => {
    mockAuth({ isLoggedIn: false, isAdmin: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/manage");
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("allows a logged-in admin", async () => {
    mockAuth({ isLoggedIn: true, isAdmin: true });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/manage");
    expect(router.currentRoute.value.name).toBe("manage");
  });
});
