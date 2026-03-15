# Simpod v2 开发进度

> **协作同步文档**：本文件用于在不同 AI 工具（Claude Code、Antigravity、Roo Code）之间同步开发进度。

---

## 当前状态

### 最后更新
- **更新时间**: 2026-03-15 (今天，工程审计)
- **更新者**: Claude Code
- **当前分支**: master

### 项目阶段
- **当前阶段**: ✅ 音频播放修复完成 + 工程审计清理
- **下一步**: 手动测试和性能基准测试

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

### 4. 前端组件集成 ✅
- [x] 集成 v0 前端组件库
- [x] 迁移播放器组件
- [x] 迁移热区组件
- [x] 迁移转录组件
- [x] 迁移波形组件

### 5. MVP 核心功能实现 ✅
- [x] 修复 workspace 播放器页面 404 问题
- [x] 连接 Zustand store 实现状态管理
- [x] 实现播客搜索功能
- [x] 实现音频播放功能（代码完成，待调试）
- [x] 实现 MARK 转录功能
- [x] 实现热区保存到数据库

### 6. 播客播放流程修复和架构优化 ✅
- [x] 添加调试日志到关键路径
- [x] 修复 mock 数据音频 URL
- [x] 创建音频 URL 验证工具
- [x] 更新 RSS 解析器使用音频验证
- [x] 更新 EpisodeList 添加错误状态
- [x] 更新播放器页面添加音频 URL 诊断
- [x] 创建 PodcastManager 服务（参考 AntennaPod）
- [x] 更新播客详情页使用 PodcastManager
- [x] 创建 podcastStore 状态管理
- [x] TypeScript 类型检查通过

### 7. 根本性修复 RSS 解析和播客播放流程 ✅
- [x] 安装 fast-xml-parser 依赖
- [x] 创建新的 RSS 解析器 v2（使用 fast-xml-parser）
- [x] 创建音频 URL 测试工具
- [x] 创建音频测试 API 端点
- [x] 创建 RSS 诊断工具
- [x] 更新 PodcastManager 使用新解析器
- [x] 增强播客详情页诊断显示
- [x] 改进播放器错误处理
- [x] 放宽音频 URL 验证规则
- [x] 创建真实播客测试用例
- [x] TypeScript 编译通过
- [x] ESLint 检查通过
- [x] 项目构建成功

---

## 具体完成任务记录

### 2026-03-08: 初始化 Next.js 项目
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 手动创建 Next.js 15 项目结构，配置 TypeScript、Tailwind CSS、ESLint、Prettier。设置 Supabase 客户端（client.ts、server.ts）和中间件。创建 Zustand playerStore。创建 API 路由（groq-proxy、hotzones）。迁移现有服务层代码并更新导入路径。成功构建并验证开发服务器运行正常。

### 2026-03-08: 集成 v0 前端组件
**状态**: ✅ 已完成
**更新者**: Antigravity
**描述**: 将 v0 文件夹中的完整前端库集成到 Next.js App Router 项目中，包括播放器、热区、转录等所有组件，添加必要依赖（clsx、tailwind-merge、lucide-react、framer-motion），迁移页面和 stores，清理 v0 目录。

### 2026-03-08: MVP 核心功能修复与实现
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. 修复 workspace 播放器页面 404 问题 - 创建 src/app/workspace/[id]/page.tsx 动态路由
2. 连接 Zustand store 实现 PodcastPlayerPage 状态管理
3. 集成热区服务实现 MARK 功能 - handleMark 调用 processAnchorsToHotzones 和 saveHotzone
4. 实现播客搜索 - 创建 podcast-search API 代理和前端 searchPodcasts 服务函数
5. 首页搜索功能连接 - 更新 src/app/page.tsx 调用真实搜索 API

### 2026-03-08: 修复 Hydration 错误并实现核心功能
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. **修复 hydration 错误** - 统一 formatTime 函数到 @/lib/time.ts，添加客户端渲染保护
2. **修复播客搜索** - 添加详细错误日志，在首页显示搜索结果和错误信息
3. **实现真实音频播放** - 添加音频加载状态指示器，添加错误处理
4. **实现 MARK 转录** - 添加转录加载状态，集成 Groq API 调用
5. **实现数据持久化** - 热区从数据库加载（fetchHotzones）和保存（saveHotzone）

