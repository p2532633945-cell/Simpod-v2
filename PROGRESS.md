# Simpod v2 开发进度

> **协作同步文档**：本文件用于在不同 AI 工具（Claude Code、Antigravity、Roo Code）之间同步开发进度。

---

## 当前状态

### 最后更新
- **更新时间**: 2026-03-08
- **更新者**: Antigravity
- **当前分支**: master

### 项目阶段
- **当前阶段**: 🚀 MVP 开发 - 前端组件库集成完成
- **下一步**: 实现播客搜索功能

---

## 已完成的工作

### 1. 工作流系统搭建 ✅
- [x] 创建 PIV 循环命令（prime、plan、execute）
- [x] 创建验证命令
- [x] 创建提交命令
- [x] 创建 PRD 生成命令
- [x] 编写工作流使用指南
- [x] 创建技术参考文档
- [x] 更新 CLAUDE.md 集成工作流系统

### 2. 项目规划 ✅
- [x] 定义产品愿景和核心价值
- [x] 确定技术栈（Next.js + Supabase）
- [x] 设计数据模型（anchors、hotzones、transcripts）
- [x] 创建产品需求文档（PRD.md）

### 3. 初始化 Next.js 项目 ✅
- [x] 创建 package.json 配置
- [x] 配置 TypeScript（tsconfig.json）
- [x] 配置 Tailwind CSS（tailwind.config.ts、postcss.config.mjs）
- [x] 配置 ESLint（.eslintrc.json）
- [x] 配置 Prettier（.prettierrc）
- [x] 创建环境变量模板（.env.example）
- [x] 创建 App Router 结构（src/app/）
- [x] 创建根布局（layout.tsx、globals.css）
- [x] 创建首页（page.tsx）
- [x] 安装 Supabase 依赖（@supabase/supabase-js、@supabase/ssr）
- [x] 创建 Supabase 客户端（client.ts、server.ts）
- [x] 创建 Supabase 中间件（middleware.ts）
- [x] 创建 Zustand store（playerStore.ts）
- [x] 创建组件目录结构（components/ui/、player/、hotzone/、shared/）
- [x] 创建 API 路由（api/groq-proxy、api/hotzones）
- [x] 迁移服务层代码（services/supabase.ts、services/groq.ts、services/hotzone.ts）
- [x] 创建统一类型文件（types/index.ts）
- [x] 配置路径别名（@/*）
- [x] 成功构建并运行开发服务器

### 2026-03-08: 初始化 Next.js 项目
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 手动创建 Next.js 15 项目结构，配置 TypeScript、Tailwind CSS、ESLint、Prettier。设置 Supabase 客户端（client.ts、server.ts）和中间件。创建 Zustand playerStore。创建 API 路由（groq-proxy、hotzones）。迁移现有服务层代码并更新导入路径。成功构建并验证开发服务器运行正常。

### 2026-03-08: 集成 v0 前端组件
**状态**: ✅ 已完成
**更新者**: Antigravity
**描述**: 将 v0 文件夹中的完整前端库集成到 Next.js App Router 项目中，包括播放器、热区、转录等所有组件，添加必要依赖（clsx、tailwind-merge、lucide-react、framer-motion），迁移页面和 stores，清理 v0 目录。

---

## 进行中的任务

### 当前任务
**状态**: 等待开始

### 已开始的功能
- (无)

---

## 待办事项

### 高优先级 🔥
- [ ] 实现播客搜索功能
  - [ ] 创建 podcast-search API 代理
  - [ ] 创建搜索页面 UI
  - [ ] 集成 Podcast Index API
  - [ ] 集成 iTunes Search API
  - [ ] 结果去重和合并
- [ ] 实现音频播放器
  - [ ] 创建播放器 UI 组件
  - [ ] 集成 Web Audio API
  - [ ] 实现播放控制（播放/暂停/跳转）
  - [ ] 实现进度显示
  - [ ] 实现速度调整
- [ ] 实现热区标记功能
  - [ ] 创建 MARK 按钮组件
  - [ ] 实现锚点创建
  - [ ] 实现热区生成
  - [ ] 集成 Zustand store

### 中优先级 ⚡
- [ ] 实现热区显示
  - [ ] 创建热区列表组件
  - [ ] 显示转录文本
  - [ ] 点击跳转播放
- [ ] 实现批量复习功能
  - [ ] 创建复习页面
  - [ ] 显示所有热区
  - [ ] 逐个播放热区

### 低优先级 📋
- [ ] 实现波形可视化
- [ ] 实现播客剧集列表
- [ ] 实现数据持久化（localStorage/IndexedDB）

---

## 技术栈确认

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **UI 组件**: (待定 - shadcn/ui 或类似)

### 后端
- **BaaS**: Supabase
- **数据库**: PostgreSQL
- **认证**: Supabase Auth
- **实时**: Supabase Realtime

### AI 服务
- **转录**: Groq Whisper API
- **搜索**: Podcast Index API + iTunes API

### 开发工具
- **包管理**: npm
- **代码规范**: ESLint + Prettier
- **测试**: (待添加 - Vitest + Playwright)

---

## 已知问题

### 当前无已知问题

---

## 技术决策记录

### 2026-03-07: 工作流系统架构
**决策**: 采用基于命令的工作流系统（参考 example-habit-tracker）

**理由**:
- 提高开发效率和一致性
- 支持 AI 工具间协作
- 减少重复工作

**实施**:
- 创建 `.claude/commands/` 目录存放命令
- 创建 `.claude/reference/` 存放技术参考
- 使用 PIV 循环（Plan → Implement → Verify）

### 2026-03-07: 技术栈选择
**决策**: Next.js + Supabase + Zustand

**理由**:
- Next.js: 全栈框架，支持服务端渲染和 API Routes
- Supabase: BaaS，提供数据库、认证、实时功能
- Zustand: 轻量级状态管理，适合客户端状态

### 2026-03-08: Next.js 项目初始化
**决策**: 手动创建项目结构而非使用 create-next-app

**理由**:
- 避免目录名称冲突（Simpod-v2 包含大写字母）
- 更精细控制项目结构和配置
- 避免覆盖现有代码

**实施**:
- 手动创建 package.json、tsconfig.json、next.config.mjs 等配置文件
- 创建 src/app/ 目录结构
- 配置 Supabase 客户端和服务端
- 配置 Tailwind CSS 和 ESLint

---

## 环境配置

### 需要的环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq API
GROQ_API_KEY=

# Podcast Index
PODCAST_INDEX_KEY=
PODCAST_INDEX_SECRET=

# 可选：OpenAI（备用转录）
# OPENAI_API_KEY=
```

---

## 代码规范

### 命名约定
- **文件名**: kebab-case (`hotzone-service.ts`)
- **组件名**: PascalCase (`HotzoneCard.tsx`)
- **函数名**: camelCase (`fetchHotzones`)
- **常量**: UPPER_SNAKE_CASE (`MAX_HOTZONE_DURATION`)

### Git 提交规范
遵循约定式提交格式：
```
<type>(<scope>): <subject>

<body>
```
类型：`feat`、`fix`、`refactor`、`docs`、`style`、`test`、`chore`

---

## 分支策略

### 主分支
- `main`: 生产环境代码

### 开发分支
- `dev`: 开发环境代码
- `feature/*`: 功能分支
- `fix/*`: 修复分支

### 分支命名规范
- `feature/hotzone-create`: 创建热区功能
- `fix/player-audio`: 修复音频播放问题
- `refactor/auth-service`: 重构认证服务

---

## AI 工具协作指南

### 使用此文档的工具
- **Claude Code**: 主要开发工具
- **Antigravity**: 辅助开发工具
- **Roo Code**: 可选开发工具

### 协作规则
1. **每次完成任务后更新本文件**
2. **标记完成的任务**
3. **添加新任务到待办列表**
4. **更新技术决策记录**
5. **更新时间戳和更新者**

### 更新模板

```
### [日期]: [任务名称]
**状态**: [进行中/已完成/已取消]
**更新者**: [AI 工具名称]
**描述**: [简要描述]
```

---

## 参考资料

### 内部文档
- [CLAUDE.md](./CLAUDE.md) - 项目宪法
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - 工作流指南
- [ACTION_GUIDE.md](./ACTION_GUIDE.md) - 开发行动指南
- [PRD.md](./PRD.md) - 产品需求文档

### 外部资源
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Groq 文档](https://console.groq.com/docs)

---

## 注释

> **注意**: 本文件是项目进度的"单一事实来源"。所有 AI 工具都应该在完成任务后更新此文件，以保持同步。

---

**文档版本**: 1.1
**创建日期**: 2026-03-07
**最后更新**: 2026-03-08
