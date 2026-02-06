# 项目开发文档

## 1. 项目概述

这是一个基于 `UniApp` + `Vue 3` + `Vite` 的前端项目，用于开发跨平台应用。项目主要功能包括用户认证、工作空间管理、项目管理、任务管理、番茄钟等。

## 2. 技术栈

- `Vue 3`：渐进式JavaScript框架，用于构建用户界面
- `UniApp`：跨平台开发框架，支持编译到多个平台
- `Vite`：快速的构建工具，提供快速的开发体验
- `JavaScript`：主要开发语言
- `uni-ui`：UI组件库（可能使用）

## 3. 开发环境

### 环境要求
- `Node.js` (推荐版本 16+)
- `npm` 或 `yarn`

### 安装依赖
```bash
npm install
```

## 4. 项目结构

```
.
├── src
│   ├── components           # 公共组件
│   │   ├── auth
│   │   │   ├── LoginForm.vue
│   │   │   └── RegisterForm.vue
│   │   ├── Layout.css
│   │   ├── Layout.js
│   │   ├── Layout.vue
│   │   ├── RecursiveSubtasks.vue
│   │   └── TaskItem.vue
│   ├── pages                # 页面组件
│   │   ├── auth
│   │   │   ├── login.css
│   │   │   ├── login.js
│   │   │   ├── login.vue
│   │   │   ├── register.css
│   │   │   ├── register.js
│   │   │   └── register.vue
│   │   ├── index
│   │   │   ├── index.css
│   │   │   ├── index.js
│   │   │   └── index.vue
│   │   ├── pomodoro
│   │   │   ├── index.css
│   │   │   ├── index.js
│   │   │   └── index.vue
│   │   ├── projects
│   │   │   ├── detail.css
│   │   │   ├── detail.js
│   │   │   ├── detail.vue
│   │   │   ├── index.css
│   │   │   ├── index.js
│   │   │   └── index.vue
│   │   ├── tasks
│   │   │   ├── detail.css
│   │   │   ├── detail.js
│   │   │   ├── detail.vue
│   │   │   ├── index.css
│   │   │   ├── index.js
│   │   │   └── index.vue
│   │   ├── user
│   │   │   ├── profile.css
│   │   │   ├── profile.js
│   │   │   └── profile.vue
│   │   └── workspaces
│   │       ├── detail.css
│   │       ├── detail.js
│   │       ├── detail.vue
│   │       ├── index.css
│   │       ├── index.js
│   │       └── index.vue
│   ├── services             # API服务
│   │   ├── http.js
│   │   └── mock.js
│   ├── utils                # 工具函数
│   │   ├── storage.js
│   │   ├── theme.js
│   │   └── time.js
│   ├── App.vue              # 应用主组件
│   ├── config.js            # 配置文件
│   ├── main.js              # 应用入口
│   ├── manifest.json        # 应用配置
│   ├── pages.json           # 页面路由配置
│   ├── shime-uni.d.ts
│   └── uni.scss             # 全局样式
├── README.md
├── builder.config.json
├── index.html
├── package-lock.json
├── package.json
├── shims-uni.d.ts
├── vite.config.js
└── 前端需求.md
```

## 5. 页面路由

根据 [pages.json](./src/pages.json) 配置，项目包含以下页面：

- 首页：`pages/index/index`
- 认证页面：
  - 登录：`pages/auth/login`
  - 注册：`pages/auth/register`
- 用户页面：
  - 个人资料：`pages/user/profile`
- 工作空间页面：
  - 工作空间列表：`pages/workspaces/index`
  - 工作空间详情：`pages/workspaces/detail`
- 项目页面：
  - 项目列表：`pages/projects/index`
  - 项目详情：`pages/projects/detail`
- 任务页面：
  - 任务列表：`pages/tasks/index`
- 番茄钟页面：`pages/pomodoro/index`

## 6. 功能模块

### 6.1 用户认证
- 用户注册：`POST /user/register`
- 用户登录：`POST /user/login`
- 用户登出：`POST /user/logout`
- 个人资料管理：`GET/PUT/DELETE /user/profile/{user_id}`

### 6.2 工作空间管理
- 创建工作空间：`POST /workspaces`
- 工作空间列表：`GET /workspaces`
- 工作空间详情：`GET /workspaces/{id}`
- 更新工作空间：`PUT /workspaces/{id}`
- 删除工作空间：`DELETE /workspaces/{id}`

### 6.3 项目管理
- 创建项目：`POST /projects`
- 项目列表：`GET /projects?workspace_id=ws`
- 项目详情：`GET /projects/{id}`
- 更新项目：`PUT /projects/{id}`
- 删除项目：`DELETE /projects/{id}`

