import { API_BASE_URL } from '../../config.js'
import Layout from '../../components/Layout.vue'
import RecursiveSubtasks from '../../components/RecursiveSubtasks.vue'
import TaskItem from '../../components/TaskItem.vue' // 导入TaskItem组件
import { getProjectId, getToken, getUserId, getCurrentWorkspace } from '../../utils/storage.js'
import { formatTimeFromMinutes } from '../../utils/time.js'

const MARKERS = {
  THINK_START: '<<<THINKING>>>',
  THINK_END: '<<<THINK_END>>>',
  JSON_BEGIN: '<<<JSON_BEGIN>>>',
  JSON_END: '<<<JSON_END>>>'
}

const MAX_MARKER_LEN = Math.max(
  MARKERS.THINK_START.length,
  MARKERS.THINK_END.length,
  MARKERS.JSON_BEGIN.length,
  MARKERS.JSON_END.length
)

export default {
  components: { Layout, RecursiveSubtasks, TaskItem }, // 添加TaskItem组件

  data() {
    return {
      id: '',
      projectName: '',
      projectDescription: '',

      tasks: [],
      tasksLoading: false,
      tasksError: '',
      expandedTaskIds: new Set(),

      userInput: '',
      scrollIntoId: '',
      textareaHeight: 45,

      editingTask: null,
      editingTaskPath: null,

      messages: [
        {
          role: 'assistant',
          content: '请输入您需要分解的任务……',
          thinking: '',
          thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
          jsonData: null
        }
      ],

      userId: getUserId()
      ,
      llmLoading: false
    }
  },

  computed: {
    isSidebarCollapsed() {
      return this.$parent?.isSidebarCollapsed || false
    }
  },

  onLoad(q) {
    this.id = q?.id || ''
    const workspace = getCurrentWorkspace()
    const storedProject = getProjectId()

    console.log('[detail] onLoad id=', this.id)
    console.log('[detail] workspace=', workspace)
    console.log('[detail] storedProject=', storedProject)

    this.fetchProjectInfo()
      .then(() => this.fetchLLMContext())
      .then(() => this.fetchTasks())
      .then(() => this.$nextTick(() => this.scrollToBottom()))
      .catch((e) => console.error('[detail] init failed:', e))
  },

  methods: {
    // 更新展开任务ID集合
    updateExpandedTaskIds(newExpandedTaskIds) {
      this.expandedTaskIds = newExpandedTaskIds
    },

    // 转换AI生成的任务数据为显示格式
    transformTaskForDisplay(task, options = {}) {
      if (!task) return null
      // 根据原始时间单位转换为分钟
      let estimatedMinutes = 0
      if (typeof task.estimated_minutes === 'number') {
        estimatedMinutes = task.estimated_minutes
      } else if (task.estimated_time && task.estimated_time_unit) {
        switch (task.estimated_time_unit) {
          case 'minutes':
            estimatedMinutes = task.estimated_time
            break
          case 'hours':
            estimatedMinutes = task.estimated_time * 60
            break
          case 'days':
            estimatedMinutes = task.estimated_time * 60 * 24
            break
          case 'weeks':
            estimatedMinutes = task.estimated_time * 60 * 24 * 7
            break
          default:
            estimatedMinutes = task.estimated_time // 默认按分钟处理
        }
      }

      const taskId = task.task_id ?? task.id ?? task.title ?? Math.random().toString(36).substr(2, 9)
      const nested = options.subtasks !== undefined ? options.subtasks : task.subtasks

      return {
        task_id: taskId,
        id: taskId,
        title: task.title,
        description: task.description,
        status: task.status || task.state || 'backlog',
        priority: task.priority || 'medium',
        estimated_minutes: estimatedMinutes,
        subtasks: this.transformSubtasksForDisplay(nested || [])
      }
    },

    transformSubtasksForDisplay(subtasks) {
      if (!subtasks || !Array.isArray(subtasks)) return []
      return subtasks
        .map((st) => {
          const nodeTask = st && st.task ? st.task : st
          if (!nodeTask) return null
          const nodeSubtasks = st && st.subtasks ? st.subtasks : nodeTask.subtasks
          return this.transformTaskForDisplay(nodeTask, { subtasks: nodeSubtasks })
        })
        .filter(Boolean)
    },

    // 添加时间格式化方法
    formatTimeFromMinutes,

    // =========================
    // 项目详情：/projects/{id}/get/
    // =========================
    fetchProjectInfo() {
      return new Promise((resolve) => {
        const projectId = (getProjectId() && getProjectId().id) ? getProjectId().id : this.id
        if (!projectId) {
          this.projectName = '未选择项目'
          this.projectDescription = ''
          resolve()
          return
        }

        const url = `${API_BASE_URL.replace(/\/$/, '')}/projects/${projectId}/get/`
        uni.request({
          url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
          },
          data: {}, // 后端无 body 参数，这里发空对象即可
          success: (res) => {
            try {
              console.log('[detail] project get:', res.statusCode, res.data)
              if (res.statusCode === 200 && res.data?.status === 'success' && res.data?.data) {
                const d = res.data.data
                this.projectName =
                  d.name || d.title || d.project_name || d.projectName || `项目 ${projectId}`
                this.projectDescription =
                  d.description || d.desc || d.project_description || d.projectDescription || ''
              } else if (res.statusCode === 404) {
                this.projectName = '项目不存在'
                this.projectDescription = ''
              } else {
                this.projectName = `项目 ${projectId}`
                this.projectDescription = ''
              }
            } catch (e) {
              console.error('[detail] parse project error:', e)
              this.projectName = `项目 ${projectId}`
              this.projectDescription = ''
            }
            resolve()
          },
          fail: (err) => {
            console.error('[detail] project get fail:', err)
            const projectId2 = projectId || this.id || ''
            this.projectName = projectId2 ? `项目 ${projectId2}` : '项目'
            this.projectDescription = ''
            resolve()
          }
        })
      })
    },

    // =========================
    // LLM 上下文：获取历史对话内容
    // =========================
    fetchLLMContext() {
      return new Promise((resolve) => {
        this.llmLoading = true
        const projectId = (getProjectId() && getProjectId().id) ? getProjectId().id : this.id
        const workspace = getCurrentWorkspace()

        if (!projectId || !workspace?.id) {
          console.log('[detail] fetchLLMContext: missing projectId or workspace')
          this.llmLoading = false
          resolve()
          return
        }

        const url = `${API_BASE_URL.replace(/\/$/, '')}/projects/${projectId}/get_context`
        uni.request({
          url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
          },
          data: {
            time: new Date().toISOString(),
            token: getToken(),
            workspace_id: workspace.id,
            project_id: projectId
          },
          success: (res) => {
            try {
              console.log('[detail] LLM context:', res.statusCode, res.data)
              if (res.statusCode === 200 && res.data?.contexts && Array.isArray(res.data.contexts)) {
                const contexts = res.data.contexts
                if (contexts.length > 0) {
                  // 清除默认的初始消息，用获取的上下文替换
                  this.messages = contexts.map((ctx) => {
                    const fullContent = ctx.content || ''
                    // 解析特殊标记（THINKING、JSON）
                    const parsed = this.parseContextMarkers(fullContent)

                    return {
                      role: ctx.role,
                      content: parsed.content,
                      thinking: parsed.thinking,
                      thinkingMeta: ctx.role === 'assistant' ? { open: false, active: false, startMs: null, endMs: null, durationSec: 0 } : null,
                      jsonData: parsed.jsonData
                    }
                  })

                  // 添加默认的助手欢迎消息（如果最后一条不是助手消息）
                  if (this.messages.length === 0 || this.messages[this.messages.length - 1].role !== 'assistant') {
                    this.messages.push({
                      role: 'assistant',
                      content: '请输入您需要分解的任务……',
                      thinking: '',
                      thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
                      jsonData: null
                    })
                  }
                }
              }
            } catch (e) {
              console.error('[detail] parse LLM context error:', e)
            }
              this.llmLoading = false
              resolve()
          },
          fail: (err) => {
            console.error('[detail] fetch LLM context fail:', err)
              this.llmLoading = false
              resolve()
          }
        })
      })
    },

    // =========================
    // 解析上下文中的特殊标记
    // =========================
    parseContextMarkers(fullText) {
      if (!fullText) return { content: '', thinking: '', jsonData: null }

      let content = ''
      let thinking = ''
      let jsonText = ''

      const text = String(fullText)
      let i = 0

      while (i < text.length) {
        // 检查 THINKING 标记
        if (text.substr(i, MARKERS.THINK_START.length) === MARKERS.THINK_START) {
          i += MARKERS.THINK_START.length
          const endIdx = text.indexOf(MARKERS.THINK_END, i)
          if (endIdx !== -1) {
            thinking += text.slice(i, endIdx)
            i = endIdx + MARKERS.THINK_END.length
            continue
          } else {
            thinking += text.slice(i)
            break
          }
        }

        // 检查 JSON 标记
        if (text.substr(i, MARKERS.JSON_BEGIN.length) === MARKERS.JSON_BEGIN) {
          i += MARKERS.JSON_BEGIN.length
          const endIdx = text.indexOf(MARKERS.JSON_END, i)
          if (endIdx !== -1) {
            jsonText += text.slice(i, endIdx)
            i = endIdx + MARKERS.JSON_END.length
            continue
          } else {
            jsonText += text.slice(i)
            break
          }
        }

        // 普通内容
        content += text[i]
        i++
      }

      // 尝试解析 JSON 数据
      let jsonData = null
      if (jsonText && jsonText.trim()) {
        const cleaned = this.cleanJsonStream(jsonText)
        const parsed = this.tryParseJson(cleaned)
        if (parsed) {
          jsonData = parsed
        }
      }

      return {
        content: content.trim(),
        thinking: thinking.trim(),
        jsonData
      }
    },

    // =========================
    // 任务列表（原逻辑保留）
    // =========================
    fetchTasks() {
      return new Promise((resolve) => {
        this.tasksLoading = true
        this.tasksError = ''

        const workspace = getCurrentWorkspace()
        const projectId = (getProjectId() && getProjectId().id) ? getProjectId().id : this.id

        if (!workspace || !workspace.id || !projectId) {
          this.tasksLoading = false
          this.tasksError = '缺少必要信息'
          resolve()
          return
        }

        const url = `${API_BASE_URL.replace(/\/$/, '')}/tasks/list/`
        uni.request({
          url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
          },
          data: {
            time: new Date().toISOString(),
            token: getToken(),
            workspace_id: workspace.id,
            project_id: projectId,
            subtasks: null
          },
          success: (res) => {
            try {
              console.log('[detail] tasks list:', res.statusCode, res.data)
              if (res.statusCode === 200 && res.data?.status === 'success') {
                const taskTreeList = res.data.data || []
                if (Array.isArray(taskTreeList)) {
                  this.tasks = taskTreeList
                    .map((tree) => {
                      if (!tree) return null
                      const nodeTask = tree.task || tree
                      const nodeSubtasks = tree.subtasks || nodeTask.subtasks
                      return this.transformTaskForDisplay(nodeTask, { subtasks: nodeSubtasks })
                    })
                    .filter(Boolean)
                } else {
                  this.tasksError = '任务数据格式错误'
                }
              } else {
                this.tasksError = res.data?.message || `服务器返回状态: ${res.statusCode}`
              }
            } catch (e) {
              console.error('[detail] parse tasks error:', e)
              this.tasksError = '解析任务数据失败'
            }

            this.tasksLoading = false
            resolve()
          },
          fail: (err) => {
            console.error('[detail] tasks list fail:', err)
            const errMsg = err?.errMsg || '未知网络错误'
            this.tasksError = `网络错误: ${errMsg}`
            this.tasksLoading = false
            resolve()
          }
        })
      })
    },

    flattenSubtasks(subtaskTrees) {
      if (!subtaskTrees || !Array.isArray(subtaskTrees)) return []
      return subtaskTrees
        .map((tree) => {
          if (!tree || !tree.task) return null
          return { ...tree.task, subtasks: this.flattenSubtasks(tree.subtasks) }
        })
        .filter(Boolean)
    },

    getExpandKey(parentId, taskId) {
      return parentId ? `${parentId}:${taskId}` : taskId
    },
    toggleTaskExpand(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      if (this.expandedTaskIds.has(key)) this.expandedTaskIds.delete(key)
      else this.expandedTaskIds.add(key)
      this.$forceUpdate()
    },
    isTaskExpanded(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      return this.expandedTaskIds.has(key)
    },

    // =========================
    // 聊天：流式 + THINK/JSON 标记
    // =========================
    toggleThinking(index) {
      const m = this.messages[index]
      if (m && m.thinkingMeta) m.thinkingMeta.open = !m.thinkingMeta.open
    },

    sendMessage() {
      // 发送信息
      const text = String(this.userInput || '').trim()
      if (!text) return

      const workspace = getCurrentWorkspace()
      const projectId = (getProjectId() && getProjectId().id) ? getProjectId().id : this.id

      if (!workspace?.id || !projectId) {
        uni.showToast({ title: '缺少 workspace 或 project_id', icon: 'none' })
        return
      }

      // push user message
      this.messages.push({
        role: 'user',
        content: text,
        thinking: '',
        thinkingMeta: null,
        jsonData: null
      })
      this.userInput = ''
      this.textareaHeight = 45
      this.$nextTick(() => this.scrollToBottom())

      // assistant placeholder
      const aiIndex = this.messages.length
      this.messages.push({
        role: 'assistant',
        content: '',
        thinking: '',
        thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
        jsonData: null
      })
      this.$nextTick(() => this.scrollToBottom())

      const token = getToken()
      const streamUrl = `${API_BASE_URL.replace(/\/$/, '')}/ai/chat-stream/`
      const self = this

      // stream buffers
      let mode = 'normal' // normal | thinking | json
      let pending = ''

      let visibleText = ''
      let thinkingText = ''
      let jsonText = ''

      const decoder = (typeof TextDecoder !== 'undefined') ? new TextDecoder('utf-8') : null
      const decodeChunk = (data) => {
        if (!data) return ''
        if (typeof data === 'string') return data
        try {
          if (data instanceof ArrayBuffer) {
            if (decoder) return decoder.decode(new Uint8Array(data), { stream: true })
            return String.fromCharCode.apply(null, Array.from(new Uint8Array(data)))
          }
          if (data?.buffer instanceof ArrayBuffer) {
            const u8 = new Uint8Array(data.buffer)
            if (decoder) return decoder.decode(u8, { stream: true })
            return String.fromCharCode.apply(null, Array.from(u8))
          }
        } catch (e) {}
        return String(data)
      }

      const appendSafe = (buf, writeFn) => {
        if (!buf) return ''
        if (buf.length < MAX_MARKER_LEN) return buf // 全部留给 pending
        const cut = buf.length - (MAX_MARKER_LEN - 1)
        writeFn(buf.slice(0, cut))
        return buf.slice(cut)
      }

      const processStreamText = (chunkText) => {
        if (!chunkText) return
        let buf = pending + chunkText
        pending = ''

        const writeVisible = (s) => { visibleText += s }
        const writeThinking = (s) => { thinkingText += s }
        const writeJson = (s) => { jsonText += s }

        while (buf.length) {
          if (mode === 'thinking') {
            const endIdx = buf.indexOf(MARKERS.THINK_END)
            if (endIdx === -1) {
              pending = appendSafe(buf, writeThinking)
              break
            }
            writeThinking(buf.slice(0, endIdx))
            buf = buf.slice(endIdx + MARKERS.THINK_END.length)
            mode = 'normal'
            continue
          }

          if (mode === 'json') {
            const endIdx = buf.indexOf(MARKERS.JSON_END)
            if (endIdx === -1) {
              pending = appendSafe(buf, writeJson)
              break
            }
            writeJson(buf.slice(0, endIdx))
            buf = buf.slice(endIdx + MARKERS.JSON_END.length)
            mode = 'normal'
            continue
          }

          // normal
          const thinkIdx = buf.indexOf(MARKERS.THINK_START)
          const jsonIdx = buf.indexOf(MARKERS.JSON_BEGIN)

          let nextIdx = -1
          let nextType = ''

          if (thinkIdx !== -1 && jsonIdx !== -1) {
            nextIdx = Math.min(thinkIdx, jsonIdx)
            nextType = (nextIdx === thinkIdx) ? 'thinking' : 'json'
          } else if (thinkIdx !== -1) {
            nextIdx = thinkIdx
            nextType = 'thinking'
          } else if (jsonIdx !== -1) {
            nextIdx = jsonIdx
            nextType = 'json'
          } else {
            pending = appendSafe(buf, writeVisible)
            break
          }

          // marker 前面的内容确定是可见文本
          writeVisible(buf.slice(0, nextIdx))
          if (nextType === 'thinking') {
            buf = buf.slice(nextIdx + MARKERS.THINK_START.length)
            mode = 'thinking'
          } else {
            buf = buf.slice(nextIdx + MARKERS.JSON_BEGIN.length)
            mode = 'json'
          }
        }
      }

      // 处理剩余缓冲区内容的函数
      const processRemainingBuffer = () => {
        // 处理剩余的pending内容
        if (pending) {
          if (mode === 'thinking') {
            thinkingText += pending
          } else if (mode === 'json') {
            jsonText += pending
          } else {
            visibleText += pending
          }
          pending = ''
        }
        
        // 重置模式
        mode = 'normal'
      }

      // ui flush throttle
      let lastUiMs = 0
      const flushUi = (force = false) => {
        const now = Date.now()
        if (!force && now - lastUiMs < 40) return
        lastUiMs = now

        self.messages[aiIndex].content = visibleText
        self.messages[aiIndex].thinking = thinkingText

        // JSON：按规则实时展示（字段齐了就显示）
        if (jsonText && jsonText.trim()) {
          const cleaned = self.cleanJsonStream(jsonText)
          const snapshot = self.makeJsonSnapshot(cleaned)
          const partialPlan = self.parsePartialTaskPlan(snapshot)
          if (partialPlan) {
            self.messages[aiIndex].jsonData = self.mergeLocalFieldsIntoTaskPlan(
              partialPlan,
              self.messages[aiIndex].jsonData
            )
          }
        }

        self.$nextTick(() => self.scrollToBottom())
      }

      // thinking timer meta
      const meta = self.messages[aiIndex].thinkingMeta
      if (meta) {
        meta.active = true
        meta.startMs = Date.now()
      }

      const req = uni.request({
        url: streamUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        dataType: 'text',
        responseType: 'arraybuffer',
        enableChunked: true,
        timeout: 10 * 60 * 1000,  // 10 minutes for timeout, the default timeout was too short for decomposing.
        data: {
          time: new Date().toISOString(),
          token: getToken(),
          message: text,
          user_id: getUserId(),
          workspace_id: workspace.id,
          project_id: projectId,
          system_prompt: null
        },
        success: (res) => {
          if (res.statusCode === 200) {
            // 没走 onChunkReceived 的端：一次性处理整包
            if (!hasChunks) {
              const all = decodeChunk(res.data)
              if (all) processStreamText(all)
            }

            // ✅ 不管有没有 chunks，都要把 pending 吐出来
            processRemainingBuffer()
            flushUi(true)
          } else {
            self.messages[aiIndex].content = '抱歉，请求失败，请稍后再试。'
          }

          // end timer（原样保留）
          if (meta) {
            meta.active = false
            meta.endMs = Date.now()
            meta.durationSec = Math.max(0, Math.round((meta.endMs - (meta.startMs || meta.endMs)) / 1000))
          }

          // ✅ 最终 JSON 解析也别再绑 !hasChunks（否则 chunk 模式永远不做最终 parse）
          if (jsonText && jsonText.trim()) {
            const cleaned = self.cleanJsonStream(jsonText)
            const parsed = self.tryParseJson(cleaned)
            if (parsed) {
              // 将AI返回的JSON结构转换为前端显示结构
              const transformedTasks = Array.isArray(parsed.tasks)
                ? parsed.tasks.map(t => self.transformTaskForDisplay(t)).filter(Boolean)
                : []
              
              self.messages[aiIndex].jsonData = {
                ...parsed,
                tasks: self.mergeLocalFieldsIntoTaskPlan(
                  { tasks: transformedTasks },
                  self.messages[aiIndex].jsonData || { tasks: [] }
                ).tasks
              }
            }
          }

          self.fetchTasks()
        },

        fail: (err) => {
          console.error('[detail] chat fail:', err)
          self.messages[aiIndex].content = '抱歉，网络连接出错，请稍后再试。'
          if (meta) {
            meta.active = false
            meta.endMs = Date.now()
            meta.durationSec = Math.max(0, Math.round((meta.endMs - (meta.startMs || meta.endMs)) / 1000))
          }
        }
      })

      // Track if we've received chunks to prevent double processing
      let hasChunks = false;

      if (req && typeof req.onChunkReceived === 'function') {
        req.onChunkReceived((e) => {
          hasChunks = true;
          const chunk = decodeChunk(e?.data)
          if (!chunk) return
          processStreamText(chunk)
          flushUi(false)
        })
      }
      
      // 确保在请求结束后处理任何剩余的缓冲区内容
      setTimeout(() => {
        if (!hasChunks) {
          processRemainingBuffer()
          flushUi(true)
        }
      }, 100)
    },

    scrollToBottom() {
      this.scrollIntoId = `msg-${this.messages.length - 1}`
    },

    onInputChange() {
      if (this.userInput.length > 20000) this.userInput = this.userInput.slice(0, 20000)

      // 兼容：H5 用 scrollHeight；其他端近似估计
      this.$nextTick(() => {
        try {
          if (typeof document !== 'undefined' && document.querySelector) {
            const el = document.querySelector('.composer-input')
            if (el) {
              const h = el.scrollHeight || 45
              this.textareaHeight = Math.min(Math.max(h, 45), 200)
              return
            }
          }
        } catch (e) {}

        // fallback：按行数估算
        const lines = String(this.userInput || '').split('\n').length
        const h2 = 24 * Math.min(lines, 8) + 21
        this.textareaHeight = Math.min(Math.max(h2, 45), 200)
      })
    },

    // =========================
    // markdown-lite（修复旧版 langLine 未定义问题）
    // =========================
    formatMessage(message) {
      if (!message) return ''
      return this.renderMarkdownLite(String(message))
    },

    renderMarkdownLite(src) {
      const s = String(src || '')
      if (!s) return ''

      const toTextHtml = (t) => this.escapeHtml(t).replace(/\n/g, '<br>')
      const toCodeHtml = (code, lang) => {
        const safeLang = (lang || '').trim()
        const langBadge = safeLang ? `<div class="code-lang">${this.escapeHtml(safeLang)}</div>` : ''
        return `<div class="code-wrap">${langBadge}<pre class="code-block"><code>${this.escapeHtml(code)}</code></pre></div>`
      }

      let out = ''
      let i = 0
      let inCode = false
      let lang = ''

      while (i < s.length) {
        const fence = s.indexOf('```', i)
        if (fence === -1) {
          const tail = s.slice(i)
          out += inCode ? toCodeHtml(tail, lang) : toTextHtml(tail)
          break
        }

        if (!inCode) {
          out += toTextHtml(s.slice(i, fence))
          // read lang line
          let j = fence + 3
          let langLine = ''
          while (j < s.length && s[j] !== '\n' && s[j] !== '\r') {
            langLine += s[j]
            j++
          }
          if (j < s.length && s[j] === '\r') j++
          if (j < s.length && s[j] === '\n') j++
          lang = (langLine || '').trim()
          inCode = true
          i = j
        } else {
          out += toCodeHtml(s.slice(i, fence), lang)
          inCode = false
          lang = ''
          i = fence + 3
        }
      }

      return out
    },

    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },

    // =========================
    // 任务编辑（原逻辑保留）
    // =========================
    editTask(task, taskPath) {
      this.editingTask = JSON.parse(JSON.stringify(task))
      this.editingTaskPath = taskPath
    },
    cancelEdit() {
      this.editingTask = null
      this.editingTaskPath = null
    },
    submitTaskEdit() {
      if (!this.editingTask || !this.editingTask.task_id) {
        uni.showToast({ title: '任务ID不存在', icon: 'none' })
        return
      }

      const payload = {
        time: new Date().toISOString(),
        token: getToken(),
        title: this.editingTask.title,
        description: this.editingTask.description,
        priority: this.editingTask.priority,
        status: this.editingTask.status,
        estimated_minutes: this.editingTask.estimated_minutes
      }

      const url = `${API_BASE_URL.replace(/\/$/, '')}/tasks/${this.editingTask.task_id}/update/`
      uni.request({
        url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        data: payload,
        success: (res) => {
          if (res.statusCode === 200 && res.data?.status === 'success') {
            uni.showToast({ title: '任务已更新', icon: 'success' })
            // 尝试回填到当前 jsonData
            if (this.editingTaskPath) {
              let target = this.messages[this.editingTaskPath[0]]
              for (let i = 1; i < this.editingTaskPath.length - 1; i++) {
                target = target?.[this.editingTaskPath[i]]
              }
              const lastKey = this.editingTaskPath[this.editingTaskPath.length - 1]
              if (target && target[lastKey]) target[lastKey] = { ...target[lastKey], ...this.editingTask }
            }
            this.cancelEdit()
          } else {
            uni.showToast({ title: res.data?.message || '更新失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('[detail] update task fail:', err)
          uni.showToast({ title: '更新失败', icon: 'none' })
        }
      })
    },

    // =========================
    // JSON 流处理：清理/补全/解析（按“字段齐了就显示”）
    // =========================
    cleanJsonStream(text) {
      let out = String(text || '')
      // 兼容某些 SSE 风格 data:
      out = out.replace(/(^|\n)\s*data:\s*/g, '$1')
      // 防御：如果标记被拼进来了，也去掉
      out = out.replace(/<<<JSON_BEGIN>>>/g, '').replace(/<<<JSON_END>>>/g, '')
      return out
    },

    tryParseJson(jsonText) {
      let text = String(jsonText || '').trim()
      if (!text) return null

      // 兼容 ```json ... ```
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

      try {
        return JSON.parse(text)
      } catch (e) {
        return null
      }
    },

    isTaskReady(task) {
      if (!task) return false
      return (
        task.title !== undefined &&
        task.description !== undefined &&
        task.estimated_time !== undefined &&
        task.estimated_time_unit !== undefined &&
        task.priority !== undefined
      )
    },

    mergeLocalFieldsIntoTaskPlan(newPlan, oldPlan) {
      if (!oldPlan || !newPlan) return newPlan
      if (!Array.isArray(oldPlan.tasks) || !Array.isArray(newPlan.tasks)) return newPlan

      // 按task_id合并任务数据，保留用户编辑的本地字段
      const result = { ...newPlan }
      result.tasks = newPlan.tasks.map(task => {
        const oldTask = oldPlan.tasks.find(t => t.task_id === task.task_id)
        if (oldTask) {
          return { ...task, ...oldTask }
        }
        return task
      })

      return result
    },

    makeJsonSnapshot(partial) {
      const s = String(partial || '')
      let inStr = false
      let esc = false
      const stack = []

      for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (inStr) {
          if (esc) { esc = false; continue }
          if (ch === '\\') { esc = true; continue }
          if (ch === '"') inStr = false
          continue
        }
        if (ch === '"') { inStr = true; continue }
        if (ch === '{') stack.push('}')
        else if (ch === '[') stack.push(']')
        else if (ch === '}' || ch === ']') {
          if (stack.length && stack[stack.length - 1] === ch) stack.pop()
        }
      }

      let out = s
      if (inStr) out += '"'
      while (stack.length) out += stack.pop()

      // 去掉结尾多余逗号
      out = out.replace(/,\s*([}\]])/g, '$1')
      out = out.replace(/,\s*$/g, '')
      return out
    },

    /**
     * 解析部分任务计划：
     * - 只要某个 task 的 5 个关键字段都出现（title/description/estimated_time/estimated_time_unit/priority），就会被加入结果
     * - 即使 task 本身未闭合 / subtasks 未输出完，也会立即出现在 jsonData 中
     */
    parsePartialTaskPlan(partialText) {
      const raw = String(partialText || '')
      const start = raw.indexOf('{')
      if (start === -1) return null
      const s = raw.slice(start)
      const len = s.length
      let i = 0

      const out = { main_goal: '', tasks: [], summary: '' }
      let foundAny = false

      const isWs = (ch) => ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t'
      const skipWs = () => { while (i < len && isWs(s[i])) i++ }
      const isDelim = (ch) => ch === ',' || ch === '}' || ch === ']' || isWs(ch)

      const parseString = () => {
        const startI = i
        if (s[i] !== '"') return { ok: false }
        i++
        let outStr = ''
        while (i < len) {
          const ch = s[i++]
          if (ch === '"') return { ok: true, value: outStr }
          if (ch === '\\') {
            if (i >= len) { i = startI; return { ok: false } }
            const escCh = s[i++]
            if (escCh === '"' || escCh === '\\' || escCh === '/') outStr += escCh
            else if (escCh === 'b') outStr += '\b'
            else if (escCh === 'f') outStr += '\f'
            else if (escCh === 'n') outStr += '\n'
            else if (escCh === 'r') outStr += '\r'
            else if (escCh === 't') outStr += '\t'
            else if (escCh === 'u') {
              if (i + 4 > len) { i = startI; return { ok: false } }
              const hex = s.slice(i, i + 4)
              if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                outStr += String.fromCharCode(parseInt(hex, 16))
                i += 4
              } else {
                outStr += 'u' + hex
                i += 4
              }
            } else outStr += escCh
          } else outStr += ch
        }
        i = startI
        return { ok: false }
      }

      const parseNumber = () => {
        const startI = i
        const m = s.slice(i).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)
        if (!m) return { ok: false }
        const numStr = m[0]
        const nextCh = s[i + numStr.length]
        if (i + numStr.length < len && nextCh && !isDelim(nextCh)) {
          i = startI
          return { ok: false }
        }
        i += numStr.length
        return { ok: true, value: Number(numStr) }
      }

      const skipValue = () => {
        skipWs()
        if (i >= len) return { ok: false }
        const ch = s[i]
        if (ch === '"') return parseString().ok ? { ok: true } : { ok: false }
        if (ch === '{' || ch === '[') {
          const startI = i
          let inStr2 = false
          let esc2 = false
          const stack = [ch === '{' ? '}' : ']']
          i++
          while (i < len && stack.length) {
            const c = s[i++]
            if (inStr2) {
              if (esc2) { esc2 = false; continue }
              if (c === '\\') { esc2 = true; continue }
              if (c === '"') inStr2 = false
              continue
            }
            if (c === '"') { inStr2 = true; continue }
            if (c === '{') stack.push('}')
            else if (c === '[') stack.push(']')
            else if (c === '}' || c === ']') {
              if (stack[stack.length - 1] === c) stack.pop()
            }
          }
          if (stack.length) { i = startI; return { ok: false } }
          return { ok: true }
        }
        const nr = parseNumber()
        if (nr.ok) return { ok: true }
        for (const lit of ['true', 'false', 'null']) {
          if (s.startsWith(lit, i)) {
            const nextCh = s[i + lit.length]
            if (i + lit.length < len && nextCh && !isDelim(nextCh)) return { ok: false }
            i += lit.length
            return { ok: true }
          }
        }
        return { ok: false }
      }

      const parseTaskObject = () => {
        const startI = i
        if (s[i] !== '{') return { ok: false }
        i++

        const task = {
          title: undefined,
          description: undefined,
          estimated_time: undefined,
          estimated_time_unit: undefined,
          priority: undefined,
          subtasks: []
        }

        while (i < len) {
          skipWs()
          if (i < len && s[i] === '}') { i++; return { ok: true, value: task, complete: true } }

          const kr = parseString()
          if (!kr.ok) return { ok: true, value: task, complete: false }
          const key = kr.value

          skipWs()
          if (i >= len || s[i] !== ':') return { ok: true, value: task, complete: false }
          i++
          skipWs()

          if (key === 'title' || key === 'description' || key === 'estimated_time_unit' || key === 'priority') {
            const vr = parseString()
            if (!vr.ok) return { ok: true, value: task, complete: false }
            task[key] = vr.value
          } else if (key === 'estimated_time') {
            const nr = parseNumber()
            if (!nr.ok) return { ok: true, value: task, complete: false }
            task.estimated_time = nr.value
          } else if (key === 'subtasks') {
            const ar = parseTaskArray()
            if (!ar.ok) return { ok: true, value: task, complete: false }
            task.subtasks = ar.value
            if (!ar.complete) return { ok: true, value: task, complete: false }
          } else {
            const sr = skipValue()
            if (!sr.ok) return { ok: true, value: task, complete: false }
          }

          skipWs()
          if (i < len && s[i] === ',') { i++; continue }
          if (i < len && s[i] === '}') { i++; return { ok: true, value: task, complete: true } }
          return { ok: true, value: task, complete: false }
        }

        i = startI
        return { ok: true, value: task, complete: false }
      }

      const parseTaskArray = () => {
        const arr = []
        if (s[i] !== '[') return { ok: false, value: [] }
        i++
        skipWs()
        if (i < len && s[i] === ']') { i++; return { ok: true, value: arr, complete: true } }

        while (i < len) {
          skipWs()
          if (i < len && s[i] === ']') { i++; return { ok: true, value: arr, complete: true } }

          const tr = parseTaskObject()
          if (!tr.ok) {
            return arr.length ? { ok: true, value: arr, complete: false } : { ok: false, value: [] }
          }

          const t = tr.value
          if (this.isTaskReady(t)) arr.push(t) // 字段齐了就立刻显示
          if (!tr.complete) return { ok: true, value: arr, complete: false }

          skipWs()
          if (i < len && s[i] === ',') { i++; continue }
          if (i < len && s[i] === ']') { i++; return { ok: true, value: arr, complete: true } }

          return { ok: true, value: arr, complete: false }
        }

        return { ok: true, value: arr, complete: false }
      }

      skipWs()
      if (s[i] !== '{') return null
      i++

      while (i < len) {
        skipWs()
        if (i < len && s[i] === '}') { i++; break }

        const kr = parseString()
        if (!kr.ok) break
        const key = kr.value

        skipWs()
        if (i >= len || s[i] !== ':') break
        i++
        skipWs()

        if (key === 'main_goal') {
          const vr = parseString()
          if (!vr.ok) break
          out.main_goal = vr.value
          foundAny = true
        } else if (key === 'summary') {
          const vr = parseString()
          if (!vr.ok) break
          out.summary = vr.value
          foundAny = true
        } else if (key === 'tasks') {
          const ar = parseTaskArray()
          if (!ar.ok) break
          // 你说 tasks 长度为 1：这里最多拿 1 个（但子任务递归照常解析）
          out.tasks = ar.value.slice(0, 1)
          foundAny = true
        } else {
          const sr = skipValue()
          if (!sr.ok) break
        }

        skipWs()
        if (i < len && s[i] === ',') { i++; continue }
        if (i < len && s[i] === '}') { i++; break }
        break
      }

      return foundAny ? out : null
    }
  }
}
