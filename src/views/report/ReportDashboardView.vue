<template>
  <div class="report-dashboard">
    <!-- 顶部概览卡片区 -->
    <el-row :gutter="20" class="overview-cards" v-loading="overviewLoading">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日营收</div>
          <div class="stat-value">{{ formatMoney(overview.todayRevenue) }}</div>
          <div class="stat-growth" :class="overview.revenueGrowthRate >= 0 ? 'up' : 'down'">
            <el-icon v-if="overview.revenueGrowthRate >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            <span>{{ Math.abs(overview.revenueGrowthRate).toFixed(1) }}%</span>
            <span class="growth-label">同比</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">本周营收</div>
          <div class="stat-value">{{ formatMoney(overview.weekRevenue) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">本月营收</div>
          <div class="stat-value">{{ formatMoney(overview.monthRevenue) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value order-count">{{ overview.todayOrderCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 日期范围选择器 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        :shortcuts="dateShortcuts"
        @change="handleDateChange"
      />
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xl="12" :lg="12" :md="24">
        <el-card shadow="hover" v-loading="lineLoading">
          <template #header>
            <span class="card-title">日营收趋势</span>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xl="12" :lg="12" :md="24">
        <el-card shadow="hover" v-loading="barLoading">
          <template #header>
            <span class="card-title">门店营收对比</span>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" v-loading="pieLoading">
          <template #header>
            <span class="card-title">菜品销量占比 TOP10</span>
          </template>
          <div ref="pieChartRef" class="chart-container chart-container-lg"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  getReportOverview,
  getDailyRevenue,
  getStoreRanking,
  getDishSalesTop
} from '@/api/report'
import type { ReportOverview, ReportQueryParams } from '@/api/report'

echarts.use([
  LineChart, BarChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent, CanvasRenderer
])

// 概览数据
const overview = ref<ReportOverview>({
  todayRevenue: 0,
  weekRevenue: 0,
  monthRevenue: 0,
  todayOrderCount: 0,
  revenueGrowthRate: 0
})
const overviewLoading = ref(false)

// 日期范围
const dateRange = ref<[string, string]>(['', ''])

// loading 状态
const lineLoading = ref(false)
const barLoading = ref(false)
const pieLoading = ref(false)

// 图表 DOM 引用
const lineChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()

// 图表实例
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

// ResizeObserver
let resizeObserver: ResizeObserver | null = null

// 日期快捷选项
const dateShortcuts = [
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 6 * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 29 * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    }
  }
]

// 格式化金额
function formatMoney(value: number): string {
  if (value == null) return '¥0.00'
  return '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 获取查询参数
function getQueryParams(): ReportQueryParams {
  const params: ReportQueryParams = { topN: 10 }
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  return params
}

// 设置默认日期（近30天）
function setDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 29 * 24 * 3600 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  dateRange.value = [fmt(start), fmt(end)]
}

// 加载概览数据
async function loadOverview() {
  overviewLoading.value = true
  try {
    const res = await getReportOverview()
    if (res?.data) {
      overview.value = res.data
    }
  } catch (e) {
    console.error('加载概览数据失败', e)
  } finally {
    overviewLoading.value = false
  }
}

// 加载折线图数据
async function loadLineChart() {
  if (!lineChart) return
  lineLoading.value = true
  try {
    const res = await getDailyRevenue(getQueryParams())
    const data = res?.data || []
    const dates = data.map((item: any) => item.date)
    const revenues = data.map((item: any) => item.revenue)

    lineChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0]
          return `${p.axisValue}<br/>营业额：¥${Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val: number) => val >= 10000 ? (val / 10000).toFixed(1) + '万' : val.toString()
        }
      },
      series: [{
        name: '营业额',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
          ])
        },
        lineStyle: { width: 2, color: '#409EFF' },
        itemStyle: { color: '#409EFF' },
        data: revenues
      }]
    })
  } catch (e) {
    console.error('加载日营收数据失败', e)
  } finally {
    lineLoading.value = false
  }
}

// 加载柱状图数据
async function loadBarChart() {
  if (!barChart) return
  barLoading.value = true
  try {
    const res = await getStoreRanking(getQueryParams())
    const data = res?.data || []
    const names = data.map((item: any) => item.storeName)
    const values = data.map((item: any) => item.totalRevenue)

    barChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0]
          return `${p.axisValue}<br/>营业额：¥${Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          rotate: names.length > 5 ? 30 : 0,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val: number) => val >= 10000 ? (val / 10000).toFixed(1) + '万' : val.toString()
        }
      },
      series: [{
        name: '营业额',
        type: 'bar',
        barMaxWidth: 40,
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const v = params.value
            return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v
          }
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#79bbff' }
          ])
        },
        data: values
      }]
    })
  } catch (e) {
    console.error('加载门店排名数据失败', e)
  } finally {
    barLoading.value = false
  }
}

// 加载饼图数据
async function loadPieChart() {
  if (!pieChart) return
  pieLoading.value = true
  try {
    const res = await getDishSalesTop(getQueryParams())
    const data = (res?.data || []).map((item: any) => ({
      name: item.dishName,
      value: item.quantity
    }))

    pieChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}份 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        type: 'scroll'
      },
      series: [{
        name: '菜品销量',
        type: 'pie',
        radius: ['30%', '65%'],
        center: ['40%', '50%'],
        roseType: 'area',
        label: {
          formatter: '{b}\n{d}%'
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        data
      }]
    })
  } catch (e) {
    console.error('加载菜品销量数据失败', e)
  } finally {
    pieLoading.value = false
  }
}

// 初始化图表
function initCharts() {
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
}

// 设置 ResizeObserver
function setupResizeObserver() {
  resizeObserver = new ResizeObserver(() => {
    lineChart?.resize()
    barChart?.resize()
    pieChart?.resize()
  })
  if (lineChartRef.value) resizeObserver.observe(lineChartRef.value)
  if (barChartRef.value) resizeObserver.observe(barChartRef.value)
  if (pieChartRef.value) resizeObserver.observe(pieChartRef.value)
}

// 日期变更处理
function handleDateChange() {
  loadLineChart()
  loadBarChart()
  loadPieChart()
}

// 加载所有图表数据
function loadChartData() {
  loadLineChart()
  loadBarChart()
  loadPieChart()
}

onMounted(async () => {
  setDefaultDateRange()
  loadOverview()
  await nextTick()
  initCharts()
  setupResizeObserver()
  loadChartData()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  lineChart?.dispose()
  barChart?.dispose()
  pieChart?.dispose()
  lineChart = null
  barChart = null
  pieChart = null
})
</script>

<style scoped>
.report-dashboard {
  padding: 0;
}

.overview-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-card__body) {
  padding: 20px 16px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  font-family: 'DIN Alternate', 'Roboto Mono', 'Menlo', monospace;
  line-height: 1.4;
}

.stat-value.order-count {
  color: #E6A23C;
}

.stat-growth {
  margin-top: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.stat-growth.up {
  color: #67C23A;
}

.stat-growth.down {
  color: #F56C6C;
}

.growth-label {
  margin-left: 4px;
  color: #909399;
  font-size: 12px;
}

.filter-bar {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.chart-container-lg {
  height: 400px;
}
</style>
