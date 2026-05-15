import request from '@/utils/request'

// 类型定义
export interface StoreItem {
  id: number
  storeCode: string
  storeName: string
  address: string
  contactPhone: string
  businessHours: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface StoreCreateRequest {
  storeCode: string
  storeName: string
  address?: string
  contactPhone?: string
  businessHours?: string
}

export interface StoreUpdateRequest {
  storeName: string
  address?: string
  contactPhone?: string
  businessHours?: string
  status?: number
}

export interface StoreQueryParams {
  pageNum: number
  pageSize: number
  storeName?: string
  storeCode?: string
  status?: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// API 方法
export function getStoreList(params: StoreQueryParams) {
  return request.get<any, any>('/api/store/list', { params })
}

export function getStoreById(id: number) {
  return request.get<any, any>(`/api/store/${id}`)
}

export function createStore(data: StoreCreateRequest) {
  return request.post<any, any>('/api/store', data)
}

export function updateStore(id: number, data: StoreUpdateRequest) {
  return request.put<any, any>(`/api/store/${id}`, data)
}

export function deleteStore(id: number) {
  return request.delete<any, any>(`/api/store/${id}`)
}

export function getAllStores() {
  return request.get<any, any>('/api/store/all')
}
