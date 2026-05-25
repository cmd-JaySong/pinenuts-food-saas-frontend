<template>
  <div class="tags-view-container">
    <div class="tags-view-wrapper" ref="scrollContainer">
      <el-tag
        v-for="tag in tagsViewStore.visitedViews"
        :key="tag.path"
        :type="isActive(tag) ? '' : 'info'"
        :closable="!tag.affix"
        :effect="isActive(tag) ? 'dark' : 'plain'"
        class="tags-view-item"
        @click="handleTagClick(tag)"
        @close="handleClose(tag)"
        @contextmenu.prevent="openContextMenu($event, tag)"
      >
        {{ tag.title }}
      </el-tag>
    </div>

    <!-- 右键菜单 -->
    <ul
      v-show="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <li @click="handleCloseCurrentTag">关闭当前</li>
      <li @click="handleCloseOtherTags">关闭其他</li>
      <li @click="handleCloseAllTags">关闭全部</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/stores/tagsView'
import type { TagView } from '@/stores/tagsView'

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  selectedTag: null as TagView | null
})

function isActive(tag: TagView) {
  return tag.path === route.path
}

function handleTagClick(tag: TagView) {
  if (tag.path !== route.path) {
    router.push(tag.path)
  }
}

function handleClose(tag: TagView) {
  tagsViewStore.removeView(tag.path)
  if (isActive(tag)) {
    // 关闭当前标签后跳转到最后一个标签
    const lastTag = tagsViewStore.visitedViews[tagsViewStore.visitedViews.length - 1]
    if (lastTag) {
      router.push(lastTag.path)
    } else {
      router.push('/')
    }
  }
}

function openContextMenu(e: MouseEvent, tag: TagView) {
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.selectedTag = tag
}

function closeContextMenu() {
  contextMenu.visible = false
}

function handleCloseCurrentTag() {
  if (contextMenu.selectedTag) {
    handleClose(contextMenu.selectedTag)
  }
  closeContextMenu()
}

function handleCloseOtherTags() {
  if (contextMenu.selectedTag) {
    tagsViewStore.removeOtherViews(contextMenu.selectedTag.path)
    if (contextMenu.selectedTag.path !== route.path) {
      router.push(contextMenu.selectedTag.path)
    }
  }
  closeContextMenu()
}

function handleCloseAllTags() {
  tagsViewStore.removeAllViews()
  router.push('/')
  closeContextMenu()
}

// 监听路由变化，自动添加标签
watch(
  () => route.path,
  () => {
    tagsViewStore.addView(route)
  },
  { immediate: true }
)

// 点击空白处关闭右键菜单
function handleClickOutside() {
  closeContextMenu()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  padding: 0 12px;
  margin-bottom: 16px;
  position: relative;
}

.tags-view-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.tags-view-item {
  cursor: pointer;
  flex-shrink: 0;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  list-style: none;
  padding: 5px 0;
  margin: 0;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  font-size: 12px;

  li {
    padding: 7px 16px;
    cursor: pointer;
    color: var(--el-text-color-regular);

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
  }
}
</style>
