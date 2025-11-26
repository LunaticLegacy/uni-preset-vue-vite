import { apiGet, apiPost, apiPut, apiDelete } from '../../services/http.js'
import { setCurrentWorkspace } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

/**
 * 工作空间管理页面
 * 显示工作空间列表，支持创建、编辑、选择和删除
 */
export default {
  components: { Layout },

  data() {
    return {
      workspaces: [],
      name: '',
      description: '',
      _editIdWorkspaceId: '',
      loading: false,
      error: ''
    }
  },

  onShow() {
    this.fetch()
  },

  methods: {
    /**
     * 获取工作空间列表
     */
    async fetch() {
      this.loading = true
      this.error = ''
      try {
        const res = await apiGet('/workspaces', null, { trailing: false })
        if (res.statusCode === 200) {
          this.workspaces = res.data.data || []
        } else {
          this.error = res?.data?.message || '加载失败'
        }
      } catch (err) {
        this.error = '网络错误'
      } finally {
        this.loading = false
      }
    },

    /**
     * 创建或更新工作空间
     */
    async createWorkspace() {
      if (!this.name) {
        uni.showToast({
          title: '请填写名称',
          icon: 'none'
        })
        return
      }

      const payload = {
        name: this.name,
        description: this.description
      }

      const res = this._editIdWorkspaceId
        ? await apiPut(`/workspaces/${this._editIdWorkspaceId}/`, payload, { trailing: false })
        : await apiPost('/workspaces/', payload, { trailing: false })

      this.name = ''
      this.description = ''
      this._editIdWorkspaceId = ''

      if (res.statusCode === 200) {
        this.fetch()
        uni.showToast({
          title: '已保存',
          icon: 'success'
        })
      } else {
        this.fetch()
        uni.showToast({
          title: '保存失败，远程服务器错误',
          icon: 'error'
        })
      }
    },

    /**
     * 开始编辑工作空间
     * @param {Object} w - 工作空间对象
     */
    edit(w) {
      this.name = w.name
      this.description = w.description
      this._editIdWorkspaceId = w.id
    },

    /**
     * 选择工作空间并跳转项目列表
     */
    chooseWorkspace(w) {
      setCurrentWorkspace({ id: w.id, name: w.name })
      uni.showToast({ title: `已选择：${w.name}`, icon: 'success' })
      uni.navigateTo({ url: '/pages/projects/index' })
    },

    /**
     * 删除工作空间
     * @param {string} id - 工作空间ID
     */
    async remove(id) {
      const res = await apiDelete(`/workspaces/${id}`, {}, { trailing: false })
      if (res.statusCode === 200) {
        uni.showToast({
          title: '已删除',
          icon: 'success'
        })
        this.fetch()
      }
    },

    /**
     * 打开工作空间详情页面
     * @param {string} id - 工作空间ID
     */
    async openDetail(id) {
      uni.navigateTo({
        url: `/pages/workspaces/detail?id=${id}`
      })
    },
  }
}
