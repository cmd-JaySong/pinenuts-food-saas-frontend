import request from '@/utils/request'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UserInfoResponse {
  id: number
  username: string
  nickname: string
  avatar: string
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}

export interface MenuItem {
  id: number
  parentId: number
  permissionCode: string
  permissionName: string
  type: number
  path: string | null
  icon: string | null
  sortOrder: number
  children: MenuItem[]
}

export function loginApi(data: LoginRequest) {
  return request.post<any, any>('/api/auth/login', data)
}

export function refreshTokenApi(refreshToken: string) {
  return request.post<any, any>('/api/auth/refresh', { refreshToken })
}

export function logoutApi() {
  return request.post<any, any>('/api/auth/logout')
}

export function getUserInfoApi() {
  return request.get<any, any>('/api/auth/userinfo')
}
