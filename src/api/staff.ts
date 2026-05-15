import request from '@/utils/request'

export interface StaffItem {
  id: number
  storeId: number
  storeName: string
  staffName: string
  phone: string
  position: string
  entryDate: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface StaffCreateRequest {
  storeId: number
  staffName: string
  phone?: string
  position?: string
  entryDate?: string
  userId?: number
}

export interface StaffUpdateRequest {
  storeId?: number
  staffName: string
  phone?: string
  position?: string
  entryDate?: string
  status?: number
}

export interface StaffQueryParams {
  pageNum: number
  pageSize: number
  staffName?: string
  storeId?: number
  status?: number
}

export function getStaffList(params: StaffQueryParams) {
  return request.get<any, any>('/api/staff/list', { params })
}

export function getStaffById(id: number) {
  return request.get<any, any>(`/api/staff/${id}`)
}

export function createStaff(data: StaffCreateRequest) {
  return request.post<any, any>('/api/staff', data)
}

export function updateStaff(id: number, data: StaffUpdateRequest) {
  return request.put<any, any>(`/api/staff/${id}`, data)
}

export function deleteStaff(id: number) {
  return request.delete<any, any>(`/api/staff/${id}`)
}
