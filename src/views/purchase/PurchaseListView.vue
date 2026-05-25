<template>
  <div class="purchase-container">
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
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="草稿" :value="0" />
          <el-option label="待审批" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已驳回" :value="3" />
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

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button
        v-if="userStore.hasPermission('purchase:create')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新建采购单
      </el-button>
    </div>

    <!-- 有数据时显示表格 + 分页 -->
    <template v-if="tableData.length > 0 || loading">
      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="purchaseCode" label="采购单号" width="180" />
        <el-table-column prop="storeName" label="门店" width="140" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总金额" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.totalAmount != null ? scope.row.totalAmount.toFixed(2) : '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column label="申请时间" width="170">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 0 && userStore.hasPermission('purchase:create')"
              link
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="(scope.row.status === 0 || scope.row.status === 3) && userStore.hasPermission('purchase:submit')"
              link
              type="warning"
              @click="handleSubmit(scope.row)"
            >
              提交审批
            </el-button>
            <el-button
              v-if="scope.row.status === 1 && scope.row.applicantId === userStore.userInfo?.id && userStore.hasPermission('purchase:withdraw')"
              link
              type="info"
              @click="handleWithdraw(scope.row)"
            >
              撤回
            </el-button>
            <el-button
              v-if="(scope.row.status === 0 || scope.row.status === 3) && userStore.hasPermission('purchase:delete')"
              link
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </template>
    <!-- 无数据且非加载中时显示空状态 -->
    <EmptyState
      v-else
      description="暂无数据"
      :show-action="true"
      action-text="新增采购单"
      @action="handleAdd"
    />

    <!-- 新建/编辑采购单弹窗 -->
    <el-dialog v-model="formDialogVisible" :title="formDialogTitle" width="900px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="所属门店" prop="storeId">
          <el-select
            v-model="formData.storeId"
            placeholder="请选择门店"
            :disabled="isEdit"
            style="width: 300px"
            @change="handleStoreChange"
          >
            <el-option
              v-for="store in storeList"
              :key="store.id"
              :label="store.storeName"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" style="width: 500px" />
        </el-form-item>
        <el-form-item label="采购明细" required>
          <div class="items-table-wrapper">
            <el-table :data="formData.items" border style="width: 100%">
              <el-table-column label="物料选择" width="200">
                <template #default="scope">
                  <el-select
                    v-model="scope.row.itemId"
                    placeholder="选择物料"
                    clearable
                    filterable
                    style="width: 100%"
                    @change="(val: any) => handleItemSelect(val, scope.$index)"
                  >
                    <el-option
                      v-for="item in inventoryItems"
                      :key="item.id"
                      :label="item.itemName"
                      :value="item.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="物料名称" width="140">
                <template #default="scope">
                  <el-input v-model="scope.row.itemName" placeholder="物料名称" />
                </template>
              </el-table-column>
              <el-table-column label="单位" width="80">
                <template #default="scope">
                  <el-input v-model="scope.row.unit" placeholder="单位" />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="120">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.quantity"
                    :min="0.01"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.unitPrice"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column label="小计" width="100" align="right">
                <template #default="scope">
                  ¥{{ calcRowTotal(scope.row) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="scope">
                  <el-button link type="danger" @click="removeItem(scope.$index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="items-footer">
              <el-button type="primary" link @click="addItem">+ 添加行</el-button>
              <span class="total-amount">合计金额：¥{{ calcTotalAmount() }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="info" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSaveAndSubmit">保存并提交</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTableList } from '@/composables/useTableList'
import EmptyState from '@/components/EmptyState.vue'
import {
  getPurchaseList,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  submitPurchase,
  withdrawPurchase,
  type PurchaseListItem,
  type PurchaseOrder,
  type PurchaseOrderItem
} from '@/api/purchase'
import { getAllStores, type StoreItem } from '@/api/store'
import { getInventoryList, type InventoryItem } from '@/api/inventory'

const userStore = useUserStore()

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

// ============ 采购列表（使用 useTableList） ============
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
  status: undefined,
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
  queryParams.status = undefined
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

// ============ 新建/编辑采购单弹窗 ============
const formDialogVisible = ref(false)
const formDialogTitle = ref('新建采购单')
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const inventoryItems = ref<InventoryItem[]>([])

interface FormDataType {
  storeId: number | undefined
  remark: string
  items: PurchaseOrderItem[]
}

const formData = reactive<FormDataType>({
  storeId: undefined,
  remark: '',
  items: []
})

const formRules: FormRules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }]
}

