import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/components/Login.vue'),
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
    },
    {
      path: '/projects/larga',
      name: 'larga',
      component: () => import('@/components/projects/larga/LargaApp.vue'),
    },
    {
      path: '/projects/lextrack',
      name: 'lextrack',
      component: () => import('@/views/LexTrackView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/gift-exchange/join',
      name: 'gift-exchange-join',
      component: () => import('@/components/projects/gift-exchange/GiftExchangeJoin.vue'),
    },
    {
      path: '/projects/gift-exchange/draw',
      name: 'gift-exchange-draw',
      component: () => import('@/components/projects/gift-exchange/GiftExchangeDraw.vue'),
    },
    {
      path: '/projects/gift-exchange/manage',
      name: 'gift-exchange-manage',
      component: () => import('@/components/projects/gift-exchange/GiftExchangeManage.vue'),
    },
    // Redirect old route or root to join
    {
      path: '/projects/gift-exchange',
      redirect: '/projects/gift-exchange/join'
    },
  ],
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.matched.some(record => record.meta?.requiresAuth)) {
    if (!auth.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});

export default router
