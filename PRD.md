# Simpod v2 产品需求文档 (PRD)

> **版本**: 1.1
> **创建日期**: 2026-03-08
> **更新日期**: 2026-03-08
> **项目阶段**: MVP 开发前期

---

## 1. 执行摘要

### 产品概述

Simpod 是一个为**进阶语言学习者**打造的智能泛听辅助平台，解决"泛听效率困境"：在选择合适材料能理解约 80% 的情况下，为了那 20% 不懂的内容反复折返精听，既浪费时间又破坏泛听体验，而不处理又影响整体理解。

核心流程为"**刻舟求剑插锚 → 智能上下文捕获 → 批量攻克复习**"，用户可以在连续泛听过程中对听不懂的地方"刻下锚点"，系统自动捕获该点的语义完整上下文（前后 3-4 句），结束后用户可以直接跳转到这些标记区块进行精听训练。

Simpod v2 是基于 legacy 项目 60% 代码基础的重构版本，采用 Next.js + Supabase + Zustand 的现代化技术栈，充分利用**开源库和现有工程**，用最小的成本和开发周期构建稳定可用的 MVP。

### 核心价值主张

- **最小中断**：用户可以在连续泛听过程中"刻下锚点"，无需暂停或拖拽进度条
- **语义完整**：自动捕获锚点前后 3-4 句的上下文，而非机械的固定秒数范围
- **批量攻克**：泛听结束后，所有标记的难点区块可直接跳转精听，提高学习效率
- **数据驱动**：收集用户标记数据，智能识别和标记音频中最可能让人听不懂的部分
- **开源优先**：充分使用成熟的开源库（如 wavesurfer.js、ffmpeg.wasm）加速开发

### MVP 目标声明

在 3-4 周内交付一个功能完整的 MVP，让进阶英语学习者能够：
1. 在泛听过程中标记听不懂的位置
2. 查看标记位置的语义完整上下文
3. 批量攻克所有标记的难点区块
4. 通过重复训练提升听懂率，让泛听发挥真正价值

---

## 2. 使命

### 产品使命

让**进阶语言学习者**在泛听过程中不被不懂的内容打断，又能高效收集和攻克难点，通过"刻舟求剑"式的标记和智能上下文捕获，让泛听发挥真正的学习价值——既练了英语，又懂了内容。

### 核心原则

1. **最小中断原则**：所有交互设计都应支持在连续泛听状态下完成，不破坏用户的心流，用户可以在听不懂的地方"刻下锚点"后继续收听
2. **语义完整原则**：标记不是简单的固定秒数范围，而是捕获锚点前后 3-4 句的语义完整上下文，为后续精听提供足够的训练材料
3. **批量攻克原则**：将泛听和精听分离，泛听时收集难点，泛听结束后集中时间逐个攻克，提高学习效率
4. **智能优先原则**：尽可能利用 AI 能力（词级时间戳、语义边界检测）自动化上下文捕获和难点识别
5. **开源优先原则**：技术实现优先使用成熟的开源库和现有工程（如 wavesurfer.js、ffmpeg.wasm），加速开发周期

---

## 3. 目标用户

### 主要用户画像

#### 用户 A：进阶英语学习者
- **特征**：英语水平较高（B2/C1+），能够选择合适难度级别的播客材料，泛听时能理解约 80% 的内容
- **技术舒适度**：高，熟悉各类 Web 应用和快捷键
- **学习场景**：日常通勤、运动、做家务时泛听播客，希望提升听力同时获取知识
- **关键需求**：泛听时标记听不懂的位置，查看语义完整上下文，批量攻克难点

#### 用户 B：时间紧张的专业人士
- **特征**：工作繁忙，只能利用碎片时间学习，追求最高学习效率
- **技术舒适度**：中高，能熟练使用标准 Web 功能
- **学习场景**：上下班路上泛听播客，希望高效利用有限时间
- **关键需求**：快速标记（不打断），直接跳转复习，智能难点识别

#### 用户 C：追求进步的语言爱好者
- **特征**：对提升听力有明确目标，愿意投入时间精听训练
- **技术舒适度**：高，愿意尝试新的学习工具
- **学习场景**：系统化学习计划，泛听+精听结合
- **关键需求**：数据追踪（难点统计），进度可视化，学习效果反馈

### 用户痛点

#### 泛听效率困境
- **选择困难**：选择太简单的材料学不到东西，选择太难的泛听完全听不懂
- **中间难点**：泛听时偶有听不懂的内容，要折返去精听会打断心流，不处理又影响整体理解
- **时间浪费**：为了那 20% 不懂的内容反复折返精听，浪费时间且破坏泛听体验
- **价值打折扣**：纯泛听既没练到英语，又没完全听懂播客

