import LoginForm from './auth/LoginForm.vue'
import RegisterForm from './auth/RegisterForm.vue'
import { apiPost } from '../services/http.js'
import { getToken, getUserId, setToken, setUserId, clearToken, clearUserId, getProjectId, setAuthAction, consumeAuthAction } from '../utils/storage.js'
import { getTheme, toggleTheme, THEMES } from '../utils/theme.js'

export default {
  name: 'Layout',
  components: {
    LoginForm,
    RegisterForm
  },
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
      currentProject: null,
      isDarkMode: false,
      showLoginModal: false,
      showRegisterModal: false,
      loginEmail: '',
      loginPassword: '',
      loginShowPassword: false,
      registerUsername: '',
      registerEmail: '',
      registerPassword: ''
    }
  },
  computed: {
    themeAttr() {
      return this.isDarkMode ? 'dark' : 'light'
    }
  },
  created() {
    this.refreshAuth()
    this.initTheme()
    this.applyAuthAction()
  },
  methods: {
    // Initialize theme from storage
    initTheme() {
      const theme = getTheme()
      this.isDarkMode = theme === THEMES.DARK
    },
    // Toggle dark mode
    toggleDarkMode() {
      const nextTheme = toggleTheme()
      this.isDarkMode = nextTheme === THEMES.DARK
    },
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
    applyAuthAction() {
      const action = consumeAuthAction()
      if (action === 'login') {
        this.openLogin()
      } else if (action === 'register') {
        this.openRegister()
      }
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
        setAuthAction('login')
        uni.reLaunch({ url: '/pages/index/index' })
      }
    },
    // Navigate to home page
    goToHome() {
      uni.reLaunch({ url: '/pages/index/index' });
    },
    openLogin() {
      this.showRegisterModal = false
      this.showLoginModal = true
    },
    openRegister() {
      this.showLoginModal = false
      this.showRegisterModal = true
    },
    closeAuth() {
      this.showLoginModal = false
      this.showRegisterModal = false
    },
    toggleLoginShow() {
      this.loginShowPassword = !this.loginShowPassword
    },
    async submitLogin() {
      if (!this.loginEmail || !this.loginPassword) {
        return uni.showToast({
          title: '请填写邮箱和密码',
          icon: 'none'
        })
      }

      try {
        const res = await apiPost('/user/login/', {
          time: new Date().toISOString(),
          token: null,
          email: this.loginEmail,
          password: this.loginPassword,
          token: null
        }, { auth: false })

        if (res.statusCode === 200 && res.data.status === 'success') {
          setToken(res.data.token)
          setUserId(res.data.user_id)
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          this.refreshAuth()
          this.$emit('auth-change', this.authed)
          this.closeAuth()
          this.loginPassword = ''
          this.loginShowPassword = false
        } else {
          uni.showToast({
            title: res.data.message || '登录失败',
            icon: 'none'
          })
        }
      } catch (e) {
        uni.showToast({
          title: '网络或服务器错误',
          icon: 'none'
        })
      }
    },
    async submitRegister() {
      if (!this.registerUsername || !this.registerEmail || !this.registerPassword) {
        return uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
      }

      if (this.registerPassword.length < 6) {
        return uni.showToast({
          title: '请设置至少6位的密码',
          icon: 'none'
        })
      }

      try {
        const res = await apiPost('/user/register/', {
          time: new Date().toISOString(),
          username: this.registerUsername,
          password: this.registerPassword,
          email: this.registerEmail,
          token: null
        }, { auth: false })

        if (res.statusCode === 200 && res.data.status === 'success') {
          uni.showToast({
            title: '注册成功',
            icon: 'success'
          })
          this.showRegisterModal = false
          this.showLoginModal = true
          this.loginEmail = this.registerEmail
          this.registerPassword = ''
        } else {
          uni.showToast({
            title: res.data.message || '注册失败',
            icon: 'none'
          })
        }
      } catch (e) {
        uni.showToast({
          title: '网络或服务器错误',
          icon: 'none'
        })
      }
    }
  }
}
