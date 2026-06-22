# Code Grader Vue - 项目技术文档

## 技术栈

### 核心框架
- **Vue 3.5.38** - 渐进式 JavaScript 框架
- **Vite 8.0.16** - 下一代前端构建工具
- **Vue Router 5.1.0** - Vue.js 官方路由管理器
- **Pinia 3.0.4** - Vue.js 状态管理库

### UI 组件库
- **Element Plus 2.14.2** - 基于 Vue 3 的组件库
- **@element-plus/icons-vue 2.3.2** - Element Plus 图标库

### 代码编辑器
- **Monaco Editor 0.55.1** - VS Code 的核心代码编辑器组件

### 开发工具
- **@vitejs/plugin-vue 6.0.7** - Vite 的 Vue 插件
- **TypeScript ~6.0.3** - JavaScript 的超集，提供类型检查
- **ESLint 10.5.0** - 代码质量检查工具
- **Oxlint ~1.65.0** - 高性能 JavaScript/TypeScript linter
- **Oxfmt 0.50.0** - 代码格式化工具
- **vue-tsc 3.3.5** - Vue 的 TypeScript 语言服务

### Element Plus 按需导入
- **unplugin-auto-import 21.0.0** - 自动导入 API（ref, computed 等）
- **unplugin-vue-components 32.1.0** - 组件自动注册

### 构建优化
- **vite-plugin-compression2 2.5.3** - Gzip / Brotli 压缩
- **vite-plugin-vue-devtools 8.1.3** - Vue DevTools 集成
- **npm-run-all2 8.0.4** - 并行/串行运行多个 npm scripts

## 代码规范

### 命名规范
- **文件名**: 使用 PascalCase 命名组件文件 (如 `CodeBlock.vue`)
- **变量名**: 使用 camelCase 格式
- **常量名**: 使用 UPPER_SNAKE_CASE 格式
- **组件名**: 使用 PascalCase 格式

### Vue 组件规范
- 所有组件使用 `<script setup lang="ts">` 语法
- 样式使用 `<style scoped>` 作用域样式
- 路由视图组件按角色分目录存放

### 目录结构
```
code-grader-vue/
├── public/                 # 静态资源，直接复制到输出目录
│   └── favicon.ico        # 网站图标
├── src/                   # 源代码目录
│   ├── api/               # API 接口定义
│   │   ├── http.ts        # HTTP 请求封装（axios 实例）
│   │   └── services.ts    # API 服务调用
│   ├── components/        # 公共组件
│   │   ├── CodeBlock.vue      # 代码块展示组件
│   │   ├── EntityDialog.vue   # 实体编辑对话框组件
│   │   ├── MetricPanel.vue    # 指标面板组件
│   │   ├── MonacoEditor.vue   # 代码编辑器组件（Monaco Editor）
│   │   └── PageIntro.vue      # 页面介绍组件
│   ├── config/            # 配置文件
│   │   └── navigation.ts  # 导航配置（角色-路由映射）
│   ├── router/            # 路由配置
│   │   └── index.ts       # 路由定义（懒加载 + 角色守卫）
│   ├── stores/            # Pinia 状态管理
│   │   └── auth.ts        # 认证状态管理（用户/角色/token）
│   ├── types/             # TypeScript 类型定义
│   │   ├── api.ts             # API 类型定义
│   │   ├── auto-imports.d.ts  # 自动导入类型声明（自动生成）
│   │   └── components.d.ts    # 组件类型声明（自动生成）
│   ├── utils/             # 工具函数
│   │   └── helpers.ts     # 辅助函数
│   ├── views/             # 页面视图组件
│   │   ├── admin/         # 管理员页面
│   │   │   ├── AdminDashboardView.vue
│   │   │   ├── AdminDepartmentsView.vue
│   │   │   ├── AdminDictionaryView.vue
│   │   │   ├── AdminMajorsView.vue
│   │   │   └── AdminUsersView.vue
│   │   ├── layouts/       # 布局组件
│   │   │   └── AppLayout.vue
│   │   ├── student/       # 学生页面
│   │   │   ├── StudentClassesView.vue
│   │   │   ├── StudentGradesView.vue
│   │   │   ├── StudentProfileView.vue
│   │   │   └── StudentWorkspaceView.vue
│   │   ├── teacher/       # 教师页面
│   │   │   ├── TeacherAssignmentsView.vue
│   │   │   ├── TeacherClassesView.vue
│   │   │   ├── TeacherPlagiarismView.vue
│   │   │   ├── TeacherProfileView.vue
│   │   │   └── TeacherReviewsView.vue
│   │   └── LoginView.vue  # 登录页面
│   ├── App.vue            # 根组件
│   ├── main.ts            # 入口文件
│   └── style.css          # 全局样式
├── dist/                  # 构建输出目录
├── .idea/                 # IDEA 配置
├── .vscode/               # VS Code 配置
├── index.html             # HTML 模板
├── package.json           # 项目依赖配置
├── pnpm-lock.yaml         # pnpm 锁定文件
├── pnpm-workspace.yaml    # pnpm 工作空间配置
├── vite.config.ts         # Vite 配置文件
├── tsconfig.json          # TypeScript 配置
├── tsconfig.app.json      # TypeScript 应用配置
├── tsconfig.node.json     # TypeScript Node 配置
├── eslint.config.ts       # ESLint 配置
├── .oxlintrc.json         # Oxlint 配置
├── .oxfmtrc.json          # Oxfmt 配置
├── nginx.conf             # Nginx 部署配置
├── LICENSE.txt            # 开源许可
└── env.d.ts               # 环境变量类型声明
```

