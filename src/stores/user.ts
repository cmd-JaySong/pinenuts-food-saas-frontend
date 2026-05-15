import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, getUserInfoApi, type LoginRequest, type UserInfoResponse } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<UserInfoResponse | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const roles = computed(() => userInfo.value?.roles || [])
  const permissions = computed(() => userInfo.value?.permissions || [])
  const menus = computed(() => userInfo.value?.menus || [])
  const nickname = computed(() => userInfo.value?.nickname || userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  // Actions
  function setToken(accessToken: string, refresh: string) {
    token.value = accessToken
    refreshToken.value = refresh
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearAuth() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  async function login(loginData: LoginRequest) {
    const res = await loginApi(loginData)
    setToken(res.data.accessToken, res.data.refreshToken)
    // 登录后立即获取用户信息
    await fetchUserInfo()
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      // 即使后端登出失败，前端也要清理
      console.error('登出请求失败', e)
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  async function fetchUserInfo() {
    const res = await getUserInfoApi()
    userInfo.value = res.data
  }

  /**
   * 检查是否有某个权限
   */
  function hasPermission(permission: string): boolean {
    if (roles.value.includes('SUPER_ADMIN')) return true
    return permissions.value.includes(permission)
  }

  return {
    token,
    refreshToken,
    userInfo,
    isLoggedIn,
    roles,
    permissions,
    menus,
    nickname,
    avatar,
    setToken,
    clearAuth,
    login,
    logout,
    fetchUserInfo,
    hasPermission
  }
})
