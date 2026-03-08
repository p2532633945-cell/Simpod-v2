# Simpod v2 开发进度

> **协作同步文档**：本文件用于在不同 AI 工具（Claude Code、Antigravity、Roo Code）之间同步开发进度。

---

## 当前状态

### 最后更新
- **更新时间**: 2026-03-07
- **更新者**: Claude Code
- **当前分支**: (待创建项目后设置)

### 项目阶段
- **当前阶段**: 🚀 准备阶段 - 工作流系统已搭建完成
- **下一步**: 初始化 Next.js 项目结构

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

---

## 进行中的任务

### 当前任务
**状态**: 等待开始

### 已开始的功能
- (无)

---

## 待办事项

### 高优先级 🔥
- [ ] 初始化 Next.js 项目
  - [ ] 使用 `npx create-next-app@latest` 创建项目
  - [ ] 配置 TypeScript
  - [ ] 配置 Tailwind CSS
  - [ ] 配置 ESLint 和 Prettier
- [ ] 设置 Supabase 客户端
  - [ ] 安装 `@supabase/supabase-js`
  - [ ] 创建环境变量模板
  - [ ] 配置客户端和服务端客户端
- [ ] 设置 Zustand 状态管理
  - [ ] 安装 `zustand`
  - [ ] 创建基础 store 结构

### 中优先级 ⚡
- [ ] 设计并实施数据库 schema
  - [ ] 创建 `anchors` 表
  - [ ] 创建 `hotzones` 表
  - [ ] 创建 `transcripts` 表
  - [ ] 设置 RLS 策略
- [ ] 实现核心服务层
  - [ ] `groq.ts` - Groq API 集成
  - [ ] `supabase.ts` - Supabase 操作
  - [ ] `hotzone.ts` - 热区处理
- [ ] 实现音频工具
  - [ ] `audio.ts` - Web Audio API 封装
  - [ ] 音频切片功能

### 低优先级 📋
- [ ] 设计 UI 组件库
- [ ] 实现播客搜索功能
- [ ] 实现音频播放器
- [ ] 实现热区可视化

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
- **包管理**: npm/pnpm
- **代码规范**: ESLint + Prettier
- **测试**: Vitest + Playwright

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

### 外部资源
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Groq 文档](https://console.groq.com/docs)

---

## 注释

> **注意**: 本文件是项目进度的"单一事实来源"。所有 AI 工具都应该在完成任务后更新此文件，以保持同步。

---

**文档版本**: 1.0
**创建日期**: 2026-03-07
