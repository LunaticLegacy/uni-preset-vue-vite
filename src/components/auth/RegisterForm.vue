<template>
  <view class="auth-page" :data-theme="themeAttr">
    <view class="auth-card">
      <image src="/static/logo.png" class="auth-brand" />
      <text class="auth-title">创建你的账号</text>

      <view class="form-row">
        <label class="field-label">用户名</label>
        <input
          class="input-control"
          :value="username"
          placeholder="输入用户名"
          @input="onUsernameInput"
        />
      </view>

      <view class="form-row">
        <label class="field-label">邮箱</label>
        <input
          type="email"
          class="input-control"
          :value="email"
          placeholder="你的邮箱地址"
          @input="onEmailInput"
        />
      </view>

      <view class="form-row">
        <label class="field-label">密码</label>
        <input
          type="password"
          class="input-control"
          :value="password"
          placeholder="设置密码（最少6位）"
          @input="onPasswordInput"
        />
      </view>

      <button class="btn-primary" @click="$emit('submit')">注册账号</button>

      <view class="auth-footer">
        <navigator url="/pages/auth/login" class="link">已有账号？去登录</navigator>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    username: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: ''
    },
    themeAttr: {
      type: String,
      default: 'light'
    }
  },
  methods: {
    onUsernameInput(event) {
      this.$emit('username-change', event.detail.value)
    },
    onEmailInput(event) {
      this.$emit('email-change', event.detail.value)
    },
    onPasswordInput(event) {
      this.$emit('password-change', event.detail.value)
    }
  }
}
</script>

<style src="../../pages/auth/register.css">
</style>
