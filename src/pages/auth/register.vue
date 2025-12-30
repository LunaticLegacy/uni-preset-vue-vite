<template>
  <RegisterForm
    :username="username"
    :email="email"
    :password="password"
    :theme-attr="themeAttr"
    @username-change="username = $event"
    @email-change="email = $event"
    @password-change="password = $event"
    @submit="register"
  />
</template>

<script src="./register.js">
</script>

