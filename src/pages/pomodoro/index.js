import Layout from "../../components/Layout.vue"
import { apiPost } from '../../services/http.js'
import { getCurrentWorkspace, getProjectId, getToken } from '../../utils/storage.js'

const POMODORO_MODES = {
  '25_5': { work: 25, break: 5 },
  '50_10': { work: 50, break: 10 }
}
export default {
  components: { Layout },
  data() {
    return {
      pomodoroMode: '25_5',
      pomodoroIsRunning: false,
      pomodoroIsBreak: false,
      pomodoroRemainingSec: 25 * 60,
      pomodoroTimerId: null,
      taskbarTasks: [],
      taskbarLoading: false,
      taskbarError: '',
      currentProject: null,
      workspace: null
    }
  },
  onLoad() {
    this.initPomodoro()
  },
  onShow() {
    this.workspace = getCurrentWorkspace()
    this.currentProject = getProjectId()
    this.fetchTaskbar()
  },
  onHide() {
    this.pausePomodoro()
  },
  onUnload() {
    this.clearPomodoroTimer()
  },
  methods: {
    initPomodoro() {
      const mode = POMODORO_MODES[this.pomodoroMode]
      this.pomodoroIsBreak = false
      this.pomodoroRemainingSec = mode.work * 60
    },
    setPomodoroMode(modeKey) {
      if (!POMODORO_MODES[modeKey] || this.pomodoroMode === modeKey) return
      this.pomodoroMode = modeKey
      this.resetPomodoro()
    },
    togglePomodoro() {
      if (this.pomodoroIsRunning) {
        this.pausePomodoro()
      } else {
        this.startPomodoro()
      }
    },
    startPomodoro() {
      if (this.pomodoroIsRunning) return
      this.pomodoroIsRunning = true
      this.clearPomodoroTimer()
      this.pomodoroTimerId = setInterval(() => {
        this.tickPomodoro()
      }, 1000)
    },
    pausePomodoro() {
      this.pomodoroIsRunning = false
      this.clearPomodoroTimer()
    },
    resetPomodoro() {
      this.pausePomodoro()
      const mode = POMODORO_MODES[this.pomodoroMode]
      this.pomodoroIsBreak = false
      this.pomodoroRemainingSec = mode.work * 60
    },
    tickPomodoro() {
      if (this.pomodoroRemainingSec > 0) {
        this.pomodoroRemainingSec -= 1
        if (this.pomodoroRemainingSec === 0) {
          this.switchPomodoroPhase()
        }
      } else {
        this.switchPomodoroPhase()
      }
    },
    switchPomodoroPhase() {
      const mode = POMODORO_MODES[this.pomodoroMode]
      this.pomodoroIsBreak = !this.pomodoroIsBreak
      const nextMinutes = this.pomodoroIsBreak ? mode.break : mode.work
      this.pomodoroRemainingSec = nextMinutes * 60
    },
    formatPomodoroTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    },
    clearPomodoroTimer() {
      if (this.pomodoroTimerId) {
        clearInterval(this.pomodoroTimerId)
        this.pomodoroTimerId = null
      }
    },
    async fetchTaskbar() {
      this.taskbarLoading = true
      this.taskbarError = ''
      this.taskbarTasks = []
      if (!this.workspace || !this.workspace.id) {
        this.taskbarLoading = false
        this.taskbarError = '\u8bf7\u5148\u9009\u62e9\u5de5\u4f5c\u7a7a\u95f4'
        return
      }
      try {
        const res = await apiPost('/tasks/list', {
          time: new Date().toISOString(),
          token: getToken(),
          workspace_id: this.workspace.id,
          project_id: this.currentProject?.id,
          subtasks: null
        })
        if (res.statusCode === 200) {
          const taskTreeList = res.data.data || []
          this.taskbarTasks = taskTreeList
            .map(tree => tree?.task)
            .filter(Boolean)
            .slice(0, 10)
        } else {
          this.taskbarError = res?.data?.message || '\u52a0\u8f7d\u5931\u8d25'
        }
      } catch (e) {
        this.taskbarError = '\u7f51\u7edc\u9519\u8bef'
      } finally {
        this.taskbarLoading = false
      }
    },
    goToTasks() {
      uni.navigateTo({ url: '/pages/tasks/index' })
    },
    openTask(task) {
      const taskId = task?.id || task?.task_id
      if (!taskId) return
      uni.navigateTo({ url: `/pages/tasks/detail?id=${taskId}` })
    }
  }
}
