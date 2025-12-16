<template>
  <view class="app-root">
    <view :class="['sidebar', { collapsed: isSidebarCollapsed }]">
      <image src="/static/logo.png" class="sidebar-logo" />
      <view class="collapse-toggle" @click="toggleSidebar">
        <text>{{ isSidebarCollapsed ? '▶' : '◀' }}</text>
      </view>
      <view class="sidebar-nav">
        <navigator url="/pages/workspaces/index" class="sidebar-link">
          <text class="icon">📁</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">工作空间</text>
        </navigator>
        <navigator url="/pages/projects/index" class="sidebar-link">
          <text class="icon">📊</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">项目</text>
        </navigator>
        <navigator url="/pages/tasks/index" class="sidebar-link">
          <text class="icon">✅</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">任务</text>
        </navigator>
        <navigator url="/pages/tags/index" class="sidebar-link">
          <text class="icon">🏷️</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">标签</text>
        </navigator>
        <navigator url="/pages/comments/index" class="sidebar-link">
          <text class="icon">💬</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">评论</text>
        </navigator>
        <navigator url="/pages/attachments/index" class="sidebar-link">
          <text class="icon">📎</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">附件</text>
        </navigator>
        <navigator url="/pages/notifications/index" class="sidebar-link">
          <text class="icon">🔔</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">通知</text>
        </navigator>
        <navigator url="/pages/search/index" class="sidebar-link">
          <text class="icon">🔍</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">搜索</text>
        </navigator>
      </view>
    </view>

    <view 
      class="main-area" 
      :class="{
        'with-sidebar-collapsed': isSidebarCollapsed
      }"
    >
      <view class="topbar">
        <text class="topbar-title">{{ pageTitle || '仪表盘' }}</text>
        <view class="topbar-status">
          <text class="status-text">{{ authed ? '已登录' : '未登录' }}</text>
          <text v-if="authed" class="status-text muted">ID: {{ userId || '未知' }}</text>
          <navigator v-if="!authed" url="/pages/auth/login" class="action-link">登录</navigator>
          <navigator v-if="!authed" url="/pages/auth/register" class="action-link">注册</navigator>
          <button v-else class="action-link btn-secondary" @click="logout">退出</button>
        </view>
      </view>

      <view class="content-body">
        <slot />
      </view>
    </view>
  </view>
</template>

<script src="./Layout.js">
</script>

<style src="./Layout.css">
</style>
