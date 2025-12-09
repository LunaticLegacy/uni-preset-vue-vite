import { apiGet, apiPost } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 项目详情页面
 * 显示和编辑项目详细信息
 */
export default { 
  components: { 
    Layout 
  }, 
  
  data() {
    return { 
      id: '', 
      project: null,
      tasks: [] // 存储项目相关的任务
    }
  },
  
  /**
   * 页面加载时获取项目详情
   * @param {Object} q - 页面参数
   */
  async onLoad(q) { 
    this.id = q.id
    
    // 获取项目信息
    const projectRes = await apiPost(`/projects/${this.id}/get/`)
    if (projectRes.statusCode === 200) {
      this.project = projectRes.data.data 
    }
    
    // 获取项目相关的任务
    this.fetchTasks()
  }, 
  
  methods: { 
    /**
     * 获取项目相关的任务
     */
    async fetchTasks() {
      try {
        const res = await apiPost('/tasks/list', { 
          time: new Date().toISOString(),
          token: getToken(),
          project_id: this.id 
        })
        
        if (res.statusCode === 200) {
          this.tasks = res.data.data || []
        }
      } catch (err) {
        console.error('获取任务失败:', err)
        uni.showToast({ 
          title: '获取任务失败', 
          icon: 'none' 
        })
      }
    },
    
    /**
     * 保存项目信息
     * 将修改后的项目信息保存到服务器
     */
    async save() { 
      const res = await apiPost(`/projects/${this.id}/update/`, { 
        time: new Date().toISOString(),
        token: getToken(),
        title: this.project.title, 
        description: this.project.description 
      })
      
      if (res.statusCode === 200) { 
        uni.showToast({ 
          title: '已保存', 
          icon: 'success' 
        }) 
      } else {
        uni.showToast({ 
          title: '保存失败', 
          icon: 'none' 
        })
      }
    },
    
    /**
     * 导航到任务管理页面
     */
    navigateToTasks() {
      uni.navigateTo({ 
        url: `/pages/tasks/index` 
      })
    }
  } 
}