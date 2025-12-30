<template>
  <view class="app-root" :data-theme="isDarkMode ? 'dark' : 'light'">
    <view :class="['sidebar', { collapsed: isSidebarCollapsed }]">
      <image src="/static/logo.png" class="sidebar-logo" @click="goToHome" />
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
        <navigator url="/pages/pomodoro/index" class="sidebar-link">
          <text class="icon">🍅</text>
          <text :class="{ 'link-text': !isSidebarCollapsed, 'collapsed-text': isSidebarCollapsed }">番茄钟</text>
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
          <text v-if="authed && currentProject" class="status-text muted">项目: {{ currentProject.name || '未知' }}</text>
          <button class="theme-toggle" @click="toggleDarkMode" :title="isDarkMode ? '切换浅色模式' : '切换深色模式'">
            <text>{{ isDarkMode ? '☀️' : '🌙' }}</text>
          </button>
          <button v-if="!authed" class="action-link" @click="openLogin">登录</button>
          <button v-if="!authed" class="action-link" @click="openRegister">注册</button>
          <button v-else class="action-link btn-secondary" @click="logout">退出</button>
        </view>
      </view>

      <view class="content-body">
        <slot />
      </view>
    </view>

    <view v-if="showLoginModal" class="auth-modal">
      <view class="auth-modal-overlay" @click="closeAuth"></view>
      <view class="auth-modal-body" @click.stop>
        <LoginForm
          :email="loginEmail"
          :password="loginPassword"
          :show-password="loginShowPassword"
          :theme-attr="themeAttr"
          @email-change="loginEmail = $event"
          @password-change="loginPassword = $event"
          @toggle-show="toggleLoginShow"
          @submit="submitLogin"
        />
      </view>
    </view>

    <view v-if="showRegisterModal" class="auth-modal">
      <view class="auth-modal-overlay" @click="closeAuth"></view>
      <view class="auth-modal-body" @click.stop>
        <RegisterForm
          :username="registerUsername"
          :email="registerEmail"
          :password="registerPassword"
          :theme-attr="themeAttr"
          @username-change="registerUsername = $event"
          @email-change="registerEmail = $event"
          @password-change="registerPassword = $event"
          @submit="submitRegister"
        />
      </view>
    </view>
  </view>
</template>

<script src="./Layout.js">
</script>

<style src="./Layout.css">
</style>
