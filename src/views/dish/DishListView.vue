<template>
  <div class="dish-container">
    <!-- 左侧分类树 -->
    <div class="category-panel">
      <div class="category-header">
        <span class="category-title">菜品分类</span>
        <el-button
          v-if="userStore.hasPermission('dish:create')"
          :icon="Plus"
          size="small"
          type="primary"
          link
          @click="handleAddCategory"
        />
      </div>
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="id"
        highlight-current
        default-expand-all
        @node-click="handleCategoryClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="tree-node-label">{{ node.label }}</span>
            <span v-if="data.id !== 'all'" class="tree-node-actions">
              <el-icon
                v-if="userStore.hasPermission('dish:update')"
                class="action-icon"
                @click.stop="handleEditCategory(data)"
              >
                <Edit />
              </el-icon>
              <el-icon
                v-if="userStore.hasPermission('dish:delete')"
                class="action-icon danger"
                @click.stop="handleDeleteCategory(data)"
              >
                <Delete />
              </el-icon>
            </span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 右侧菜品列表 -->
    <div class="dish-panel">
      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="菜品名称">
          <el-input
            v-model="queryParams.dishName"
            placeholder="请输入菜品名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button value="table">表格</el-radio-button>
            <el-radio-button value="card">卡片</el-radio-button>
          </el-radio-group>
        </div>
        <div class="action-right">
          <el-button
            v-if="userStore.hasPermission('dish:update')"
            :disabled="selectedRows.length === 0"
            @click="handleBatchStatus(1)"
          >
            批量上架
          </el-button>
          <el-button
            v-if="userStore.hasPermission('dish:update')"
            :disabled="selectedRows.length === 0"
            @click="handleBatchStatus(0)"
          >
            批量下架
          </el-button>
          <el-button
            v-if="userStore.hasPermission('dish:create')"
            type="primary"
            :icon="Plus"
            @click="handleAdd"
          >
            新增菜品
          </el-button>
        </div>
      </div>

      <!-- 有数据时显示表格/卡片 + 分页 -->
      <template v-if="tableData.length > 0 || loading">
        <!-- 表格视图 -->
        <el-table
          v-if="viewMode === 'table'"
          :data="tableData"
          v-loading="loading"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column label="图片" width="80" align="center">
            <template #default="scope">
              <el-image
                v-if="scope.row.imageUrl"
                :src="scope.row.imageUrl"
                style="width: 60px; height: 60px"
                fit="cover"
              />
              <div v-else class="image-placeholder">暂无</div>
            </template>
          </el-table-column>
          <el-table-column prop="dishCode" label="菜品编号" width="130" />
          <el-table-column prop="dishName" label="菜品名称" min-width="140" />
          <el-table-column prop="categoryName" label="所属分类" width="120" />
          <el-table-column label="价格" width="100" align="right">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
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
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="scope">
              <el-button
                v-if="userStore.hasPermission('dish:update')"
                link
                type="primary"
                @click="handleEdit(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="userStore.hasPermission('dish:delete')"
                link
                type="danger"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 卡片视图 -->
        <div v-if="viewMode === 'card'" v-loading="loading" class="card-view">
          <el-row :gutter="16">
            <el-col v-for="item in tableData" :key="item.id" :span="6" class="card-col">
              <el-card :body-style="{ padding: '0' }" shadow="hover" class="dish-card">
                <div class="card-image">
                  <el-image
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    fit="cover"
                    style="width: 100%; height: 180px"
                  />
                  <div v-else class="card-image-placeholder">暂无图片</div>
                </div>
                <div class="card-content">
                  <div class="card-name">{{ item.dishName }}</div>
                  <div class="card-info">
                    <span class="card-price">¥{{ item.price.toFixed(2) }}</span>
                    <el-tag :type="item.status === 1 ? 'success' : 'info'" size="small">
                      {{ item.status === 1 ? '上架' : '下架' }}
                    </el-tag>
                  </div>
                  <div class="card-actions">
                    <el-button
                      v-if="userStore.hasPermission('dish:update')"
                      link
                      type="primary"
                      size="small"
                      @click="handleEdit(item)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="userStore.hasPermission('dish:delete')"
                      link
                      type="danger"
                      size="small"
                      @click="handleDelete(item)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

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
      </template>
      <!-- 无数据且非加载中时显示空状态 -->
      <EmptyState
        v-else
        description="暂无数据"
        :show-action="true"
        action-text="新增菜品"
        @action="handleAdd"
      />
    </div>

    <!-- 分类弹窗 -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="480px" destroy-on-close>
      <el-form ref="categoryFormRef" :model="categoryFormData" :rules="categoryFormRules" label-width="100px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="categoryFormData.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父分类" prop="parentId">
          <el-tree-select
            v-model="categoryFormData.parentId"
            :data="categoryTree"
            :props="{ label: 'categoryName', children: 'children', value: 'id' }"
            placeholder="请选择父分类（可选）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="categoryFormData.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCategorySubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 菜品弹窗 -->
    <el-dialog v-model="dishDialogVisible" :title="dishDialogTitle" width="700px" destroy-on-close>
      <el-form ref="dishFormRef" :model="dishFormData" :rules="dishFormRules" label-width="100px">
        <el-form-item label="所属分类" prop="categoryId">
          <el-tree-select
            v-model="dishFormData.categoryId"
            :data="categoryTree"
            :props="{ label: 'categoryName', children: 'children', value: 'id' }"
            placeholder="请选择分类"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜品名称" prop="dishName">
          <el-input v-model="dishFormData.dishName" placeholder="请输入菜品名称" />
        </el-form-item>
        <el-form-item label="菜品编号" prop="dishCode">
          <el-input
            v-model="dishFormData.dishCode"
            placeholder="请输入菜品编号"
            :disabled="isDishEdit"
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="dishFormData.price"
            :precision="2"
            :min="0.01"
            :step="1"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="菜品图片">
          <el-upload
            action="/api/file/upload"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :on-exceed="handleUploadExceed"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="菜品描述">
          <el-input
            v-model="dishFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入菜品描述"
          />
        </el-form-item>
        <el-form-item label="规格信息">
          <div class="spec-section">
            <div class="spec-header">
              <el-button type="primary" size="small" :icon="Plus" @click="addSpec">添加规格</el-button>
            </div>
            <div v-for="(spec, index) in specList" :key="index" class="spec-row">
              <el-input v-model="spec.name" placeholder="规格名称" style="width: 160px" />
              <el-input-number v-model="spec.price" :precision="2" :min="0" placeholder="价格" style="width: 140px; margin-left: 8px" />
              <el-button
                :icon="Delete"
                type="danger"
                link
                style="margin-left: 8px"
                @click="removeSpec(index)"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDishSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadUserFile } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTableList } from '@/composables/useTableList'
