# 功能：修复 Hydration 错误并实现核心功能

## PROGRESS.md 关联

**实现任务**：
1. 🔥 修复 Hydration 错误 - 播放器页面无法加载
2. 🔥 修复播客搜索 CORS 问题
3. 🔥 实现真实音频播放
4. 🔥 实现 MARK 按钮转录功能
5. 🔥 实现热区保存到数据库

**优先级**：🔥 高
**预计完成时间**：今天

---

## 问题诊断

### 问题 1：Hydration 错误（图一上半部分 & 图二）

**错误信息**：
```
Hydration failed because the initial UI does not match
Warning: Text content did not match. Server: "0:00" Client: "0.00"
```

**根因分析**：
- 服务器端渲染时 `currentTime: 0` 显示为 "0:00"
- 客户端 hydration 时显示为 "0.00"
- 可能原因：有两个 `formatTime` 函数（`src/lib/time.ts` 和 `src/lib/mock-data.ts`）
- 或者某个地方直接显示了数字而不是格式化的字符串

**影响**：播放器页面完全无法使用，所有按钮都无法点击

### 问题 2：搜索功能（图一下半部分）

**控制台输出显示**：
- 搜索请求已发出
- 但可能有 CORS 错误或 API 错误

**需要检查**：
- Podcast Index API 环境变量是否配置
- API 响应是否正确

---

## 功能描述

本次实施包含两个修复任务和三个功能实现任务：

1. **修复 Hydration 错误**：统一时间格式化，确保服务器端和客户端一致
2. **修复搜索功能**：添加 CORS 支持，完善错误处理
3. **实现真实播放**：确保音频 URL 可用，添加加载状态
4. **实现 MARK 转录**：确保 Groq API 调用正常，添加加载反馈
5. **实现数据持久化**：热区保存到 Supabase

---

## 实施计划

### 阶段 1：修复 Hydration 错误（30分钟）

**任务**：
1. 删除重复的 `formatTime` 函数
2. 统一使用 `@/lib/time.ts` 中的版本
3. 确保所有组件都导入正确的 `formatTime`
4. 添加客户端 only 标记防止 hydration 不匹配

### 阶段 2：修复搜索功能（30分钟）

**任务**：
1. 检查环境变量配置
2. 添加更详细的错误日志
3. 添加搜索加载状态
4. 显示搜索结果或错误信息

### 阶段 3：实现真实播放（30分钟）

**任务**：
1. 确认音频 URL 可访问（使用可靠的公开音频）
2. 添加音频加载状态
3. 添加错误处理（音频加载失败提示）
4. 测试播放/暂停/进度跳转

### 阶段 4：实现 MARK 转录（1小时）

**任务**：
1. 确认 Groq API Key 配置
2. 添加 MARK 按钮加载状态
3. 显示转录进度提示
4. 测试热区创建和保存

### 阶段 5：实现数据库保存（30分钟）

**任务**：
1. 确认 Supabase 连接
2. 测试热区保存
3. 测试热区加载
4. 刷新页面验证数据持久化

---

## 分步任务

### 任务 1：统一 formatTime 函数

**IMPLEMENT**：
1. 删除 `src/lib/mock-data.ts` 中的 `formatTime` 函数（保留在 `src/lib/time.ts` 中）
2. 更新所有导入，使用 `@/lib/time` 的版本
3. 确保格式一致

**PATTERN**：保持现有的 `formatTime` 实现

**FILES TO UPDATE**：
- `src/lib/mock-data.ts` - 删除 formatTime，改为从 `@/lib/time` 导出
- `src/components/player/PlaybackControls.tsx` - 改为从 `@/lib/time` 导入
- 所有其他使用 formatTime 的文件

**VALIDATE**：刷新页面，不再出现 hydration 错误

---

### 任务 2：添加客户端渲染保护

**IMPLEMENT**：
在 PodcastPlayerPage 组件中添加 `useEffect` 确保 audioRef 只在客户端设置

**PATTERN**：使用 `isMounted` 模式或 `useEffect` 设置 ref

**GOTCHA**：服务器端渲染时 audioRef 可能为 null

**VALIDATE**：页面正常加载，无 hydration 警告

---

### 任务 3：修复播客搜索

**IMPLEMENT**：
1. 检查 `.env` 文件，确认环境变量已配置
2. 在 `podcast-search/route.ts` 中添加更详细的错误日志
3. 在首页添加搜索结果显示或错误提示
4. 处理 CORS 问题（如果存在）

