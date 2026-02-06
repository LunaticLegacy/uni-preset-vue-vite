<div align="center">

# 🧩 星之梦 任务管理助手 · 前端应用

[![GitHub stars](https://img.shields.io/github/stars/LunaticLegacy/uni-preset-vue-vite?style=social)](https://github.com/LunaticLegacy/uni-preset-vue-vite/stargazers)
[![CI](https://github.com/LunaticLegacy/uni-preset-vue-vite/actions/workflows/<ci_workflow>.yml/badge.svg)](https://github.com/LunaticLegacy/uni-preset-vue-vite/actions/workflows/<ci_workflow>.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org/)
[![UniApp](https://img.shields.io/badge/uni--app-Vue3%20%2B%20Vite-2F80ED)](#)

> 📱 基于 uni-app + Vue3 + Vite 的多端前端项目。面向 H5 / 小程序（按需扩展），通过调用后端 API 提供完整业务能力。

[**功能特性**](#-功能特性) • [**快速开始**](#-快速开始) • [**部署指南**](docs/DEPLOY.md) • [**开发文档**](docs/DEVELOPMENT.md) • [**更新日志**](docs/CHANGELOG.md)

</div>

---

## ✨ 功能特性

### 🎯 核心能力
- **多端构建**：H5 / 微信小程序（可扩展到更多端）
- **模块化组织**：页面、组件、接口层按业务域拆分，便于协作共创
- **统一请求层**：API Base URL、拦截器、错误处理集中管理
- **工程化规范**：脚本命令统一、可接入 CI（lint/build/test）
- **环境隔离**：开发/测试/生产通过环境变量切换后端地址

### 🧩 技术栈
- **uni-app** + **Vue 3**
- **Vite**

---

## 🖼️ 预览

> 建议放 1～3 张关键页面截图或动图（登录/主流程/核心功能页）。

![功能演示](./docs/assets/demo.gif)

---

## 🚀 快速开始

### 1) 环境要求
- Node.js **18+**
- npm / pnpm / yarn 任意一种包管理器（本文以 npm 为例）

### 2) 安装依赖
```bash
npm install
