<template>
  <view :class="['task-item', 'task-level-' + level]" v-if="task">
    <view :class="['task-header', { 'task-header-expanded': isExpanded }]" @click="toggleExpanded">
      <view :class="['task-info', { 'task-expanded': isExpanded }]">
        <text :class="['task-title', 'level-' + level]">{{ getPrefix(level) }} {{ task.title }}</text>
        <text class="task-meta">
          {{ task.priority }} · 
          <span v-if="task.estimated_minutes !== undefined && task.estimated_minutes !== null">
            {{ formatTimeFromMinutes(task.estimated_minutes) }}
          </span>
          <span v-else-if="task.estimated_time && task.estimated_time_unit">
            {{ task.estimated_time }} {{ task.estimated_time_unit }}
          </span>
          <span v-else>时间未设置</span>
        </text>
      </view>
      <view v-if="task.subtasks && task.subtasks.length > 0" class="subtask-count">{{ task.subtasks.length }}个子任务</view>
      <view :class="['expand-indicator', { 'expanded': isExpanded }]">{{ isExpanded ? '−' : '+' }}</view>
    </view>

    <view v-show="isExpanded" :class="['task-details', { 'show': isExpanded }]">
      <view class="detail-section" v-if="task.description">
        <text class="section-title">描述</text>
        <text class="detail-text">{{ task.description }}</text>
      </view>

      <view class="detail-section" v-if="task.status">
        <text class="section-title">状态</text>
        <text class="detail-text">{{ task.status }}</text>
      </view>

      <view class="detail-section" v-if="task.assignee_id">
        <text class="section-title">负责人</text>
        <text class="detail-text">{{ task.assignee_id }}</text>
      </view>

      <view class="detail-section" v-if="task.start_date || task.end_date">
        <text class="section-title">时间安排</text>
        <view class="info-row">
          <text class="info-label">开始时间:</text>
          <text class="info-value">{{ task.start_date || '未设置' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">结束时间:</text>
          <text class="info-value">{{ task.end_date || '未设置' }}</text>
        </view>
      </view>

      <view class="subtasks-list" v-if="task.subtasks && task.subtasks.length > 0">
        <view class="subtasks-title">子任务</view>
        <TaskItem
          v-for="(subtask, index) in task.subtasks"
          :key="subtask.task_id || subtask.id || index"
          :task="subtask"
          :level="level + 1"
          :parent-expanded="isExpanded"
          :expandedTaskIds="expandedTaskIds"
          @update:expandedTaskIds="$emit('update:expandedTaskIds', $event)"
        />
      </view>
    </view>
  </view>
</template>

<script>
import { formatTimeFromMinutes } from '../utils/time.js';

export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      default: () => {}
    },
    expandedTaskIds: {
      type: [Set, Array],
      default: null
    },
    level: {
      type: Number,
      default: 1
    },
    parentExpanded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      expanded: false
    }
  },
  computed: {
    taskKey() {
      return this.task?.task_id || this.task?.id || this.task?.title || ''
    },
    usesExpandedSet() {
      const hasCollection = this.expandedTaskIds instanceof Set || Array.isArray(this.expandedTaskIds)
      return hasCollection && !!this.taskKey
    },
    isExpanded() {
      if (this.usesExpandedSet) {
        if (this.expandedTaskIds instanceof Set) {
          return this.expandedTaskIds.has(this.taskKey)
        }
        return this.expandedTaskIds.includes(this.taskKey)
      }
      return this.expanded
    }
  },
  watch: {
    parentExpanded(newVal) {
      if (!newVal) {
        if (this.usesExpandedSet) {
          this.emitExpandedSet(false)
        } else {
          this.expanded = false
        }
      }
    }
  },
  methods: {
    emitExpandedSet(nextExpanded) {
      if (!this.usesExpandedSet) return
      const current = this.expandedTaskIds instanceof Set
        ? Array.from(this.expandedTaskIds)
        : (this.expandedTaskIds || [])
      const nextSet = new Set(current)
      if (!this.taskKey) return
      if (nextExpanded) nextSet.add(this.taskKey)
      else nextSet.delete(this.taskKey)
      this.$emit('update:expandedTaskIds', nextSet)
    },
    toggleExpanded() {
      const nextExpanded = !this.isExpanded
      if (this.usesExpandedSet) {
        this.emitExpandedSet(nextExpanded)
      } else {
        this.expanded = nextExpanded
      }
    },
    getPrefix(level) {
      if (level === 1) return '•';
      if (level === 2) return '◦';
      if (level === 3) return '▪';
      if (level === 4) return '▫';
      return '▹';
    },
    formatTimeFromMinutes
  }
}
</script>

<style scoped>
.task-item {
  border: 1rpx solid var(--glass-stroke);
  border-radius: 16rpx;
  overflow: hidden;
  transition: border-color 0.3s ease;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  animation: fade-up 0.5s ease both;
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 16rpx;
  cursor: pointer;
  background: transparent;
  transition: background 0.3s ease;
}