function handleAdd() {
  isEdit.value = false
  formDialogTitle.value = '新建采购单'
  editId.value = null
  formData.storeId = undefined
  formData.remark = ''
  formData.items = [{ itemId: undefined, itemName: '', unit: '', quantity: 1, unitPrice: 0 }]
  inventoryItems.value = []
  formDialogVisible.value = true
}

async function handleEdit(row: PurchaseListItem) {
  isEdit.value = true
  formDialogTitle.value = '编辑采购单'
  editId.value = row.id
  try {
    const res = await getPurchaseById(row.id)
    const detail: PurchaseOrder = res.data
    formData.storeId = detail.storeId
    formData.remark = detail.remark || ''
    formData.items = (detail.items || []).map((item) => ({
      id: item.id,
      itemId: item.itemId,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0
    }))
    // 加载该门店的物料列表
    if (detail.storeId) {
      await loadInventoryItems(detail.storeId)
    }
    formDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || '加载采购单详情失败')
  }
}

async function handleStoreChange(storeId: number) {
  formData.items.forEach((item) => {
    item.itemId = undefined
  })
  if (storeId) {
    await loadInventoryItems(storeId)
  } else {
    inventoryItems.value = []
  }
}

async function loadInventoryItems(storeId: number) {
  try {
    const res = await getInventoryList({ pageNum: 1, pageSize: 200, storeId })
    inventoryItems.value = res.data?.records || []
  } catch (e) {
    console.error('加载物料列表失败', e)
    inventoryItems.value = []
  }
}

function handleItemSelect(itemId: number | undefined, index: number) {
  if (!itemId) {
    return
  }
  const found = inventoryItems.value.find((inv) => inv.id === itemId)
  if (found) {
    formData.items[index].itemName = found.itemName
    formData.items[index].unit = found.unit
  }
}

function addItem() {
  formData.items.push({ itemId: undefined, itemName: '', unit: '', quantity: 1, unitPrice: 0 })
}

function removeItem(index: number) {
  formData.items.splice(index, 1)
}

function calcRowTotal(row: PurchaseOrderItem) {
  const total = (row.quantity || 0) * (row.unitPrice || 0)
  return total.toFixed(2)
}

function calcTotalAmount() {
  const sum = formData.items.reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0)
  }, 0)
  return sum.toFixed(2)
}

function validateItems(): boolean {
  if (formData.items.length === 0) {
    ElMessage.warning('请至少添加一行采购明细')
    return false
  }
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.itemName) {
      ElMessage.warning(`第${i + 1}行物料名称不能为空`)
      return false
    }
    if (!item.quantity || item.quantity <= 0) {
      ElMessage.warning(`第${i + 1}行数量必须大于0`)
      return false
    }
  }
  return true
}

async function handleSaveDraft() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!validateItems()) return

  try {
    const items = formData.items.map((item) => ({
      id: item.id,
      itemId: item.itemId || undefined,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0
    }))

    if (isEdit.value && editId.value) {
      await updatePurchase(editId.value, { remark: formData.remark, items })
      ElMessage.success('保存成功')
    } else {
      await createPurchase({ storeId: formData.storeId!, remark: formData.remark, items })
      ElMessage.success('创建成功')
    }
    formDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  }
}

async function handleSaveAndSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!validateItems()) return

  try {
    const items = formData.items.map((item) => ({
      id: item.id,
      itemId: item.itemId || undefined,
      itemName: item.itemName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0
    }))

    let purchaseId: number
    if (isEdit.value && editId.value) {
      await updatePurchase(editId.value, { remark: formData.remark, items })
      purchaseId = editId.value
    } else {
      const res = await createPurchase({ storeId: formData.storeId!, remark: formData.remark, items })
      purchaseId = res.data?.id || res.data
    }
    await submitPurchase(purchaseId)
    ElMessage.success('提交审批成功')
    formDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// ============ 提交审批 ============
async function handleSubmit(row: PurchaseListItem) {
  try {
    await ElMessageBox.confirm('确定要提交该采购单进行审批吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await submitPurchase(row.id)
    ElMessage.success('提交审批成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '提交失败')
    }
  }
}

// ============ 撤回 ============
async function handleWithdraw(row: PurchaseListItem) {
  try {
    await ElMessageBox.confirm('确定要撤回该采购单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await withdrawPurchase(row.id)
    ElMessage.success('撤回成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '撤回失败')
    }
  }
}

// ============ 删除 ============
async function handleDelete(row: PurchaseListItem) {
  try {
    await ElMessageBox.confirm(`确定要删除采购单「${row.purchaseCode}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deletePurchase(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
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
.purchase-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.items-table-wrapper {
  width: 100%;
}

.items-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 8px;
}

.total-amount {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
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
