# Simpod Developer Guide

> **单一事实来源 (SSOT)**：开始任何开发任务前必须阅读本文档。

---

## 快速开始

### 必读文档（按顺序）

1. **[ROADMAP.md](ROADMAP.md)** — 全局计划总览（从这里开始）`n2. **本文档** — 技术规则、架构和防坑准则
3. **[PROGRESS.md](PROGRESS.md)** — ⭐ 项目进度（多工具协作必读）
4. **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** — 工作流命令参考

### 标准开发流程

```
/prime              → 加载项目上下文
/plan-feature       → 创建实施计划
/execute 计划文件   → 执行实施
/validate           → 验证质量
/commit             → 标准化提交
```

---

## ⚠️ Simpod 开发防坑准则（必读）

这些准则来自实际踩过的坑，违反它们将导致难以排查的 Bug。

### 准则 1：先打日志，再修复（Strict Rule）

**在进行任何 Debug 任务前，必须先在相关逻辑节点添加 `console.log` 以确认真实数据流。禁止在没有数据证据的情况下进行「推测性修复」。**

这条规则直接来自 RSS 解析 Bug 的教训：我们花了 3 小时猜测原因，最后发现是 UI 层的双重代理问题。如果一开始就打日志，5 分钟就能定位。

```typescript
// ✅ 正确：先确认数据，再决定修复方向
console.log('[RSSParser] Raw response:', { status, contentType, bodyPreview: text.slice(0, 100) })
console.log('[Player] Audio element state:', { src: audio.src, readyState, networkState })
console.log('[Supabase] Moving transcript_words to metadata for schema compatibility')

// ❌ 错误：看到症状就猜原因然后直接修改
// 这导致了 MARK 失败的 3 小时调试
```

**关键日志节点**：
- API 请求发出前（URL、参数）
- API 响应收到后（状态码、数据预览）
- 状态更新前（旧值 → 新值）
- 组件 mount/unmount 时（关键 ref 是否存在）
- 数据转换时（原始数据 → 转换后数据）

---

### 准则 2：UI 代码不碰业务逻辑

v0.dev 生成的 UI 组件**只能做展示和事件转发**，所有业务逻辑必须在 hooks/services/utils 层。

```typescript
// ✅ 正确：组件只负责展示和事件转发
function EpisodeItem({ episode }: Props) {
  return <button onClick={() => onPlay(episode.audioUrl)}>Play</button>
}

// ❌ 错误：组件内部处理 URL 代理、格式转换等业务逻辑
function EpisodeItem({ episode }: Props) {
  const proxied = `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`
  // 这里的 URL 转换属于业务逻辑，不属于 UI
  return <button onClick={() => onPlay(proxied)}>Play</button>
}
```

**为什么重要**：当 UI 层处理业务逻辑时，数据会在不该转换的地方被转换，导致下游组件收到错误的数据格式。这正是导致双重代理问题的根本原因。

---

### 准则 3：`<audio>` / `<video>` 元素不能有条件渲染

HTML 媒体元素的 `ref` 和事件监听器必须在组件生命周期内**始终存在**，不能被 `isMounted`、条件判断或 early return 影响。

```typescript
// ✅ 正确：audio 元素始终在 DOM 中
return (
  <div>
    <audio ref={audioRef} src={proxiedUrl} />
    {!isLoaded && <LoadingSpinner />}
  </div>
)

// ❌ 错误：isMounted 导致 audio 渲染时机晚于事件绑定
if (!isMounted) return <LoadingSpinner />  // 此时 audioRef.current = null
return <audio ref={audioRef} src={url} />  // 事件监听器已错过绑定时机
```

**为什么重要**：这导致了"音频永远加载中"的死锁。`useEffect` 在 `isMounted=false` 时执行，`audioRef.current` 是 null，事件监听器无法绑定。当 `isMounted` 变 true 后，`<audio>` 渲染了，但 `useEffect` 不会重新运行。

---

### 准则 4：代理 URL 只包装一次

音频/RSS URL 通过代理访问时，**只在最终消费者处包装一次**，中间层不得重复包装。

```typescript
// ✅ 正确：只在播放器的 <audio src> 处包装
<audio src={`/api/audio-proxy?url=${encodeURIComponent(rawAudioUrl)}`} />

