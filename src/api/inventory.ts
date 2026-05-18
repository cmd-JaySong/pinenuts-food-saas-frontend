import request from '@/utils/request'

// ==================== 类型定义 ====================

export interface InventoryItem {
  id: number
  storeId: number
  storeName: string
  itemName: string
  itemCode: string
  category: string
  unit: string
  quantity: number
  costPrice: number
  alertThreshold: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface InventoryItemQueryParams {
  pageNum: number
  pageSize: number
  itemName?: string
  category?: string
  storeId?: number
  status?: number
  lowStock?: boolean
}

export interface InventoryItemCreateRequest {
  storeId: number
  itemName: string
  itemCode: string
  category?: string
  unit: string
  quantity?: number
  costPrice?: number
  alertThreshold?: number
}

export interface InventoryItemUpdateRequest {
  itemName?: string
  category?: string
  unit?: string
  costPrice?: number
  alertThreshold?: number
  status?: number
}

export interface InventoryInboundRequest {
  itemId: number
  quantity: number
  sourceType?: string
  remark?: string
}

export interface InventoryOutboundRequest {
  itemId: number
  quantity: number
  sourceType?: string
  remark?: string
}

export interface InventoryCheckRequest {
  itemId: number
  actualQuantity: number
  remark?: string
}

export interface InventoryFlow {
  id: number
  itemId: number
  itemName: string
  flowType: number
  sourceType: string
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  operatorName: string
  remark: string
  createdAt: string
}

export interface InventoryFlowQueryParams {
  pageNum: number
  pageSize: number
  itemId?: number
  flowType?: number
  startTime?: string
  endTime?: string
}

export interface InventoryAlert {
  id: number
  storeId: number
  storeName: string
  itemId: number
  itemName: string
  currentQuantity: number
  alertThreshold: number
  status: number
  createdAt: string
}

export interface InventoryAlertQueryParams {
  pageNum: number
  pageSize: number
  status?: number
}

// ==================== API 方法 ====================

export function getInventoryList(params: InventoryItemQueryParams) {
  return request.get<any, any>('/api/inventory/list', { params })
}

export function getInventoryById(id: number) {
  return request.get<any, any>(`/api/inventory/${id}`)
}

export function createInventoryItem(data: InventoryItemCreateRequest) {
  return request.post<any, any>('/api/inventory', data)
}

export function updateInventoryItem(id: number, data: InventoryItemUpdateRequest) {
  return request.put<any, any>(`/api/inventory/${id}`, data)
}

export function deleteInventoryItem(id: number) {
  return request.delete<any, any>(`/api/inventory/${id}`)
}

export function inventoryInbound(data: InventoryInboundRequest) {
  return request.post<any, any>('/api/inventory/inbound', data)
}

export function inventoryOutbound(data: InventoryOutboundRequest) {
  return request.post<any, any>('/api/inventory/outbound', data)
}

export function inventoryCheck(data: InventoryCheckRequest) {
  return request.post<any, any>('/api/inventory/check', data)
}

export function getInventoryFlowList(params: InventoryFlowQueryParams) {
  return request.get<any, any>('/api/inventory/flow/list', { params })
}

export function getInventoryAlertList(params: InventoryAlertQueryParams) {
  return request.get<any, any>('/api/inventory/alert/list', { params })
}

export function handleInventoryAlert(id: number) {
  return request.put<any, any>(`/api/inventory/alert/${id}/handle`)
}
