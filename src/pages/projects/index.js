import { apiDelete, apiGet, apiPost } from '../../services/http.js'
import { getCurrentWorkspace, setProjectId, getUserId, getToken } from '../../utils/storage.js'
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
        const res = await apiPost('/projects/list', { 
          workspace_id: this.workspace.id,
          time: new Date().toISOString(),
          token: getToken()
        })
        if (res.statusCode === 200) {
          this.projects = res.data.data || []
        } else {
          this.error = res?.data?.message || '加载失败'
        }
      } catch (e) {
        this.error = e
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

      const res = await apiPost('/projects/create', {
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

    chooseProject(p) {
      setProjectId({id: p.id, name: p.name})
      uni.showToast({ title: `已选择${p.name}`, icon: 'success' })
      uni.navigateTo({ url: `/pages/projects/detail?id=${p.id}` })
    },

    /**
     * 编辑项目信息
     * @param {Object} project - 项目对象
     */
    edit(project) {
      // 这里可以添加编辑项目的逻辑
      console.log('编辑项目:', project)
      uni.showToast({ title: '编辑功能待实现', icon: 'none' })
    },

    /**
     * 删除项目
     * @param {string} id - 项目ID
     */
    async remove(id) {
      const res = await apiDelete(`/projects/${id}/delete`, {})
      
      if (res.statusCode === 200) { 
        uni.showToast({ 
          title: '删除成功', 
          icon: 'success' 
        })
        // 重新获取项目列表
        this.fetch()
      } else {
        uni.showToast({ 
          title: '删除失败', 
          icon: 'none' 
        })
      } 
    }
  }
}