<template>
  <view class="auth-page" :data-theme="themeAttr">
    <view class="auth-card">
      <image src="/static/logo.png" class="auth-brand" />
      <text class="auth-title">登录到 星之梦</text>

      <view class="form-row">
        <label class="field-label">邮箱</label>
        <input
          class="input-control"
          :value="email"
          placeholder="邮箱地址"
          @input="onEmailInput"
        />
      </view>

      <view class="form-row">
        <label class="field-label">密码</label>
        <view class="password-row">
          <input
            :type="showPassword ? 'text' : 'password'"
            class="input-control"
            :value="password"
            placeholder="密码"
            @input="onPasswordInput"
          />
          <button class="eye-toggle" @click="$emit('toggle-show')">
            {{ showPassword ? '隐藏' : '显示' }}
          </button>
        </view>
      </view>

      <button class="btn-primary" @click="$emit('submit')">登录</button>

      <view class="auth-footer">
        <text class="link" @click="$emit('switch-register')">没有账号？去注册</text>
        <text class="link muted">忘记密码</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    email: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      default: ''
    },
    showPassword: {
      type: Boolean,
      default: false
    },
    themeAttr: {
      type: String,
      default: 'light'
    }
  },
  methods: {
    onEmailInput(event) {
      this.$emit('email-change', event.detail.value)
    },
    onPasswordInput(event) {
      this.$emit('password-change', event.detail.value)
    }
  }
}
</script>

<style src="@/components/auth/auth.css">
</style>
