import { ref, reactive, onMounted } from 'vue'

interface UseTableListOptions {
  immediate?: boolean  // 是否立即加载，默认 true
}

export function useTableList<T = any>(
  fetchApi: (params: any) => Promise<any>,
  defaultQuery: Record<string, any> = {},
  options: UseTableListOptions = {}
) {
  const { immediate = true } = options

  const tableData = ref<T[]>([]) as any
  const loading = ref(false)
  const total = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const queryParams = reactive<Record<string, any>>({ ...defaultQuery })

  async function fetchList() {
    loading.value = true
    try {
      const params = {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        ...queryParams
      }
      const res = await fetchApi(params)
      // 适配后端 MyBatis-Plus IPage 返回格式
      if (res.data) {
        tableData.value = res.data.records || []
        total.value = res.data.total || 0
      }
    } catch (error) {
      console.error('Failed to fetch list:', error)
      tableData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pageNum.value = 1
    fetchList()
  }

  function handleReset() {
    Object.keys(queryParams).forEach(key => {
      queryParams[key] = defaultQuery[key] ?? undefined
    })
    pageNum.value = 1
    fetchList()
  }

  function handlePageChange() {
    fetchList()
  }

  function handleSizeChange(size: number) {
    pageSize.value = size
    pageNum.value = 1
    fetchList()
  }

  if (immediate) {
    onMounted(() => {
      fetchList()
    })
  }

  return {
    tableData,
    loading,
    total,
    pageNum,
    pageSize,
    queryParams,
    fetchList,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange
  }
}