### 6.4 任务管理
- 创建任务：`POST /tasks`
- 任务列表：`GET /tasks?workspace_id=ws&project_id=proj`
- 任务详情：`GET /tasks/{id}`
- 更新任务：`PUT /tasks/{id}`
- 删除任务：`DELETE /tasks/{id}`

### 6.5 标签管理
- 创建标签：`POST /tags`
- 标签列表：`GET /tags?workspace_id=ws`
- 关联标签到任务：`POST /tags/attach`
- 从任务解绑标签：`POST /tags/detach`

### 6.6 评论功能
- 创建评论：`POST /comments`
- 评论列表：`GET /comments?resource_type=task&resource_id=task-uuid`
- 删除评论：`DELETE /comments/{id}`

### 6.7 附件管理
- 创建附件：`POST /attachments`
- 附件列表：`GET /attachments?attached_to_type=task&attached_to_id=task-uuid`
- 删除附件：`DELETE /attachments/{id}`

### 6.8 通知系统
- 创建通知：`POST /notifications`
- 通知列表：`GET /notifications?user_id=user-uuid&unread_only=false`
- 标记已读：`POST /notifications/{id}/read`

### 6.9 搜索功能
- 全局搜索：`GET /search?workspace_id=ws-uuid&q=home`

### 6.10 AI 功能
- 任务分解：`POST /ai/decompose`
- 任务建议：`POST /ai/suggestions/{task_id}`
- AI 对话：`POST /ai/chat`

## 7. 开发规范

### 7.1 代码规范
1. 使用JSDoc为函数和变量添加类型注解和说明文档
```javascript
/**
 * 计算两个数的和
 * @param {number} a - 第一个数字
 * @param {number} b - 第二个数字
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}
```

2. 组件命名规范
- 所有的组件名必须使用大写字母开头的驼峰命名法，例如：`UserProfile.vue`、`TaskList.vue`
- 组件文件名以`.vue`结尾

3. 变量和函数命名规范
- 使用驼峰命名法，例如：`userName`、`getUserInfo()`
- 常量使用全大写字母，单词之间用下划线分割，例如：`API_BASE_URL`

4. CSS 类名规范
- 使用小写字母，单词之间用连字符分割，例如：`.user-profile`、`.task-item`

### 7.2 组件开发规范
1. Vue组件结构
```vue
<template>
  <!-- 组件模板 -->
</template>

<script>
// 组件逻辑
export default {
  name: 'ComponentName',
  props: {},
  data() {
    return {}
  },
  methods: {}
}
</script>

<style scoped>
/* 组件样式 */
</style>
```

2. 组件通信
- 父组件向子组件传递数据使用 `props`
- 子组件向父组件传递数据使用 `$emit`
- 跨级组件通信可使用 `provide/inject`

### 7.3 路由规范
1. 页面路由配置在 `pages.json` 文件中
2. 页面路径遵循 `pages/功能模块/页面名` 的结构
3. 导航使用 `uni.navigateTo`、`uni.redirectTo` 等 API

### 7.4 状态管理
1. 简单状态可使用 Vue 的响应式系统
2. 复杂全局状态可使用 Vuex 或 Pinia（如果项目需要）
3. 用户信息等全局数据存储在 `utils/storage.js` 中

### 7.5 API 调用规范
1. 所有 API 调用统一在 `services/` 目录下管理
2. 使用封装好的 `request` 函数进行网络请求
3. API 地址统一配置在 `config.js` 中

## 8. 运行和构建

### 开发环境运行
```bash
# 运行H5平台
npm run dev:h5

# 运行微信小程序
npm run dev:mp-weixin

# 运行其他平台，如支付宝小程序、百度小程序等
npm run dev:mp-alipay
```

### 构建项目
```bash
# 构建H5平台
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 构建其他平台
npm run build:mp-alipay
```

## 9. API 请求规范

1. 统一请求头：
   - 请求默认携带 `Authorization: Bearer <token>`（注册/登录除外）
   - time 使用 ISO8601 格式

2. 错误处理：
   - 401 退登重登录
   - 其他错误使用 toast/弹窗提示
   - 列表有加载/空态/错误态处理

3. 在 `services/http.js` 中统一封装 http 层，自动注入 token、处理重试与错误码

## 10. 测试规范

1. 单元测试使用 Jest 或 Vitest
2. 组件测试使用 @testing-library/vue
3. E2E 测试使用 Cypress 或 Puppeteer
4. 测试文件放在 `__tests__` 目录中，与被测试文件保持相同结构

## 11. 代码提交规范

请`fork`本仓库，并创建一个新的分支，随后签出到创建的分支：
- 你的所有改动都必须放在这个分支上，并上传到你自己fork后的仓库
- 确定代码完工后，请对主仓库发起`pull request`
- 本代码采用模块化开发
    - 请在`src`目录内为你的模块创建相应文件夹，并在文件夹内写入组件或功能模块