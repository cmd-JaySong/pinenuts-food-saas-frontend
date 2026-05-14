# 松籽餐饮数字化管理平台 - 前端

基于 Vue 3 + TypeScript 构建的餐饮 SaaS 管理平台前端应用。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | 渐进式前端框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6.0 | 构建工具 |
| Element Plus | 2.9 | UI 组件库 |
| Vue Router | 4.5 | 路由管理 |
| Pinia | 2.3 | 状态管理 |
| Axios | 1.7 | HTTP 请求库 |
| SCSS | - | CSS 预处理器 |

## 项目结构

```
src/
├── api/            # 接口请求模块
├── components/     # 公共组件（AppHeader、Sidebar 等）
├── layouts/        # 布局组件
├── router/         # 路由配置
├── stores/         # Pinia 状态管理
├── styles/         # 全局样式
├── utils/          # 工具函数（Axios 封装等）
├── views/          # 页面视图
├── App.vue         # 根组件
└── main.ts         # 入口文件
```

## 本地开发

### 环境要求

- Node.js 18+
- pnpm

### 启动步骤

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 启动开发服务器：
   ```bash
   pnpm dev
   ```

3. 访问 http://localhost:5173

> **注意**：开发模式下 `/api` 请求会自动代理到 http://localhost:8080，请确保后端服务已启动。

### 构建

```bash
pnpm build
```

构建产物输出到 `dist/` 目录。

### 类型检查

```bash
pnpm type-check
```

## Docker 启动

参考根目录 `docker-compose.yml`，一键启动全部服务：

```bash
docker-compose up -d
```

前端容器使用 Nginx 托管静态资源，访问 http://localhost。

## Git 提交规范

| 前缀 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | 修复 Bug |
| `refactor:` | 代码重构 |
| `docs:` | 文档变更 |
| `style:` | 代码格式调整 |
| `test:` | 测试相关 |
| `chore:` | 构建/工具变更 |

示例：`feat: 添加门店列表页面`