// ❌ 错误：EpisodeList 包装一次，再通过 URL params 传给播放器后又包装一次
const proxied = `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`
const playUrl = `/workspace/${id}?audioUrl=${encodeURIComponent(proxied)}`  // 双重包装！
// 播放器再包装一次 → /api/audio-proxy?url=%2Fapi%2Faudio-proxy%3Furl%3D...
// 代理收到的是 localhost 地址 → SSRF 防护拦截 → 永久失败
```

**为什么重要**：双重包装导致代理收到 `localhost` 地址，被 SSRF 防护拦截，用户看到"永远加载中"。

---

### 准则 5：删除前验证没有被引用

删除任何文件（特别是 `src/lib/` 下的工具文件）前，必须先搜索引用：

```bash
# 删除前必须运行
rg "import.*audio-context-pool" src/
npx tsc --noEmit  # 删除后验证编译通过
```

过度工程化（over-engineering）的文件（如 `cache-manager.ts`、`request-optimizer.ts`、`performance-monitor.ts`）如未被实际使用，直接删除，不要保留「以备将来用」。

**为什么重要**：我们删除了 `audio-context-pool.ts`，但 `audio.ts` 还在引用它，导致编译失败。这浪费了 30 分钟的调试时间。

---

## 项目概述

### 产品愿景

Simpod 是一个播客学习平台，核心用户流程：

> **盲听插锚 → AI 智能热区 → 批量复盘**

### 核心概念

| 术语 | 定义 |
|------|------|
| **Anchor** | 用户在播放时标记的时间戳 |
| **Hotzone** | 基于 Anchor 生成的音频片段（±10s），包含转录文本 |
| **Transcript** | 共享缓存的转录数据，避免重复调用 API |
| **audio_id** | 播客剧集的唯一标识符 |

---

## 架构总览

```
src/
├── app/                    # Next.js App Router 页面和 API 路由
│   ├── api/
│   │   ├── audio-proxy/    # 音频代理（解决 CORS，支持 Range 请求）
│   │   ├── rss-proxy/      # RSS 代理（缓存 5 分钟，带重试）
│   │   ├── itunes-proxy/   # iTunes 搜索代理
│   │   ├── groq-proxy/     # Groq 转录 API 代理
│   │   └── hotzones/       # Hotzone CRUD
│   ├── podcast/[id]/       # 播客详情页（剧集列表）
│   ├── workspace/[id]/     # 播放器工作区
│   └── page.tsx            # 首页（搜索）
├── components/
│   ├── player/             # PodcastPlayerPage, PlaybackControls, MarkButton
│   ├── podcast/            # EpisodeList
│   ├── hotzones/           # HotzoneSidebar
│   ├── waveform/           # HotzoneWaveform
│   └── transcript/         # TranscriptStream
├── services/               # 业务逻辑层
│   ├── supabase.ts         # DB CRUD（hotzones, transcripts）
│   ├── groq.ts             # 转录 API
│   ├── hotzone.ts          # Hotzone 生成和处理管道
│   └── podcast-manager.ts  # RSS 解析和缓存
├── lib/
│   ├── rss-parser-v2.ts    # RSS 解析器（fast-xml-parser）
│   ├── audio-validator.ts  # 音频 URL 验证
│   ├── podcast-search.ts   # iTunes 搜索
│   ├── mock-data.ts        # 开发用 mock 数据
│   └── time.ts             # 时间格式化工具
├── stores/
│   ├── playerStore.ts      # 播放器状态（Zustand）
│   └── podcastStore.ts     # 播客列表状态（Zustand）
├── types/
│   └── simpod.ts           # 核心类型定义
└── utils/
    └── audio.ts            # 音频切片工具（Web Audio API）
```

---

## 数据流（关键路径）

### 播放流程

```
搜索播客 (iTunes API)
  → 选择播客 → RSS 解析 (rss-proxy + rss-parser-v2)
  → 选择剧集 → 传递原始 audioUrl
  → workspace/[id]?audioUrl=...
  → PodcastPlayerPage
  → <audio src="/api/audio-proxy?url=编码后的audioUrl">
  → HTML5 Audio 事件 → Zustand store 更新 → UI 响应
```

### MARK 转录流程

```
用户按 MARK → 记录当前时间戳 (Anchor)
  → processAnchorsToHotzones()
  → 切片音频 (sliceRemoteAudio via audio-proxy)
  → 检查 transcript 缓存 (Supabase)
  → 命中 → 复用缓存
  → 未命中 → Groq Whisper API → 保存缓存
  → 生成 Hotzone → 保存 Supabase → 更新 UI
