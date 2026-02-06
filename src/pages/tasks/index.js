import { apiGet, apiPost } from '../../services/http.js'
import { getCurrentWorkspace, getProjectId, getUserId, getToken } from '../../utils/storage.js'
import { formatTimeFromMinutes } from '../../utils/time.js'
import Layout from '../../components/Layout.vue'

/**
 * 任务列表页：按工作空间列出任务，可创建和查看详情
 */
export default {
  components: { Layout },

  data() {
    return {
      tasks: [],
      project_id: '',
      title: '',
      description: '',
      priority: '',
      priorities: [
        { label: 'low', value: 'low' },
        { label: 'medium', value: 'medium' },
        { label: 'high', value: 'high' }
      ],
      loading: false,
      error: '',
      workspace: null,
      currentProject: null,
      expandedTaskIds: new Set()
    }
  },
  
  onShow() {
    this.workspace = getCurrentWorkspace()
    this.currentProject = getProjectId()
    this.fetch()
  },
  
  methods: {
    /**
     * 获取任务列表
     * API现在返回任务树结构，需要转换为平铺的任务列表
     */
    async fetch() {
      this.loading = true
      this.error = ''
      if (!this.workspace || !this.workspace.id) {
        this.loading = false
        this.error = '请先选择工作空间'
        return
      }
      try {
        const res = await apiPost('/tasks/list', {
           time: new Date().toISOString(),
           token: getToken(),
           workspace_id: this.workspace.id,
           project_id: getProjectId().id,
           subtasks: null
        })
        if (res.statusCode === 200) {
          const taskTreeList = res.data.data || []
          // 将任务树结构转换为平铺的任务列表
          // TaskTree 结构: { task: Task, subtasks: List[TaskTree] }
          this.tasks = taskTreeList.map(tree => ({
            ...tree.task,
            subtasks: this.flattenSubtasks(tree.subtasks)
          }))
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
     * 将递归的子任务树转换为平铺的列表
     * @param {Array} subtaskTrees - TaskTree 数组
     * @returns {Array} 平铺的任务对象数组
     */
    flattenSubtasks(subtaskTrees) {
      if (!subtaskTrees || !Array.isArray(subtaskTrees)) {
        return []
      }

      return subtaskTrees.map(tree => ({
        ...tree.task,
        subtasks: this.flattenSubtasks(tree.subtasks)
      }))
    },
    
    /**
     * 处理优先级选择
     * @param {Object} e - 事件对象
     */
    onPriority(e) { 
      const idx = e.detail.value
      this.priority = this.priorities[idx].value 
    },
    
    /**
     * 创建新任务
     */
    async createTask() { 
      if (!this.workspace || !this.workspace.id) {
        uni.showToast({ title: '请先选择工作空间', icon: 'none' })
        return
      }
      if (!this.project_id || !this.title) { 
        uni.showToast({ 
          title: '请填写必要信息', 
          icon: 'none' 
        })
        return 
      }
      
      const res = await apiPost('/tasks/create', { 
        project_id: this.project_id, 
        workspace_id: this.workspace.id,
        creator_id: getUserId(), 
        title: this.title, 
        description: this.description, 
        assignee_id: getUserId(),
        priority: this.priority || 'medium',
        estimated_minutes: 0,
        due_at: null
      })
      
      if (res.statusCode === 200) { 
        this.project_id = ''
        this.title = ''
        this.description = ''
        this.priority = ''
        this.fetch()
        uni.showToast({ 
          title: '已创建', 
          icon: 'success' 
        }) 
      }
    },
    
    /**
     * 生成展开状态的唯一键
     * @param {string} parentId - 父任务ID，为空时表示顶级任务
     * @param {string} taskId - 当前任务ID
     * @returns {string}
     */
    getExpandKey(parentId, taskId) {
      return parentId ? `${parentId}:${taskId}` : taskId
    },

    /**
     * 切换任务的展开/收回状态
     * @param {string} parentId - 父任务ID，为空时表示顶级任务
     * @param {string} taskId - 当前任务ID
     */
    toggleTaskExpand(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      if (this.expandedTaskIds.has(key)) {
        this.expandedTaskIds.delete(key)
      } else {
        this.expandedTaskIds.add(key)
      }
      this.$forceUpdate()
    },

    /**
     * 检查任务是否已展开
     * @param {string} parentId - 父任务ID，为空时表示顶级任务
     * @param {string} taskId - 当前任务ID
     * @returns {boolean}
     */
    isTaskExpanded(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      return this.expandedTaskIds.has(key)
    },
    isTaskCompleted(task) {
      return task?.status === 'done'
    },
    hasIncompleteSubtasks(task) {
      if (!task?.subtasks || !Array.isArray(task.subtasks) || task.subtasks.length === 0) {
        return false
      }
      return task.subtasks.some(st => st?.status !== 'done' || this.hasIncompleteSubtasks(st))
    },

    async confirmSubtaskComplete(task) {
      const taskId = task?.id || task?.task_id
      if (!taskId) {
        uni.showToast({ title: '任务ID不存在', icon: 'none' })
        return
      }
      if (task.status === 'done') {
        uni.showToast({ title: '该任务已完成', icon: 'none' })
        return
      }
      if (this.hasIncompleteSubtasks(task)) {
        uni.showToast({ title: '请先完成子任务', icon: 'none' })
        return
      }

      const prevStatus = task.status
      const prevCompletedAt = task.completed_at
      task.status = 'done'
      const completedAt = new Date().toISOString()
      task.completed_at = completedAt

      try {
        const res = await apiPost(`/tasks/${taskId}/update/`, {
          time: new Date().toISOString(),
          token: getToken(),
          status: 'done',
          completed_at: completedAt
        })

        if (res.statusCode === 200) {
          uni.showToast({ title: '已确认完成', icon: 'success' })
        } else {
          
          task.status = prevStatus
          task.completed_at = prevCompletedAt
          uni.showToast({ title: res?.data?.message || '确认完成失败', icon: 'none' })
        }
      } catch (err) {
        task.status = prevStatus
        task.completed_at = prevCompletedAt
        uni.showToast({ title: '网络错误', icon: 'none' })
      }
    },

    formatTimeFromMinutes,

  }
}
