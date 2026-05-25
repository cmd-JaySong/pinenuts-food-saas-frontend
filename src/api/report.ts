import request from '@/utils/request'

export interface ReportQueryParams {
  startDate?: string  // yyyy-MM-dd
  endDate?: string    // yyyy-MM-dd
  storeId?: number
  topN?: number
}

export interface ReportOverview {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  todayOrderCount: number
  revenueGrowthRate: number
}

export interface DailyRevenue {
  date: string
  revenue: number
  orderCount: number
}

export interface StoreRanking {
  storeId: number
  storeName: string
  totalRevenue: number
  orderCount: number
}

export interface DishSalesTop {
  dishId: number
  dishName: string
  quantity: number
  revenue: number
}

export function getReportOverview() {
  return request.get<any, any>('/api/report/overview')
}

export function getDailyRevenue(params: ReportQueryParams) {
  return request.get<any, any>('/api/report/daily-revenue', { params })
}

export function getStoreRanking(params: ReportQueryParams) {
  return request.get<any, any>('/api/report/store-ranking', { params })
}

export function getDishSalesTop(params: ReportQueryParams) {
  return request.get<any, any>('/api/report/dish-sales-top', { params })
}
