import request from '@/utils/request'

export interface DishItem {
  id: number
  categoryId: number
  categoryName: string
  dishName: string
  dishCode: string
  price: number
  imageUrl: string
  description: string
  specifications: string // JSON字符串
  status: number
  createdAt: string
  updatedAt: string
}

export interface DishCreateRequest {
  categoryId: number
  dishName: string
  dishCode?: string
  price: number
  imageUrl?: string
  description?: string
  specifications?: string
}

export interface DishUpdateRequest {
  categoryId?: number
  dishName: string
  dishCode?: string
  price: number
  imageUrl?: string
  description?: string
  specifications?: string
  status?: number
}

export interface DishQueryParams {
  pageNum: number
  pageSize: number
  dishName?: string
  categoryId?: number
  status?: number
}

export interface BatchStatusRequest {
  ids: number[]
  status: number
}

export function getDishList(params: DishQueryParams) {
  return request.get<any, any>('/api/dish/list', { params })
}

export function getDishById(id: number) {
  return request.get<any, any>(`/api/dish/${id}`)
}

export function createDish(data: DishCreateRequest) {
  return request.post<any, any>('/api/dish', data)
}

export function updateDish(id: number, data: DishUpdateRequest) {
  return request.put<any, any>(`/api/dish/${id}`, data)
}

export function deleteDish(id: number) {
  return request.delete<any, any>(`/api/dish/${id}`)
}

export function updateDishStatus(id: number, status: number) {
  return request.put<any, any>(`/api/dish/${id}/status`, null, { params: { status } })
}

export function batchUpdateDishStatus(data: BatchStatusRequest) {
  return request.put<any, any>('/api/dish/batch-status', data)
}
