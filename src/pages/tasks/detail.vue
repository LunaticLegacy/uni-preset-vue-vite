<template>
  <layout page-title="任务详情">
    <view class="page-root">
      <view class="page-card detail-card">
        <view class="card-header">
          <view class="header-content">
            <text class="page-title">任务详情</text>
            <view v-if="currentProject" class="project-info">
              <text class="project-label">项目：</text>
              <text class="project-name">{{ currentProject.name || currentProject.id }}</text>
            </view>
          </view>
        </view>

        <view class="card-body" v-if="task">
          <!-- 基本信息 -->
          <view class="form-section">
            <view class="section-title">基本信息</view>
            <view class="form-row">
              <label class="field-label">标题</label>
              <input class="input-control" v-model="task.title" />
            </view>
            <view class="form-row">
              <label class="field-label">描述</label>
              <textarea class="textarea-control" v-model="task.description"></textarea>
            </view>
          </view>

          <!-- 状态和优先级 -->
          <view class="form-section">
            <view class="section-title">状态与优先级</view>
            <view class="form-row">
              <label class="field-label">状态</label>
              <picker :range="statuses" @change="onStatusChange">
                <view class="picker-control">{{ task.status || '请选择状态' }}</view>
              </picker>
            </view>
            <view class="form-row">
              <label class="field-label">优先级</label>
              <picker :range="priorities" range-key="label" @change="onPriorityChange">
                <view class="picker-control">{{ task.priority || '请选择优先级' }}</view>
              </picker>
            </view>
          </view>

          <!-- 指派和时间 -->
          <view class="form-section">
            <view class="section-title">指派与时间</view>
            <view class="form-row">
              <label class="field-label">指派用户ID</label>
              <input class="input-control" v-model="task.assignee_id" />
            </view>
            <view class="form-row">
              <label class="field-label">开始时间</label>
              <input class="input-control" type="date" v-model="task.start_date" />
            </view>
            <view class="form-row">
              <label class="field-label">结束时间</label>
              <input class="input-control" type="date" v-model="task.end_date" />
            </view>
            <view class="form-row">
              <label class="field-label">估计时间（分钟）</label>
              <input class="input-control" type="number" v-model="task.estimated_minutes" />
            </view>
          </view>

          <!-- 创建者和创建时间信息 -->
          <view class="form-section">
            <view class="section-title">元数据</view>
            <view class="info-row">
              <label class="field-label">创建者ID</label>
              <text class="info-text">{{ task.creator_id || '未指定' }}</text>
            </view>
            <view class="info-row">
              <label class="field-label">创建时间</label>
              <text class="info-text">{{ formatDateTime(task.created_at) || '未记录' }}</text>
            </view>
            <view class="info-row">
              <label class="field-label">更新时间</label>
              <text class="info-text">{{ formatDateTime(task.updated_at) || '未记录' }}</text>
            </view>
          </view>

          <!-- 子任务 -->
          <RecursiveSubtasks
            v-if="task.subtasks && task.subtasks.length > 0"
            :subtasks="task.subtasks"
            :level="1"
          />

          <!-- 操作按钮 -->
          <view class="form-actions">
            <button class="btn-primary" @click="save">保存</button>
            <button class="btn-secondary" @click="goBack">返回</button>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./detail.js">
</script>

<style src="./detail.css">
</style>
