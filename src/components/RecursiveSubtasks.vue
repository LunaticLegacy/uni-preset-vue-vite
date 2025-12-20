<template>
  <view :class="['subtasks', 'subtasks-level-' + level]" v-if="subtasks && subtasks.length">
    <view class="subtasks-title">子任务</view>
    <view v-for="(st, si) in subtasks" :key="si" class="subtask-item">
      <view :class="['subtask-name', 'level-' + level]">
        {{ getPrefix(level) }} {{ st.title }}
      </view>
      <view class="subtask-meta">{{ st.priority }} · {{ st.estimated_time }} {{ st.estimated_time_unit }}</view>
      <view class="subtask-desc">{{ st.description }}</view>
      
      <!-- 子任务的起始时间和结束时间 -->
      <view class="task-times">
        <view class="time-item">
          <text class="time-label">开始时间:</text>
          <input type="date" v-model="st.startDate" class="time-input" />
        </view>
        <view class="time-item">
          <text class="time-label">结束时间:</text>
          <input type="date" v-model="st.endDate" class="time-input" />
        </view>
      </view>
      
      <!-- 递归渲染更深层的子任务 -->
      <RecursiveSubtasks 
        :subtasks="st.subtasks" 
        :level="level + 1"
        v-if="st.subtasks && st.subtasks.length">
      </RecursiveSubtasks>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RecursiveSubtasks',
  props: {
    subtasks: {
      type: Array,
      default: () => []
    },
    level: {
      type: Number,
      default: 1
    }
  },
  methods: {
    getPrefix(level) {
      if (level === 1) return '-';
      if (level === 2) return '•';
      if (level === 3) return '◦';
      if (level === 4) return '▪';
      return '▫';
    }
  }
};
</script>

<style scoped>
.subtasks{
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.10);
}

.subtasks-title{
  font-size: 12px;
  font-weight: 700;
  opacity: 0.85;
  margin-bottom: 6px;
}

.subtask-item{
  margin-bottom: 8px;
}

.subtask-item--nested{
  margin-left: 10px;
  opacity: 0.95;
}

.subtask-name{
  font-size: 12px;
  font-weight: 700;
}

.level-1 {
  font-weight: 700;
}

.level-2 {
  font-weight: 600;
}

.level-3 {
  font-weight: 500;
}

.level-4 {
  font-weight: 400;
}

.level-5 {
  font-weight: 300;
}

.subtask-meta{
  font-size: 11px;
  opacity: 0.72;
  margin-top: 2px;
}

.subtask-desc{
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.5;
  margin-top: 4px;
}

.task-times {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.10);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 120px;
}

.time-label {
  font-size: 11px;
  opacity: 0.8;
}

.time-input {
  flex: 1;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
  color: white;
}
</style>