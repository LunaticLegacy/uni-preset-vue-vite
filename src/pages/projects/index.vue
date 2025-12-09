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
            <button class="btn btn-primary" @click="createProject">新建</button>
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
              <view class="workspace-actions">
                <button class="btn btn-secondary" @click.stop="edit(p)">编辑</button>
                <button class="btn btn-primary" @click.stop="openDetail(p.id)">进入项目</button>
                <button class="btn btn-danger" @click.stop="remove(p.id)">删除</button>
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