#### 传统解决方案的问题
- **手动记录困难**：需要暂停播放、拖拽进度条、手动记录位置，操作复杂
- **机械回退不准**：固定秒数回退（如 -5s）无法精确对齐语义边界
- **缺乏上下文**：只标记难点，没有上下文导致精听时信息不足
- **无法批量**：每次都要单独处理，没有统一的复习界面
- **重复劳动**：相同内容多人重复转录，无法共享学习成果

---

## 4. MVP 范围

### 范围内功能 ✅

#### 核心功能
- ✅ **播客搜索**
  - Podcast Index API + iTunes 混合搜索
  - RSS feed 解析和剧集列表展示
- ✅ **音频播放器**
  - 基础播放/暂停控制
  - 进度条拖拽跳转
  - 时间显示（当前时间/总时长）
  - 播放速度调整（0.5x - 2.0x）
- ✅ **"刻舟求剑"标记功能**
  - MARK 按钮快速标记当前播放位置（无需暂停）
  - 快捷键支持（空格 + Shift）
  - 标记时播放不中断
- ✅ **语义上下文捕获**
  - 基于词级时间戳自动识别句子边界
  - 捕获锚点前后 3-4 句的语义完整上下文
  - 热区保存到 Supabase 数据库
- ✅ **智能转录**
  - Groq Whisper API 集成（whisper-large-v3）
  - 词级时间戳获取（用于句子边界检测）
  - 共享转录缓存（transcripts 表，减少 API 成本）
- ✅ **热区管理**
  - 热区列表展示（按时间排序）
  - 点击热区直接跳转播放
  - 标记为"已攻克"
  - 过滤功能（显示/隐藏已攻克）
- ✅ **批量攻克复习**
- ✅ **随时跳转功能**  - 播放过程中可随时点击热区列表跳转回该区域  - 键盘快捷键支持（1-9 数字键快速跳转到对应热区）  - 核心价值：精准保留标记区域，随时可回溯- ✅ **快捷键交互**  - MARK 快捷键（空格 + Shift）  - 播放控制快捷键（空格：播放/暂停，←/→：快退/快进，↑/↓：上一个/下一个热区）  - 最小化 friction，纯键盘操作- ✅ **语音控制集成（浏览器原生）**  - 利用浏览器 Web Speech API 实现语音控制  - 支持语音指令："回退到刚刚讲的某个话题"、"重复刚才那部分"  - 锁定播放模式下的交互（避免语音误触发）
  - 专注界面显示所有未攻克的热区
  - 逐个播放热区音频
  - 显示每个热区的转录文本和上下文
  - 快速标记"已攻克"并进入下一个

#### 技术功能
- ✅ **Supabase 集成**
  - 数据库客户端配置
  - RLS 策略设置
  - 基础 CRUD 操作
- ✅ **状态管理**
  - Zustand store 实现
  - 播放器状态管理
  - 热区状态管理
- ✅ **API 代理**
  - Groq API 代理（CORS 处理）
  - 音频代理（Range 请求）
- ✅ **PWA 支持**  - Service Worker 配置  - 离线访问支持  - 安装提示

#### 集成
- ✅ Groq API（Whisper-large-v3）
- ✅ Podcast Index API
- ✅ iTunes Search API
- ✅ Supabase（PostgreSQL）

#### 部署
- ✅ Vercel 部署配置
- ✅ 环境变量管理

### 范围外功能 ❌

#### 高级功能
- ❌ **智能回溯**
  - 词级时间戳语义段落跳转
  - Full Stop 检测
- ❌ **智能热区**
  - LLM 内容重要性评分
  - 动态热区可视化
  - 难度评分

#### 用户功能
- ❌ **用户认证系统**
  - Supabase Auth 集成
  - 用户登录/注册
- ❌ **个人数据隔离**
  - 用户专属热区
  - 用户专属转录
- ❌ **社交功能**
  - 热区分享
  - 评论系统

#### 高级特性
- ❌ **波形交互编辑**
  - 拖拽调整热区边界
  - 多热区合并
- ❌ **高级搜索**
  - 全文搜索转录内容
  - 热区标签分类
- ❌ **数据导出**
  - Markdown/Anki 导出
  - 学习进度统计

---

## 5. 用户故事

### US1：播客发现
**作为一个学习者，我想要搜索并发现感兴趣的播客内容，以便开始学习之旅。**

**示例场景**：
1. 用户在首页搜索框输入"machine learning"
2. 系统并行查询 Podcast Index 和 iTunes API
3. 用户看到去重后的搜索结果列表，包含播客封面、标题和简介
4. 用户选择一个播客，查看其 RSS feed 解析后的剧集列表
5. 用户点击某个剧集，进入播放页面

---

### US2：音频播放控制
**作为一个学习者，我想要控制音频播放，以便灵活调整收听进度。**