### 2026-03-08: 手动测试和音频问题诊断
**状态**: ⚠️ 发现问题，待修复
**更新者**: Claude Code (根据用户反馈)
**测试结果**:
1. **播客搜索功能** ✅ 正常工作
2. **音频播放功能** ❌ 失败 - 音频元素报错
3. **Hydration 错误** ✅ 已修复

**错误信息**:
```
[Player] Audio element error: {}
Error Type: Console Error
位置: PodcastPlayerPage.tsx onError 处理器
```

**问题根因**:
- 音频 URL 可能无法访问或存在 CORS 问题
- 错误处理信息不够详细（空对象 {}）
- 需要实现音频代理或使用本地音频文件

### 2026-03-09: 简化播客搜索和修复音频播放
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. **简化播客搜索** - 移除 Podcast Index API（网络不稳定），仅使用 iTunes Search API
2. **创建 iTunes CORS 代理** - 新建 `/api/itunes-proxy` 路由避免 CORS 问题
3. **重写 podcast-search.ts** - 简化为仅使用 iTunes API，添加详细错误处理
4. **修复音频播放** - PodcastPlayerPage 现在正确使用从 RSS feed 获取的 audioUrl
5. **改进错误处理** - 首页添加友好的错误提示和搜索建议
6. **移除 mock 数据依赖** - 播放器现在使用真实的播客音频 URL

### 2026-03-12: 根本性修复 RSS 解析和播客播放流程
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 
采用分层诊断和修复策略，实现了更健壮的 RSS 解析和音频播放系统。

**第一层：增强 RSS 解析**
- 安装 `fast-xml-parser` 依赖
- 创建新的 RSS 解析器 v2（src/lib/rss-parser-v2.ts）
  - 使用 fast-xml-parser 替代浏览器 DOMParser
  - 改进命名空间处理（itunes:、content: 等）
  - 更好的错误报告和日志

**第二层：改进音频 URL 验证**
- 创建音频 URL 测试工具（src/lib/audio-tester.ts）
  - 使用 HEAD 请求测试 URL 可访问性
  - Fallback 到 GET 请求
  - 检查 Content-Type 是否为音频格式
- 放宽音频 URL 验证规则（src/lib/audio-validator.ts）
  - 只检查基本 URL 格式有效性
  - 允许更多有效的 URL 模式

**第三层：增强诊断能力**
- 创建 RSS 诊断工具（src/lib/rss-diagnostics.ts）
- 创建音频测试 API 端点（src/app/api/audio-test/route.ts）
- 增强播客详情页诊断显示（src/app/podcast/[id]/page.tsx）
- 改进播放器错误处理（src/components/player/PodcastPlayerPage.tsx）

**第四层：端到端测试支持**
- 创建真实播客测试用例（src/lib/test-podcasts.ts）
- 创建测试指南（src/lib/TESTING_GUIDE.ts）

**验证结果**:
- ✅ TypeScript 编译通过
- ✅ 项目构建成功
- ✅ 所有新文件创建完成
- ✅ 所有依赖安装成功
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. **阶段1：诊断和紧急修复**
   - 添加调试日志到关键路径（podcast/[id]/page.tsx、EpisodeList.tsx、workspace/[id]/page.tsx、PodcastPlayerPage.tsx）
   - 修复 mock 数据音频 URL（替换为 SoundHelix 等公开测试音频）
   - 添加 RSS 解析结果验证

2. **阶段2：核心稳定性改进**
   - 创建音频 URL 验证工具（src/lib/audio-validator.ts）- HTTP→HTTPS 转换，URL 验证
   - 更新 RSS 解析器使用音频验证
   - 更新 EpisodeList 添加错误状态显示
   - 更新播放器页面添加音频 URL 诊断信息

3. **阶段3：架构优化（参考 AntennaPod）**
   - 创建 PodcastManager 服务（src/services/podcast-manager.ts）- 5分钟缓存，搜索功能
   - 更新播客详情页使用 PodcastManager
   - 创建 podcastStore 状态管理（src/stores/podcastStore.ts）

**新建文件**:
- `src/lib/audio-validator.ts` - 音频 URL 验证和清理工具
- `src/services/podcast-manager.ts` - 统一的播客管理服务
- `src/stores/podcastStore.ts` - 播客相关状态管理

