import { apiPost } from '../services/http.js'
import { getToken, getUserId, clearToken, clearUserId, getProjectId } from '../utils/storage.js'

export default {
  name: 'Layout',
  props: { 
    pageTitle: { 
      type: String, 
      default: '' 
    } 
  },
  data() {
    return {
      isSidebarCollapsed: false,
      authed: false,
      userId: '',
      currentProject: null
    }
  },
  created() {
    this.refreshAuth()
  },
  methods: {
    // Toggle sidebar collapse/expand
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    // Refresh auth state from storage
    refreshAuth() {
      const token = getToken()
      this.authed = !!token
      this.userId = getUserId() || ''
      this.currentProject = getProjectId()
    },
    // Logout current user
    async logout() {
      try {
        await apiPost('/user/logout/', {}, { trailing: false })
      } catch (e) {
        // ignore error and continue cleanup
      } finally {
        clearToken()
        clearUserId()
        this.refreshAuth()
        uni.reLaunch({ url: '/pages/auth/login' })
      }
    },
    // Navigate to home page
    goToHome() {
      uni.reLaunch({ url: '/pages/index/index' });
    }
  }
}