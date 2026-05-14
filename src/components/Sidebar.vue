<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  House,
  OfficeBuilding,
  Food,
  Box,
} from '@element-plus/icons-vue'

defineProps<{
  isCollapse: boolean
}>()

const router = useRouter()

function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="sidebar-container">
    <div class="logo-container" :class="{ collapsed: isCollapse }">
      <img src="/vite.svg" alt="Logo" class="logo-icon" />
      <span v-show="!isCollapse" class="logo-text">松籽餐饮</span>
    </div>
    <el-menu
      default-active="/"
      :collapse="isCollapse"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      :collapse-transition="false"
      @select="handleMenuSelect"
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      <el-menu-item index="/store">
        <el-icon><OfficeBuilding /></el-icon>
        <template #title>门店管理</template>
      </el-menu-item>
      <el-menu-item index="/dish">
        <el-icon><Food /></el-icon>
        <template #title>菜品管理</template>
      </el-menu-item>
      <el-menu-item index="/inventory">
        <el-icon><Box /></el-icon>
        <template #title>库存管理</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-container {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;

  .el-menu {
    border-right: none;
    flex: 1;
  }
}

.logo-container {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: #263445;

  &.collapsed {
    padding: 0;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  .logo-text {
    margin-left: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
}
</style>
