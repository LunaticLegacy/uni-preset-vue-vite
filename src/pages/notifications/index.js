import { apiGet, apiPut, apiDelete } from '../../services/http.js'
import { getUserId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

/**
 * 通知管理页面
 * 显示用户通知列表，支持标记已读
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
      const userId = getUserId()
      if (!userId) {
        this.notifications = []
        return
      }
      const res = await apiGet('/notifications/', { user_id: userId, unread_only: false })
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
     * 删除通知（占位，后端未提供可直接忽略）
     * @param {string} id - 通知ID
     */
    async remove(id) { 
      const res = await apiDelete(`/notifications/${id}/`, {})
      if (res.statusCode === 200) {
        this.fetch() 
      }
    },
  }
}
