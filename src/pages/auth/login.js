import { apiPost } from '../../services/http.js'
import { setToken, setUserId } from '../../utils/storage.js'

/**
 * 用户登录页面
 * 处理用户登录逻辑，包括表单验证和身份验证
 */
export default {
  data() {
    return { 
      email: '', 
      password: '', 
      showPassword: false 
    }
  },
  
  methods: {
    /**
     * 切换密码显示/隐藏状态
     */
    toggleShow() {
      this.showPassword = !this.showPassword
    },
    
    /**
     * 处理用户登录
     * 验证用户名和密码，向服务器发送登录请求
     */
    async login() {
      if (!this.email || !this.password) {
        return uni.showToast({ 
          title: '请填写邮箱和密码', 
          icon: 'none' 
        }) 
      }
      
      try {
        const res = await apiPost('/user/login/', { 
          email: this.email, 
          password: this.password 
        }, { auth: false, trailing: false })
        
        if (res.statusCode === 200 && res.data.status === 'success') {
          setToken(res.data.token)
          setUserId(res.data.user_id)
          uni.showToast({ 
            title: '登录成功', 
            icon: 'success' 
          })
          uni.reLaunch({ 
            url: '/pages/index/index' 
          })
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
    }
  }
}
