import { API_BASE_URL } from '../../config.js'
import Layout from '../../components/Layout.vue'
import RecursiveSubtasks from '../../components/RecursiveSubtasks.vue'
import { getProjectId, getToken, getUserId, getCurrentWorkspace } from '../../utils/storage.js'

export default {
  components: { Layout, RecursiveSubtasks },

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
          content: '你好！我是AI助手，有什么可以帮您的？',
          thinking: '',
          thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
          jsonData: null,
          jsonBlocks: null,
          readyTasks: []
        }
      ],
      userId: getUserId()
    }
  },

  computed: {
    isSidebarCollapsed() {
      return this.$parent?.isSidebarCollapsed || false
    }
  },

  onLoad(q) {
    this.id = q.id
    console.log('项目详情页加载, projectId:', this.id)
    const workspace = getCurrentWorkspace()
    console.log('当前工作空间:', workspace)
    console.log('当前项目:', getProjectId())

    this.fetchProjectInfo().then(() => {
      console.log('项目信息加载完成')
      return this.fetchTasks()
    }).then(() => {
      console.log('任务加载完成')
      this.$nextTick(() => this.scrollToBottom())
    }).catch((err) => {
      console.error('加载失败:', err)
    })
  },

  methods: {
    fetchProjectInfo() {
      return new Promise((resolve) => {
        try {
          const projectId = getProjectId()?.id || this.id
          const url = `${API_BASE_URL.replace(/\/$/, '')}/projects/${projectId}/`
          uni.request({
            url,
            method: 'GET',
            header: {
              'Content-Type': 'application/json',
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data?.status === 'success' && res.data?.data) {
                this.projectName = res.data.data.title || res.data.data.name || '项目'
                this.projectDescription = res.data.data.description || ''
              }
              resolve()
            },
            fail: (err) => {
              console.error('获取项目信息失败:', err)
              this.projectName = '项目'
              resolve()
            }
          })
        } catch (err) {
          console.error('获取项目信息失败:', err)
          this.projectName = '项目'
          resolve()
        }
      })
    },

    fetchTasks() {
      return new Promise((resolve) => {
        this.tasksLoading = true
        this.tasksError = ''
        const workspace = getCurrentWorkspace()
        const projectId = getProjectId()?.id || this.id

        if (!workspace || !workspace.id || !projectId) {
          this.tasksLoading = false
          this.tasksError = '缺少必要信息'
          resolve()
          return
        }

        try {
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
                console.log('任务API响应:', res.statusCode, res.data)
                if (res.statusCode === 200 && res.data?.status === 'success') {
                  const taskTreeList = res.data.data || []
                  console.log('任务树列表:', taskTreeList)
                  if (Array.isArray(taskTreeList)) {
                    this.tasks = taskTreeList.map(tree => {
                      if (!tree || !tree.task) {
                        console.warn('单个任务数据格式错误:', tree)
                        return null
                      }
                      return {
                        ...tree.task,
                        subtasks: this.flattenSubtasks(tree.subtasks)
                      }
                    }).filter(Boolean)
                    console.log('处理后的任务:', this.tasks)
                  } else {
                    console.warn('任务数据不是数组:', taskTreeList)
                    this.tasksError = '任务数据格式错误'
                  }
                } else {
                  const errMsg = res.data?.message || `服务器返回状态: ${res.statusCode}`
                  console.error('任务API返回错误:', errMsg, res.data)
                  this.tasksError = errMsg
                }
              } catch (parseErr) {
                console.error('解析任务数据失败:', parseErr, res)
                this.tasksError = '解析任务数据失败'
              }
              this.tasksLoading = false
              resolve()
            },
            fail: (err) => {
              const errMsg = err?.errMsg || JSON.stringify(err) || '未知网络错误'
              console.error('获取任务失败:', errMsg, err)
              this.tasksError = `网络错误: ${errMsg}`
              this.tasksLoading = false
              resolve()
            }
          })
        } catch (err) {
          console.error('获取任务失败:', err)
          this.tasksError = '网络错误'
          this.tasksLoading = false
          resolve()
        }
      })
    },

    flattenSubtasks(subtaskTrees) {
      if (!subtaskTrees || !Array.isArray(subtaskTrees)) {
        return []
      }
      return subtaskTrees.map(tree => {
        if (!tree || !tree.task) {
          console.warn('子任务数据格式错误:', tree)
          return { id: Math.random(), title: '数据错误', subtasks: [] }
        }
        return {
          ...tree.task,
          subtasks: this.flattenSubtasks(tree.subtasks)
        }
      }).filter(Boolean)
    },

    getExpandKey(parentId, taskId) {
      return parentId ? `${parentId}:${taskId}` : taskId
    },

    toggleTaskExpand(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      if (this.expandedTaskIds.has(key)) {
        this.expandedTaskIds.delete(key)
      } else {
        this.expandedTaskIds.add(key)
      }
      this.$forceUpdate()
    },

    isTaskExpanded(parentId, taskId) {
      const key = this.getExpandKey(parentId, taskId)
      return this.expandedTaskIds.has(key)
    },

    toggleThinking(index) {
      const m = this.messages[index]
      if (m && m.thinkingMeta) m.thinkingMeta.open = !m.thinkingMeta.open
    },

    formatMessage(message) {
      if (!message) return ''
      return String(message).replace(/\n/g, '<br>')
    },

    scrollToBottom() {
      this.scrollIntoId = `msg-${this.messages.length - 1}`
    },

    onInputChange(e) {
      if (this.userInput.length > 20000) {
        this.userInput = this.userInput.slice(0, 20000)
      }

      this.$nextTick(() => {
        const textarea = document.querySelector('.composer-input')
        if (textarea) {
          const scrollHeight = textarea.scrollHeight
          this.textareaHeight = Math.min(Math.max(scrollHeight, 45), 200)
        }
      })
    },

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
            if (this.editingTaskPath) {
              let target = this.messages[this.editingTaskPath[0]].jsonData
              for (let i = 1; i < this.editingTaskPath.length - 1; i++) {
                target = target[this.editingTaskPath[i]]
              }
              const lastKey = this.editingTaskPath[this.editingTaskPath.length - 1]
              target[lastKey] = { ...target[lastKey], ...this.editingTask }
            }
            this.editingTask = null
            this.editingTaskPath = null
          } else {
            uni.showToast({ title: res.data?.message || '更新失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('更新任务失败:', err)
          uni.showToast({ title: '更新失败', icon: 'none' })
        }
      })
    },

    cleanJsonStream(text) {
      let out = String(text || '')
      out = out.replace(/(^|\n)\s*data:\s*/g, '$1')
      out = out.replace(/^<<<JSON_BEGIN>>>\s*/i, '').replace(/<<<JSON_END>>>\s*$/i, '')
      return out
    },

    tryParseJson(jsonText) {
      let text = String(jsonText || '').trim()
      if (!text) return null

      text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      text = this.cleanJsonStream(text)

      try {
        return JSON.parse(text)
      } catch (e) {
        return null
      }
    },

    collectReadyTasks(json) {
      if (!json || !Array.isArray(json.tasks)) return []
      const ready = []
      const walk = (task, path) => {
        if (!task) return
        if (this.isTaskReady(task)) ready.push({ path, title: task.title || '' })
        const subs = Array.isArray(task.subtasks) ? task.subtasks : []
        subs.forEach((st, idx) => walk(st, [...path, 'subtasks', idx]))
      }
      json.tasks.forEach((t, idx) => walk(t, ['tasks', idx]))
      return ready
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

    mergeLocalFieldsIntoTaskPlan(nextJson, prevJson) {
      if (!nextJson) return nextJson
      if (!prevJson) return nextJson

      const copyTaskLocal = (dst, src) => {
        if (!dst || !src) return
        if (src.startDate !== undefined) dst.startDate = src.startDate
        if (src.endDate !== undefined) dst.endDate = src.endDate

        const dstSubs = Array.isArray(dst.subtasks) ? dst.subtasks : []
        const srcSubs = Array.isArray(src.subtasks) ? src.subtasks : []
        const n = Math.min(dstSubs.length, srcSubs.length)
        for (let i = 0; i < n; i++) copyTaskLocal(dstSubs[i], srcSubs[i])
      }

      const nextTasks = Array.isArray(nextJson.tasks) ? nextJson.tasks : []
      const prevTasks = Array.isArray(prevJson.tasks) ? prevJson.tasks : []
      const n = Math.min(nextTasks.length, prevTasks.length)
      for (let i = 0; i < n; i++) copyTaskLocal(nextTasks[i], prevTasks[i])

      return nextJson
    },

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
      const skipWs = () => {
        while (i < len && isWs(s[i])) i++
      }
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
            const esc = s[i++]
            if (esc === '"' || esc === '\\' || esc === '/') outStr += esc
            else if (esc === 'b') outStr += '\b'
            else if (esc === 'f') outStr += '\f'
            else if (esc === 'n') outStr += '\n'
            else if (esc === 'r') outStr += '\r'
            else if (esc === 't') outStr += '\t'
            else if (esc === 'u') {
              if (i + 4 > len) { i = startI; return { ok: false } }
              const hex = s.slice(i, i + 4)
              if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                outStr += 'u' + hex
                i += 4
              } else {
                outStr += String.fromCharCode(parseInt(hex, 16))
                i += 4
              }
            } else {
              outStr += esc
            }
          } else {
            outStr += ch
          }
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
        if (i + numStr.length >= len || (nextCh && !isDelim(nextCh))) {
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
        if (ch === '"') {
          const r = parseString()
          return r.ok ? { ok: true } : { ok: false }
        }
        if (ch === '{' || ch === '[') {
          const startI = i
          let inStr = false
          let esc = false
          const stack = []
          stack.push(ch === '{' ? '}' : ']')
          i++
          while (i < len && stack.length) {
            const c = s[i++]
            if (inStr) {
              if (esc) { esc = false; continue }
              if (c === '\\') { esc = true; continue }
              if (c === '"') inStr = false
              continue
            }
            if (c === '"') { inStr = true; continue }
            if (c === '{') stack.push('}')
            else if (c === '[') stack.push(']')
            else if (c === '}' || c === ']') {
              if (stack[stack.length - 1] === c) stack.pop()
            }
          }
          if (stack.length) { i = startI; return { ok: false } }
          return { ok: true }
        }
        const num = parseNumber()
        if (num.ok) return { ok: true }
        const lits = ['true', 'false', 'null']
        for (const lit of lits) {
          if (s.startsWith(lit, i)) {
            const nextCh = s[i + lit.length]
            if (i + lit.length < len && nextCh && !isDelim(nextCh)) return { ok: false }
            i += lit.length
            return { ok: true }
          }
        }
        return { ok: false }
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
          if (this.isTaskReady(t)) arr.push(t)
          if (!tr.complete) return { ok: true, value: arr, complete: false }

          skipWs()
          if (i < len && s[i] === ',') { i++; continue }
          if (i < len && s[i] === ']') { i++; return { ok: true, value: arr, complete: true } }

          return { ok: true, value: arr, complete: false }
        }

        return { ok: true, value: arr, complete: false }
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
    },

    sendMessage() {
      if (!this.userInput.trim()) return

      const userMessageText = this.userInput
      this.messages.push({
        role: 'user',
        content: userMessageText,
        thinking: '',
        thinkingMeta: null,
        jsonData: null,
        jsonBlocks: null,
        readyTasks: []
      })
      this.userInput = ''
      this.textareaHeight = 45
      this.$nextTick(() => this.scrollToBottom())

      const aiMessageIndex = this.messages.length
      this.messages.push({
        role: 'assistant',
        content: '',
        thinking: '',
        thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
        jsonData: null,
        jsonBlocks: null,
        readyTasks: []
      })
      this.$nextTick(() => this.scrollToBottom())

      const token = getToken()
      const streamUrl = `${API_BASE_URL.replace(/\/$/, '')}/ai/chat-stream/`
      const self = this

      uni.request({
        url: streamUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        data: {
          time: new Date().toISOString(),
          token: getToken(),
          message: userMessageText,
          user_id: getUserId(),
          workspace_id: getCurrentWorkspace().id,
          project_id: getProjectId().id,
          system_prompt: null
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const responseData = res.data || {}
            let content = responseData.content || responseData.message || ''

            self.messages[aiMessageIndex].content = String(content)
            if (responseData.thinking) {
              self.messages[aiMessageIndex].thinking = String(responseData.thinking)
              self.messages[aiMessageIndex].thinkingMeta.durationSec = 0
            }
            self.$nextTick(() => self.scrollToBottom())
          } else {
            self.messages[aiMessageIndex].content = '抱歉，请求失败，请稍后再试。'
            self.$nextTick(() => self.scrollToBottom())
          }
        },
        fail: (err) => {
          console.error('获取 AI 回复失败:', err)
          self.messages[aiMessageIndex].content = '抱歉，网络连接出错，请稍后再试。'
          self.$nextTick(() => self.scrollToBottom())
        }
      })
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

      out = out.replace(/,\s*([}\]])/g, '$1')
      out = out.replace(/,\s*$/g, '')
      return out
    },

    buildBlocksFromJson(json) {
      const mkId = (p) => p.join('.')

      const taskToBlock = (task, path) => {
        const block = {
          id: mkId(path),
          type: 'task',
          title: task.title || '',
          description: task.description || '',
          meta: {
            estimated_time: task.estimated_time,
            estimated_time_unit: task.estimated_time_unit,
            priority: task.priority
          },
          open: true,
          children: []
        }

        const subs = Array.isArray(task.subtasks) ? task.subtasks : []
        block.children = subs.map((st, i) => taskToBlock(st, [...path, 'subtasks', String(i)]))
        return block
      }

      const blocks = []
      blocks.push({
        id: 'main_goal',
        type: 'main_goal',
        title: 'main_goal',
        value: json?.main_goal || '',
        open: true,
        children: []
      })

      const tasks = Array.isArray(json?.tasks) ? json.tasks : []
      blocks.push({
        id: 'tasks',
        type: 'tasks',
        title: 'tasks',
        open: true,
        children: tasks.map((t, i) => taskToBlock(t, ['tasks', String(i)]))
      })

      blocks.push({
        id: 'summary',
        type: 'summary',
        title: 'summary',
        value: json?.summary || '',
        open: true,
        children: []
      })

      return blocks
    }
  }
}
