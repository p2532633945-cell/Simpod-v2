# Simpod v2 工作系统搭建完成

> 本文档总结了为 Simpod v2 搭建的完整工作流系统

---

## 已完成的工作

### 1. 创建的核心命令

| 文件 | 用途 | 状态 |
|------|------|------|
| `.claude/commands/create-prd.md` | 创建产品需求文档 | ✅ |
| `.claude/commands/commit.md` | 标准化 Git 提交 | ✅ |
| `.claude/commands/core_piv_loop/prime.md` | 加载项目上下文 | ✅ |
| `.claude/commands/core_piv_loop/plan-feature.md` | 创建实施计划 | ✅ |
| `.claude/commands/core_piv_loop/execute.md` | 执行实施计划 | ✅ |
| `.claude/commands/validation/validate.md` | 完整验证流程 | ✅ |

### 2. 创建的参考文档

| 文件 | 内容 | 状态 |
|------|------|------|
| `.claude/reference/nextjs-best-practices.md` | Next.js 最佳实践 | ✅ |
| `.claude/reference/supabase-integration.md` | Supabase 集成指南 | ✅ |

### 3. 创建的工作流文档

| 文件 | 内容 | 状态 |
|------|------|------|
| `WORKFLOW_GUIDE.md` | 工作系统使用指南 | ✅ |
| `PROGRESS.md` | 项目进度跟踪（多工具协作） | ✅ |
| `CLAUDE.md` | 更新：集成工作流系统 | ✅ |

### 4. 创建的目录结构

```
Simpod-v2/
├── .claude/
│   ├── commands/           ✅ 命令文件
│   │   ├── create-prd.md
│   │   ├── commit.md
│   │   ├── core_piv_loop/
│   │   │   ├── prime.md
│   │   │   ├── plan-feature.md
│   │   │   └── execute.md
│   │   └── validation/
│   │       └── validate.md
│   └── reference/          ✅ 参考文档
│       ├── nextjs-best-practices.md
│       └── supabase-integration.md
│
├── .agents/               ✅ Agent 工作目录
│   └── plans/            (空，用于存放实施计划)
│
├── CLAUDE.md              ✅ 项目宪法（已更新）
├── WORKFLOW_GUIDE.md       ✅ 工作系统使用指南
├── PROGRESS.md            ✅ 项目进度跟踪（新增）
└── ACTION_GUIDE.md        (已存在)
```

---

## 工作系统如何使用

### 快速开始

1. **首次开发？先了解工作流**
```
阅读：WORKFLOW_GUIDE.md
```

2. **多工具协作？先查看进度**
```
阅读：PROGRESS.md
```

3. **标准开发流程**
```
/prime                      # 加载项目上下文
    ↓
阅读 PROGRESS.md           # 了解当前进度和待办任务
    ↓
/plan-feature "功能描述"       # 创建实施计划
    ↓
/execute .agents/plans/xxx.md  # 执行计划
    ↓
更新 PROGRESS.md           # 记录完成的工作
    ↓
/validate                   # 验证质量
    ↓
/commit "提交信息"           # 标准化提交
```

### 命令快速参考

| 命令 | 简短说明 |
|------|----------|
| `/prime` | 加载项目上下文 |
| `/create-prd` | 创建 PRD |
| `/plan-feature` | 规划功能 |
| `/execute` | 执行计划 |
| `/validate` | 验证代码 |
| `/commit` | 提交代码 |

### 多工具协作（新增）

当你使用多个 AI 工具（Claude Code、Antigravity、Roo Code）时：

**任务开始前**：
```
1. 阅读 PROGRESS.md 获取最新状态
2. 确认要处理的任务
3. 避免重复已完成的工作
```

**任务完成后**：
```
1. 更新 PROGRESS.md 的相应章节
2. 标记任务为完成
3. 更新"最后更新"和"更新者"
```

---

## 文档关系图

```
WORKFLOW_GUIDE.md (工作流指南)
    ↓ 解释如何使用命令
    ↓
.claude/commands/* (命令文件)
    ↓ 命令调用参考文档
    ↓
.claude/reference/* (技术参考)
    ↓
CLAUDE.md (项目宪法)
    ↓
PROGRESS.md (进度跟踪) ⭐ 新增 - 多工具协作同步
    ↓
ACTION_GUIDE.md (开发任务)
```

---

## 下一步建议

### 选项 1：直接开始编码（推荐）

```
1. 阅读现有 CLAUDE.md 了解技术栈
2. 阅读 PROGRESS.md 查看待办事项
3. 阅读 ACTION_GUIDE.md 了解当前任务
4. 使用 /plan-feature 规划第一个功能
5. 使用 /execute 开始实施
```

### 选项 2：先创建 PRD

```
1. 使用 /create-prd 创建产品需求文档
2. 基于 PRD 规划功能
3. 逐个功能实施
```

### 选项 3：完善工作系统

```
1. 根据实际使用调整命令
2. 添加更多参考文档
3. 完善验证命令
```

---

## 工作系统核心理念

### 三层开发模式
```
规划 (Plan)  →  实施 (Implement)  →  验证 (Verify)
```

### 关键原则

1. **上下文为王**：计划必须包含所有必要信息
2. **一次性成功**：执行代理无需额外研究
3. **保护上下文**：主文件精简，参考文档按需加载
4. **命令复用**：重复工作流封装为命令
5. **进度同步**：多工具协作时保持 PROGRESS.md 更新

---

## 文件清单

### 新建文件 (10个)
- `.claude/commands/create-prd.md`
- `.claude/commands/commit.md`
- `.claude/commands/core_piv_loop/prime.md`
- `.claude/commands/core_piv_loop/plan-feature.md`
- `.claude/commands/core_piv_loop/execute.md`
- `.claude/commands/validation/validate.md`
- `.claude/reference/nextjs-best-practices.md`
- `.claude/reference/supabase-integration.md`
- `WORKFLOW_GUIDE.md`
- `PROGRESS.md` ⭐ 新增

### 更新文件 (1个)
- `CLAUDE.md` (已更新为 v2.0，包含 PROGRESS.md 说明)

### 备份文件 (0个)
- 无

---

## 注意事项

1. **example-habit-tracker-main 文件夹**
   - 这是参考项目，与 Simpod v2 无关
   - 仅用于学习其工作流模式
   - 可以删除或保留作为参考

2. **命令文件已翻译成中文**
   - 所有命令文档使用中文
   - 技术术语保留英文
   - 代码示例保持英文

3. **参考文档针对 Simpod v2 技术栈**
   - Next.js + TypeScript
   - Supabase
   - Zustand (如需要)
   - Tailwind CSS

4. **PROGRESS.md 多工具协作规则**
   - 每次任务完成后必须更新
   - 记录完成状态和更新者
   - 保持待办事项的优先级
   - 记录技术决策和问题

---

## 需要帮助？

### 查看
- `WORKFLOW_GUIDE.md` - 工作流详细说明
- `CLAUDE.md` - 技术规则和架构
- `PROGRESS.md` - ⭐ 项目进度和待办事项

### 运行
- `/prime` - 获取项目状态
- `/plan-feature "帮助"` - 规划任务

---

**搭建完成时间**: 2026-03-07
**搭建者**: Claude Code (参考 example-habit-tracker 项目)
**版本**: 1.1 (添加 PROGRESS.md 多工具协作支持)