**修改文件**:
- `src/lib/rss-parser.ts` - 集成音频验证
- `src/lib/mock-data.ts` - 更新音频 URL
- `src/app/podcast/[id]/page.tsx` - 使用 PodcastManager
- `src/components/podcast/EpisodeList.tsx` - 添加错误处理
- `src/app/workspace/[id]/page.tsx` - 添加调试日志
- `src/components/player/PodcastPlayerPage.tsx` - 添加音频 URL 诊断

### 2026-03-12: 根本性修复 RSS 解析和播客播放流程
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
采用分层诊断和修复策略，实现了更健壮的 RSS 解析和音频播放系统。

**第一层：增强 RSS 解析**
- 安装 `fast-xml-parser` 依赖（npm install fast-xml-parser）
- 创建新的 RSS 解析器 v2（src/lib/rss-parser-v2.ts）
  - 使用 fast-xml-parser 替代浏览器 DOMParser
  - 改进命名空间处理（itunes:、content: 等）
  - 更好的错误报告和日志
  - 正确处理单个和多个 items 的差异

**第二层：改进音频 URL 验证**
- 创建音频 URL 测试工具（src/lib/audio-tester.ts）
  - 使用 HEAD 请求测试 URL 可访问性
  - Fallback 到 GET 请求（某些服务器不支持 HEAD）
  - 检查 Content-Type 是否为音频格式
  - 5 秒超时限制
- 放宽音频 URL 验证规则（src/lib/audio-validator.ts）
  - 只检查基本 URL 格式有效性
  - 允许更多有效的 URL 模式
  - 实际可访问性由 audio-tester 工具验证

**第三层：增强诊断能力**
- 创建 RSS 诊断工具（src/lib/rss-diagnostics.ts）
  - 诊断 RSS feed 解析问题
  - 测试第一个剧集的音频 URL
  - 返回详细的诊断信息
- 创建音频测试 API 端点（src/app/api/audio-test/route.ts）
  - 接收 URL 查询参数
  - 返回音频 URL 有效性信息
  - 支持 CORS 跨域请求
- 增强播客详情页诊断显示（src/app/podcast/[id]/page.tsx）
  - 自动运行诊断（debug 模式或 mock 数据时）
  - 显示 RSS 解析状态、剧集数、音频有效性
  - 错误时显示详细诊断信息
- 改进播放器错误处理（src/components/player/PodcastPlayerPage.tsx）
  - 更详细的错误日志
  - 包含音频 URL、网络状态、就绪状态等信息

**第四层：端到端测试支持**
- 创建真实播客测试用例（src/lib/test-podcasts.ts）
  - BBC News、NPR、TED Talks 等真实播客
  - 用于手动测试和诊断
- 创建测试指南（src/lib/TESTING_GUIDE.ts）
  - 7 个完整的测试用例
  - API 测试方法
  - 性能指标测量

**更新 PodcastManager**
- 迁移到新的 RSS 解析器 v2
- 添加详细的解析日志
- 验证所有音频 URL 有效性

**验证结果**:
- ✅ TypeScript 编译通过（npx tsc --noEmit）
- ✅ 项目构建成功（npm run build）
- ✅ 所有新文件创建完成
- ✅ 所有依赖安装成功

**新建文件**:
- `src/lib/rss-parser-v2.ts` - 新的 RSS 解析器（使用 fast-xml-parser）
- `src/lib/audio-tester.ts` - 音频 URL 测试工具
- `src/app/api/audio-test/route.ts` - 音频测试 API 端点
- `src/lib/rss-diagnostics.ts` - RSS 诊断工具
- `src/lib/test-podcasts.ts` - 真实播客测试用例
- `src/lib/TESTING_GUIDE.ts` - 测试指南

**修改文件**:
- `src/services/podcast-manager.ts` - 迁移到 rss-parser-v2，添加日志
- `src/lib/audio-validator.ts` - 放宽验证规则，采用宽松策略
- `src/app/podcast/[id]/page.tsx` - 添加诊断显示和 debug 模式
- `src/components/player/PodcastPlayerPage.tsx` - 改进错误处理和日志

**package.json 更新**:
- 添加 `fast-xml-parser` 依赖

---

## 进行中的任务

