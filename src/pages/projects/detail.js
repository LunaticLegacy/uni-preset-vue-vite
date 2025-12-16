import { API_BASE_URL } from '../../config.js'
import Layout from '../../components/Layout.vue'
import RecursiveSubtasks from '../../components/RecursiveSubtasks.vue'
import { getProjectId, getToken, getUserId, getCurrentWorkspace } from '../../utils/storage.js'

/**
 * AI 助手页面
 * - 支持流式输出
 * - 思考流/输出流分离：<<<THINKING>>> ... <<<THINK_END>>>
 * - 思考流可收起，并显示思考时长（s）
 * - 支持 <JSON_BEGIN>...<JSON_END> 以及 <<<JSON_BEGIN>>>...<<<JSON_END>>>
 */
export default {
  components: { Layout, RecursiveSubtasks },

  data() {
    return {
      id: '',
      userInput: '',
      scrollIntoId: '',
      messages: [
        {
          role: 'assistant',
          content: '您好！我是 AI 动手，有什么我可以帮您的吗？',
          thinking: '',
          thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
          jsonData: null
        }
      ],
      userId: getUserId()
    }
  },

  computed: {
    isSidebarCollapsed() {
      // 从父组件 Layout 获取侧边栏状态
      return this.$parent?.isSidebarCollapsed || false;
    }
  },

  async onLoad(q) {
    this.id = q.id
    this.$nextTick(() => this.scrollToBottom())
  },

  methods: {
    toggleThinking(index) {
      const m = this.messages[index]
      if (m && m.thinkingMeta) m.thinkingMeta.open = !m.thinkingMeta.open
    },

    formatMessage(message) {
      if (!message) return ''
      // 安全起见：这里仅做换行转换；如果需要更强的富文本渲染，请在后端或专门的 markdown 渲染组件里做白名单处理
      return String(message).replace(/\n/g, '<br>')
    },

    scrollToBottom() {
      // scroll-into-view 需要元素 id
      this.scrollIntoId = `msg-${this.messages.length - 1}`
    },

    tryParseJson(jsonText) {
      const text = (jsonText || '').trim()
      if (!text) return null
      try {
        return JSON.parse(text)
      } catch (e) {
        return null
      }
    },

    async sendMessage() {
      if (!this.userInput.trim()) return

      // 1) push user msg
      let lastJsonPreviewMs = 0;
      const JSON_PREVIEW_INTERVAL = 120; // ms，自己调
      
      const userMessageText = this.userInput
      this.messages.push({ role: 'user', content: userMessageText, thinking: '', thinkingMeta: null, jsonData: null })
      this.userInput = ''
      this.$nextTick(() => this.scrollToBottom())

      // 2) placeholder assistant msg
      const aiMessageIndex = this.messages.length
      this.messages.push({
        role: 'assistant',
        content: '',
        thinking: '',
        thinkingMeta: { open: false, active: false, startMs: null, endMs: null, durationSec: 0 },
        jsonData: null
      })
      this.$nextTick(() => this.scrollToBottom())

      try {
        const token = getToken()
        const streamUrl = `${API_BASE_URL.replace(/\/$/, '')}/ai/chat-stream/`
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            time: new Date().toISOString(),
            token: getToken(),
            message: userMessageText,
            user_id: getUserId(),
            workspace_id: getCurrentWorkspace().id,
            project_id: getProjectId().id,
            system_prompt: null
          })
        })

        if (!(response.ok && response.body?.getReader)) {
          if (response.ok) {
            // 载入文本内容。
            const fullText = await response.text()
            this.messages[aiMessageIndex].content = fullText || ''
            this.$nextTick(() => this.scrollToBottom())
            return
          }
          throw new Error('API 返回错误状态')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')

        const nowMs = () => {
          // duration 仅用于相对计时；优先用 performance.now()
          if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') return performance.now()
          return Date.now()
        }

        // --- streaming state machine (supports split markers across chunks) ---
        const TOKENS = {
          // 新协议：思考流
          THINK_BEGIN: '<<<THINKING>>>',
          THINK_END: '<<<THINK_END>>>',

          JSON_BEGIN: '<<<JSON_BEGIN>>>',
          JSON_END: '<<<JSON_END>>>'
        }

        let mode = 'text' // 'text' | 'thinking' | 'json'
        let buffer = ''
        let accumulatedText = ''
        let accumulatedThinking = ''
        let jsonBuffer = ''

        // 思考计时
        let thinkingStartMs = null

        const appendText = (s) => {
          if (!s) return
          // 移除 JSON 标记
          const cleanedText = s.replace(/<<<JSON_BEGIN>>>/g, '').replace(/<<<JSON_END>>>/g, '')
                               .replace(/<<>>/g, '').replace(/<<</g, '').replace(/>>>/g, '');
          accumulatedText += cleanedText
          this.messages[aiMessageIndex].content = accumulatedText
        }
        const appendThinking = (s) => {
          if (!s) return
          accumulatedThinking += s
          const meta = this.messages[aiMessageIndex].thinkingMeta
          if (meta && meta.active && meta.startMs != null) {
            meta.durationSec = ((nowMs() - meta.startMs) / 1000).toFixed(3)
          }
          this.messages[aiMessageIndex].thinking = accumulatedThinking
        }
        const appendJson = (s) => {
          if (!s) return;
          jsonBuffer += s;

          const t = nowMs();
          if (t - lastJsonPreviewMs < JSON_PREVIEW_INTERVAL) return;
          lastJsonPreviewMs = t;

          const snap = this.makeJsonSnapshot(jsonBuffer);
          const parsed = this.tryParseJson(snap);
          if (parsed) {
            this.messages[aiMessageIndex].jsonData = parsed;
            this.messages[aiMessageIndex].jsonBlocks = this.buildBlocksFromJson(parsed);
            if (!this.messages[aiMessageIndex].content) {
              this.messages[aiMessageIndex].content = '正在生成任务分解…（可边生成边展开查看）';
            }
          }
        };


        const findNextToken = (haystack, tokens) => {
          // return { idx, token } for earliest token occurrence, else null
          let best = null
          for (const t of tokens) {
            const i = haystack.indexOf(t)
            if (i === -1) continue
            if (!best || i < best.idx) best = { idx: i, token: t }
          }
          return best
        }

        const textTokens = [
          TOKENS.THINK_BEGIN,
          TOKENS.THINK_END,
          TOKENS.JSON_BEGIN,
          TOKENS.JSON_END,
        ]
        const thinkingEndTokens = [TOKENS.THINK_END]
        const jsonEndTokens = [TOKENS.JSON_END]

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // process buffer
          while (buffer.length) {
            if (mode === 'text') {
              const next = findNextToken(buffer, textTokens)
              if (!next) {
                appendText(buffer)
                buffer = ''
                break
              }

              // content before token
              if (next.idx > 0) appendText(buffer.slice(0, next.idx))
              buffer = buffer.slice(next.idx + next.token.length)

              if (next.token === TOKENS.THINK_BEGIN) {
                mode = 'thinking'
                thinkingStartMs = nowMs()
                const meta = this.messages[aiMessageIndex].thinkingMeta
                if (meta) {
                  meta.active = true
                  meta.startMs = thinkingStartMs
                  meta.endMs = null
                  meta.durationSec = 0
                }
              } else if (next.token === TOKENS.THINK_END) {
                mode = 'text'
              }
              else if (next.token === TOKENS.JSON_BEGIN) {
                mode = 'json'
                jsonBuffer = '' // 新的 JSON 块开始
              } else if (next.token === TOKENS.JSON_END) {
                // 允许后端直接吐 JSON_END（容错）
                mode = 'text'
              }
            } else if (mode === 'thinking') {
              const next = findNextToken(buffer, thinkingEndTokens)
              if (!next) {
                appendThinking(buffer)
                buffer = ''
                break
              }
              if (next.idx > 0) appendThinking(buffer.slice(0, next.idx))
              buffer = buffer.slice(next.idx + next.token.length)
              mode = 'text'
              const meta = this.messages[aiMessageIndex].thinkingMeta
              if (meta && meta.active && meta.startMs != null) {
                meta.active = false
                meta.endMs = nowMs()
                meta.durationSec = ((meta.endMs - meta.startMs) / 1000).toFixed(3)
              }
            } else if (mode === 'json') {
              const next = findNextToken(buffer, jsonEndTokens)
              if (!next) {
                appendJson(buffer)
                buffer = ''
                break
              }
              if (next.idx > 0) appendJson(buffer.slice(0, next.idx))
              buffer = buffer.slice(next.idx + next.token.length)
              mode = 'text'

              // parse jsonBuffer and attach to message
              const parsed = this.tryParseJson(jsonBuffer)
              if (parsed) {
                this.messages[aiMessageIndex].jsonData = parsed
                // 如果不希望把 JSON 原文显示在气泡里，可以在这里不 appendText
                // 这里给一个轻量提示，避免用户看不到"AI 已完成输出"
                if (!this.messages[aiMessageIndex].content) {
                  this.messages[aiMessageIndex].content = '我已生成任务计划，见下方。'
                }
              } else {
                // 解析失败：把原文当普通文本展示，便于排查
                appendText(`\n[JSON 解析失败]\n${jsonBuffer}\n`)
              }
              jsonBuffer = ''
            }

            // keep view pinned to bottom while streaming
            this.$nextTick(() => this.scrollToBottom())
          }
        }

        // flush any remaining buffer after stream ends
        if (buffer) {
          if (mode === 'thinking') {
            appendThinking(buffer)
            const meta = this.messages[aiMessageIndex].thinkingMeta
            if (meta && meta.active && meta.startMs != null) {
              meta.active = false
              meta.endMs = nowMs()
              meta.durationSec = ((meta.endMs - meta.startMs) / 1000).toFixed(3)
            }
          }
          else if (mode === 'json') {
            appendJson(buffer)
            const parsed = this.tryParseJson(jsonBuffer)
            if (parsed) this.messages[aiMessageIndex].jsonData = parsed
            else appendText(`\n[JSON 解析失败]\n${jsonBuffer}\n`)
          } else appendText(buffer)
          buffer = ''
        }

        this.$nextTick(() => this.scrollToBottom())
      } catch (err) {
        console.error('获取 AI 回复失败:', err)
        this.messages[aiMessageIndex].content = '抱歉，我遇到了一些问题，请稍后再试。'
        this.$nextTick(() => this.scrollToBottom())
      }
    },

    makeJsonSnapshot(partial) {
      const s = String(partial || '');
      let inStr = false;
      let esc = false;
      const stack = [];

      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if (ch === '}' || ch === ']') {
          // 遇到闭合符号：尝试弹栈（不强校验，避免太激进）
          if (stack.length && stack[stack.length - 1] === ch) stack.pop();
        }
      }

      let out = s;
      if (inStr) out += '"';
      while (stack.length) out += stack.pop();
      return out;
    },
    buildBlocksFromJson(json) {
      const mkId = (p) => p.join('.');

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
        };

        const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
        block.children = subs.map((st, i) => taskToBlock(st, [...path, 'subtasks', String(i)]));
        return block;
      };

      const blocks = [];
      blocks.push({
        id: 'main_goal',
        type: 'main_goal',
        title: 'main_goal',
        value: json?.main_goal || '',
        open: true,
        children: []
      });

      const tasks = Array.isArray(json?.tasks) ? json.tasks : [];
      blocks.push({
        id: 'tasks',
        type: 'tasks',
        title: 'tasks',
        open: true,
        children: tasks.map((t, i) => taskToBlock(t, ['tasks', String(i)]))
      });

      blocks.push({
        id: 'summary',
        type: 'summary',
        title: 'summary',
        value: json?.summary || '',
        open: true,
        children: []
      });

      return blocks;
    },

  }
}