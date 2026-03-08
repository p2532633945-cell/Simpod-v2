---
description: 创建标准化的 git commit
argument-hint: [提交信息]
---

# Commit：标准化 Git 提交

## 提交信息

使用格式：`$ARGUMENTS`

如果未提供参数，根据更改生成描述性信息。

## 提交类型

遵循约定式提交格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- **feat**：新功能
- **fix**：错误修复
- **refactor**：代码重构（不添加功能或修复 bug）
- **docs**：仅文档更改
- **style**：代码格式（不影响功能）
- **test**：添加或更新测试
- **chore**：构建过程或辅助工具的更改

### 范围（scope）

可以是任何内容，说明提交更改的范围（例如：`hotzone`、`player`、`api`、`ui`）

### 主题（subject）

- 使用祈使句现在时（"添加"而不是"添加了"）
- 不要句号结尾
- 小写（除了代码引用）

### 正文（body）

- 使用祈使句现在时
- 说明"是什么"和"为什么"，而不是"怎么做"
- 可以包含多个段落

### 页脚（footer）

- 引用相关的 issue：`Closes #123`
- 列出破坏性更改：`BREAKING CHANGE:`

## 提交前检查清单

### 代码质量
- [ ] 代码符合项目约定（见 CLAUDE.md）
- [ ] 所有测试通过
- [ ] 无 lint 错误
- [ ] 文档已更新（如需要）

### 文件检查
- [ ] 无临时/调试文件
- [ ] .env 文件未提交（除非模板）
- [ ] 无敏感信息
- [ ] dist/build 文件夹已忽略

## 执行步骤

1. **查看更改**
```bash
git status
git diff
```

2. **暂存文件**
```bash
git add <files>
# 或
git add .
```

3. **创建提交**
```bash
git commit -m "提交信息"
```

## 提交信息模板

### 添加功能
```
feat(hotzone): 实现智能热区创建

- 使用机械窗口（±10s, -2s 偏移）
- 支持词级时间戳对齐
- 集成转录缓存
```

### 修复 Bug
```
fix(player): 修复播放时进度条不更新问题

原因是 setState 闭包捕获了旧的 currentTime 值
使用函数式 setState 解决
```

### 重构
```
refactor(audio): 将音频切片逻辑提取到独立服务

- 创建 src/services/audioSlice.ts
- 从组件中迁移重复代码
- 提高可测试性
```

### 文档
```
docs: 更新 CLAUDE.md 添加数据库模式参考

添加 transcripts 表的详细说明
包含索引和约束信息
```

## 推送提交

```bash
git push
```

### 推送到新分支
```bash
git push -u origin <branch-name>
```

## 注意事项

- **保持提交小而专注**：每个提交解决一件事
- **修复之前不要推送损坏的代码**
- **提交前测试**：确保代码实际工作
- **写有意义的消息**：未来你会感谢自己