### 当前任务：诊断和修复博客搜索播放加载问题
**状态**: ✅ 已完成
**描述**:
- ✅ 根本原因分析：代理返回 JSON 错误对象，客户端把它当 XML 解析失败
- ✅ 修复 `rss-parser-v2.ts`：正确解析代理错误响应，不再吞掉错误信息
- ✅ 修复 `podcast-manager.ts`：移除静默 fallback 到 mock 数据，让错误向上传播
- ✅ 修复 `rss-proxy/route.ts`：改进错误格式、添加内存缓存、结构化日志
- ✅ 清理 `podcast/[id]/page.tsx`：移除 diagnostics 面板和 mock 提示
- ✅ 删除无用文件：audio-tester、rss-diagnostics、test-podcasts、test-supabase、TESTING_GUIDE、rss-parser（旧版）、hotzone-v2、audio-test API 路由

**根本性改进**:
1. 错误信息链路完整：代理 → 客户端 → 用户界面
2. 代理不再静默失败
3. 客户端不再静默 fallback
4. 代码库减少冗余文件 8 个

### 诊断和修复博客搜索播放加载持续但无法播放的问题
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
采用分层诊断和修复策略，根本性解决了"加载播放一直持续但播放不了"的问题。

**根本原因（5 个环节的链式失败）**:
1. `EpisodeList.tsx` 将音频 URL 先包装为代理 URL 再通过 searchParams 传给播放器，导致播放器的 `<audio src>` 是嵌套代理 URL（双重代理）
2. 播放器超时只有 15 秒，国际播客服务器响应慢时直接超时报错
3. 事件处理链不完整（缺少 `canplaythrough`、`playing`、`stalled`、`waiting` 事件）
4. `loadstart` 事件没有重置 `audioLoading` 状态，导致多次加载时状态紊乱
5. 音频代理没有重试机制，单次网络抖动即永久失败

**修复内容**:
- ✅ 重写 `api/audio-proxy/route.ts`：添加指数退避重试（最多 2 次）、SSRF 防护（拦截本地地址）、智能 Content-Type 推断、完整 CORS 头
- ✅ 修复 `EpisodeList.tsx`：直接传递原始 audioUrl，由播放器内部统一处理代理，消除双重代理问题
- ✅ 修复 `PodcastPlayerPage.tsx`：
  - `<audio src>` 统一使用 `/api/audio-proxy?url=...` 包装
  - 超时从 15 秒增加到 30 秒
  - 新增 `canplaythrough`、`playing`、`stalled`、`waiting` 事件处理
  - `loadstart` 事件重置加载状态（修复多次加载状态紊乱）
  - 移除未使用的 `generateId` import
- ✅ TypeScript 编译通过（npx tsc --noEmit，exit code 0）
- ✅ ESLint 检查通过（无新增 errors，仅已有 warnings）

---

## 待办事项

### 高优先级 🔥

#### Phase 1: 紧急修复 ✅ **已完成**
- [x] 修复 Supabase 错误处理
- [x] 添加 API 超时和重试机制
- [x] 修复播放器状态同步
- [x] 创建诊断报告文档

#### Phase 2: 核心优化 ⏳ **待开始**
- [ ] **重构音频处理**（AudioContextPool，内存管理）
  - [ ] 实现 AudioContextPool 复用 AudioContext
  - [ ] 添加资源清理机制
  - [ ] 实现分块处理大文件
  - [ ] 添加进度回调
  
- [ ] **修复热区并发处理**（竞态条件）
  - [ ] 使用事务性操作保证一致性
  - [ ] 实现锁机制防止竞态条件
  - [ ] 添加原子性操作
  - [ ] 实现回滚机制
  
- [ ] **改进缓存策略**（智能 TTL）
  - [ ] 实现智能 TTL（基于内容类型）
  - [ ] 添加缓存预热
  - [ ] 实现增量更新
  - [ ] 添加缓存失效通知
  
- [ ] **统一错误处理**（AppError 类）
  - [ ] 创建 AppError 类
  - [ ] 实现错误分类系统
  - [ ] 添加错误恢复策略
  - [ ] 统一日志格式

### 中优先级 ⚡

#### Phase 3: 代码质量 ⏳ **待开始**
- [ ] 消除代码重复（提取 generateId()）
- [ ] 完善类型系统（修复 HotzoneMetadata）
- [ ] 实现日志系统（Logger 类）
- [ ] 添加单元测试