import EmptyState from '@/components/EmptyState.vue'
import {
  getDishList,
  createDish,
  updateDish,
  deleteDish,
  updateDishStatus,
  batchUpdateDishStatus,
  type DishItem,
  type DishCreateRequest,
  type DishUpdateRequest
} from '@/api/dish'
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryTreeNode,
  type CategoryCreateRequest,
  type CategoryUpdateRequest
} from '@/api/dishCategory'

const userStore = useUserStore()

// ============ 视图切换 ============
const viewMode = ref<'table' | 'card'>('table')
const selectedRows = ref<DishItem[]>([])

// ============ 分类树 ============
const categoryTree = ref<CategoryTreeNode[]>([])
const treeProps = { label: 'categoryName', children: 'children' }

const treeData = computed(() => {
  const allNode = { id: 'all' as any, categoryName: '全部菜品', children: [], parentId: 0, sortOrder: 0, status: 1 }
  return [allNode, ...categoryTree.value]
})

async function loadCategoryTree() {
  try {
    const res = await getCategoryTree()
    categoryTree.value = res.data || []
  } catch (e) {
    console.error('加载分类树失败', e)
  }
}

// ============ 菜品列表（使用 useTableList） ============
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
} = useTableList<DishItem>(getDishList, { dishName: '', categoryId: undefined, status: undefined })