### 路径别名
- `@` 映射到 `src/` 目录

### 开发命令
```bash
pnpm dev         # 启动开发服务器
pnpm build       # 构建生产版本（包含类型检查）
pnpm preview     # 预览生产构建
pnpm build-only  # 仅构建，不进行类型检查
pnpm type-check  # 执行 TypeScript 类型检查
pnpm lint        # 运行所有 lint 检查（oxlint + eslint）
pnpm lint:oxlint # 仅运行 oxlint
pnpm lint:eslint # 仅运行 eslint
pnpm format      # 格式化代码（oxfmt）
```

### 代理配置
开发服务器代理配置到后端 `http://192.168.227.128:8080`，所有 `/api` 开头的请求会被转发，且路径会去除 `/api` 前缀。

### Vite 配置要点
- **Element Plus 按需导入**: 通过 `unplugin-auto-import` 和 `unplugin-vue-components` 实现，自动生成类型声明文件到 `src/types/`
- **代码压缩**: 对大于 10KB 的文件同时生成 Gzip 和 Brotli 压缩产物，排除互为同格式的文件
- **Monaco Editor**: 通过 `optimizeDeps.exclude` 排除预构建，避免打包问题
- **构建优化**: chunk 大小警告阈值 1000KB，关闭 sourcemap 减小产物体积

### 路由设计
- **懒加载**: 所有页面组件使用动态 `import()` 实现路由级别的代码分割
- **角色守卫**: `router.beforeEach` 中根据 `meta.role` 校验用户角色，未授权角色自动重定向
- **公开路由**: `/login` 标记为 `public`，已登录用户访问时重定向到对应角色首页
- **角色首页**:
  - 管理员 → `/admin/dashboard`
  - 教师 → `/teacher/classes`
  - 学生 → `/student/classes`

### 项目特点
1. **多角色系统**: 支持管理员、教师、学生三种角色，路由级别权限控制
2. **代码编辑**: 集成 Monaco Editor 支持代码编写和评审
3. **前后端分离**: 通过 RESTful API 与后端通信
4. **现代化构建**: 使用 Vite 提供快速的开发体验和构建速度
5. **类型安全**: 全面使用 TypeScript 提供完整的类型检查
6. **代码质量**: 集成 Oxlint、ESLint 和 Oxfmt 确保代码质量和一致性
7. **代理配置**: 开发环境自动代理 API 请求到后端服务器
8. **懒加载**: 路由级别代码分割，优化首屏加载性能
9. **按需导入**: Element Plus 组件和 API 按需自动导入，减少打包体积
10. **压缩部署**: 同时生成 Gzip 和 Brotli 压缩产物

### Node.js 版本要求
- Node.js ^20.19.0 或 >=22.12.0

### 包管理器
- 使用 **pnpm** 作为包管理器，配置文件 `pnpm-workspace.yaml`
