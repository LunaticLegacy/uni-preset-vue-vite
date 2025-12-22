<template>
  <view class="auth-page">
    <view class="auth-card">
      <image src="/static/logo.png" class="auth-brand" />
      <text class="auth-title">登录到 星之梦</text>

      <view class="form-row">
        <label class="field-label">邮箱</label>
        <input class="input-control" v-model="email" placeholder="请输入邮箱地址" />
      </view>

      <view class="form-row">
        <label class="field-label">密码</label>
        <view class="password-row">
          <input :type="showPassword ? 'text' : 'password'" class="input-control" v-model="password" placeholder="请输入密码" />
          <button class="eye-toggle" @click="toggleShow">{{ showPassword ? '隐藏' : '显示' }}</button>
        </view>
      </view>

      <button class="btn-primary" @click="login">登录</button>

      <view class="auth-footer">
        <navigator url="/pages/auth/register" class="link">没有账号？去注册</navigator>
        <navigator url="/pages/auth/login" class="link muted">忘记密码</navigator>
      </view>
    </view>
  </view>
</template>

<script src="./login.js">
</script>

<style src="./login.css">
</style>
