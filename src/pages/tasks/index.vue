<template>
  <layout page-title="任务">
    <view class="page-root">
      <view class="page-card">
        <view class="card-header">
          <view class="header-title-section">
            <text class="page-title">任务</text>
            <view v-if="currentProject" class="current-project-info">
              <text class="project-label">当前项目：</text>
              <text class="project-name">{{ currentProject.name || currentProject.id }}</text>
            </view>
          </view>
          <view class="header-actions">
            <text v-if="workspace" class="selected-ws">当前工作空间：{{ workspace.name || workspace.id }}</text>
            <navigator v-else url="/pages/workspaces/index" class="action-link link">去选择工作空间</navigator>
            <input class="input-sm" v-model="project_id" placeholder="项目ID" />
            <input class="input-sm" v-model="title" placeholder="标题" />
            <input class="input-sm" v-model="description" placeholder="描述" />
            <picker :range="priorities" range-key="label" @change="onPriority"><view class="picker-box">{{ priority || '优先级' }}</view></picker>
            <button class="btn-primary" @click="createTask">新建</button>
          </view>
        </view>

        <view class="card-body">
          <view v-if="loading" class="list-state">加载中...</view>
          <view v-else-if="error" class="list-state error">{{ error }}</view>
          <view v-else-if="tasks.length === 0" class="list-state">暂无数据</view>
          <view v-else class="tasks-container">
            <view v-for="task in tasks" :key="task.id" class="task-item">
              <view class="task-header" @click="toggleTaskExpand(null, task.id)">
                <view class="expand-indicator">{{ isTaskExpanded(null, task.id) ? '▼' : '▶' }}</view>
                <view class="task-info">
                  <text class="task-title">{{ task.title }}</text>
                  <text class="task-meta">{{ task.status }} · {{ task.priority }}</text>
                  <text v-if="task.subtasks && task.subtasks.length > 0" class="subtask-count">{{ task.subtasks.length }} 个子任务</text>
                </view>
              </view>

              <view v-if="isTaskExpanded(null, task.id)" class="task-details">
                <view class="detail-section">
                  <view class="section-title">描述</view>
                  <text class="detail-text">{{ task.description || '无描述' }}</text>
                </view>

                <view class="detail-section">
                  <view class="section-title">基本信息</view>
                  <view class="info-row">
                    <text class="info-label">项目ID:</text>
                    <text class="info-value">{{ task.project_id }}</text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">优先级:</text>
                    <text class="info-value">{{ task.priority }}</text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">状态:</text>
                    <text class="info-value">{{ task.status }}</text>
                  </view>
                  <view class="info-row">
                    <text class="info-label">预计时间:</text>
                    <text class="info-value">{{ task.estimated_minutes }} 分钟</text>
                  </view>
                </view>

                <view v-if="task.subtasks && task.subtasks.length > 0" class="detail-section">
                  <view class="section-title">子任务</view>
                  <view class="subtasks-list">
                    <view v-for="(subtask, idx) in task.subtasks" :key="subtask.id || idx" class="subtask-item">
                      <view class="subtask-header" @click="toggleTaskExpand(task.id, subtask.id)">
                        <view v-if="subtask.subtasks && subtask.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(task.id, subtask.id) ? '▼' : '▶' }}</view>
                        <view v-else class="expand-indicator-empty">·</view>
                        <view class="subtask-info">
                          <text class="subtask-title">{{ subtask.title }}</text>
                          <text class="subtask-meta">{{ subtask.status }} · {{ subtask.priority }}</text>
                        </view>
                      </view>
                      <view v-if="subtask.description" class="subtask-desc">{{ subtask.description }}</view>

                      <view v-if="subtask.subtasks && subtask.subtasks.length > 0 && isTaskExpanded(task.id, subtask.id)" class="nested-subtasks">
                        <view v-for="(nested, nidx) in subtask.subtasks" :key="nested.id || nidx" class="nested-subtask-item">
                          <view class="nested-subtask-header" @click="toggleTaskExpand(subtask.id, nested.id)">
                            <view v-if="nested.subtasks && nested.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(subtask.id, nested.id) ? '▼' : '▶' }}</view>
                            <view v-else class="expand-indicator-empty">·</view>
                            <view class="nested-subtask-info">
                              <text class="nested-subtask-title">{{ nested.title }}</text>
                              <text class="nested-subtask-meta">{{ nested.status }} · {{ nested.priority }}</text>
                            </view>
                          </view>
                          <view v-if="nested.description" class="nested-subtask-desc">{{ nested.description }}</view>

                          <view v-if="nested.subtasks && nested.subtasks.length > 0 && isTaskExpanded(subtask.id, nested.id)" class="deep-nested-subtasks">
                            <view v-for="(deep, didx) in nested.subtasks" :key="deep.id || didx" class="deep-nested-subtask-item">
                              <view class="deep-nested-subtask-header" @click="toggleTaskExpand(nested.id, deep.id)">
                                <view v-if="deep.subtasks && deep.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(nested.id, deep.id) ? '▼' : '▶' }}</view>
                                <view v-else class="expand-indicator-empty">·</view>
                                <view class="deep-nested-subtask-info">
                                  <text class="deep-nested-subtask-title">{{ deep.title }}</text>
                                  <text class="deep-nested-subtask-meta">{{ deep.status }} · {{ deep.priority }}</text>
                                </view>
                              </view>
                              <view v-if="deep.description" class="deep-nested-subtask-desc">{{ deep.description }}</view>
                            </view>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js"></script>

<style src="./index.css"></style>
