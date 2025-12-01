import { apiGet, apiPost, apiPut, apiDelete } from '../../services/http.js'
import { getUserId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

/**
 * 评论管理页面
 * 处理特定资源的评论显示、创建、编辑和删除功能
 */
export default {
  components: { 
    Layout 
  },
  
  data() {
    return { 
      resource_type: 'task', 
      resource_id: '', 
      content: '', 
      comments: [], 
      editId: '' 
    }
  },
  
  onShow() { 
    this.fetch() 
  },
  
  methods: {
    /**
     * 获取评论列表
     * 根据资源类型和ID获取相关评论
     */
    async fetch() { 
      if (!this.resource_type || !this.resource_id) { 
        this.comments = []
        return 
      } 
      
      const res = await apiGet('/comments/', { 
        resource_type: this.resource_type, 
        resource_id: this.resource_id 
      })
      
      if (res.statusCode === 200) {
        this.comments = res.data.data || [] 
      }
    },
    
    /**
     * 创建或更新评论
     * 如果处于编辑状态则更新评论，否则创建新评论
     */
    async createComment() { 
      if (!this.resource_type || !this.resource_id || !this.content) { 
        uni.showToast({ 
          title: '请填写信息', 
          icon: 'none' 
        })
        return 
      }
      
      if (this.editId) { 
        const r = await apiPut(`/comments/${this.editId}/`, { 
          content: this.content 
        })
        
        if (r.statusCode === 200) { 
          this.reset()
          this.fetch()
          uni.showToast({ 
            title: '已更新', 
            icon: 'success' 
          }) 
        } 
        return 
      }
      
      const res = await apiPost('/comments/', { 
        resource_type: this.resource_type, 
        resource_id: this.resource_id, 
        user_id: getUserId(),
        content: this.content,
        reply_to_comment_id: null 
      })
      
      if (res.statusCode === 200) { 
        this.reset()
        this.fetch()
        uni.showToast({ 
          title: '已发布', 
          icon: 'success' 
        }) 
      } 
    },
    
    /**
     * 开始编辑评论
     * @param {Object} c - 评论对象
     */
    startEdit(c) { 
      this.editId = c.id
      this.content = c.content 
    },
    
    /**
     * 重置表单
     */
    reset() { 
      this.editId = ''
      this.content = '' 
    },
    
    /**
     * 删除评论
     * @param {string} id - 评论ID
     */
    async remove(id) { 
      const res = await apiDelete(`/comments/${id}/`, {})
      if (res.statusCode === 200) {
        this.fetch() 
      }
    },
  }
}
