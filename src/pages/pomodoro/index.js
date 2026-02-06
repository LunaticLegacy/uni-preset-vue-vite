import Layout from "../../components/Layout.vue"

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
      pomodoroTimerId: null
    }
  },
  onLoad() {
    this.initPomodoro()
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
    }
  }
}
