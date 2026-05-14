<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHealth } from '@/api/health'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'

const healthData = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')

async function fetchHealth() {
  loading.value = true
  error.value = ''
  try {
    const res = await getHealth()
    healthData.value = res.data ?? res
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = '无法连接后端服务'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHealth()
})
</script>

<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span style="font-size: 18px; font-weight: 600;">欢迎使用松籽餐饮数字化管理平台</span>
          </template>
          <p style="color: #606266; line-height: 1.8;">
            这是一个集门店管理、菜品管理、库存管理等功能于一体的餐饮SaaS管理平台。
            请通过左侧菜单导航到各功能模块。
          </p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>后端服务状态</span>
          </template>
          <div v-loading="loading">
            <div v-if="healthData" style="color: #67c23a;">
              <el-icon style="vertical-align: middle;"><CircleCheckFilled /></el-icon>
              <span style="margin-left: 8px;">后端服务连接正常</span>
              <pre style="margin-top: 12px; background: #f5f7fa; padding: 12px; border-radius: 4px; font-size: 13px;">{{ JSON.stringify(healthData, null, 2) }}</pre>
            </div>
            <div v-else-if="error" style="color: #f56c6c;">
              <el-icon style="vertical-align: middle;"><CircleCloseFilled /></el-icon>
              <span style="margin-left: 8px;">{{ error }}</span>
            </div>
            <div v-else style="color: #909399;">
              <span>正在检查后端服务...</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>快速开始</span>
          </template>
          <el-space direction="vertical" :size="12" style="width: 100%;">
            <p style="color: #606266;">当前为开发阶段，以下功能模块即将上线：</p>
            <el-tag type="info">门店管理</el-tag>
            <el-tag type="info">菜品管理</el-tag>
            <el-tag type="info">库存管理</el-tag>
            <el-tag type="info">订单管理</el-tag>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  padding: 0;
}
</style>