**示例场景**：
1. 用户点击播放按钮，音频开始播放
2. 用户看到进度条实时更新
3. 用户拖拽进度条到 15:30 位置，音频立即跳转
4. 用户暂停播放，再次点击播放继续
5. 用户看到当前时间"15:30"和总时长"45:00"

---

### US3：快速标记内容
**作为一个学习者，我想要在收听过程中快速标记感兴趣的内容，而无需暂停播放。**

**示例场景**：
1. 用户听到一句有价值的话（时间戳 23:45）
2. 用户点击 MARK 按钮
3. 系统自动生成一个热区（时间范围约 11:45-33:45，考虑反应偏移）
4. 音频继续播放，用户的心流不被打断
5. 用户看到右侧侧边栏新增一条热区记录

---

### US4：查看转录文本
**作为一个学习者，我想要查看热区的转录文本，以便理解内容的上下文。**

**示例场景**：
1. 用户点击热区列表中的某条记录
2. 系统调用 Groq API 转录该热区对应的音频片段
3. 用户看到转录文本显示在界面上
4. 用户可以复制文本到剪贴板
5. 如果之前有人转录过相同内容，系统直接使用缓存结果

---

### US5：批量复习
**作为一个学习者，我想要在一个专注的界面中批量复习所有标记的内容，以便高效回顾。**

**示例场景**：
1. 用户完成一次收听后，点击"复习"按钮
2. 用户进入复习页面，看到所有热区按时间顺序排列
3. 用户逐个点击每个热区，播放对应的音频片段
4. 每个热区都显示其转录文本和上下文
5. 用户可以标记某个热区为"已学习"

---

### US6：热区跳转
**作为一个学习者，我想要点击热区列表直接跳转到对应位置播放，以便快速定位内容。**

**示例场景**：
1. 用户在热区列表中看到一个标记为"重要概念"的条目
2. 用户点击该条目
3. 音频立即跳转到该热区的开始时间
4. 音频开始播放该热区范围
5. 播放器高亮显示当前播放的热区

---

### US7：数据持久化
**作为一个学习者，我想要我的热区和转录数据自动保存，以便下次访问时仍然可用。**

**示例场景**：
1. 用户创建了一个热区
2. 系统自动将热区数据保存到 Supabase 的 hotzones 表
3. 用户关闭浏览器
4. 用户第二天重新打开页面
5. 用户看到之前创建的热区仍然存在

---

### US8：成本优化缓存
**作为一个系统，我想要共享转录缓存，以便减少重复的 API 调用。**

**示例场景**：
1. 用户 A 创建了一个热区（音频 10:00-20:00）
2. 系统调用 Groq API 进行转录
3. 系统将转录结果保存到 transcripts 表
4. 用户 B 创建了另一个热区（音频 10:05-19:55）
5. 系统检测到存在匹配的缓存（±1s 容差）
6. 系统直接使用缓存结果，无需再次调用 API

---

## 6. 核心架构与模式

### 高层架构

Simpod v2 采用 **前后端一体化** 架构，基于 Next.js 15 App Router 模式：

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
├─────────────────────────────────────────────────────────┤
│  UI Layer (React Components)                          │
│  - AudioPlayer, HotzoneList, Search, etc.            │
├─────────────────────────────────────────────────────────┤
│  State Management (Zustand Stores)                  │
│  - playerStore, hotzoneStore, transcriptStore        │
├─────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                      │
│  - groq.ts, supabase.ts, hotzone.ts, audio.ts     │
├─────────────────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)                 │
│  - /api/groq-proxy, /api/audio-proxy, etc.         │
├─────────────────────────────────────────────────────────┤
│  External Services                                  │
│  - Supabase (PostgreSQL), Groq API, Podcast Index   │
└─────────────────────────────────────────────────────────┘
```

### 目录结构

```
Simpod-v2/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页（搜索）
│   ├── player/             # 播放器页面
│   │   └── [audioId]/
│   │       └── page.tsx
│   └── review/            # 复习页面
│       └── page.tsx
├── components/             # UI 组件
│   ├── audio-player/
│   ├── hotzone-list/
│   ├── search-results/
│   └── waveform/
├── src/
│   ├── lib/              # 配置和工具
│   │   └── supabase.ts   # Supabase 客户端
│   ├── services/         # 业务逻辑
│   │   ├── groq.ts      # Groq API 集成
│   │   ├── supabase.ts   # 数据库操作
│   │   └── hotzone.ts   # 热区处理
│   ├── utils/           # 工具函数
│   │   └── audio.ts     # 音频处理
│   └── stores/          # Zustand 状态管理
│       ├── playerStore.ts
│       ├── hotzoneStore.ts
│       └── transcriptStore.ts
├── supabase/           # 数据库迁移
│   └── migrations/
└── .env               # 环境变量
```

### 关键设计模式

#### 1. 音频中心化数据模型 (Audio-Centric Data Model)

所有数据表通过 `audio_id` 关联，而非 `user_id`：

```typescript
// 传统用户中心化模型
user → hotzone (1:N)

