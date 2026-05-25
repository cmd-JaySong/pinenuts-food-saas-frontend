<template>
  <div class="approval-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="采购单号">
        <el-input
          v-model="queryParams.purchaseCode"
          placeholder="请输入采购单号"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="门店">
        <el-select v-model="queryParams.storeId" placeholder="全部门店" clearable style="width: 160px">
          <el-option
            v-for="store in storeList"
            :key="store.id"
            :label="store.storeName"
            :value="store.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
          @change="handleDateChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleResetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="purchaseCode" label="采购单号" width="180" />
      <el-table-column prop="storeName" label="门店" width="140" />
      <el-table-column label="总金额" width="120" align="right">
        <template #default="scope">
          ¥{{ scope.row.totalAmount != null ? scope.row.totalAmount.toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="applicantName" label="申请人" width="100" />
      <el-table-column label="提交时间" width="170">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleDetail(scope.row)">
            查看详情
          </el-button>
          <el-button link type="success" @click="handleApprove(scope.row)">
            通过
          </el-button>
          <el-button link type="danger" @click="handleReject(scope.row)">
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 审批操作弹窗 -->
    <el-dialog v-model="approvalDialogVisible" :title="approvalDialogTitle" width="500px" destroy-on-close>
      <div v-if="approvalRow" class="approval-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="采购单号">{{ approvalRow.purchaseCode }}</el-descriptions-item>
          <el-descriptions-item label="门店">{{ approvalRow.storeName }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ approvalRow.totalAmount?.toFixed(2) || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ approvalRow.applicantName }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form ref="approvalFormRef" :model="approvalFormData" :rules="approvalFormRules" label-width="80px" style="margin-top: 16px;">
        <el-form-item label="审批意见" prop="remark">
          <el-input
            v-model="approvalFormData.remark"
            type="textarea"
            :rows="3"
            :placeholder="approvalType === 'reject' ? '请输入驳回原因（必填）' : '请输入审批意见（选填）'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button :type="approvalType === 'approve' ? 'success' : 'danger'" @click="handleApprovalSubmit">
          {{ approvalType === 'approve' ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="采购单详情" width="800px" destroy-on-close>
      <div v-if="detailData" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="采购单号">{{ detailData.purchaseCode }}</el-descriptions-item>
            <el-descriptions-item label="门店">{{ detailData.storeName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(detailData.status)" size="small">
                {{ getStatusLabel(detailData.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="总金额">¥{{ detailData.totalAmount?.toFixed(2) || '0.00' }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detailData.applicantName }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatTime(detailData.createdAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.status === 2 || detailData.status === 3" label="审批人">{{ detailData.approverName }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.status === 2 || detailData.status === 3" label="审批时间">{{ formatTime(detailData.approvalTime) }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.approvalRemark" label="审批意见" :span="2">{{ detailData.approvalRemark }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.remark" label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 明细表格 -->
        <div class="detail-section">
          <h4>采购明细</h4>
          <el-table :data="detailData.items" border style="width: 100%">
            <el-table-column prop="itemName" label="物料名称" min-width="140" />
            <el-table-column prop="unit" label="单位" width="80" align="center" />
            <el-table-column label="数量" width="100" align="right">
              <template #default="scope">
                {{ scope.row.quantity }}
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="right">
              <template #default="scope">
                ¥{{ scope.row.unitPrice != null ? scope.row.unitPrice.toFixed(2) : '0.00' }}
              </template>
            </el-table-column>
            <el-table-column label="小计" width="110" align="right">
              <template #default="scope">
                ¥{{ scope.row.totalPrice != null ? scope.row.totalPrice.toFixed(2) : '0.00' }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 审批进度时间线 -->
        <div v-if="detailData.approvalLogs && detailData.approvalLogs.length > 0" class="detail-section">
          <h4>审批进度</h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in detailData.approvalLogs"
              :key="log.id"
              :timestamp="formatTime(log.createdAt)"
              :color="getActionColor(log.action)"
              placement="top"
            >
              <h4>{{ getActionLabel(log.action) }}</h4>
              <p>操作人：{{ log.operatorName }}</p>
              <p v-if="log.remark">备注：{{ log.remark }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useTableList } from '@/composables/useTableList'
import {
  getPurchaseList,
  getPurchaseById,
  approvePurchase,
  rejectPurchase,
  type PurchaseListItem,
  type PurchaseOrder
} from '@/api/purchase'
import { getAllStores, type StoreItem } from '@/api/store'

// ============ 门店列表 ============
const storeList = ref<StoreItem[]>([])

async function loadStoreList() {
  try {
    const res = await getAllStores()
    storeList.value = res.data || []
  } catch (e) {
    console.error('加载门店列表失败', e)
  }
}

// ============ 采购列表（默认只显示待审批） ============
const dateRange = ref<string[]>([])

const {
  tableData,
  loading,
  total,
  pageNum,
  pageSize,
  queryParams,
  fetchList,
  handleSearch,
  handlePageChange,
  handleSizeChange
} = useTableList<PurchaseListItem>(getPurchaseList, {
  purchaseCode: '',
  storeId: undefined,
  status: 1,
  startTime: undefined,
  endTime: undefined
})

function handleDateChange(val: string[] | null) {
  if (val && val.length === 2) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }
}

function handleResetSearch() {
  queryParams.purchaseCode = ''
  queryParams.storeId = undefined
  queryParams.status = 1
  queryParams.startTime = undefined
  queryParams.endTime = undefined
  dateRange.value = []
  pageNum.value = 1
  fetchList()
}

// ============ 工具函数 ============
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

function getStatusLabel(status: number) {
  const map: Record<number, string> = { 0: '草稿', 1: '待审批', 2: '已完成', 3: '已驳回' }
  return map[status] ?? '未知'
}

function getStatusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] ?? 'info'
}

function getActionLabel(action: number) {
  const map: Record<number, string> = { 1: '创建采购单', 2: '提交审批', 3: '撤回申请', 4: '审批通过', 5: '审批驳回' }
  return map[action] ?? '未知操作'
}

function getActionColor(action: number) {
  const map: Record<number, string> = { 1: '#909399', 2: '#E6A23C', 3: '#909399', 4: '#67C23A', 5: '#F56C6C' }
  return map[action] ?? '#909399'
}

// ============ 审批操作弹窗 ============
const approvalDialogVisible = ref(false)
const approvalDialogTitle = ref('审批通过')
const approvalType = ref<'approve' | 'reject'>('approve')
const approvalRow = ref<PurchaseListItem | null>(null)
const approvalFormRef = ref<FormInstance>()
const approvalFormData = reactive({
  remark: ''
})

const approvalFormRules = computed<FormRules>(() => {
  if (approvalType.value === 'reject') {
    return {
      remark: [{ required: true, message: '驳回原因不能为空', trigger: 'blur' }]
    }
  }
  return {}
})

function handleApprove(row: PurchaseListItem) {
  approvalType.value = 'approve'
  approvalDialogTitle.value = '审批通过'
  approvalRow.value = row
  approvalFormData.remark = ''
  approvalDialogVisible.value = true
}

function handleReject(row: PurchaseListItem) {
  approvalType.value = 'reject'
  approvalDialogTitle.value = '审批驳回'
  approvalRow.value = row
  approvalFormData.remark = ''
  approvalDialogVisible.value = true
}

async function handleApprovalSubmit() {
  const valid = await approvalFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (approvalType.value === 'approve') {
      await approvePurchase(approvalRow.value!.id, { remark: approvalFormData.remark || undefined })
      ElMessage.success('审批通过成功')
    } else {
      await rejectPurchase(approvalRow.value!.id, { remark: approvalFormData.remark })
      ElMessage.success('已驳回')
    }
    approvalDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// ============ 详情弹窗 ============
const detailDialogVisible = ref(false)
const detailData = ref<PurchaseOrder | null>(null)

async function handleDetail(row: PurchaseListItem) {
  try {
    const res = await getPurchaseById(row.id)
    detailData.value = res.data
    detailDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '加载详情失败')
  }
}

// ============ 初始化 ============
onMounted(() => {
  loadStoreList()
})
</script>

<style scoped>
.approval-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.approval-info {
  margin-bottom: 8px;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  font-size: 15px;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 8px;
}
</style>
