import { apiGet, apiPut } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 任务详情：查看、编辑标题/描述/状态/指派
 */
export default { 
  components: { Layout }, 
  
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
     */
    async save() { 
      const { title, description, status, assignee_id } = this.task
      const res = await apiPut(`/tasks/${this.id}/`, { 
        title: title, 
        description: description, 
        status: status, 
        assignee_id: assignee_id
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
