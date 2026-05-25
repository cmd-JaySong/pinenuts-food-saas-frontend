<template>
  <div class="empty-state">
    <el-empty :image-size="120" :description="description">
      <template v-if="showAction" #default>
        <el-button type="primary" @click="$emit('action')">
          {{ actionText }}
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
  showAction?: boolean
  actionText?: string
}>(), {
  description: '暂无数据',
  showAction: false,
  actionText: '立即添加'
})

defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