```

---

## 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Groq（转录）
GROQ_API_KEY=
```

---

## 代码规范

- **文件名**：kebab-case (`rss-parser-v2.ts`)
- **组件名**：PascalCase (`HotzoneSidebar.tsx`)
- **函数名**：camelCase (`fetchHotzones`)
- **日志前缀**：`[模块名]` 格式（`[Player]`、`[RSS]`、`[Hotzone]`）
- **类型**：所有函数参数和返回值都要有明确类型，禁用 `any`

---

### 准则 6：Middleware 不能干扰 API 路由（Strict Rule）

**Next.js middleware 必须显式排除 `/api/*` 路由，避免在 API 处理前执行全局逻辑（如 Supabase session 刷新）导致代理超时或行为异常。**

这条规则来自 Phase 3 的 middleware 覆盖问题：新 middleware 在每个请求上调用 `supabase.auth.getUser()`，导致 `/api/rss-proxy` 请求延迟和失败。

```typescript
// ✅ 正确：API 路由直接跳过
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()  // 直通，不执行任何逻辑
  }
  
  // 只对页面路由执行 session 刷新
  const supabase = createServerClient(...)
  await supabase.auth.getUser()
  return supabaseResponse
}

// ❌ 错误：所有请求都执行 Supabase 调用
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  await supabase.auth.getUser()  // 这会阻塞 /api/rss-proxy
  return NextResponse.next()
}
```

**检查清单**：
- [ ] 新增 middleware 时，检查 matcher 是否包含 `/api/*`
- [ ] 如果包含，添加 `if (pathname.startsWith('/api/')) return NextResponse.next()`
- [ ] 删除旧 middleware 文件避免冲突（Next.js 只加载根目录 `middleware.ts`）
- [ ] 测试 API 路由响应时间是否正常（应 < 1s）

**诊断命令**：
```bash
# 检查是否有多个 middleware 文件
find . -name "middleware.ts" -o -name "middleware.js"

# 检查 middleware 是否排除了 /api
grep -n "pathname.startsWith('/api')" middleware.ts
```

---

### 准则 7：模块化设计 - 独立开发与集成（Strict Rule）

**为了支持并行开发和降低集成风险，所有新功能必须遵循模块化设计原则。各模块之间通过明确的接口通信，不直接依赖内部实现。**

这条规则确保：
1. 不同开发者可以独立开发不同模块
2. 模块更新不会影响其他模块
3. 易于测试和调试
4. 易于后期替换或升级

**模块划分**：
```
src/
├── services/          # 业务逻辑层（独立模块）
│   ├── hotzone.ts     # 热区处理模块
│   ├── transcription.ts # 转录模块
│   ├── playback.ts    # 播放控制模块
│   └── analytics.ts   # 统计分析模块
├── components/        # UI 组件层（展示层）
│   ├── player/        # 播放器模块
│   ├── hotzones/      # 热区管理模块
│   ├── transcript/    # 转录显示模块
│   └── analytics/     # 统计显示模块
├── stores/            # 状态管理（接口层）
│   ├── playerStore.ts
│   ├── hotzoneStore.ts
│   └── analyticsStore.ts
└── lib/               # 工具库（可复用）
    ├── audio.ts       # 音频处理
    ├── time.ts        # 时间格式化
    └── cache.ts       # 缓存工具
```

**模块间通信规则**：
```typescript
// ✅ 正确：通过 store 和 service 接口通信
// 组件只调用 service 的公开接口
const result = await hotzoneService.createHotzone(data)

// ❌ 错误：组件直接调用内部函数
const result = await hotzoneService._internalProcessing(data)

// ✅ 正确：模块通过 store 共享状态
const { hotzones } = useHotzoneStore()

// ❌ 错误：模块直接修改其他模块的状态
hotzoneStore.hotzones = newHotzones  // 绕过 setter
```

**新功能开发检查清单**：
- [ ] 功能是否有明确的 service 层实现？
- [ ] 是否通过 store 暴露状态？
- [ ] 是否有清晰的公开接口文档？
- [ ] 是否避免了跨模块的直接依赖？
- [ ] 是否可以独立测试？

---

**最后更新**：2026-03-17
**版本**：3.3（7 条防坑准则 + 模块化设计）

