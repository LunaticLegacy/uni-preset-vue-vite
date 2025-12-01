import { apiGet, apiPost } from '../../services/http.js'
import { getCurrentWorkspace, getUserId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

export default {
  components: { Layout },

  data() {
    return {
      projects: [],
      workspace: null,
      title: '',
      description: '',
      loading: false,
      error: ''
    }
  },

  onShow() {
    this.workspace = getCurrentWorkspace()
    this.fetch()
  },

  methods: {
    async fetch() {
      this.loading = true
      this.error = ''
      if (!this.workspace || !this.workspace.id) {
        this.loading = false
        this.error = '请先选择工作空间'
        return
      }
      try {
        const res = await apiGet('/projects/', { workspace_id: this.workspace.id })
        if (res.statusCode === 200) {
          this.projects = res.data.data || []
        } else {
          this.error = res?.data?.message || '加载失败'
        }
      } catch (e) {
        this.error = '网络错误'
      } finally {
        this.loading = false
      }
    },

    async createProject() {
      if (!this.workspace || !this.workspace.id) {
        uni.showToast({ title: '请先选择工作空间', icon: 'none' })
        return
      }
      if (!this.title) {
        uni.showToast({ title: '请填写必要信息', icon: 'none' })
        return
      }

      const res = await apiPost('/projects/', {
        workspace_id: this.workspace.id,
        owner_id: getUserId(),
        title: this.title,
        description: this.description,
        start_date: null,
        due_date: null
      })
      if (res.statusCode === 200) {
        this.title = ''
        this.description = ''
        this.fetch()
        uni.showToast({ title: '已创建', icon: 'success' })
      }
    },

    openDetail(id) {
      uni.navigateTo({ url: `/pages/projects/detail?id=${id}` })
    },
  }
}
