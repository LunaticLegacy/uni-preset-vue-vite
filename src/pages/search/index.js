import { apiGet } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 搜索页面
 * 支持按任务或项目进行搜索
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
      projectResults: [] 
    }
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
      
      if (this.tab === 'tasks') { 
        const r = await apiGet('/search/tasks/', { 
          query: this.query 
        })
        if (r.statusCode === 200) {
          this.taskResults = r.data.data || [] 
        }
      } else { 
        const r = await apiGet('/search/projects/', { 
          query: this.query 
        })
        if (r.statusCode === 200) {
          this.projectResults = r.data.data || [] 
        }
      } 
    }
  }
}