#### Phase 4: 性能优化 ⏳ **待开始**
- [ ] 优化音频处理（Web Worker）
- [ ] 优化数据库查询（索引、缓存）
- [ ] 优化网络请求（去重、合并）

### 低优先级 📋
- [ ] 添加离线支持
- [ ] 考虑参考开源播客项目
- [ ] 性能监控和分析

---

## 技术栈确认

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **UI 组件**: 自定义组件 + lucide-react 图标

### 后端
- **BaaS**: Supabase
- **数据库**: PostgreSQL
- **认证**: Supabase Auth
- **实时**: Supabase Realtime

### AI 服务
- **转录**: Groq Whisper API
- **搜索**: iTunes Search API (通过 CORS 代理)

### 开发工具
- **包管理**: npm
- **代码规范**: ESLint + Prettier
- **测试**: (待添加 - Vitest + Playwright)

---

## 已知问题

### 已解决的问题 ✅

**Podcast Index API 网络问题**
- **症状**: API 调用失败，返回空对象或网络错误
- **解决方案**: 移除 Podcast Index API，仅使用 iTunes Search API
- **状态**: ✅ 已解决

**音频播放使用 mock 数据**
- **症状**: 播放器使用默认测试音频，而非播客实际音频
- **解决方案**: 修改 PodcastPlayerPage 正确使用从 RSS feed 获取的 audioUrl
- **状态**: ✅ 已解决

**Mock 数据音频 URL 无效**
- **症状**: 首页项目卡片使用 example.com 无效 URL
- **解决方案**: 替换为 SoundHelix 等公开测试音频 URL
- **状态**: ✅ 已解决

---

## 技术决策记录

### 2026-03-09: 简化播客搜索策略
**决策**: 移除 Podcast Index API，仅使用 iTunes Search API

**理由**:
- Podcast Index API 在中国大陆访问不稳定
- iTunes Search API 覆盖范围广，数据质量高
- 减少依赖，提高系统稳定性
- 通过 CORS 代理解决跨域问题

**实施**:
- 创建 `/api/itunes-proxy` 路由
- 重写 `src/lib/podcast-search.ts` 移除 Podcast Index 相关代码
- 改进错误处理和用户反馈

### 2026-03-09: 真实音频 URL 集成
**决策**: 播放器必须使用从 RSS feed 获取的真实音频 URL

**理由**:
- Mock 数据无法测试真实场景
- 用户需要播放实际播客内容
- 便于调试真实音频播放问题

**实施**:
- PodcastPlayerPage 接收并使用 audioUrl 参数
- 当没有 audioUrl 时显示友好提示
- 移除对 mock 数据的硬编码依赖

### 2026-03-09: PodcastManager 服务架构
**决策**: 参考 AntennaPod 创建 PodcastManager 服务

**理由**:
- 统一管理播客数据和缓存
- 减少重复的 RSS 解析请求
- 为未来功能（订阅管理）提供基础

**实施**:
- 创建 `src/services/podcast-manager.ts`
- 5分钟内存缓存
- 集成音频 URL 验证

---

## 环境配置

### 已配置的环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sullhivtnigaxxqksmnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_R7s7q7JWlk0G4nM_ccXvcQ_lz0bnwSh

# Groq API
GROQ_API_KEY=***REMOVED***

# Podcast Index (已弃用，保留供参考)
PODCAST_INDEX_KEY=***REMOVED***
PODCAST_INDEX_SECRET=***REMOVED***
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
- `master`: 当前开发分支

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

### 新对话开始时
1. **首先阅读 PROGRESS.md** 了解当前状态
2. **检查待办事项** 优先级
3. **查看已知问题** 避免重复工作

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

### 推荐参考的开源播客项目
- [Podverse](https://github.com/Podverse/podverse-desktop) - React + Electron
- [AntennaPod](https://github.com/AntennaPod/AntennaPod) - Android + Kotlin
- [Podfetch](https://github.com/SamTV12345/PodFetch) - Rust + Svelte

---

## 注释

> **注意**: 本文件是项目进度的"单一事实来源"。所有 AI 工具都应该在完成任务后更新此文件，以保持同步。

---

**文档版本**: 1.6
**创建日期**: 2026-03-07
**最后更新**: 2026-03-12 (下午)
**更新者**: Claude Code
