<template>
  <layout page-title="项目">
    <view class="page-root">
      <view class="page-card">
        <view class="card-header">
          <text class="page-title">项目</text>
          <view class="header-actions">
            <text v-if="workspace" class="selected-ws">当前工作空间：{{ workspace.name || workspace.id }}</text>
            <navigator v-else url="/pages/workspaces/index" class="action-link link">去选择工作空间</navigator>
            <input class="input-sm" v-model="title" placeholder="标题" />
            <input class="input-sm" v-model="description" placeholder="描述" />
            <button class="btn-primary" @click="createProject">新建</button>
          </view>
        </view>

        <view class="card-body">
          <view v-if="loading" class="list-state">加载中...</view>
          <view v-else-if="error" class="list-state error">{{ error }}</view>
          <view v-else-if="projects.length === 0" class="list-state">暂无数据</view>
          <view v-else class="grid">
            <view class="project-card" v-for="p in projects" :key="p.id" @click="openDetail(p.id)">
              <text class="project-title">{{ p.title }}<br></text>
              <text class="project-sub">{{ p.description }}</text>
            </view>
            <view class="workspace-actions">
              <button class="btn-ghost" @click.stop="edit(p)">编辑</button>
              <button class="btn-primary" @click.stop="chooseproject(p)">进入项目</button>
              <button class="btn-danger" @click.stop="remove(p.id)">删除</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js"></script>

<style>
.page-root{ padding:24rpx }
.page-card{ background:#fff; border-radius:12rpx; box-shadow:0 8rpx 24rpx rgba(8,28,45,0.06); overflow:hidden }
.card-header{ display:flex; align-items:center; justify-content:space-between; padding:20rpx 24rpx; border-bottom:1rpx solid #f1f5f9 }
.page-title{ font-size:32rpx; color:#111827 }
.header-actions{ display:flex; gap:12rpx; align-items:center; flex-wrap: wrap }
.input-sm{ padding:12rpx; border-radius:8rpx; border:1rpx solid #e6e9ee }
.btn-primary{ background:#2563eb; color:#fff; padding:10rpx 16rpx; border-radius:10rpx }
.selected-ws{ color:#2563eb; font-size:26rpx }
.link{ color:#2563eb }

.card-body{ padding:20rpx }
.grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:16rpx }
.project-card{ background:#fff; border-radius:10rpx; padding:16rpx; box-shadow:0 4rpx 12rpx rgba(8,28,45,0.04) }
.project-title{ font-size:28rpx; color:#0f172a }
.project-sub{ color:#6b7280; margin-top:6rpx }
.list-state{ padding:20rpx; text-align:center; color:#6b7280 }
.list-state.error{ color:#ef4444 }

@media (max-width:640px){ .grid{ grid-template-columns: repeat(1, 1fr) } }
</style>
