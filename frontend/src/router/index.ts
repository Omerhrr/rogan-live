import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  // ── Public ────────────────────────────────────────────────────
  {
    path: '/',
    name: 'Feed',
    component: () => import('@/views/feed/FeedView.vue'),
    meta: { requiresAuth: false },
  },

  // ── Auth ──────────────────────────────────────────────────────
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, hideNav: true },
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, hideNav: true },
  },
  {
    path: '/auth/:provider/callback',
    name: 'OAuthCallback',
    component: () => import('@/views/auth/OAuthCallbackView.vue'),
    meta: { requiresAuth: false, hideNav: true },
    props: true,
  },

  // ── Live ──────────────────────────────────────────────────────
  {
    path: '/live/:id',
    name: 'LiveRoom',
    component: () => import('@/views/live/LiveRoomView.vue'),
    meta: { requiresAuth: false },
    props: true,
  },

  // ── Stream / Go Live ──────────────────────────────────────────
  {
    path: '/stream/go-live',
    name: 'GoLive',
    component: () => import('@/views/stream/GoLiveView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/stream/keys',
    name: 'StreamKeys',
    component: () => import('@/views/stream/StreamKeyView.vue'),
    meta: { requiresAuth: true },
  },

  // ── Wallet ────────────────────────────────────────────────────
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/views/wallet/WalletView.vue'),
    meta: { requiresAuth: true },
  },

  // ── Dashboard ─────────────────────────────────────────────────
  {
    path: '/dashboard',
    name: 'CreatorDashboard',
    component: () => import('@/views/dashboard/CreatorDashboardView.vue'),
    meta: { requiresAuth: true, creatorOnly: true },
  },

  // ── DM ────────────────────────────────────────────────────────
  {
    path: '/dm',
    name: 'DMList',
    component: () => import('@/views/dm/DMListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dm/:userId',
    name: 'DMConversation',
    component: () => import('@/views/dm/DMConversationView.vue'),
    meta: { requiresAuth: true },
    props: true,
  },

  // ── Profile ───────────────────────────────────────────────────
  {
    path: '/profile/:id',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: false },
    props: true,
  },

  // ── Notifications ─────────────────────────────────────────────
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/notifications/NotificationsView.vue'),
    meta: { requiresAuth: true },
  },

  // ── Private Shows ─────────────────────────────────────────────
  {
    path: '/shows',
    name: 'PrivateShowList',
    component: () => import('@/views/shows/PrivateShowListView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/shows/:id',
    name: 'PrivateShow',
    component: () => import('@/views/shows/PrivateShowView.vue'),
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: '/shows/start',
    name: 'StartPrivateShow',
    component: () => import('@/views/shows/StartPrivateShowView.vue'),
    meta: { requiresAuth: true, creatorOnly: true },
  },

  // ── Tasks ─────────────────────────────────────────────────────
  {
    path: '/tasks',
    name: 'TaskList',
    component: () => import('@/views/tasks/TaskListView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/tasks/create',
    name: 'CreateTask',
    component: () => import('@/views/tasks/CreateTaskView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/tasks/TaskDetailView.vue'),
    meta: { requiresAuth: false },
    props: true,
  },

  // ── Subscriptions ─────────────────────────────────────────────
  {
    path: '/subscriptions',
    name: 'SubscriptionsHome',
    component: () => import('@/views/subscriptions/SubscriptionTiersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/subscriptions/tiers',
    name: 'SubscriptionTiers',
    component: () => import('@/views/subscriptions/SubscriptionTiersView.vue'),
    meta: { requiresAuth: true, creatorOnly: true },
  },
  {
    path: '/subscriptions/:creatorId',
    name: 'Subscribe',
    component: () => import('@/views/subscriptions/SubscribeView.vue'),
    meta: { requiresAuth: true },
    props: true,
  },

  // ── Marketplace ───────────────────────────────────────────────
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import('@/views/marketplace/MarketplaceView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/marketplace/create',
    name: 'CreateProduct',
    component: () => import('@/views/marketplace/CreateProductView.vue'),
    meta: { requiresAuth: true, creatorOnly: true },
  },
  {
    path: '/marketplace/:id',
    name: 'ProductDetail',
    component: () => import('@/views/marketplace/ProductDetailView.vue'),
    meta: { requiresAuth: false },
    props: true,
  },

  // ── PK Battles ────────────────────────────────────────────────
  {
    path: '/pk/start',
    name: 'StartPKBattle',
    component: () => import('@/views/pk/StartPKBattleView.vue'),
    meta: { requiresAuth: true, creatorOnly: true },
  },
  {
    path: '/pk/:id',
    name: 'PKBattle',
    component: () => import('@/views/pk/PKBattleView.vue'),
    meta: { requiresAuth: false },
    props: true,
  },

  // ── Web3 ──────────────────────────────────────────────────────
  {
    path: '/web3/wallet',
    name: 'WalletConnect',
    component: () => import('@/views/web3/WalletConnectView.vue'),
    meta: { requiresAuth: true },
  },

  // ── Moderation (Admin) ────────────────────────────────────────
  {
    path: '/moderation',
    name: 'Moderation',
    component: () => import('@/views/moderation/ModerationView.vue'),
    meta: { requiresAuth: true, adminOnly: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.creatorOnly && !authStore.isCreator) {
    next({ name: 'Feed' });
    return;
  }

  if (to.meta.adminOnly && authStore.user?.role !== 'admin') {
    next({ name: 'Feed' });
    return;
  }

  // Redirect logged-in users away from auth pages
  if (
    (to.name === 'Login' || to.name === 'Register') &&
    authStore.isAuthenticated
  ) {
    next({ name: 'Feed' });
    return;
  }

  next();
});

export default router;
