<template>
  <div class="staff-list-page">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="员工姓名">
        <el-input
          v-model="queryParams.staffName"
          placeholder="请输入员工姓名"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="所属门店">
        <el-select
          v-model="queryParams.storeId"
          placeholder="请选择门店"
          clearable
        >
          <el-option
            v-for="store in storeOptions"
            :key="store.id"
            :label="store.storeName"
            :value="store.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 新增按钮 -->
    <div class="action-bar">
      <el-button
        v-if="userStore.hasPermission('staff:create')"
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增员工
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="staffName" label="姓名" width="120" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="storeName" label="所属门店" min-width="150" />
      <el-table-column prop="position" label="职位" width="120" />
      <el-table-column prop="entryDate" label="入职日期" width="120" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button
            v-if="userStore.hasPermission('staff:update')"
            link
            type="primary"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="userStore.hasPermission('staff:delete')"
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
        <el-form-item label="所属门店" prop="storeId">
          <el-select v-model="formData.storeId" placeholder="请选择门店" style="width: 100%">
            <el-option
              v-for="store in storeOptions"
              :key="store.id"
              :label="store.storeName"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="staffName">
          <el-input v-model="formData.staffName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-input v-model="formData.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="入职日期" prop="entryDate">
          <el-date-picker
            v-model="formData.entryDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
          </el-select>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTableList } from '@/composables/useTableList'
import {
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  type StaffItem,
  type StaffCreateRequest,
  type StaffUpdateRequest
} from '@/api/staff'
import { getAllStores, type StoreItem } from '@/api/store'

const userStore = useUserStore()

// 门店选项列表
const storeOptions = ref<StoreItem[]>([])

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
} = useTableList<StaffItem>(getStaffList, { staffName: '', storeId: undefined })

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const formData = reactive<StaffCreateRequest & { status?: number }>({
  storeId: undefined as unknown as number,
  staffName: '',
  phone: '',
  position: '',
  entryDate: ''
})

const formRules: FormRules = {
  storeId: [
    { required: true, message: '请选择所属门店', trigger: 'change' }
  ],
  staffName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 50, message: '长度不超过50个字符', trigger: 'blur' }
  ]
}

// 获取门店列表
async function fetchStoreOptions() {
  try {
    const res = await getAllStores()
    storeOptions.value = res.data || []
  } catch (error) {
    console.error('获取门店列表失败', error)
  }
}

onMounted(() => {
  fetchStoreOptions()
})

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增员工'
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row: StaffItem) {
  isEdit.value = true
  dialogTitle.value = '编辑员工'
  editId.value = row.id
  Object.assign(formData, {
    storeId: row.storeId,
    staffName: row.staffName,
    phone: row.phone,
    position: row.position,
    entryDate: row.entryDate,
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
      const updateData: StaffUpdateRequest = {
        storeId: formData.storeId,
        staffName: formData.staffName,
        phone: formData.phone,
        position: formData.position,
        entryDate: formData.entryDate,
        status: formData.status
      }
      await updateStaff(editId.value, updateData)
      ElMessage.success('修改成功')
    } else {
      await createStaff({
        storeId: formData.storeId,
        staffName: formData.staffName,
        phone: formData.phone,
        position: formData.position,
        entryDate: formData.entryDate
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
async function handleDelete(row: StaffItem) {
  try {
    await ElMessageBox.confirm(`确定要删除员工「${row.staffName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteStaff(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

function resetForm() {
  formData.storeId = undefined as unknown as number
  formData.staffName = ''
  formData.phone = ''
  formData.position = ''
  formData.entryDate = ''
  formData.status = undefined
  formRef.value?.resetFields()
}
</script>

<style scoped>
.staff-list-page {
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
