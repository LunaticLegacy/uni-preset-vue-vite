import { apiPost } from '../../services/http.js'

/**
 * 用户注册页面
 * 处理新用户注册逻辑，包括表单验证和账户创建
 */
export default {
  data() { 
    return { 
      username: '', 
      email: '', 
      password: '' 
    } 
  },
  
  methods: {
    /**
     * 处理用户注册
     * 验证表单数据并向服务器发送注册请求
     */
    async register() {
      if (!this.username || !this.email || !this.password) { 
        return uni.showToast({ 
          title: '请填写完整信息', 
          icon: 'none' 
        }) 
      }
      
      if (this.password.length < 6) { 
        return uni.showToast({ 
          title: '请设置至少6位的密码', 
          icon: 'none' 
        }) 
      }
      
      try {
        const res = await apiPost('/user/register/', { 
          username: this.username, 
          password: this.password,
          email: this.email,
          token: null
        }, { auth: false })
        
        if (res.statusCode === 200 && res.data.status === 'success') {
          uni.showToast({ 
            title: '注册成功', 
            icon: 'success' 
          })
          uni.navigateTo({ 
            url: '/pages/auth/login' 
          })
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
