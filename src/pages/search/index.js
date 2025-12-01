import { apiGet } from '../../services/http.js'
import { getCurrentWorkspace } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

/**
 * 搜索页面
 * 使用 /search/ 接口，按工作空间搜索任务/项目
 */
export default {
  components: { 
    Layout 
  },
  
  data() {
    return { 
      tab: 'tasks', 
      query: '', 
      taskResults: [], 
      projectResults: [], 
      workspace: null
    }
  },

  onShow() {
    this.workspace = getCurrentWorkspace()
  },
  
  methods: {
    /**
     * 执行搜索操作
     * 根据当前选项卡类型搜索任务或项目
     */
    async search() { 
      if (!this.query) { 
        this.taskResults = []
        this.projectResults = []
        return 
      }
      if (!this.workspace || !this.workspace.id) {
        uni.showToast({ title: '请先选择工作空间', icon: 'none' })
        return
      }
      
      const r = await apiGet('/search/', { 
        workspace_id: this.workspace.id,
        q: this.query 
      })
      if (r.statusCode === 200) {
        const data = r.data.data || {}
        this.taskResults = data.tasks || []
        this.projectResults = data.projects || []
      }
    }
  }
}
