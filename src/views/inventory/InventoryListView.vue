<template>
  <div class="inventory-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="物料名称">
        <el-input
          v-model="queryParams.itemName"
          placeholder="请输入物料名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 140px">
          <el-option label="蔬菜" value="蔬菜" />
          <el-option label="肉类" value="肉类" />
          <el-option label="水产" value="水产" />
          <el-option label="调味品" value="调味品" />
          <el-option label="粮油" value="粮油" />
          <el-option label="饮品" value="饮品" />
          <el-option label="其他" value="其他" />
        </el-select>
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
      <el-form-item>
        <el-checkbox v-model="queryParams.lowStock">低库存</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button
        v-if="userStore.hasPermission('inventory:inbound')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增物料
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="itemCode" label="物料编码" width="130" />
      <el-table-column prop="itemName" label="物料名称" min-width="140" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="storeName" label="所属门店" width="130" />
      <el-table-column label="库存量" width="100" align="right">
        <template #default="scope">
          <span
            :style="{
              color: scope.row.alertThreshold && scope.row.quantity < scope.row.alertThreshold ? '#f56c6c' : ''
            }"
          >
            {{ scope.row.quantity }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="80" align="center" />
      <el-table-column label="成本价" width="100" align="right">
        <template #default="scope">
          ¥{{ scope.row.costPrice != null ? scope.row.costPrice.toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="alertThreshold" label="预警阈值" width="100" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.status === 1 ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="scope">
          <el-button
            v-if="userStore.hasPermission('inventory:inbound')"
            link
            type="primary"
            @click="handleInbound(scope.row)"
          >
            入库
          </el-button>
          <el-button
            v-if="userStore.hasPermission('inventory:outbound')"
            link
            type="warning"
            @click="handleOutbound(scope.row)"
          >
            出库
          </el-button>
          <el-button
            v-if="userStore.hasPermission('inventory:inbound')"
            link
            type="success"
            @click="handleCheck(scope.row)"
          >
            盘点
          </el-button>
          <el-button link type="info" @click="handleFlow(scope.row)">
            流水
          </el-button>
          <el-button
            v-if="userStore.hasPermission('inventory:inbound')"
            link
            type="primary"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="userStore.hasPermission('inventory:inbound')"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
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

    <!-- 新增/编辑物料弹窗 -->
    <el-dialog v-model="itemDialogVisible" :title="itemDialogTitle" width="560px" destroy-on-close>
      <el-form ref="itemFormRef" :model="itemFormData" :rules="itemFormRules" label-width="100px">
        <el-form-item label="所属门店" prop="storeId">
          <el-select
            v-model="itemFormData.storeId"
            placeholder="请选择门店"
            :disabled="isItemEdit"
            style="width: 100%"
          >
            <el-option
              v-for="store in storeList"
              :key="store.id"
              :label="store.storeName"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="itemFormData.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="itemFormData.itemCode" placeholder="请输入物料编码" :disabled="isItemEdit" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="itemFormData.category" placeholder="请选择分类" clearable style="width: 100%">
            <el-option label="蔬菜" value="蔬菜" />
            <el-option label="肉类" value="肉类" />
            <el-option label="水产" value="水产" />
            <el-option label="调味品" value="调味品" />
            <el-option label="粮油" value="粮油" />
            <el-option label="饮品" value="饮品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="itemFormData.unit" placeholder="请输入计量单位，如：kg、瓶、包" />
        </el-form-item>
        <el-form-item v-if="!isItemEdit" label="初始库存量">
          <el-input-number v-model="itemFormData.quantity" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="成本单价">
          <el-input-number v-model="itemFormData.costPrice" :min="0" :precision="2" :step="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="itemFormData.alertThreshold" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleItemSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 入库弹窗 -->
    <el-dialog v-model="inboundDialogVisible" title="入库操作" width="480px" destroy-on-close>
      <el-form ref="inboundFormRef" :model="inboundFormData" :rules="inboundFormRules" label-width="100px">
        <el-form-item label="物料名称">
          <el-input :model-value="currentItem?.itemName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :model-value="String(currentItem?.quantity ?? 0)" disabled />
        </el-form-item>
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="inboundFormData.quantity" :min="0.01" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="来源类型" prop="sourceType">
          <el-select v-model="inboundFormData.sourceType" placeholder="请选择来源类型" style="width: 100%">
            <el-option label="采购入库" value="purchase_in" />
            <el-option label="手动调整" value="manual_in" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inboundFormData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inboundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInboundSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 出库弹窗 -->
    <el-dialog v-model="outboundDialogVisible" title="出库操作" width="480px" destroy-on-close>
      <el-form ref="outboundFormRef" :model="outboundFormData" :rules="outboundFormRules" label-width="100px">
        <el-form-item label="物料名称">
          <el-input :model-value="currentItem?.itemName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :model-value="String(currentItem?.quantity ?? 0)" disabled />
        </el-form-item>
        <el-form-item label="出库数量" prop="quantity">
          <el-input-number v-model="outboundFormData.quantity" :min="0.01" :max="currentItem?.quantity || 9999" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="来源类型" prop="sourceType">
          <el-select v-model="outboundFormData.sourceType" placeholder="请选择来源类型" style="width: 100%">
            <el-option label="销售消耗" value="sale_out" />
            <el-option label="损耗出库" value="loss_out" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="outboundFormData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outboundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOutboundSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 盘点弹窗 -->
    <el-dialog v-model="checkDialogVisible" title="盘点操作" width="480px" destroy-on-close>
      <el-form ref="checkFormRef" :model="checkFormData" :rules="checkFormRules" label-width="100px">
        <el-form-item label="物料名称">
          <el-input :model-value="currentItem?.itemName" disabled />
        </el-form-item>
        <el-form-item label="系统库存">
          <el-input :model-value="String(currentItem?.quantity ?? 0)" disabled />
        </el-form-item>
        <el-form-item label="实际库存" prop="actualQuantity">
          <el-input-number v-model="checkFormData.actualQuantity" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="差异量">
          <span :style="{ color: checkDiff !== 0 ? '#f56c6c' : '' }">
            {{ checkDiff > 0 ? '+' : '' }}{{ checkDiff }}
          </span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkFormData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCheckSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 流水弹窗 -->
    <el-dialog v-model="flowDialogVisible" title="库存流水" width="800px" destroy-on-close>
      <el-table :data="flowTableData" v-loading="flowLoading" border style="width: 100%">
        <el-table-column label="时间" width="170">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getFlowTypeColor(scope.row.flowType)" size="small">
              {{ getFlowTypeLabel(scope.row.flowType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="110">
          <template #default="scope">
            {{ getSourceTypeLabel(scope.row.sourceType) }}
          </template>
        </el-table-column>
        <el-table-column label="变动数量" width="100" align="right">
          <template #default="scope">
            {{ scope.row.quantity }}
          </template>
        </el-table-column>
        <el-table-column prop="beforeQuantity" label="变动前" width="90" align="right" />
        <el-table-column prop="afterQuantity" label="变动后" width="90" align="right" />
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="flowPageNum"
          v-model:page-size="flowPageSize"
          :page-sizes="[10, 20, 50]"
          :total="flowTotal"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchFlowList"
          @size-change="handleFlowSizeChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTableList } from '@/composables/useTableList'
import {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  inventoryInbound,
  inventoryOutbound,
  inventoryCheck,
  getInventoryFlowList,
  type InventoryItem,
  type InventoryItemCreateRequest,
  type InventoryItemUpdateRequest,
  type InventoryFlow
} from '@/api/inventory'
import { getAllStores, type StoreItem } from '@/api/store'

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

// ============ 库存列表（使用 useTableList） ============
const {
  tableData,
  loading,
  total,
  pageNum,
  pageSize,
  queryParams,
  fetchList,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange
} = useTableList<InventoryItem>(getInventoryList, {
  itemName: '',
  category: undefined,
  storeId: undefined,
  lowStock: false
})

// ============ 工具函数 ============
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

function getFlowTypeLabel(type: number) {
  const map: Record<number, string> = { 1: '入库', 2: '出库', 3: '盘点调整' }
  return map[type] || '未知'
}

function getFlowTypeColor(type: number) {
  const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning' }
  return map[type] || 'info'
}

function getSourceTypeLabel(type: string) {
  const map: Record<string, string> = {
    purchase_in: '采购入库',
    manual_in: '手动调整',
    sale_out: '销售消耗',
    loss_out: '损耗出库',
    check_adjust: '盘点调整'
  }
  return map[type] || type
}

// ============ 新增/编辑物料弹窗 ============
const itemDialogVisible = ref(false)
const itemDialogTitle = ref('新增物料')
const isItemEdit = ref(false)
const editItemId = ref<number | null>(null)
const itemFormRef = ref<FormInstance>()
const itemFormData = reactive<InventoryItemCreateRequest>({
  storeId: undefined as unknown as number,
  itemName: '',
  itemCode: '',
  category: undefined,
  unit: '',
  quantity: 0,
  costPrice: 0,
  alertThreshold: 0
})
const itemFormRules: FormRules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  itemName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  itemCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入计量单位', trigger: 'blur' }]
}

function handleAdd() {
  isItemEdit.value = false
  itemDialogTitle.value = '新增物料'
  editItemId.value = null
  itemFormData.storeId = undefined as unknown as number
  itemFormData.itemName = ''
  itemFormData.itemCode = ''
  itemFormData.category = undefined
  itemFormData.unit = ''
  itemFormData.quantity = 0
  itemFormData.costPrice = 0
  itemFormData.alertThreshold = 0
  itemDialogVisible.value = true
}

function handleEdit(row: InventoryItem) {
  isItemEdit.value = true
  itemDialogTitle.value = '编辑物料'
  editItemId.value = row.id
  itemFormData.storeId = row.storeId
  itemFormData.itemName = row.itemName
  itemFormData.itemCode = row.itemCode
  itemFormData.category = row.category || undefined
  itemFormData.unit = row.unit
  itemFormData.costPrice = row.costPrice || 0
  itemFormData.alertThreshold = row.alertThreshold || 0
  itemDialogVisible.value = true
}

async function handleItemSubmit() {
  const valid = await itemFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isItemEdit.value && editItemId.value) {
      const updateData: InventoryItemUpdateRequest = {
        itemName: itemFormData.itemName,
        category: itemFormData.category,
        unit: itemFormData.unit,
        costPrice: itemFormData.costPrice,
        alertThreshold: itemFormData.alertThreshold
      }
      await updateInventoryItem(editItemId.value, updateData)
      ElMessage.success('修改成功')
    } else {
      await createInventoryItem(itemFormData)
      ElMessage.success('新增成功')
    }
    itemDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// ============ 删除物料 ============
async function handleDelete(row: InventoryItem) {
  try {
    await ElMessageBox.confirm(`确定要删除物料「${row.itemName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteInventoryItem(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// ============ 入库弹窗 ============
const currentItem = ref<InventoryItem | null>(null)
const inboundDialogVisible = ref(false)
const inboundFormRef = ref<FormInstance>()
const inboundFormData = reactive({
  quantity: 1,
  sourceType: 'purchase_in',
  remark: ''
})
const inboundFormRules: FormRules = {
  quantity: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
  sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }]
}

function handleInbound(row: InventoryItem) {
  currentItem.value = row
  inboundFormData.quantity = 1
  inboundFormData.sourceType = 'purchase_in'
  inboundFormData.remark = ''
  inboundDialogVisible.value = true
}

async function handleInboundSubmit() {
  const valid = await inboundFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await inventoryInbound({
      itemId: currentItem.value!.id,
      quantity: inboundFormData.quantity,
      sourceType: inboundFormData.sourceType,
      remark: inboundFormData.remark
    })
    ElMessage.success('入库成功')
    inboundDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '入库失败')
  }
}

// ============ 出库弹窗 ============
const outboundDialogVisible = ref(false)
const outboundFormRef = ref<FormInstance>()
const outboundFormData = reactive({
  quantity: 1,
  sourceType: 'sale_out',
  remark: ''
})
const outboundFormRules: FormRules = {
  quantity: [{ required: true, message: '请输入出库数量', trigger: 'blur' }],
  sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }]
}

function handleOutbound(row: InventoryItem) {
  currentItem.value = row
  outboundFormData.quantity = 1
  outboundFormData.sourceType = 'sale_out'
  outboundFormData.remark = ''
  outboundDialogVisible.value = true
}

async function handleOutboundSubmit() {
  const valid = await outboundFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (outboundFormData.quantity > (currentItem.value?.quantity || 0)) {
    ElMessage.warning('出库数量不能超过当前库存量')
    return
  }

  try {
    await inventoryOutbound({
      itemId: currentItem.value!.id,
      quantity: outboundFormData.quantity,
      sourceType: outboundFormData.sourceType,
      remark: outboundFormData.remark
    })
    ElMessage.success('出库成功')
    outboundDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '出库失败')
  }
}

// ============ 盘点弹窗 ============
const checkDialogVisible = ref(false)
const checkFormRef = ref<FormInstance>()
const checkFormData = reactive({
  actualQuantity: 0,
  remark: ''
})
const checkFormRules: FormRules = {
  actualQuantity: [{ required: true, message: '请输入实际库存量', trigger: 'blur' }]
}

const checkDiff = computed(() => {
  return checkFormData.actualQuantity - (currentItem.value?.quantity || 0)
})

function handleCheck(row: InventoryItem) {
  currentItem.value = row
  checkFormData.actualQuantity = row.quantity
  checkFormData.remark = ''
  checkDialogVisible.value = true
}

async function handleCheckSubmit() {
  const valid = await checkFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await inventoryCheck({
      itemId: currentItem.value!.id,
      actualQuantity: checkFormData.actualQuantity,
      remark: checkFormData.remark
    })
    ElMessage.success('盘点成功')
    checkDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '盘点失败')
  }
}

// ============ 流水弹窗 ============
const flowDialogVisible = ref(false)
const flowTableData = ref<InventoryFlow[]>([])
const flowLoading = ref(false)
const flowTotal = ref(0)
const flowPageNum = ref(1)
const flowPageSize = ref(10)
const flowItemId = ref<number | null>(null)

function handleFlow(row: InventoryItem) {
  flowItemId.value = row.id
  flowPageNum.value = 1
  flowDialogVisible.value = true
  fetchFlowList()
}

async function fetchFlowList() {
  flowLoading.value = true
  try {
    const res = await getInventoryFlowList({
      pageNum: flowPageNum.value,
      pageSize: flowPageSize.value,
      itemId: flowItemId.value!
    })
    flowTableData.value = res.data?.records || []
    flowTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('加载流水失败', error)
    flowTableData.value = []
    flowTotal.value = 0
  } finally {
    flowLoading.value = false
  }
}

function handleFlowSizeChange(size: number) {
  flowPageSize.value = size
  flowPageNum.value = 1
  fetchFlowList()
}

// ============ 初始化 ============
onMounted(() => {
  loadStoreList()
})
</script>

<style scoped>
.inventory-container {
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
</style>
