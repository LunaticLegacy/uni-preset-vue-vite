<template>
  <layout page-title="番茄钟">
    <view class="pomodoro-page">
      <view class="pomodoro-taskbar">
        <view class="taskbar-header">
          <view class="taskbar-title-group">
            <text class="taskbar-title">&#20219;&#21153;&#26639;</text>
            <text class="taskbar-subtitle" v-if="currentProject">
              &#39033;&#30446;: {{ currentProject.name || currentProject.title || currentProject.id }}
            </text>
            <text class="taskbar-subtitle" v-else>&#26410;&#36873;&#25321;&#39033;&#30446;</text>
          </view>
          <button class="taskbar-action" @click="goToTasks">&#26597;&#30475;&#20219;&#21153;</button>
        </view>
        <scroll-view class="taskbar-list" scroll-x="true" show-scrollbar="false">
          <view v-if="taskbarLoading" class="taskbar-chip muted">&#21152;&#36733;&#20013;...</view>
          <view v-else-if="taskbarError" class="taskbar-chip error">{{ taskbarError }}</view>
          <view v-else-if="taskbarTasks.length === 0" class="taskbar-chip muted">&#26242;&#26080;&#20219;&#21153;</view>
          <view
            v-else
            v-for="task in taskbarTasks"
            :key="task.id"
            class="taskbar-chip"
            @click="openTask(task)"
          >
            <text class="taskbar-chip-title">{{ task.title }}</text>
            <text class="taskbar-chip-status" v-if="task.status">{{ task.status }}</text>
          </view>
        </scroll-view>
      </view>

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
