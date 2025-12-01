import { apiGet, apiPost, apiPut, apiDelete } from '../../services/http.js'
import { getCurrentWorkspace, getUserId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'

/**
 * 标签管理：创建、编辑、列表
 */
export default {
  components: { Layout },
  
  data() {
    return { 
      tags: [], 
      workspace_id: '', 
      name: '', 
      color: '', 
      editId: '', 
      loading: false, 
      error: '' 
    }
  },
  
  onShow() { 
    const ws = getCurrentWorkspace()
    this.workspace_id = ws?.id || ''
    this.fetch() 
  },
  
  methods: {
    /**
     * 获取标签列表
     */
    async fetch() { 
      this.loading = true
      this.error = ''
      try {
        const res = await apiGet('/tags/', this.workspace_id ? { workspace_id: this.workspace_id } : undefined)
        if (res.statusCode === 200) {
          this.tags = res.data.data || [] 
        } else {
          this.error = res?.data?.message || '加载失败'
        }
      } catch (err) {
        this.error = '网络错误'
      } finally {
        this.loading = false
      } 
    },
    
    /**
     * 创建或更新标签
     * 如果处于编辑状态则更新标签，否则创建新标签
     */
    async createTag() { 
      if (!this.workspace_id) {
        uni.showToast({ title: '请先选择工作空间', icon: 'none' })
        return
      }
      if (!this.name) {
        uni.showToast({ title: '请输入标签名称', icon: 'none' })
        return
      }

      if (this.editId) { 
        const r = await apiPut(`/tags/${this.editId}/`, { 
          name: this.name, 
          color: this.color 
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
      
      const res = await apiPost('/tags/', { 
        workspace_id: this.workspace_id, 
        user_id: getUserId(),
        name: this.name, 
        color: this.color 
      })
      
      if (res.statusCode === 200) { 
        this.reset()
        this.fetch()
        uni.showToast({ 
          title: '已创建', 
          icon: 'success' 
        }) 
      }
    },
    
    /**
     * 开始编辑标签
     * @param {Object} t - 标签对象
     */
    startEdit(t) { 
      this.editId = t.id
      this.name = t.name
      this.color = t.color 
    },
    
    /**
     * 重置表单
     */
    reset() { 
      const ws = getCurrentWorkspace()
      this.editId = ''
      this.workspace_id = ws?.id || ''
      this.name = ''
      this.color = '' 
    },
    
    /**
     * 删除标签
     * @param {string} id - 标签ID
     */
    async remove(id) { 
      const res = await apiDelete(`/tags/${id}/`, {})
      if (res.statusCode === 200) {
        this.fetch() 
      }
    },
  }
}
