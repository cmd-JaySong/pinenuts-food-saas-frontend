import request from '@/utils/request'

export interface CategoryItem {
  id: number
  parentId: number
  categoryName: string
  sortOrder: number
  status: number
}

export interface CategoryTreeNode {
  id: number
  parentId: number
  categoryName: string
  sortOrder: number
  status: number
  children: CategoryTreeNode[]
}

export interface CategoryCreateRequest {
  parentId?: number
  categoryName: string
  sortOrder?: number
}

export interface CategoryUpdateRequest {
  categoryName: string
  sortOrder?: number
  status?: number
}

export function getCategoryTree() {
  return request.get<any, any>('/api/dish-category/tree')
}

export function getCategoryList() {
  return request.get<any, any>('/api/dish-category/list')
}

export function createCategory(data: CategoryCreateRequest) {
  return request.post<any, any>('/api/dish-category', data)
}

export function updateCategory(id: number, data: CategoryUpdateRequest) {
  return request.put<any, any>(`/api/dish-category/${id}`, data)
}

export function deleteCategory(id: number) {
  return request.delete<any, any>(`/api/dish-category/${id}`)
}
