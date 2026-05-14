<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
} from '@element-plus/icons-vue'

const props = defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  userStore.clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <el-icon class="collapse-btn" @click="emit('toggle-collapse')">
        <Fold v-if="!props.isCollapse" />
        <Expand v-else />
      </el-icon>
    </div>
    <div class="header-right">
      <el-dropdown trigger="click">
        <span class="user-dropdown">
          <el-avatar :size="30" style="background-color: #409eff;">
            {{ userStore.userInfo?.username?.toString().charAt(0) || 'U' }}
          </el-avatar>
          <span class="username">{{ userStore.userInfo?.username || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;

  .collapse-btn {
    font-size: 20px;
    cursor: pointer;
    color: #606266;

    &:hover {
      color: #409eff;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;

  .user-dropdown {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #606266;

    .username {
      margin: 0 8px;
      font-size: 14px;
    }
  }
}
</style>
