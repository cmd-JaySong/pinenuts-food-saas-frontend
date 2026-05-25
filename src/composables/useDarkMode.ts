import { ref, watch } from 'vue'

const STORAGE_KEY = 'pinenuts-theme-dark'

const isDark = ref(localStorage.getItem(STORAGE_KEY) === 'true')

// 初始化时应用主题
function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 初始应用
applyTheme()

watch(isDark, () => {
  applyTheme()
  localStorage.setItem(STORAGE_KEY, String(isDark.value))
})

export function useDarkMode() {
  function toggleDark() {
    isDark.value = !isDark.value
  }
  return { isDark, toggleDark }
}