// Simpod 音频中心化模型
audio_episode → hotzone (1:N)
audio_episode → anchor (1:N)
audio_episode → transcript (1:N)
```

**优势**：
- 支持共享转录缓存，减少 API 成本
- 简化查询逻辑（按音频 ID 查询所有相关数据）
- 未来可轻松添加用户视图层

#### 2. 共享转录缓存模式 (Shared Transcript Cache)

```typescript
// 热区创建流程
1. 用户创建热区 (10:00-20:00)
2. 检查 transcripts 表是否存在匹配缓存
3. 如果不存在：调用 Groq API → 保存到 transcripts 表
4. 如果存在：直接使用缓存结果
```

**技术实现**：
- transcripts 表使用唯一约束 `(audio_id, start_time, end_time)`
- 查询时使用 ±1 秒容差匹配
- upsert 操作避免重复插入

#### 3. 机械 + 上下文热区生成 (Mechanical + Contextual Generation)

```typescript
// 机械生成（默认）
center = anchor.timestamp - 2s (反应偏移)
start_time = center - 10s
end_time = center + 10s

// 上下文生成（如果存在完整转录）
找到重叠的转录片段
扩展到句子边界
```

**优势**：
- 默认使用简单机械算法，快速响应
- 当有完整转录时，提供更智能的边界
- 渐进式增强

#### 4. Web Audio API 音频切片

```typescript
// 音频切片流程
fetch → ArrayBuffer → AudioContext.decodeAudioData
→ AudioBuffer.slice → AudioBuffer → WAV Blob
```

**选择理由**：
- 比 ffmpeg.wasm 更轻量
- 浏览器原生支持，无需外部依赖
- 精确的帧级控制

### 特定技术模式

#### CORS 代理模式

所有外部 API 调用通过 Next.js API 代理：

```typescript
// 客户端
fetch('/api/groq-proxy', { body: formData })

// 服务端
// app/api/groq-proxy/route.ts
export async function POST(req: Request) {
  // 转发到 Groq API
  const response = await fetch('https://api.groq.com/...', options)
  return new Response(response.body)
}
```

**优势**：
- 隐藏 API 密钥
- 统一错误处理
- 支持 CORS 和 Range 请求

#### 词级时间戳利用

```typescript
// 热区边界优化
words = [{ word: "Hello", start: 0, end: 0.5 }, ...]

firstWord = words[0]
lastWord = words[words.length - 1]

