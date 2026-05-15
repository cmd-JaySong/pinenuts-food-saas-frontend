<template>
  <div class="store-list-page">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="门店名称">
        <el-input
          v-model="queryParams.storeName"
          placeholder="请输入门店名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="门店编号">
        <el-input
          v-model="queryParams.storeCode"
          placeholder="请输入门店编号"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 新增按钮 -->
    <div class="action-bar">
      <el-button
        v-if="userStore.hasPermission('store:create')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增门店
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="storeCode" label="门店编号" width="140" />
      <el-table-column prop="storeName" label="门店名称" min-width="150" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="contactPhone" label="联系电话" width="140" />
      <el-table-column prop="businessHours" label="营业时间" width="160" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button
            v-if="userStore.hasPermission('store:update')"
            link
            type="primary"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="userStore.hasPermission('store:delete')"
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="门店编号" prop="storeCode">
          <el-input
            v-model="formData.storeCode"
            placeholder="请输入门店编号"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="门店名称" prop="storeName">
          <el-input v-model="formData.storeName" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="营业时间" prop="businessHours">
          <el-input v-model="formData.businessHours" placeholder="例如：09:00-22:00" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTableList } from '@/composables/useTableList'
import {
  getStoreList,
  createStore,
  updateStore,
  deleteStore,
  type StoreItem,
  type StoreCreateRequest,
  type StoreUpdateRequest
} from '@/api/store'

const userStore = useUserStore()

// 使用通用Hook
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
} = useTableList<StoreItem>(getStoreList, { storeName: '', storeCode: '' })

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增门店')
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const formData = reactive<StoreCreateRequest & { status?: number }>({
  storeCode: '',
  storeName: '',
  address: '',
  contactPhone: '',
  businessHours: ''
})

const formRules: FormRules = {
  storeCode: [
    { required: true, message: '请输入门店编号', trigger: 'blur' },
    { max: 50, message: '长度不超过50个字符', trigger: 'blur' }
  ],
  storeName: [
    { required: true, message: '请输入门店名称', trigger: 'blur' },
    { max: 100, message: '长度不超过100个字符', trigger: 'blur' }
  ]
}

// 格式化时间
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增门店'
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row: StoreItem) {
  isEdit.value = true
  dialogTitle.value = '编辑门店'
  editId.value = row.id
  Object.assign(formData, {
    storeCode: row.storeCode,
    storeName: row.storeName,
    address: row.address,
    contactPhone: row.contactPhone,
    businessHours: row.businessHours,
    status: row.status
  })
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value && editId.value) {
      const updateData: StoreUpdateRequest = {
        storeName: formData.storeName,
        address: formData.address,
        contactPhone: formData.contactPhone,
        businessHours: formData.businessHours,
        status: formData.status
      }
      await updateStore(editId.value, updateData)
      ElMessage.success('修改成功')
    } else {
      await createStore({
        storeCode: formData.storeCode,
        storeName: formData.storeName,
        address: formData.address,
        contactPhone: formData.contactPhone,
        businessHours: formData.businessHours
      })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// 删除
async function handleDelete(row: StoreItem) {
  try {
    await ElMessageBox.confirm(`确定要删除门店「${row.storeName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteStore(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 状态切换
async function handleStatusChange(row: StoreItem) {
  try {
    await updateStore(row.id, { storeName: row.storeName, status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error: any) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error(error?.message || '状态更新失败')
  }
}

function resetForm() {
  formData.storeCode = ''
  formData.storeName = ''
  formData.address = ''
  formData.contactPhone = ''
  formData.businessHours = ''
  formData.status = undefined
  formRef.value?.resetFields()
}
</script>

<style scoped>
.store-list-page {
  padding: 20px;
}

.search-form {
  margin-bottom: 16px;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
