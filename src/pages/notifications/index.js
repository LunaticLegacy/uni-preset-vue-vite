import { apiGet, apiPut, apiDelete } from '../../services/http.js'
import Layout from '../../components/Layout.vue'

/**
 * 通知管理页面
 * 显示用户通知列表，支持标记已读和删除操作
 */
export default {
  components: { 
    Layout 
  },
  
  data() {
    return { 
      notifications: [] 
    }
  },
  
  onShow() { 
    this.fetch() 
  },
  
  methods: {
    /**
     * 获取通知列表
     */
    async fetch() { 
      const res = await apiGet('/notifications/')
      if (res.statusCode === 200) {
        this.notifications = res.data.data || [] 
      }
    },
    
    /**
     * 标记通知为已读
     * @param {string} id - 通知ID
     */
    async markRead(id) { 
      const res = await apiPut(`/notifications/${id}/read/`, {})
      if (res.statusCode === 200) {
        this.fetch() 
      }
    },
    
    /**
     * 删除通知
     * @param {string} id - 通知ID
     */
    async remove(id) { 
      const res = await apiDelete(`/notifications/${id}`, {})
      if (res.statusCode === 200) {
        this.fetch() 
      }
    },
  }
}