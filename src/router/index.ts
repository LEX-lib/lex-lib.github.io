import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { syncAuthFromCookie } from "@/lib/pocketbase";
import { legacyGiftExchangeRedirect } from "@/lib/lulon/routes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/components/Login.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("@/views/ProjectsView.vue"),
    },
    {
      path: "/projects/larga",
      name: "larga",
      component: () => import("@/components/projects/larga/LargaApp.vue"),
    },
    {
      path: "/projects/lextrack",
      name: "lextrack",
      component: () => import("@/views/LexTrackView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/projects/lulon",
      name: "lulon",
      component: () => import("@/components/projects/lulon/LulonLanding.vue"),
    },
    {
      path: "/projects/lulon/join",
      name: "lulon-join",
      component: () => import("@/components/projects/lulon/LulonJoin.vue"),
    },
    {
      path: "/projects/lulon/draw",
      name: "lulon-draw",
      component: () => import("@/components/projects/lulon/LulonDraw.vue"),
    },
    {
      path: "/projects/lulon/manage",
      name: "lulon-manage",
      component: () => import("@/components/projects/lulon/LulonManage.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    // Legacy MonitoX paths — preserve query (?lobby= / ?code=) so shared links
    // keep working after the rebrand.
    {
      path: "/projects/gift-exchange/:pathMatch(.*)*",
      redirect: legacyGiftExchangeRedirect,
    },
    {
      path: "/projects/api-playground",
      name: "api-playground",
      component: () =>
        import("@/components/projects/api-playground/ApiPlaygroundApp.vue"),
    },
    {
      path: "/projects/wallecx",
      name: "wallecx",
      component: () => import("@/components/projects/wallecx/WallecxApp.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/blog",
      name: "blog",
      component: () => import("@/views/BlogView.vue"),
    },
  ],
});

router.beforeEach((to, from, next) => {
  // Re-sync from the shared cookie before every guard check so in-SPA
  // navigation picks up a logout or login from the sibling app.
  syncAuthFromCookie();

  const auth = useAuthStore();
  if (to.matched.some((record) => record.meta?.requiresAuth)) {
    if (!auth.isLoggedIn) {
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }
  }
  if (to.matched.some((record) => record.meta?.requiresAdmin)) {
    if (!auth.isAdmin) {
      next({ name: "lulon" });
      return;
    }
  }
  next();
});

export default router;
