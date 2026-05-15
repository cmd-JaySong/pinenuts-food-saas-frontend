<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

defineProps<{
  isCollapse: boolean
}>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const menuList = computed(() => userStore.menus)
const activeMenu = computed(() => route.path)

function handleMenuSelect(index: string) {
  if (index) {
    router.push(index)
  }
}
</script>

<template>
  <div class="sidebar-container">
    <div class="logo-container" :class="{ collapsed: isCollapse }">
      <img src="/vite.svg" alt="Logo" class="logo-icon" />
      <span v-show="!isCollapse" class="logo-text">松籽餐饮</span>
      <span v-show="isCollapse" class="logo-short">松</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      :collapse-transition="false"
      router
      @select="handleMenuSelect"
    >
      <!-- 始终保留首页菜单 -->
      <el-menu-item index="/">
        <el-icon><component is="HomeFilled" /></el-icon>
        <template #title>首页</template>
      </el-menu-item>

      <!-- 动态菜单渲染 -->
      <template v-for="menu in menuList" :key="menu.id">
        <!-- 有子菜单的项目 -->
        <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.permissionCode">
          <template #title>
            <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
            <span>{{ menu.permissionName }}</span>
          </template>
          <template v-for="child in menu.children" :key="child.id">
            <el-sub-menu v-if="child.children && child.children.length > 0" :index="child.permissionCode">
              <template #title>
                <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                <span>{{ child.permissionName }}</span>
              </template>
              <el-menu-item
                v-for="subChild in child.children"
                :key="subChild.id"
                :index="subChild.path || ''"
              >
                <el-icon v-if="subChild.icon"><component :is="subChild.icon" /></el-icon>
                <template #title>{{ subChild.permissionName }}</template>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="child.path || ''">
              <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
              <template #title>{{ child.permissionName }}</template>
            </el-menu-item>
          </template>
        </el-sub-menu>
        <!-- 没有子菜单的项目 -->
        <el-menu-item v-else :index="menu.path || ''">
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <template #title>{{ menu.permissionName }}</template>
        </el-menu-item>
      </template>
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

  .logo-short {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }
}
</style>