.task-header:active {
  background: var(--bg-tertiary);
}

.task-header-expanded {
  background: var(--bg-tertiary);
}

.expand-indicator {
  font-size: 24rpx;
  color: var(--text-secondary);
  min-width: 16rpx;
  padding-top: 4rpx;
  transition: color 0.3s ease;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.task-title {
  font-size: 32rpx;
  color: var(--text-primary);
  font-weight: 600;
  transition: color 0.3s ease;
}

.task-meta {
  color: var(--text-secondary);
  font-size: 24rpx;
  transition: color 0.3s ease;
}

.subtask-count {
  color: var(--text-on-accent, white);
  font-size: 24rpx;
  font-weight: 500;
  background: var(--accent-success);
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  margin-left: 10rpx;
}

.task-details {
  padding: 0 16rpx 16rpx 16rpx;
  background: var(--bg-secondary);
  border-top: 1rpx solid var(--border-color);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.detail-section {
  margin-top: 16rpx;
  padding: 16rpx;
  background: var(--card-bg-strong);
  border-radius: 12rpx;
  border: 1rpx solid var(--border-color-subtle);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12rpx;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 6rpx;
  height: 24rpx;
  background: var(--accent-primary);
  border-radius: 3rpx;
  margin-right: 12rpx;
}

.detail-text {
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.8;
  transition: color 0.3s ease;
  padding: 8rpx 0;
}

.info-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 12rpx;
  padding: 8rpx 0;
}

.info-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  min-width: 120rpx;
  font-weight: 500;
  transition: color 0.3s ease;
}

.info-value {
  font-size: 26rpx;
  color: var(--text-primary);
  flex: 1;
  font-weight: 500;
  transition: color 0.3s ease;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.subtask-item {
  padding: 16rpx;
  background: var(--card-bg-strong);
  border-radius: 12rpx;
  border-left: 4rpx solid var(--accent-primary);
  transition: all 0.3s ease;
  border: 1rpx solid var(--border-color-subtle);
}

.subtask-item:hover {
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.05);
}

.subtask-header {
  display: flex;
  gap: 8rpx;
  align-items: flex-start;
  cursor: pointer;
}

.subtask-info {
  flex: 1;
}

.subtask-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  transition: color 0.3s ease;
}

.subtask-meta {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
  display: block;
  transition: color 0.3s ease;
}

.subtask-desc {
  font-size: 25rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
  display: block;
  line-height: 1.6;
  padding-left: 24rpx;
  transition: color 0.3s ease;
  background: var(--bg-secondary);
  padding: 12rpx;
  border-radius: 10rpx;
  margin-top: 12rpx;
}

.expand-indicator-empty {
  font-size: 24rpx;
  color: var(--text-tertiary);
  min-width: 14rpx;
}

.nested-subtasks {
  margin-top: 12rpx;
  margin-left: 16rpx;
  padding-left: 16rpx;
  border-left: 3rpx solid var(--accent-primary);
  background: var(--bg-secondary);
  border-radius: 10rpx;
  padding: 12rpx 0;
}

.nested-subtask-item {
  padding: 12rpx 16rpx;
  background: var(--card-bg-strong);
  border-radius: 10rpx;
  margin-bottom: 8rpx;
  transition: background 0.3s ease;
  border: 1rpx solid var(--border-color-subtle);
}

.nested-subtask-header {
  display: flex;
  gap: 8rpx;
  align-items: flex-start;
  cursor: pointer;
}

.nested-subtask-info {
  flex: 1;
}

.nested-subtask-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.nested-subtask-meta {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
  display: block;
  transition: color 0.3s ease;
}

.nested-subtask-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
  display: block;
  line-height: 1.6;
  padding-left: 24rpx;
  transition: color 0.3s ease;
  background: var(--bg-secondary);
  padding: 10rpx;
  border-radius: 10rpx;
  margin-top: 8rpx;
}

.deep-nested-subtasks {
  margin-top: 12rpx;
  margin-left: 16rpx;
  padding-left: 16rpx;
  border-left: 2rpx solid var(--accent-secondary);
  background: var(--bg-tertiary);
  border-radius: 10rpx;
  padding: 8rpx 0;
}

.deep-nested-subtask-item {
  padding: 10rpx 16rpx;
  background: var(--card-bg-strong);
  border-radius: 10rpx;
  margin-bottom: 8rpx;
  transition: background 0.3s ease;
  border: 1rpx solid var(--border-color-subtle);
}

.deep-nested-subtask-header {
  display: flex;
  gap: 8rpx;
  align-items: flex-start;
  cursor: pointer;
}

.deep-nested-subtask-info {
  flex: 1;
}

.deep-nested-subtask-title {
  font-size: 24rpx;
  font-weight: 400;
  color: var(--text-secondary);
  display: block;
  transition: color 0.3s ease;
}

.deep-nested-subtask-meta {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-top: 4rpx;
  display: block;
  transition: color 0.3s ease;
}
</style>
