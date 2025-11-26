<template>
  <layout page-title="任务">
    <view class="page-root">
      <view class="page-card">
        <view class="card-header">
          <text class="page-title">任务</text>
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
          <view v-else class="grid">
            <view class="task-card" v-for="t in tasks" :key="t.id" @click="openDetail(t.id)">
              <text class="task-title">{{ t.title }}</text>
              <text class="task-meta">{{ t.status }} · {{ t.priority }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js"></script>

<style src="./index.css"></style>
