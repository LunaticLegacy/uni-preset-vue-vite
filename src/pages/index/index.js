import Layout from '@/components/Layout.vue';
import { getToken, getCurrentWorkspace, getProjectId } from '@/utils/storage.js';

export default {
  components: {
    Layout
  },
  data() {
    return {
      title: 'Hello',
      isLoggedIn: false,
      currentWorkspace: null,
      currentProject: null
    }
  },
  onLoad() {
    this.checkLoginStatus();
  },
  onShow() {
    // 页面显示时也更新状态，确保信息是最新的
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      const token = getToken();
      this.isLoggedIn = !!token;
      
      if (this.isLoggedIn) {
        this.currentWorkspace = getCurrentWorkspace();
        this.currentProject = getProjectId();
      }
    },
    goToRegister() {
      uni.navigateTo({
        url: '/pages/auth/register'
      })
    },
    logout() {
      uni.clearStorageSync();
      this.checkLoginStatus();
      uni.reLaunch({
        url: '/pages/index/index'
      });
    },
    goToWorkspaces() {
      uni.navigateTo({
        url: '/pages/workspaces/index'
      })
    },
    goToProjects() {
      uni.navigateTo({
        url: '/pages/projects/index'
      })
    },
    goToTasks() {
      uni.navigateTo({
        url: '/pages/tasks/index'
      })
    },
    goToProfile() {
      uni.navigateTo({
        url: '/pages/user/profile'
      })
    }
  },
}