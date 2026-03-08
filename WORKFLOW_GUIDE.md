# Simpod v2 工作系统使用指南

> 基于顶级开发工作流模式，为 Simpod v2 构建的高效、系统化开发流程。

---

## 目录

1. [核心理念](#核心理念)
2. [目录结构](#目录结构)
3. [工作流程](#工作流程)
4. [命令参考](#命令参考)
5. [典型使用场景](#典型使用场景)
6. [最佳实践](#最佳实践)

---

## 核心理念

### 三层开发模式

```
规划 (Plan)  →  实施 (Implement)  →  验证 (Verify)
     ↓               ↓                    ↓
  创建计划      执行代码              质量检查
  上下文为王   一次性成功            持续改进
```

### 关键原则

1. **上下文为王**：计划必须包含实施所需的所有信息
2. **一次性成功**：执行代理无需额外研究即可完成功能
3. **保护上下文**：主文件精简，参考文档按需加载
4. **命令复用**：重复的工作流封装为可复用命令

---

## 目录结构

```
Simpod-v2/
├── .claude/                    # Claude AI 命令和配置
│   ├── commands/               # 可执行命令
│   │   ├── create-prd.md       # 创建产品需求文档
│   │   ├── commit.md           # Git 提交命令
│   │   ├── core_piv_loop/     # 核心 PIV 循环
│   │   │   ├── prime.md       # 加载项目上下文
│   │   │   ├── plan-feature.md # 规划功能
│   │   │   └── execute.md     # 执行计划
│   │   └── validation/        # 验证命令
│   │       └── validate.md    # 完整验证流程
│   ├── reference/             # 参考文档
│   │   ├── nextjs-best-practices.md
│   │   └── supabase-integration.md
│   └── PRD.md                # 产品需求文档
│
├── .agents/                   # Agent 工作目录
│   └── plans/                # 详细实施计划
│       ├── backend-foundation.md
│       └── hotzone-feature.md
│
├── CLAUDE.md                  # 项目宪法（单一事实来源）
├── ACTION_GUIDE.md            # 开发行动指南
└── WORKFLOW_GUIDE.md          # 本文件
```

---

## 工作流程

### 标准开发流程

#### 第 0 步：准备环境

```
用户：/prime
→ Claude 加载项目上下文
→ 了解当前状态和架构
```

#### 第 1 步：创建 PRD（如需要）

```
用户：/create-prd PRD.md
→ Claude 生成产品需求文档
→ 包含用户故事、技术栈、阶段规划
```

#### 第 2 步：规划功能

```
用户：/plan-feature "智能回溯功能"
→ Claude 进行深度分析
→ 生成详细实施计划 (.agents/plans/xxx.md)
→ 包含：上下文引用、模式、分步任务、验证命令
```

#### 第 3 步：实施功能

```
用户：/execute .agents/plans/intelligent-backtrack.md
→ Claude 阅读完整计划
→ 按顺序执行每个任务
→ 运行验证命令
```

#### 第 4 步：验证

```
用户：/validate
→ 运行所有验证级别
→ 检查代码质量
```

#### 第 5 步：提交

```
用户：/commit "feat: 实现智能回溯"
→ 标准化提交信息
```

---

## 命令参考

### `/create-prd [filename]`

**用途**：从对话中生成产品需求文档

**何时使用**：
- 项目初期定义产品
- 重大功能规划
- 重新审视产品方向

**示例**：
```
/create-prd PRD.md
```

---

### `/prime`

**用途**：加载项目上下文，建立对代码库的理解

**何时使用**：
- 新对话开始
- 长时间未工作后恢复
- 需要全面了解当前状态

**输出**：
- 项目概述
- 架构分析
- 技术栈
- 当前状态

---

### `/plan-feature "功能描述"`

**用途**：创建全面的实施计划

**何时使用**：
- 开发新功能
- 重构现有代码
- 修复复杂 bug

**计划包含**：
- 功能描述和用户故事
- 相关代码库文件（必须阅读）
- 要创建的新文件
- 相关文档链接
- 要遵循的模式
- 分步任务（可执行）
- 测试策略
- 验证命令
- 验收标准

**示例**：
```
/plan-feature "实现智能回溯功能"
```

---

### `/execute [plan-path]`

**用途**：从计划执行实施

**何时使用**：
- 规划完成后立即实施
- 遵循既定计划执行

**执行流程**：
1. 阅读完整计划
2. 按顺序执行任务
3. 创建测试
4. 运行验证命令
5. 确认完成

**示例**：
```
/execute .agents/plans/intelligent-backtrack.md
```

---

### `/validate`

**用途**：运行完整验证流程

**何时使用**：
- 实施完成后
- 提交代码前
- 代码审查前

**验证级别**：
1. 语法与类型检查
2. 单元测试
3. 集成测试
4. 构建验证
5. 手动验证
6. 代码审查检查点

---

### `/commit [message]`

**用途**：创建标准化的 git commit

**何时使用**：
- 功能开发完成
- Bug 修复完成
- 任何需要提交的更改

**提交格式**：
```
<type>(<scope>): <subject>

<body>
```

**类型**：
- `feat`：新功能
- `fix`：错误修复
- `refactor`：重构
- `docs`：文档
- `style`：格式
- `test`：测试
- `chore`：构建/工具

**示例**：
```
/commit "feat(hotzone): 实现智能热区创建"
```

---

## 典型使用场景

### 场景 1：开发新功能

```bash
# 1. 准备环境
/prime

# 2. 规划功能
/plan-feature "实现智能回溯功能"

# 3. 实施功能
/execute .agents/plans/intelligent-backtrack.md

# 4. 验证
/validate

# 5. 提交
/commit "feat: 实现智能回溯"
```

### 场景 2：修复 Bug

```bash
# 1. 准备环境
/prime

# 2. 分析并规划（可选）
/plan-feature "修复播放进度条不更新问题"

# 3. 实施修复
/execute .agents/plans/fix-progress-bar.md

# 4. 验证
/validate

# 5. 提交
/commit "fix(player): 修复播放进度条不更新"
```

### 场景 3：重构代码

```bash
# 1. 准备环境
/prime

# 2. 规划重构
/plan-feature "重构音频服务以支持多种格式"

# 3. 实施重构
/execute .agents/plans/refactor-audio-service.md

# 4. 验证（重构尤其重要）
/validate

# 5. 提交
/commit "refactor(audio): 重构音频服务"
```

### 场景 4：项目初始化

```bash
# 1. 创建 PRD
/create-prd PRD.md

# 2. 规划基础架构
/plan-feature "搭建项目基础架构"

# 3. 实施基础
/execute .agents/plans/backend-foundation.md

# 4. 验证
/validate

# 5. 提交
/commit "chore: 搭建项目基础架构"
```

---

## 最佳实践

### 1. 命令使用顺序

**黄金法则**：不要跳过步骤

```
✅ 正确：prime → plan → execute → validate → commit
❌ 错误：直接编写代码（无规划）
❌ 错误：跳过验证直接提交
```

### 2. 上下文管理

**原则**：保护上下文，按需加载

- CLAUDE.md 保持精简（核心规则）
- 参考文档在特定任务时才加载
- 计划文件包含完整上下文

**示例**：
```markdown
# CLAUDE.md（精简）
仅包含：项目规则、核心架构、命名规范

# .claude/reference/xxx.md（详细）
具体技术栈的最佳实践
```

### 3. 计划质量

**好计划的特征**：
- ✅ 每个任务都有文件和行号引用
- ✅ 每个任务都有验证命令
- ✅ 新人无需额外研究即可执行
- ✅ 包含测试策略

**坏计划的迹象**：
- ❌ 通用描述（"实现 X 功能"）
- ❌ 缺少文件路径
- ❌ 无验证方法
- ❌ 需要外部知识

### 4. 验证优先

**永远不要跳过验证**：

```bash
# 实施后立即验证
/execute plan.md → /validate

# 验证失败时不要提交
❌ 验证失败 → /commit  # 危险！

# 修复后再验证
验证失败 → 修复 → /validate → /commit  # 正确
```

### 5. 提交规范化

**每次提交都遵循约定**：

```
✅ 好：feat(hotzone): 实现智能热区创建
      - 使用机械窗口
      - 支持词级时间戳

❌ 差：添加了热区功能
❌ 差：fix bug
❌ 差：update
```

### 6. 计划复用

**成功创建的计划可以复用**：

```markdown
# .agents/plans/feature-template.md
可以用作类似功能的模板
只需修改具体细节
```

---

## 进阶技巧

### 1. 并行规划

对于大型功能，拆分为多个计划：

```bash
# 计划 1：后端 API
/plan-feature "实现热区 API 端点"

# 计划 2：前端 UI
/plan-feature "实现热区 UI 组件"

# 分别实施
/execute .agents/plans/hotzone-api.md
/execute .agents/plans/hotzone-ui.md
```

### 2. 迭代改进

根据实施经验改进计划模板：

```markdown
# .claude/commands/core_piv_loop/plan-feature.md
# 根据实际使用添加新章节
# 改进任务格式
# 完善验证命令
```

### 3. 自定义命令

为重复性工作流创建自定义命令：

```markdown
# .claude/commands/deploy.md
---
description: 部署到生产环境
---
# 部署流程
1. 运行测试
2. 构建项目
3. 部署到 Vercel
```

### 4. 文档同步

保持 CLAUDE.md 和 PRD.md 同步：

```markdown
# CLAUDE.md
技术规则和架构

# PRD.md
产品需求和功能定义

# ACTION_GUIDE.md
具体开发任务和步骤
```

---

## 故障排除

### 问题：计划执行失败

**原因**：
1. 计划缺少必要上下文
2. 代码库发生变化
3. 依赖问题

**解决方案**：
1. 重新运行 `/prime` 更新上下文
2. 修订计划文件
3. 再次执行

### 问题：验证总是失败

**原因**：
1. 测试设置不正确
2. 代码质量标准不一致
3. 环境配置问题

**解决方案**：
1. 检查测试配置
2. 运行 CLAUDE.md 中的质量标准
3. 验证环境变量

### 问题：计划太长难以执行

**原因**：
1. 功能太大
2. 缺乏拆分

**解决方案**：
1. 拆分为多个小计划
2. 每个计划专注一个方面
3. 逐步构建

---

## 工作流图

```
开始新功能
    ↓
   /prime
    ↓
/plan-feature
    ↓
   计划评审
    ↓
/execute
    ↓
/validate
    ↓
  通过？
    ↓ 是
/commit
    ↓
   完成
    ↓ 否
    ↓
修复问题
    ↓
/validate
```

---

## 资源

### 内部文档
- [CLAUDE.md](./CLAUDE.md) - 项目宪法
- [ACTION_GUIDE.md](./ACTION_GUIDE.md) - 开发指南
- [PRD.md](.claude/PRD.md) - 产品需求

### 参考文档
- [.claude/reference/](.claude/reference/) - 技术参考
- [.agents/plans/](.agents/plans/) - 实施计划

---

## 总结

**核心工作流**：`prime → plan → execute → validate → commit`

**记住**：
- 每一步都很重要，不要跳过
- 计划质量决定执行效率
- 验证保证代码质量
- 标准化提高可维护性

**目标**：系统化的开发流程，让每次实施都成功，每个提交都可靠。

---

**版本**: 1.0
**创建日期**: 2026-03-07
