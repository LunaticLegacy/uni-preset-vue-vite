<template>
  <layout page-title="标签">
    <view class="page-root">
      <view class="page-card">
        <view class="card-header">
          <text class="page-title">标签</text>
          <view class="header-actions">
            <input class="input-sm" v-model="workspace_id" placeholder="工作空间ID" />
            <input class="input-sm" v-model="name" placeholder="名称" />
            <input class="input-sm" v-model="color" placeholder="#颜色" />
            <button class="btn-primary" @click="createTag">新建</button>
          </view>
        </view>

        <view class="card-body">
          <view v-if="loading" class="list-state">加载中...</view>
          <view v-else-if="error" class="list-state error">{{ error }}</view>
          <view v-else-if="tags.length === 0" class="list-state">暂无数据</view>
          <view v-else class="tag-grid">
            <view class="tag-card" v-for="t in tags" :key="t.id">
              <view style="display:flex;align-items:center;gap:12rpx">
                <view :style="{width:'12rpx',height:'12rpx',borderRadius:'3rpx',background:t.color||'#e5e7eb'}"></view>
                <text class="tag-name">{{ t.name }}</text>
              </view>
              <view class="tag-actions">
                <button class="btn-ghost" @click.stop="startEdit(t)">编辑</button>
                <button class="btn-danger" @click.stop="remove(t.id)">删除</button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./index.js">
</script>

<style src="./index.css">
</style>