new_start_time = hotzone_start + firstWord.start
new_end_time = hotzone_start + lastWord.end
```

**效果**：热区边界"磁吸"到实际语音内容

---

## 7. 工具/功能

### 7.1 音频播放器

**目的**：提供流畅的音频播放体验

**核心操作**：
- 播放/暂停
- 进度条拖拽跳转
- 时间显示（当前/总时长）
- 播放速度调整（0.5x - 2.0x）

**关键特性**：
- 自动加载音频 URL
- 支持远程音频流
- 播放进度实时同步到 Zustand store
- 支持热区跳转

**UI 组件**：
```tsx
// components/audio-player/AudioPlayer.tsx
interface AudioPlayerProps {
  audioUrl: string
  hotzones: Hotzone[]
  onSeek: (time: number) => void
  onPlayPause: () => void
}
```

---

### 7.2 转录文本显示

**目的**：展示热区的转录内容，提供上下文支持

**核心操作**：
- 显示转录文本
- 点击词跳转播放（词级时间戳）
- 复制文本到剪贴板

**关键特性**：
- 加载状态显示
- 错误处理（转录失败提示）
- 格式化显示（词间距、句子分隔）

**UI 组件**：
```tsx
// components/transcript/TranscriptDisplay.tsx
interface TranscriptDisplayProps {
  transcript_snippet: string
  transcript_words?: Word[]
  onWordClick: (time: number) => void
}
```

---

### 7.3 MARK 按钮

**目的**：快速创建热区，不打断播放流程

**核心操作**：
- 点击标记当前播放位置
- 触发热区创建流程
- 视觉反馈（按钮动画、热区列表更新）

**关键特性**：
- 固定位置显示（播放器右侧）
- 支持快捷键（空格 + Shift）
- 防抖动处理（防止重复点击）

**实现逻辑**：
```typescript
// 点击 MARK 按钮
const handleMark = async () => {
  const currentTime = playerStore.currentTime
  const anchor = {
    id: generateId(),
    audio_id: currentAudioId,
    timestamp: currentTime,
    source: 'manual',
    created_at: new Date().toISOString()
  }

  // 生成热区
  const hotzone = generateHotzoneFromAnchor(anchor)

  // 保存到数据库
  await saveHotzone(hotzone)

  // 更新 store
  hotzoneStore.add(hotzone)
}
```

---

### 7.4 波形可视化

**目的**：提供音频的视觉表示，辅助定位内容

**核心操作**：
- 显示音频波形
- 高亮标记的热区
- 点击波形跳转播放

**关键特性**：
- 动态生成波形（使用 Web Audio API）
- 热区高亮显示（不同颜色）
- 响应式设计

**实现方案**（使用 wavesurfer.js 开源库）：
- 集成 wavesurfer.js 开源库
- 从 AudioBuffer 提取音频数据并生成波形
- 支持热区高亮显示和点击跳转

**未来增强**：
- 支持波形交互编辑（拖拽调整热区边界）
- 支持多热区合并

---

### 7.5 热区侧边栏

**目的**：展示和管理所有热区

**核心操作**：
- 列表显示所有热区
- 按时间排序
- 点击跳转播放
- 标记为"已学习"

**关键特性**：
- 实时更新（新热区自动添加）
- 过滤功能（显示/隐藏已学习）
- 拖拽排序（可选）

**UI 组件**：
```tsx
// components/hotzone-list/HotzoneSidebar.tsx
interface HotzoneSidebarProps {
  hotzones: Hotzone[]
  onHotzoneClick: (hotzone: Hotzone) => void
  onHotzoneDelete: (id: string) => void
}
```

---

### 7.6 播客搜索

**目的**：发现和选择播客内容

**核心操作**：
- 搜索播客（关键词）
- 显示搜索结果
- 选择播客查看剧集列表
- 选择剧集进入播放

**关键特性**：
- 混合搜索（Podcast Index + iTunes）
- 结果去重（按 feedUrl）
- 缓存搜索结果

**实现逻辑**：
```typescript
// 搜索播客
const searchPodcasts = async (term: string) => {
  const [podcastIndexResults, iTunesResults] = await Promise.all([
    fetchFromPodcastIndex(term),
    fetchFromItunes(term)
  ])

  // 去重
  const deduplicated = mergeResults(podcastIndexResults, iTunesResults)
  return deduplicated
}

// 解析 RSS feed
const fetchRSS = async (feedUrl: string) => {
  const response = await fetch(`/api/rss-proxy?url=${feedUrl}`)
  const xml = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  // 提取剧集列表
  const items = doc.querySelectorAll('item')
  return extractEpisodes(items)
}
```

---

## 8. 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15 (App Router) | 全栈框架，服务端渲染，API Routes |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 3.x | 样式系统 |
| **shadcn/ui** | Latest | UI 组件库（可选） |
| **Zustand** | 4.x | 状态管理 |
| **Framer Motion** | Latest | 动效库（可选） |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js API Routes** | 15 | 服务端 API |
| **Supabase** | Latest | BaaS，PostgreSQL 数据库 |
| **PostgreSQL** | 15.x | 关系型数据库 |

### AI 服务

| 服务 | 模型 | 用途 |
|------|------|------|
| **Groq** | whisper-large-v3 | 音频转录（词级时间戳） |

### 外部 API

| API | 用途 | 认证方式 |
|-----|------|---------|
| **Podcast Index** | 播客搜索 | HMAC SHA1 |
| **iTunes Search** | 播客搜索（备选） | 无 |
| **Groq Whisper** | 音频转录 | Bearer Token |

### 依赖项和库

```json
{
  "dependencies": {
    "next": "15.x",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^4.x",
    "framer-motion": "^11.x",
    "tailwindcss": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "vitest": "^1.x",
    "playwright": "^1.x"
  }
}
```

### 可选依赖项

- **wavesurfer.js**：开源波形可视化库（MVP 阶段使用）
- **ffmpeg.wasm**：复杂音频处理（Phase 5+）
- **react-use**: React hooks 工具库
- **date-fns**: 日期处理

---

## 9. 安全与配置

### 认证/授权方法

**MVP 阶段**：
- 无用户认证
- 公开访问模式（所有用户共享数据）
- 通过 RLS 策略允许匿名读写

**后续阶段**：
- 集成 Supabase Auth
- 用户登录/注册
- 用户专属热区和转录
- 社交分享功能

### 配置管理

**环境变量** (.env):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq API
GROQ_API_KEY=gsk_your-groq-api-key

# Podcast Index
PODCAST_INDEX_KEY=your-podcast-index-key
PODCAST_INDEX_SECRET=your-podcast-index-secret
```

**配置原则**：
- 敏感信息（API 密钥）通过环境变量管理
- 公开信息（API URL）通过 `NEXT_PUBLIC_` 前缀暴露给客户端
- 服务端密钥不在客户端代码中

### 安全范围

