import { apiGet, apiPut } from '../../services/http.js'
import { getProjectId } from '../../utils/storage.js'
import Layout from '../../components/Layout.vue'
import RecursiveSubtasks from '../../components/RecursiveSubtasks.vue'

/**
 * 任务详情：查看、编辑任务的所有信息，包括子任务
 */
export default {
  components: { Layout, RecursiveSubtasks },

  data() {
    return {
      id: '',
      task: null,
      currentProject: null,
      statuses: ['backlog', 'in_progress', 'done'],
      priorities: [
        { label: 'low', value: 'low' },
        { label: 'medium', value: 'medium' },
        { label: 'high', value: 'high' }
      ]
    }
  },

  /**
   * 页面加载时获取任务详情
   * @param {Object} q - 页面参数
   */
  async onLoad(q) {
    this.id = q.id
    this.currentProject = getProjectId()
    const res = await apiGet(`/tasks/${this.id}/`)
    if (res.statusCode === 200) {
      this.task = res.data.data
      // 初始化日期格式
      if (this.task.start_date) {
        this.task.start_date = this.formatDateForInput(this.task.start_date)
      }
      if (this.task.end_date) {
        this.task.end_date = this.formatDateForInput(this.task.end_date)
      }
    }
  },

  methods: {
    /**
     * 状态变更处理
     */
    onStatusChange(e) {
      const idx = e.detail.value
      this.task.status = this.statuses[idx]
    },

    /**
     * 优先级变更处理
     */
    onPriorityChange(e) {
      const idx = e.detail.value
      this.task.priority = this.priorities[idx].value
    },

    /**
     * 格式化日期时间为显示格式
     */
    formatDateTime(dateStr) {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (e) {
        return dateStr
      }
    },

    /**
     * 格式化日期为输入框格式 (YYYY-MM-DD)
     */
    formatDateForInput(dateStr) {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (e) {
        return dateStr
      }
    },

    /**
     * 保存任务信息
     */
    async save() {
      if (!this.task.title) {
        uni.showToast({
          title: '标题不能为空',
          icon: 'none'
        })
        return
      }

      const res = await apiPut(`/tasks/${this.id}/`, {
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        priority: this.task.priority,
        assignee_id: this.task.assignee_id,
        start_date: this.task.start_date,
        end_date: this.task.end_date,
        estimated_minutes: this.task.estimated_minutes
      })

      if (res.statusCode === 200) {
        uni.showToast({
          title: '已保存',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: res?.data?.message || '保存失败',
          icon: 'none'
        })
      }
    },

    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack()
    }
  }
}
