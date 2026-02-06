<template>
  <layout ref="layout" page-title="首页" @auth-change="checkLoginStatus">
    <view class="content-wrapper">
      <!-- 登录前的界面 -->
      <view v-if="!isLoggedIn">
        <text class="page-heading">欢迎使用 Uni Workspace</text>
        <view class="card-grid">
          <view class="card" @click="openLogin">登录</view>
          <view class="card" @click="openRegister">注册</view>
          <navigator url="/pages/user/profile" class="card">个人资料</navigator>
          <navigator url="/pages/workspaces/index" class="card">工作空间</navigator>
          <navigator url="/pages/projects/index" class="card">项目</navigator>
          <navigator url="/pages/tasks/index" class="card">任务</navigator>
        </view>
        <button class="nav-btn" @click="openRegister">去注册</button>
      </view>
      
      <!-- 登录后的工作台界面 -->
      <view v-else>
        <text class="page-heading">工作台</text>
        <view class="welcome-message">
          <text>欢迎回来！</text>
        </view>
        
        <view class="dashboard-stats">
          <view class="stat-card">
            <text class="stat-value">{{ currentWorkspace ? currentWorkspace.name : '未选择' }}</text>
            <text class="stat-label">当前工作空间</text>
          </view>
          
          <view class="stat-card">
            <text class="stat-value">{{ currentProject ? currentProject.name : '未选择' }}</text>
            <text class="stat-label">当前项目</text>
          </view>
        </view>
        
        <view class="quick-actions">
          <text class="section-title">快速操作</text>
          <view class="card-grid">
            <view class="card" @click="goToWorkspaces">
              <text>工作空间</text>
            </view>
            <view class="card" @click="goToProjects">
              <text>项目</text>
            </view>
            <view class="card" @click="goToTasks">
              <text>任务</text>
            </view>
            <view class="card" @click="goToProfile">
              <text>个人资料</text>
            </view>
          </view>
        </view>
        
        <button class="nav-btn" @click="logout">退出登录</button>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js">
</script>

<style src="./index.css" scoped>
</style>
