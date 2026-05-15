import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'store',
        name: 'Store',
        component: () => import('@/views/store/StoreListView.vue'),
        meta: { title: '门店管理', permission: 'store:list' }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: () => import('@/views/staff/StaffListView.vue'),
        meta: { title: '员工管理', permission: 'staff:list' }
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 动态导入避免循环依赖
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()

  // 不需要认证的路由直接放行
  if (to.meta.requiresAuth === false) {
    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next({ path: '/' })
      return
    }
    next()
    return
  }

  // 需要认证的路由
  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录但未获取用户信息（如页面刷新后）
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
      next()
    } catch (error) {
      // 获取用户信息失败（Token 已失效）
      userStore.clearAuth()
      next({ path: '/login' })
    }
    return
  }

  next()
})

export default router