**PATTERN**：参考 `groq-proxy/route.ts` 的错误处理模式

**GOTCHA**：
- Podcast Index API 需要有效密钥
- 确保环境变量已正确设置

**VALIDATE**：搜索返回结果或显示明确错误信息

---

### 任务 4：实现音频播放状态

**IMPLEMENT**：
1. 确认 DEMO_AUDIO_URL 可访问
2. 添加音频加载状态指示器
3. 添加音频加载错误处理
4. 显示加载进度

**FILES TO UPDATE**：
- `src/components/player/PodcastPlayerPage.tsx` - 添加加载状态

**GOTCHA**：
- 远程音频需要支持 CORS
- 添加 fallback 处理

**VALIDATE**：点击播放按钮，音频正常播放

---

### 任务 5：实现 MARK 按钮转录

**IMPLEMENT**：
1. 确认 GROQ_API_KEY 已配置
2. 在 handleMark 中添加加载状态
3. 显示转录中提示
4. 处理转录错误

**FILES TO UPDATE**：
- `src/components/player/PodcastPlayerPage.tsx` - 添加转录状态
- `src/components/player/MarkButton.tsx` - 添加加载指示

**GOTCHA**：
- Groq API 调用需要时间
- 音频切片可能失败
- 添加超时处理

**VALIDATE**：点击 MARK，控制台显示转录日志，热区出现在侧边栏

---

### 任务 6：实现数据库保存和加载

**IMPLEMENT**：
1. 确认 Supabase 连接配置
2. 测试 saveHotzone 函数
3. 实现从数据库加载热区
4. 刷新页面验证数据持久化

**FILES TO UPDATE**：
- `src/components/player/PodcastPlayerPage.tsx` - 从数据库加载热区
- `src/services/supabase.ts` - 确保函数正确

**GOTCHA**：
- 需要运行 Supabase migrations
- RLS 策略可能阻止写入
- 检查环境变量

**VALIDATE**：
- MARK 创建的热区保存成功
- 刷新页面后热区仍然存在

---

## 环境配置检查清单

### 必需的环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Groq API
GROQ_API_KEY=gsk_xxx

# Podcast Index
PODCAST_INDEX_KEY=xxx
PODCAST_INDEX_SECRET=xxx
```

### 检查命令

```bash
# 验证环境变量
cat .env | grep -E "SUPABASE|GROQ|PODCAST_INDEX"

# 验证 Supabase 连接
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('hotzones').select('*').then(console.log);
"
```

---

## 验证命令

### 级别 1：语法检查

```bash
npm run lint
```

### 级别 2：类型检查

```bash
npx tsc --noEmit
```

### 级别 3：构建

```bash
npm run build
```

### 级别 4：手动验证

1. 启动开发服务器：`npm run dev`
2. 访问首页：http://localhost:3000
3. 验证无 hydration 错误
4. 搜索播客：输入关键词，查看结果
5. 点击项目卡片进入播放器
6. 点击播放按钮，验证音频播放
7. 点击 MARK 按钮，验证热区创建
8. 刷新页面，验证热区持久化

---

## 验收标准

- [ ] 无 hydration 错误
- [ ] 播客搜索返回结果或显示错误
- [ ] 音频可以正常播放/暂停
- [ ] 进度条可以拖动
- [ ] MARK 按钮创建热区
- [ ] 热区显示转录文本
- [ ] 刷新页面后热区仍然存在
- [ ] 所有验证命令通过

---

## 完成后：更新 PROGRESS.md

```markdown
### 2026-03-08: 修复 Hydration 错误并实现核心功能
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. 修复 hydration 错误 - 统一 formatTime 函数
2. 修复播客搜索 - 添加错误处理
3. 实现真实音频播放 - 添加加载状态
4. 实现 MARK 转录 - 集成 Groq API
5. 实现数据持久化 - 热区保存到 Supabase
```

---

## 注意事项

1. **环境变量**：确保所有必需的环境变量已配置
2. **API 密钥**：Groq 和 Podcast Index 密钥必须有效
3. **CORS**：确保音频 URL 支持 CORS
4. **Supabase**：确保已运行 migrations
5. **调试**：使用浏览器控制台查看详细错误

---

**信心评分**：9/10

**风险评估**：
- 低风险：hydration 修复是标准操作
- 中风险：API 集成依赖外部服务
- 中风险：音频加载可能遇到 CORS 问题
