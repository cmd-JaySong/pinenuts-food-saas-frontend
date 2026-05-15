import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { refreshTokenApi } from '@/api/auth'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000
})

// Token 刷新锁，防止并发刷新
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken))
  refreshSubscribers = []
}

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code !== 200) {
      // 401: Token 过期或无效
      if (res.code === 401) {
        return handleUnauthorized(response.config, res)
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      return handleUnauthorized(error.config, error.response.data)
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

/**
 * 处理 401 未授权：尝试刷新 Token，失败则跳转登录
 */
async function handleUnauthorized(config: any, _res: any) {
  const userStore = useUserStore()

  // 如果没有 refreshToken，直接跳转登录
  if (!userStore.refreshToken) {
    userStore.clearAuth()
    router.push('/login')
    return Promise.reject(new Error('未登录'))
  }

  // 如果正在刷新，将请求加入队列等待
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken: string) => {
        config.headers.Authorization = `Bearer ${newToken}`
        resolve(service(config))
      })
    })
  }

  isRefreshing = true

  try {
    const res = await refreshTokenApi(userStore.refreshToken)
    const { accessToken, refreshToken } = res.data
    userStore.setToken(accessToken, refreshToken)

    // 通知队列中的请求使用新 Token
    onTokenRefreshed(accessToken)

    // 重试原始请求
    config.headers.Authorization = `Bearer ${accessToken}`
    return service(config)
  } catch (refreshError) {
    // 刷新失败，清除认证信息并跳转登录
    userStore.clearAuth()
    ElMessage.error('登录已过期，请重新登录')
    router.push('/login')
    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
}

export default service
