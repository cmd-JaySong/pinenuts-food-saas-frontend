<template>
  <div class="alert-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 160px">
          <el-option label="未处理" :value="0" />
          <el-option label="已处理" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      border
      style="width: 100%"
      :row-class-name="getRowClassName"
    >
      <el-table-column prop="itemName" label="物料名称" min-width="140" />
      <el-table-column prop="storeName" label="所属门店" width="140" />
      <el-table-column label="当前库存" width="100" align="right">
        <template #default="scope">
          <span style="color: #f56c6c; font-weight: 600">{{ scope.row.currentQuantity }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="alertThreshold" label="预警阈值" width="100" align="right" />
      <el-table-column label="缺口量" width="100" align="right">
        <template #default="scope">
          <span style="color: #f56c6c; font-weight: 600">
            {{ scope.row.alertThreshold - scope.row.currentQuantity }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'danger' : 'success'" size="small">
            {{ scope.row.status === 0 ? '未处理' : '已处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="产生时间" width="170">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 0"
            link
            type="primary"
            @click="handleMarkProcessed(scope.row)"
          >
            标记已处理
          </el-button>
          <el-button link type="success" @click="goToInventory">
            去入库
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
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useTableList } from '@/composables/useTableList'
import {
  getInventoryAlertList,
  handleInventoryAlert,
  type InventoryAlert
} from '@/api/inventory'

const router = useRouter()

// ============ 预警列表（使用 useTableList） ============
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
} = useTableList<InventoryAlert>(getInventoryAlertList, {
  status: undefined
})

// ============ 工具函数 ============
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

function getRowClassName({ row }: { row: InventoryAlert }) {
  return row.status === 0 ? 'alert-row' : ''
}

// ============ 标记已处理 ============
async function handleMarkProcessed(row: InventoryAlert) {
  try {
    await ElMessageBox.confirm(`确定将物料「${row.itemName}」的预警标记为已处理吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await handleInventoryAlert(row.id)
    ElMessage.success('处理成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  }
}

// ============ 跳转到库存台账 ============
function goToInventory() {
  router.push('/inventory')
}
</script>

<style scoped>
.alert-container {
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
</style>

<style>
.el-table .alert-row {
  background-color: #fef0f0 !important;
}
</style>