// ============ 分类点击 ============
function handleCategoryClick(data: any) {
  if (data.id === 'all') {
    queryParams.categoryId = undefined
  } else {
    queryParams.categoryId = data.id
  }
  handleSearch()
}

// ============ 表格选中 ============
function handleSelectionChange(rows: DishItem[]) {
  selectedRows.value = rows
}

// ============ 批量上下架 ============
async function handleBatchStatus(status: number) {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择菜品')
    return
  }
  try {
    const ids = selectedRows.value.map(r => r.id)
    await batchUpdateDishStatus({ ids, status })
    ElMessage.success(status === 1 ? '批量上架成功' : '批量下架成功')
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// ============ 单个状态切换 ============
async function handleStatusChange(row: DishItem) {
  try {
    await updateDishStatus(row.id, row.status)
    ElMessage.success('状态更新成功')
  } catch (error: any) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error(error?.message || '状态更新失败')
  }
}

// ============ 格式化时间 ============
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

// ============ 分类弹窗 ============
const categoryDialogVisible = ref(false)
const categoryDialogTitle = ref('新增分类')
const isCategoryEdit = ref(false)
const editCategoryId = ref<number | null>(null)
const categoryFormRef = ref<FormInstance>()
const categoryFormData = reactive<CategoryCreateRequest & { sortOrder: number }>({
  parentId: undefined,
  categoryName: '',
  sortOrder: 0
})
const categoryFormRules: FormRules = {
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

function handleAddCategory() {
  isCategoryEdit.value = false
  categoryDialogTitle.value = '新增分类'
  editCategoryId.value = null
  categoryFormData.categoryName = ''
  categoryFormData.parentId = undefined
  categoryFormData.sortOrder = 0
  categoryDialogVisible.value = true
}

function handleEditCategory(data: any) {
  isCategoryEdit.value = true
  categoryDialogTitle.value = '编辑分类'
  editCategoryId.value = data.id
  categoryFormData.categoryName = data.categoryName
  categoryFormData.parentId = data.parentId || undefined
  categoryFormData.sortOrder = data.sortOrder || 0
  categoryDialogVisible.value = true
}

async function handleDeleteCategory(data: any) {
  try {
    await ElMessageBox.confirm(`确定要删除分类「${data.categoryName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCategory(data.id)
    ElMessage.success('删除成功')
    loadCategoryTree()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

async function handleCategorySubmit() {
  const valid = await categoryFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isCategoryEdit.value && editCategoryId.value) {
      const updateData: CategoryUpdateRequest = {
        categoryName: categoryFormData.categoryName,
        sortOrder: categoryFormData.sortOrder
      }
      await updateCategory(editCategoryId.value, updateData)
      ElMessage.success('修改成功')
    } else {
      const createData: CategoryCreateRequest = {
        categoryName: categoryFormData.categoryName,
        parentId: categoryFormData.parentId,
        sortOrder: categoryFormData.sortOrder
      }
      await createCategory(createData)
      ElMessage.success('新增成功')
    }
    categoryDialogVisible.value = false
    loadCategoryTree()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// ============ 菜品弹窗 ============
const dishDialogVisible = ref(false)
const dishDialogTitle = ref('新增菜品')
const isDishEdit = ref(false)
const editDishId = ref<number | null>(null)
const dishFormRef = ref<FormInstance>()
const dishFormData = reactive<DishCreateRequest>({
  categoryId: undefined as unknown as number,
  dishName: '',
  dishCode: '',
  price: 0,
  imageUrl: '',
  description: '',
  specifications: ''
})
const dishFormRules: FormRules = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  dishName: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

// 图片上传
const fileList = ref<UploadUserFile[]>([])
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + userStore.token
}))

function handleUploadSuccess(response: any) {
  if (response.code === 200) {
    dishFormData.imageUrl = response.data
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

function handleUploadRemove() {
  dishFormData.imageUrl = ''
}

function handleUploadExceed() {
  ElMessage.warning('最多只能上传1张图片')
}

// 规格动态表单
interface SpecItem {
  name: string
  price: number
}
const specList = ref<SpecItem[]>([])

function addSpec() {
  specList.value.push({ name: '', price: 0 })
}

function removeSpec(index: number) {
  specList.value.splice(index, 1)
}

// 新增菜品
function handleAdd() {
  isDishEdit.value = false
  dishDialogTitle.value = '新增菜品'
  editDishId.value = null
  dishFormData.categoryId = undefined as unknown as number
  dishFormData.dishName = ''
  dishFormData.dishCode = ''
  dishFormData.price = 0
  dishFormData.imageUrl = ''
  dishFormData.description = ''
  dishFormData.specifications = ''
  specList.value = []
  fileList.value = []
  dishDialogVisible.value = true
}

// 编辑菜品
function handleEdit(row: DishItem) {
  isDishEdit.value = true
  dishDialogTitle.value = '编辑菜品'
  editDishId.value = row.id
  dishFormData.categoryId = row.categoryId
  dishFormData.dishName = row.dishName
  dishFormData.dishCode = row.dishCode
  dishFormData.price = row.price
  dishFormData.imageUrl = row.imageUrl || ''
  dishFormData.description = row.description || ''
  dishFormData.specifications = row.specifications || ''
  // 回显规格
  try {
    specList.value = JSON.parse(row.specifications || '[]')
  } catch {
    specList.value = []
  }
  // 回显图片
  if (row.imageUrl) {
    fileList.value = [{ name: 'image', url: row.imageUrl }]
  } else {
    fileList.value = []
  }
  dishDialogVisible.value = true
}

// 提交菜品表单
async function handleDishSubmit() {
  const valid = await dishFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const specifications = specList.value.length > 0 ? JSON.stringify(specList.value) : ''

    if (isDishEdit.value && editDishId.value) {
      const updateData: DishUpdateRequest = {
        categoryId: dishFormData.categoryId,
        dishName: dishFormData.dishName,
        dishCode: dishFormData.dishCode,
        price: dishFormData.price,
        imageUrl: dishFormData.imageUrl,
        description: dishFormData.description,
        specifications
      }
      await updateDish(editDishId.value, updateData)
      ElMessage.success('修改成功')
    } else {
      const createData: DishCreateRequest = {
        categoryId: dishFormData.categoryId,
        dishName: dishFormData.dishName,
        dishCode: dishFormData.dishCode,
        price: dishFormData.price,
        imageUrl: dishFormData.imageUrl,
        description: dishFormData.description,
        specifications
      }
      await createDish(createData)
      ElMessage.success('新增成功')
    }
    dishDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

// 删除菜品
async function handleDelete(row: DishItem) {
  try {
    await ElMessageBox.confirm(`确定要删除菜品「${row.dishName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteDish(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// ============ 初始化 ============
onMounted(() => {
  loadCategoryTree()
})
</script>

<style scoped>
.dish-container {
  display: flex;
  height: 100%;
  gap: 16px;
}

.category-panel {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  overflow-y: auto;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
}

.tree-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-actions {
  display: none;
  margin-left: 8px;
}

.tree-node:hover .tree-node-actions {
  display: inline-flex;
  gap: 4px;
}

.action-icon {
  cursor: pointer;
  font-size: 14px;
  color: #409eff;
}

.action-icon.danger {
  color: #f56c6c;
}

.dish-panel {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  overflow-y: auto;
}

.search-form {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  align-items: center;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-radius: 4px;
}

.card-view {
  min-height: 200px;
}

.card-col {
  margin-bottom: 16px;
}

.dish-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.dish-card:hover {
  transform: translateY(-2px);
}

.card-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.card-image-placeholder {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 14px;
}

.card-content {
  padding: 12px;
}

.card-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.card-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.spec-section {
  width: 100%;
}

.spec-header {
  margin-bottom: 8px;
}

.spec-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
