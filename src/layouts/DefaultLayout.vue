<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import AppHeader from '@/components/AppHeader.vue'

const isCollapse = ref(false)

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <el-container class="app-wrapper">
    <el-aside :width="isCollapse ? '64px' : '210px'" class="sidebar-container">
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>
    <el-container>
      <el-header style="padding: 0; height: 50px;">
        <AppHeader :is-collapse="isCollapse" @toggle-collapse="toggleCollapse" />
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.app-wrapper {
  height: 100%;
}

.sidebar-container {
  transition: width 0.3s;
  overflow: hidden;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
