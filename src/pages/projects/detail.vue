<template>
  <layout page-title="项目详情">
    <view class="page-root">
      <view class="page-card detail-card">
        <view class="card-header">
          <text class="page-title">项目详情</text>
        </view>
        <view class="card-body" v-if="project">
          <view class="form-row">
            <label class="field-label">标题</label>
            <input class="input-control" v-model="project.title" />
          </view>
          <view class="form-row">
            <label class="field-label">描述</label>
            <input class="input-control" v-model="project.description" />
          </view>
          
          <!-- 任务选择和显示区域 -->
          <view class="section-title">关联任务</view>
          <view class="task-list" v-if="tasks && tasks.length > 0">
            <view class="task-item" v-for="task in tasks" :key="task.id">
              <text class="task-title">{{ task.title }}</text>
              <text class="task-status">{{ task.status }}</text>
            </view>
          </view>
          <view class="empty-task" v-else>
            暂无关联任务
          </view>
          
          <view class="form-actions">
            <button class="btn btn-secondary" @click="navigateToTasks">管理任务</button>
            <button class="btn btn-primary" @click="save">保存</button>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./detail.js"></script>

<style src="./detail.css"></style>