**范围内（MVP）**：
- ✅ 基础 RLS 策略（公开读写）
- ✅ API 密钥隐藏（服务端代理）
- ✅ 输入验证（TypeScript 类型检查）
- ✅ 错误处理（不泄露敏感信息）

**范围外（未来）**：
- ❌ 用户认证和授权
- ❌ 数据加密
- ❌ 速率限制
- ❌ CSRF 保护
- ❌ XSS 防护（超出 Next.js 默认）

### 部署考虑事项

**Vercel 部署**：
- 环境变量在 Vercel Dashboard 配置
- 自动 HTTPS
- 边缘函数支持（API Routes）

**Supabase 托管**：
- 使用 Supabase Cloud
- 数据库迁移通过 Supabase CLI 或 Dashboard 执行
- 实时订阅（可选功能）

**域名配置**：
- Vercel 自动生成域名
- 可绑定自定义域名
- DNS 配置指向 Vercel

---

## 10. API 规范

### 10.1 Groq 代理 API

**端点**: `POST /api/groq-proxy`

**用途**: 代理 Groq Whisper API，隐藏 API 密钥

**请求格式**:
```typescript
POST /api/groq-proxy
Content-Type: multipart/form-data

FormData {
  file: Blob (audio/wav)
  model: "whisper-large-v3"
  response_format: "verbose_json"
  timestamp_granularities[]: "word"
}
```

**响应格式**:
```json
{
  "text": "Transcribed text...",
  "words": [
    { "word": "Hello", "start": 0, "end": 0.5 },
    { "word": "world", "start": 0.5, "end": 1.0 }
  ]
}
```

**认证**: 服务端使用 `GROQ_API_KEY`

---

### 10.2 音频代理 API

**端点**: `GET /api/audio-proxy`

**用途**: 代理远程音频文件，处理 CORS 和 Range 请求

**请求格式**:
```typescript
GET /api/audio-proxy?url={encoded_url}
Headers: {
  Range: "bytes=0-{end_byte}"
}
```

**响应格式**:
```typescript
Status: 206 (Partial Content) or 200 (OK)
Headers: {
  Content-Type: "audio/mpeg",
  Content-Range: "bytes 0-{end}/{total}",
  Accept-Ranges: "bytes"
}
Body: Audio binary data
```

**特性**:
- 支持部分内容请求（Range）
- 处理 HTTP 重定向
- 转发关键头部

---

### 10.3 Podcast 搜索 API

**端点**: `POST /api/podcast-search`

**用途**: 混合搜索 Podcast Index 和 iTunes

**请求格式**:
```typescript
POST /api/podcast-search
Content-Type: application/json

{
  "term": "machine learning",
  "limit": 10
}
```

**响应格式**:
```json
{
  "results": [
    {
      "title": "Podcast Name",
      "author": "Author Name",
      "feedUrl": "https://example.com/feed.xml",
      "artwork": "https://example.com/artwork.jpg",
      "source": "podcastindex" | "itunes"
    }
  ]
}
```

**认证**: Podcast Index 使用 HMAC SHA1

---

### 10.4 RSS 代理 API

**端点**: `GET /api/rss-proxy`

**用途**: 代理 RSS feed，处理 CORS

**请求格式**:
```typescript
GET /api/rss-proxy?url={encoded_feed_url}
```

**响应格式**:
```xml
<?xml version="1.0"?>
<rss>
  <channel>
    <title>Podcast Title</title>
    <description>Description</description>
    <item>
      <title>Episode Title</title>
      <enclosure url="audio_url.mp3"/>
      <description>Episode Description</description>
      <pubDate>2026-03-08</pubDate>
    </item>
  </channel>
</rss>
```

**回退**:
- 如果主代理失败，尝试公共 CORS 代理
- 支持多个回退源（allorigins.win, corsproxy.io）

---

### 10.5 Supabase 数据操作

**保存热区**:
```typescript
POST /api/hotzones (client-side Supabase)
{
  "id": "unique-id",
  "audio_id": "episode-123",
  "start_time": 10.5,
  "end_time": 30.5,
  "transcript_snippet": "Text...",
  "metadata": { "transcript_words": [...] },
  "source": "manual",
  "status": "pending"
}
```

**获取热区**:
```typescript
GET /api/hotzones?audio_id=episode-123
Response: Hotzone[]
```

---

## 11. 成功标准

### MVP 成功定义

Simpod v2 MVP 成功意味着用户可以：
1. 搜索并选择播客剧集
2. 播放音频并使用基础控制
3. 点击 MARK 按钮创建热区
4. 查看热区的转录文本
5. 批量复习所有热区

### 功能需求清单

