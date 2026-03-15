# Simpod Developer Guide

> **单一事实来源 (SSOT)**：开始任何开发任务前必须阅读本文档。

---

## 快速开始

### 必读文档（按顺序）

1. **本文档** — 技术规则、架构和防坑准则
2. **[PROGRESS.md](PROGRESS.md)** — ⭐ 项目进度（多工具协作必读）
3. **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** — 工作流命令参考

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

### 准则 1：先打日志，再修复

**Strict Rule：在进行任何 Debug 任务前，必须先在相关逻辑节点添加 `console.log` 以确认真实数据流。禁止在没有数据证据的情况下进行「推测性修复」。**

```typescript
// ✅ 正确：先确认数据，再决定修复方向
console.log('[RSSParser] Raw response:', { status, contentType, bodyPreview: text.slice(0, 100) })
console.log('[Player] Audio element state:', { src: audio.src, readyState, networkState })

// ❌ 错误：看到症状就猜原因然后直接修改
```

**关键日志节点**：
- API 请求发出前（URL、参数）
- API 响应收到后（状态码、数据预览）
- 状态更新前（旧值 → 新值）
- 组件 mount/unmount 时（关键 ref 是否存在）

---

### 准则 2：UI 代码不碰业务逻辑

v0.dev 生成的 UI 组件**只能做展示**，所有业务逻辑必须在 hooks/services/utils 层。

```typescript
// ✅ 正确：组件只负责展示和事件转发
function EpisodeItem({ episode }: Props) {
  return <button onClick={() => onPlay(episode.audioUrl)}>Play</button>
}

// ❌ 错误：组件内部处理 URL 代理、格式转换等业务逻辑
function EpisodeItem({ episode }: Props) {
  const proxied = `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`
  // 这里的 URL 转换属于业务逻辑，不属于 UI
}
```

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

---

### 准则 4：代理 URL 只包装一次

音频/RSS URL 通过代理访问时，**只在最终消费者处包装一次**，中间层不得重复包装。

```typescript
// ✅ 正确：只在播放器的 <audio src> 处包装
<audio src={`/api/audio-proxy?url=${encodeURIComponent(rawAudioUrl)}`} />

// ❌ 错误：EpisodeList 包装一次，再通过 URL params 传给播放器后又包装一次
const proxied = `/api/audio-proxy?url=${encodeURIComponent(episode.audioUrl)}`
const playUrl = `/workspace/${id}?audioUrl=${encodeURIComponent(proxied)}`  // 双重包装！
```

---

### 准则 5：删除前验证没有被引用

删除任何文件（特别是 `src/lib/` 下的工具文件）前，必须先搜索引用：

```bash
# 删除前必须运行
rg "import.*audio-context-pool" src/
npx tsc --noEmit  # 删除后验证编译通过
```

过度工程化（over-engineering）的文件（如 `cache-manager.ts`、`request-optimizer.ts`、`performance-monitor.ts`）如未被实际使用，直接删除，不要保留「以备将来用」。

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

# Podcast Index（已弃用，保留供参考）
PODCAST_INDEX_KEY=
PODCAST_INDEX_SECRET=
```

---

## 数据库表

| 表名 | 用途 |
|------|------|
| `anchors` | 用户标记的时间戳 |
| `hotzones` | 转录后的音频片段 |
| `transcripts` | 共享转录缓存（按 audio_id + 时间范围索引）|

---

## 代码规范

- **文件名**：kebab-case (`rss-parser-v2.ts`)
- **组件名**：PascalCase (`HotzoneSidebar.tsx`)
- **函数名**：camelCase (`fetchHotzones`)
- **日志前缀**：`[模块名]` 格式（`[Player]`、`[RSS]`、`[Hotzone]`）
- **类型**：所有函数参数和返回值都要有明确类型，禁用 `any`

---

## 工程审计结论（2026-03-15）

### 已识别并修复的风险

| 风险 | 严重度 | 状态 |
|------|--------|------|
| `isMounted` 导致 `<audio>` 事件监听器无法绑定 | 🔴 严重 | ✅ 已修复 |
| EpisodeList 双重代理 URL（数据在 UI 层被意外转换）| 🔴 严重 | ✅ 已修复 |
| 音频代理无重试机制，单次网络抖动即失败 | 🟡 中 | ✅ 已修复 |
| `audio-context-pool` 等过度工程化文件未被使用却被引用 | 🟡 中 | ✅ 已清理 |
| `.agents/plans/` 历史计划文件堆积混淆上下文 | 🟠 低 | ✅ 已删除 |

### 已清理的冗余文件

- `.agents/`（所有计划和执行摘要）
- `DIAGNOSIS.md`、`QUICK_REFERENCE.md`、`MIGRATION_CHECKLIST.md`
- `WORKFLOW_COORDINATION.md`、`WORKFLOW_SETUP_COMPLETE.md`、`ACTION_GUIDE.md`
- `src/pages-legacy/`（v0 遗留的 landing page 组件）
- `src/components/hotzone/`（与 `hotzones/` 重复的目录）
- `src/lib/audio-context-pool.ts`、`cache-manager.ts`、`request-optimizer.ts`
- `src/lib/performance-monitor.ts`、`logger.ts`、`id-generator.ts`、`app-error.ts`
- `src/lib/mock-episodes.ts`（与 `mock-data.ts` 重复）

---

**最后更新**：2026-03-15
**版本**：3.0（工程审计后精简版）
