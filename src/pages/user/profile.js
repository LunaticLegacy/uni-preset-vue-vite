import { apiGet, apiPut, apiPost } from '../../services/http.js'
import { getUserId, clearToken } from '../../utils/storage.js'

/**
 * 用户资料页面
 * 管理用户个人信息，支持查看和编辑个人资料
 */
export default {
  data() {
    return { 
      full_name: '', 
      display_name: '', 
      bio: '' 
    }
  },
  
  /**
   * 页面加载时获取用户资料
   */
  async onLoad() {
    const id = getUserId()
    if (!id) { 
      return 
    }
    
    const res = await apiGet(`/user/profile/${id}/`)
    if (res.statusCode === 200 && res.data.status === 'success') {
      const d = res.data.data || {}
      this.full_name = d.full_name || ''
      this.display_name = d.display_name || ''
      this.bio = d.bio || ''
    }
  },
  
  methods: {
    /**
     * 保存用户资料
     */
    async save() {
      const id = getUserId()
      if (!id) { 
        return 
      }
      
      const res = await apiPut(`/user/profile/${id}/`, { 
        full_name: this.full_name, 
        display_name: this.display_name, 
        bio: this.bio 
      })
      
      if (res.statusCode === 200 && res.data.status === 'success') { 
        uni.showToast({ 
          title: '已保存', 
          icon: 'success' 
        }) 
      }
    },
    
    /**
     * 用户登出
     */
    async logout() {
      await apiPost('/user/logout/', {})
      clearToken()
      uni.reLaunch({ 
        url: '/pages/auth/login' 
      })
    }
  }
}