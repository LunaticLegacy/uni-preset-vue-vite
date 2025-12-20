import { apiGet, apiPut } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 工作空间详情页面
 * 显示和编辑工作空间详细信息
 */
export default {
  components: { 
    Layout 
  },
  
  data() {
    return { 
      id: '', 
      workspace: null 
    }
  },
  
  /**
   * 页面加载时获取工作空间详情
   * @param {Object} q - 页面参数
   */
  async onLoad(q) { 
    this.id = q.id
    const res = await apiPost(`/workspaces/${this.id}/`)
    if (res.statusCode === 200) {
      this.workspace = res.data.data 
    }
  },
  
  methods: {
    /**
     * 保存工作空间信息
     */
    async save() { 
      const res = await apiPut(`/workspaces/${this.id}/`, { 
        name: this.workspace.name, 
        description: this.workspace.description 
      })
      
      if (res.statusCode === 200) { 
        uni.showToast({ 
          title: '已保存', 
          icon: 'success' 
        }) 
      } 
    }
  }
}