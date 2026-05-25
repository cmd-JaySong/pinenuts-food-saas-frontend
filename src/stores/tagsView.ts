import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  name: string
  path: string
  title: string
  affix?: boolean // 固定标签不可关闭
}

export const useTagsViewStore = defineStore('tagsView', () => {
  const visitedViews = ref<TagView[]>([
    { name: 'Home', path: '/', title: '首页', affix: true }
  ])

  function addView(route: RouteLocationNormalized) {
    if (!route.meta?.title) return
    const exists = visitedViews.value.find(v => v.path === route.path)
    if (exists) return
    visitedViews.value.push({
      name: route.name as string,
      path: route.path,
      title: route.meta.title as string
    })
  }

  function removeView(path: string) {
    const index = visitedViews.value.findIndex(v => v.path === path)
    if (index > -1 && !visitedViews.value[index].affix) {
      visitedViews.value.splice(index, 1)
    }
  }

  function removeOtherViews(path: string) {
    visitedViews.value = visitedViews.value.filter(v => v.affix || v.path === path)
  }

  function removeAllViews() {
    visitedViews.value = visitedViews.value.filter(v => v.affix)
  }

  return { visitedViews, addView, removeView, removeOtherViews, removeAllViews }
})
