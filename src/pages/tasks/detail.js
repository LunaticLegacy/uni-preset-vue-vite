import { apiGet, apiPut } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 任务详情页面
 * 显示和编辑任务详细信息
 */
export default { 
  components: { 
    Layout 
  }, 
  
  data() {
    return { 
      id: '', 
      task: null 
    }
  },
  
  /**
   * 页面加载时获取任务详情
   * @param {Object} q - 页面参数
   */
  async onLoad(q) { 
    this.id = q.id
    const res = await apiGet(`/tasks/${this.id}/`)
    if (res.statusCode === 200) {
      this.task = res.data.data 
    }
  }, 
  
  methods: { 
    /**
     * 保存任务信息
     * 将修改后的任务信息保存到服务器
     */
    async save() { 
      const { title, description, status, assignee_id } = this.task
      const res = await apiPut(`/tasks/${this.id}`, { 
        title, 
        description, 
        status, 
        assignee_id 
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