#### 核心功能
- ✅ 用户可以搜索播客并查看结果
- ✅ 用户可以选择播客并查看剧集列表
- ✅ 用户可以播放音频并控制播放（播放/暂停/跳转）
- ✅ 用户可以通过 MARK 按钮创建热区
- ✅ 用户可以查看热区的转录文本
- ✅ 用户可以批量复习所有热区
- ✅ 热区数据持久化到数据库

#### 技术功能
- ✅ Supabase 数据库正常工作（CRUD 操作）
- ✅ Groq API 成功转录音频
- ✅ 音频切片功能正常工作
- ✅ 共享转录缓存减少 API 调用
- ✅ API 代理正常处理 CORS 和认证

### 质量指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 页面加载时间 | < 2s | Lighthouse Performance |
| 转录响应时间 | < 5s (20s 音频) | API 监控 |
| 热区创建响应 | < 1s | 用户测试 |
| 热区命中率 (缓存) | > 50% | 数据库分析 |
| 播放器延迟 | < 200ms | 用户测试 |

### 用户体验目标

- **最小中断**：所有核心操作（播放、标记、查看）可以在不暂停播放的情况下完成
- **直观易用**：新用户无需教程即可完成基本工作流
- **响应迅速**：所有交互在 1s 内有反馈
- **错误友好**：清晰的错误提示，提供恢复建议

---

## 12. 实施阶段

### Phase 1: 基础设施 (Phase 1: Infrastructure)

**目标**: 搭建开发环境和基础架构

**时间**: 1-2 天

**交付成果**:
- ✅ 初始化 Next.js 项目（App Router）
- ✅ 配置 TypeScript 和 Tailwind CSS
- ✅ 配置 ESLint 和 Prettier
- ✅ 创建 Supabase 项目
- ✅ 运行数据库迁移
- ✅ 配置环境变量
- ✅ 设置 Zustand stores

**验证标准**:
- Next.js 开发服务器正常运行
- Supabase 连接成功
- 数据库表创建成功

---

### Phase 2: 产品定义 (Phase 2: Product Definition)

**目标**: 完善产品需求和设计

**时间**: 1 天

**交付成果**:
- ✅ 编写完整的 PRD.md（本文档）
- ✅ 创建 UI 设计原型（可选）
- ✅ 定义组件层次结构

**验证标准**:
- PRD 覆盖所有核心功能
- 组件层次结构清晰

---

### Phase 3: 视觉外壳 (Phase 3: Visual Shell)

**目标**: 构建基础 UI 组件

**时间**: 2-3 天

**交付成果**:
- ✅ 播放器 UI 组件
- ✅ 转录文本显示组件
- ✅ MARK 按钮组件
- ✅ 波形可视化组件（占位符）
- ✅ 热区侧边栏组件
- ✅ 播客搜索页面

**验证标准**:
- 所有组件可独立渲染
- 组件具有占位数据
- 响应式设计正常工作

---

### Phase 4: 逻辑集成 (Phase 4: Logic Integration)

**目标**: 将业务逻辑集成到 UI

**时间**: 3-4 天

**交付成果**:
- ✅ 接入音频播放逻辑
- ✅ 接入热区创建逻辑
- ✅ 接入 Supabase 数据操作
- ✅ 接入 Groq 转录 API
- ✅ 接入播客搜索 API
- ✅ 实现状态管理

**验证标准**:
- 用户可以搜索并播放播客
- 用户可以创建热区
- 用户可以查看转录文本
- 数据持久化正常工作

---

### Phase 5: 智能功能 (Phase 5: Smart Features)

**目标**: 实现核心智能特性

**时间**: 2-3 天

**交付成果**:
- ✅ 实现共享转录缓存
- ✅ 实现词级时间戳优化
- ✅ 实现热区边界优化
- ✅ 实现批量复习功能

**验证标准**:
- 转录缓存减少 API 调用
- 热区边界准确对齐语音
- 批量复习流程完整

---

### Phase 6: 测试和优化 (Phase 6: Testing & Optimization)

**目标**: 质量保证和性能优化

**时间**: 2 天

**交付成果**:
- ✅ 端到端测试
- ✅ 性能优化
- ✅ Bug 修复
- ✅ 部署到生产环境

**验证标准**:
- 所有测试通过
- 性能指标达标
- 生产环境可访问

---

**总时间估计**: 10-14 天

---

## 13. 未来考虑

### MVP 后增强功能

#### 智能回溯 (Intelligent Backtracking)
- 利用词级时间戳回退到语义段落开头
- Full Stop 检测（句号、问号等）
- 段落级跳转

#### 智能热区 (Intelligent Hotzones)
- LLM 内容重要性评分
- 动态热区可视化（不同颜色表示重要性）
- 难度评分

#### 波形交互
- 拖拽调整热区边界
- 多热区合并
- 缩放和平移

#### 高级搜索
- 全文搜索转录内容
- 热区标签分类
- 热区评分和排序

### 集成机会

