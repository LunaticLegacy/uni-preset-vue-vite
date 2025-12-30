<template>
  <layout page-title="番茄钟">
    <view class="pomodoro-page">
      <view class="pomodoro-card">
        <text class="pomodoro-title">番茄钟</text>
        <view class="pomodoro-modes">
          <button
            class="pomodoro-chip"
            :class="{ active: pomodoroMode === '25_5' }"
            @click="setPomodoroMode('25_5')"
          >
            25/5
          </button>
          <button
            class="pomodoro-chip"
            :class="{ active: pomodoroMode === '50_10' }"
            @click="setPomodoroMode('50_10')"
          >
            50/10
          </button>
        </view>
        <text class="pomodoro-phase">{{ pomodoroIsBreak ? '休息' : '专注' }}</text>
        <text class="pomodoro-time">{{ formatPomodoroTime(pomodoroRemainingSec) }}</text>
        <view class="pomodoro-actions">
          <button class="pomodoro-btn" @click="togglePomodoro">
            {{ pomodoroIsRunning ? '暂停' : '开始' }}
          </button>
          <button class="pomodoro-btn secondary" @click="resetPomodoro">重置</button>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js"></script>
<style src="./index.css"></style>
