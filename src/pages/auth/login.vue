<template>
  <LoginForm
    :email="email"
    :password="password"
    :show-password="showPassword"
    :theme-attr="themeAttr"
    @email-change="email = $event"
    @password-change="password = $event"
    @toggle-show="toggleShow"
    @submit="login"
  />
</template>

<script src="./login.js">
</script>

