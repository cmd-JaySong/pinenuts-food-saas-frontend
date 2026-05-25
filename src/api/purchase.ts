import request from '@/utils/request'

// ==================== 类型定义 ====================

export interface PurchaseOrderItem {
    id?: number
    itemId?: number    // 可为空（新物料）
    itemName: string
    unit: string
    quantity: number
    unitPrice?: number
    totalPrice?: number
}

export interface PurchaseApprovalLog {
    id: number
    action: number    // 1-创建 2-提交 3-撤回 4-通过 5-驳回
    operatorName: string
    remark: string
    createdAt: string
}

export interface PurchaseOrder {
    id: number
    purchaseCode: string
    storeId: number
    storeName: string
    status: number    // 0-草稿 1-待审批 2-已完成 3-已驳回
    totalAmount: number
    remark: string
    applicantId: number
    applicantName: string
    approverName: string
    approvalTime: string
    approvalRemark: string
    createdAt: string
    updatedAt: string
    items: PurchaseOrderItem[]
    approvalLogs: PurchaseApprovalLog[]
}

export interface PurchaseListItem {
    id: number
    purchaseCode: string
    storeId: number
    storeName: string
    status: number
    totalAmount: number
    remark: string
    applicantId: number
    applicantName: string
    approverName: string
    approvalTime: string
    createdAt: string
}

export interface PurchaseQueryParams {
    pageNum: number
    pageSize: number
    purchaseCode?: string
    storeId?: number
    status?: number
    startTime?: string
    endTime?: string
}

export interface PurchaseCreateRequest {
    storeId: number
    remark?: string
    items: PurchaseOrderItem[]
}

export interface PurchaseUpdateRequest {
    remark?: string
    items: PurchaseOrderItem[]
}

export interface PurchaseApproveRequest {
    remark?: string
}

// ==================== API 方法 ====================

export function getPurchaseList(params: PurchaseQueryParams) {
    return request.get<any, any>('/api/purchase/list', { params })
}

export function getPurchaseById(id: number) {
    return request.get<any, any>(`/api/purchase/${id}`)
}

export function createPurchase(data: PurchaseCreateRequest) {
    return request.post<any, any>('/api/purchase', data)
}

export function updatePurchase(id: number, data: PurchaseUpdateRequest) {
    return request.put<any, any>(`/api/purchase/${id}`, data)
}

export function deletePurchase(id: number) {
    return request.delete<any, any>(`/api/purchase/${id}`)
}

export function submitPurchase(id: number) {
    return request.post<any, any>(`/api/purchase/${id}/submit`)
}

export function withdrawPurchase(id: number) {
    return request.post<any, any>(`/api/purchase/${id}/withdraw`)
}

export function approvePurchase(id: number, data?: PurchaseApproveRequest) {
    return request.post<any, any>(`/api/purchase/${id}/approve`, data || {})
}

export function rejectPurchase(id: number, data: PurchaseApproveRequest) {
    return request.post<any, any>(`/api/purchase/${id}/reject`, data)
}
