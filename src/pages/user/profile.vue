<template>
  <view class="profile-container" :data-theme="themeAttr">
    <text class="screen-title">个人资料</text>
    <view class="form-field"><input class="text-input" v-model="full_name" placeholder="姓名" /></view>
    <view class="form-field"><input class="text-input" v-model="display_name" placeholder="显示名" /></view>
    <view class="form-field"><input class="text-input" v-model="bio" placeholder="简介" /></view>
    <button class="primary-button" @click="save">保存</button>
    <button class="danger-button" @click="logout">退出登录</button>
  </view>
</template>

<script src="./profile.js">
</script>

<style src="./profile.css">
</style>
