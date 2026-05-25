<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useDarkMode } from '@/composables/useDarkMode'
import {
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
  Sunny,
  Moon,
} from '@element-plus/icons-vue'

const { isDark, toggleDark } = useDarkMode()

const props = defineProps<{
  isCollapse: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const userStore = useUserStore()

function handleLogout() {
  userStore.logout()
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
      <el-tooltip :content="isDark ? '切换亮色模式' : '切换暗色模式'" placement="bottom">
        <el-button :icon="isDark ? Sunny : Moon" circle @click="toggleDark" />
      </el-tooltip>
      <el-dropdown trigger="click">
        <span class="user-dropdown">
          <el-avatar v-if="userStore.avatar" :size="30" :src="userStore.avatar" />
          <el-avatar v-else :size="30" style="background-color: #409eff;">
            {{ userStore.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="username">{{ userStore.nickname || '管理员' }}</span>
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