#### 学习工具集成
- Anki 导出（带音频片段）
- Notion 集成
- Obsidian 插件

#### 内容平台
- YouTube 转录支持
- 视频播客支持
- 本地音频文件支持

#### AI 增强
- 语义搜索（向量数据库）
- 内容摘要（GPT/Claude）
- 知识点提取

- **复杂句子简化**：对听不懂的复杂句子，AI 用简单版本的英语重说一遍（非翻译）- **变速辅助播放**：听不懂的部分用 0.5x-0.8x 慢速播放，同时提供简化版本文本- **播客内置教练**：上述 AI 功能作为播客内置教练，辅助学习者理解，而非翻译成母语
### 后续阶段的高级功能

#### 社交功能
- 热区分享（公开/私有）
- 热区评论
- 学习社区

#### 用户系统
- 用户认证（Supabase Auth）
- 个人数据隔离
- 学习进度追踪

#### 数据分析
- 学习时长统计
- 热区分析
- 个性化推荐

---

## 14. 风险与缓解措施

### 风险 1: Groq API 稳定性

**描述**: Groq 是新兴服务，可能存在不稳定或中断

**影响**: 转录功能不可用

**缓解措施**:
- 添加备选转录服务（OpenAI Whisper API）
- 实现自动重试机制（3次重试）
- 友好的错误提示
- 缓存已转录内容

---

### 风险 2: 音频切片精度

**描述**: Web Audio API 切片可能在某些音频格式上不准确

**影响**: 热区音频片段不准确

**缓解措施**:
- 测试多种音频格式（MP3, AAC, WAV）
- 添加 ffmpeg.wasm 作为备选方案
- 提供手动调整热区边界的功能
- 使用词级时间戳"磁吸"优化

---

### 风险 3: 播客搜索 API 限制

**描述**: Podcast Index 和 iTunes API 可能有速率限制

**影响**: 搜索功能受限

**缓解措施**:
- 实现客户端缓存
- 合并多个搜索结果
- 添加速率限制提示
- 支持直接 RSS URL 输入

---

### 风险 4: Supabase 成本增长

**描述**: 随着用户增长，数据库和 API 调用成本增加

**影响**: 运营成本超出预期

**缓解措施**:
- 使用共享转录缓存减少调用
- 实现数据清理策略（删除旧转录）
- 监控成本指标
- 考虑数据压缩和归档

---

### 风险 5: 用户体验复杂性

**描述**: 功能增多可能导致界面复杂，用户难以理解

**影响**: 用户流失

**缓解措施**:
- 严格的 MVP 范围控制
- 渐进式功能展示
- 用户测试和反馈
- 简洁的 UI 设计原则

---

## 15. 附录

### 相关文档

- [CLAUDE.md](./CLAUDE.md) - 项目宪法和开发指南
- [architecture.md](./architecture.md) - 技术架构文档
- [ACTION_GUIDE.md](./ACTION_GUIDE.md) - 开发行动指南
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - 工作流系统指南
- [PROGRESS.md](./PROGRESS.md) - 项目进度跟踪

### 关键依赖项链接

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Groq](https://console.groq.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Podcast Index API](https://podcastindex-org.github.io/docs/)

### 数据库模式

完整数据库迁移脚本位于：
- [supabase/migrations/20250227000000_create_tables.sql](./supabase/migrations/20250227000000_create_tables.sql)
- [supabase/migrations/20260301000000_create_transcripts_table.sql](./supabase/migrations/20260301000000_create_transcripts_table.sql)

### API 端点参考

所有 API 端点位于 `app/api/` 目录：
- `/api/groq-proxy` - Groq Whisper API 代理
- `/api/audio-proxy` - 音频文件代理
- `/api/podcast-search` - 播客搜索代理
- `/api/rss-proxy` - RSS feed 代理

### 服务层函数参考

核心业务逻辑位于 `src/services/`：
- [src/services/groq.ts](./src/services/groq.ts) - Groq API 集成
- [src/services/supabase.ts](./src/services/supabase.ts) - 数据库操作
- [src/services/hotzone.ts](./src/services/hotzone.ts) - 热区处理流程

### 工具函数参考

音频处理工具位于：
- [src/utils/audio.ts](./src/utils/audio.ts) - Web Audio API 封装

---

## 文档版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-03-08 | 初始版本，完整 MVP PRD | Claude Code |
| 1.1 | 2026-03-08 | 纠正产品定位，聚焦进阶语言学习者和刻舟求剑式标记；更新核心技术为使用开源库；强调语义完整上下文捕获（3-4 句）而非机械固定秒数 | Claude Code |
| 1.2 | 2026-03-08 | 新增：随时跳转功能、快捷键交互、语音控制集成、PWA 支持、AI 辅助播放（变速+简化）| Claude Code |

---

**文档结束**
