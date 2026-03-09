# 功能：MVP 核心功能修复与实现

以下计划应该是完整的，但开始实施前验证文档和代码库模式及任务合理性。

特别注意现有 utils、types 和 models 的命名。从正确的文件导入等。

---

## PROGRESS.md 关联

**实现任务**：
1. 🔥 修复 Workspace 播放器页面 404 问题
2. 🔥 实现音频播放器功能（连接 Zustand Store）
3. 🔥 实现热区标记功能（集成服务层）
4. 🔥 实现播客搜索功能

**优先级**：🔥 高
**更新后操作**：完成后更新 PROGRESS.md，将此任务移至"已完成的工作"

---

## 功能描述

本次实施包含四个高优先级任务，旨在让 Simpod v2 的核心功能可用：

1. **修复 404 问题**：首页和 Discover 页面链接到 `/workspace/${id}`，但缺少动态路由页面
2. **音频播放器**：连接现有组件与 Zustand store，实现真实播放控制
3. **热区标记**：MARK 按钮点击后创建热区，调用服务层进行转录
4. **播客搜索**：集成 Podcast Index 和 iTunes API，实现真实搜索功能

## 用户故事

作为一个 **播客学习者**
我想要 **在播放时标记重要片段并自动转录**
以便 **后续批量复习这些知识点**

## 问题陈述

### 问题 1：404 黑页
- **根因**：缺少 `src/app/workspace/[id]/page.tsx` 动态路由
- **影响**：用户无法进入播放器界面
- **参考文件**：`E:/vibe-coding projects/b_V3XnPhLO04I-1772966910502/app/workspace/[id]/page.tsx`

### 问题 2：前端功能未连接
- **根因**：组件使用本地 state 和 mock 数据，未连接 Zustand store 和服务层
- **影响**：MARK 按钮创建的热区不会被转录，播放器状态不持久

### 问题 3：搜索功能是 mock
- **根因**：搜索只是 console.log，未调用真实 API
- **影响**：用户无法搜索真实播客

## 解决方案陈述

1. **创建 workspace 路由**：使用 Next.js App Router 动态路由模式
2. **连接 Zustand store**：让 PodcastPlayerPage 使用 usePlayerStore
3. **集成服务层**：MARK 按钮调用 processAnchorsToHotzones
4. **实现搜索 API**：创建 podcast-search API 代理和前端调用逻辑

## 功能元数据

**功能类型**：缺陷修复 + 新能力
**估计复杂度**：中
**受影响的主要系统**：
- App Router (workspace/[id]/page.tsx)
- Zustand Store (playerStore)
- Services (hotzone, groq, supabase)
- API Routes (podcast-search)

**依赖项**：
- @supabase/supabase-js (已安装)
- zustand (已安装)
- lucide-react (已安装)
- framer-motion (已安装)

---

## 上下文引用

### 相关代码库文件 - 实施前必须阅读这些文件！

**现有组件（可直接使用）：**
- `src/components/player/PodcastPlayerPage.tsx` - 播放器页面容器，已完整实现
- `src/components/player/MarkButton.tsx` - MARK 按钮，已完整实现
- `src/components/player/PlaybackControls.tsx` - 播放控制，已完整实现
- `src/components/waveform/HotzoneWaveform.tsx` - 波形组件
- `src/components/hotzones/HotzoneSidebar.tsx` - 热区侧边栏
- `src/components/transcript/TranscriptStream.tsx` - 转录流

**服务层（已迁移）：**
- `src/services/hotzone.ts` (77-332行) - processAnchorsToHotzones 函数
- `src/services/groq.ts` (全文) - transcribeAudio 函数
- `src/services/supabase.ts` (全文) - saveHotzone, fetchHotzones 函数

**状态管理：**
- `src/stores/playerStore.ts` (全文) - Zustand store，已实现

**类型定义：**
- `src/types/simpod.ts` (全文) - 核心类型
- `src/types/index.ts` - 类型导出

**Mock 数据：**
- `src/lib/mock-data.ts` (全文) - mockHotzones, mockEpisodes 等

**v0 参考文件（需要复制的结构）：**
- `E:/vibe-coding projects/b_V3XnPhLO04I-1772966910502/app/workspace/[id]/page.tsx` - 路由文件模板

**现有 API 路由：**
- `src/app/api/groq-proxy/route.ts` - Groq 代理（作为参考）
- `src/app/api/hotzones/route.ts` - 热区 API

### 要创建的新文件
1. `src/app/workspace/[id]/page.tsx` - 动态路由页面（关键！）
2. `src/lib/podcast-search.ts` - 播客搜索服务函数
3. `src/app/api/podcast-search/route.ts` - 搜索 API 代理

### 要遵循的模式

**Next.js App Router 动态路由模式：**
```typescript
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  // ...
}
```

**API 代理模式**（来自 `src/app/api/groq-proxy/route.ts`）：
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // CORS Headers
  const searchParams = req.nextUrl.searchParams
  // ... logic
  return NextResponse.json(data)
}
```

**HMAC SHA1 认证模式**（来自 architecture.md 363-377行）：
```typescript
const apiKey = process.env.PODCAST_INDEX_KEY
const apiSecret = process.env.PODCAST_INDEX_SECRET
const apiHeaderTime = Math.floor(Date.now() / 1000)
const data4Hash = apiKey + apiSecret + apiHeaderTime
const hash = crypto.createHash('sha1').update(data4Hash).digest('hex')
```

---

## 实施计划

### 阶段 1：修复 404 问题（立即见效）

**目标**：让用户能够进入播放器界面

**任务**：
- 创建 `src/app/workspace/[id]/page.tsx` 动态路由
- 复用现有的 `PodcastPlayerPage` 组件

### 阶段 2：连接 Zustand Store

**目标**：让播放器状态全局可用

**任务**：
- 修改 `PodcastPlayerPage` 使用 `usePlayerStore`
- 替换本地 state 为 store 调用
- 连接 audioRef 让 store 能控制音频元素

### 阶段 3：集成热区服务

**目标**：MARK 按钮创建真实热区

**任务**：
- 在 `handleMark` 中调用 `processAnchorsToHotzones`
- 连接 `saveHotzone` 保存到数据库

### 阶段 4：实现播客搜索

**目标**：首页搜索功能可用

**任务**：
- 创建 podcast-search API 代理
- 创建搜索服务函数
- 连接首页搜索框

---

## 分步任务

### 任务 1：CREATE src/app/workspace/[id]/page.tsx

**IMPLEMENT**：创建动态路由页面，渲染 PodcastPlayerPage 组件

**PATTERN**：参考 `src/app/settings/page.tsx` 的页面结构和 `E:/vibe-coding projects/b_V3XnPhLO04I-1772966910502/app/workspace/[id]/page.tsx`

**IMPORTS**：
```typescript
import { PodcastPlayerPage } from "@/components/player/PodcastPlayerPage"
```

**GOTCHA**：
- 确保目录结构是 `workspace/[id]/page.tsx`
- `[id]` 是文件夹名，不是文件名
- params 在 Next.js 15 中是 Promise

**VALIDATE**：启动开发服务器，访问 http://localhost:3000/workspace/ep-1 不再显示 404

---

### 任务 2：UPDATE src/components/player/PodcastPlayerPage.tsx - 连接 Zustand

**IMPLEMENT**：
1. 导入 usePlayerStore
2. 替换本地 playerState 为 store 状态
3. 使用 store 的 actions 替换本地 handlers

**关键修改**：

```typescript
// 添加导入
import { usePlayerStore } from "@/stores/playerStore"

// 在组件内
const {
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  seek,
  togglePlay,
  setPlaybackRate,
  setAudioRef,
  hotzones,
  addHotzone,
} = usePlayerStore()
```

**PATTERN**：参考 `src/stores/playerStore.ts` 的 store 结构

**GOTCHA**：
- 需要正确设置 audioRef，让 store 能够控制真实 audio 元素
- 使用 useEffect 设置 audioRef：`useEffect(() => { setAudioRef(audioRef.current) }, [audioRef])`

**VALIDATE**：播放/暂停、进度跳转、速度调整功能正常

---

### 任务 3：UPDATE src/components/player/PodcastPlayerPage.tsx - 集成热区服务

**IMPLEMENT**：
1. 导入 processAnchorsToHotzones 和相关服务
2. 修改 handleMark 函数调用服务层

**关键修改**：

```typescript
import { processAnchorsToHotzones } from "@/services/hotzone"
import { saveHotzone } from "@/services/supabase"

const handleMark = useCallback(async (timestamp: number) => {
  // 生成锚点 ID
  const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`

  const anchor: Anchor = {
    id: generateId("anc"),
    audio_id: audioId,
    timestamp,
    source: "manual",
    created_at: new Date().toISOString(),
  }

  try {
    // 处理为热区（需要音频 URL）
    const DEMO_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    const [newHotzone] = await processAnchorsToHotzones(
      [anchor],
      undefined, // transcript
      undefined, // audioFile
      DEMO_AUDIO_URL, // audioUrl
      undefined, // transcriptInfo
      hotzones // existingHotzones
    )

    if (newHotzone) {
      // 保存到数据库
      await saveHotzone(newHotzone)
      // 更新本地状态
      addHotzone(newHotzone)
    }
  } catch (error) {
    console.error("Failed to create hotzone:", error)
  }
}, [audioId, hotzones, addHotzone])
```

**PATTERN**：参考 `src/services/hotzone.ts` 的 processAnchorsToHotzones 函数

**GOTCHA**：
- processAnchorsToHotzones 是异步的，需要 await
- 需要传入有效的 audioUrl（当前使用 DEMO_URL）
- 确保 Anchor 类型从 `@/types/simpod` 导入

**VALIDATE**：点击 MARK 后，控制台显示转录日志，热区出现在侧边栏

---

### 任务 4：CREATE src/app/api/podcast-search/route.ts

**IMPLEMENT**：创建播客搜索 API 代理，调用 Podcast Index API

**PATTERN**：参考 `src/app/api/groq-proxy/route.ts` 的 API 代理结构

**IMPORTS**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
```

**关键代码**：
```typescript
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  const apiKey = process.env.PODCAST_INDEX_KEY
  const apiSecret = process.env.PODCAST_INDEX_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'API credentials not configured' }, { status: 500 })
  }

  // HMAC SHA1 认证
  const apiHeaderTime = Math.floor(Date.now() / 1000)
  const data4Hash = apiKey + apiSecret + apiHeaderTime
  const hash = crypto.createHash('sha1').update(data4Hash).digest('hex')

  try {
    const response = await fetch(
      `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query)}&clean=y&max=10`,
      {
        headers: {
          'User-Agent': 'Simpod/2.0',
          'X-Auth-Key': apiKey,
          'X-Auth-Date': apiHeaderTime.toString(),
          'Authorization': hash,
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Podcast search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**GOTCHA**：
- 确保环境变量 PODCAST_INDEX_KEY 和 PODCAST_INDEX_SECRET 已配置
- Podcast Index API 需要 HMAC SHA1 签名
- User-Agent 是必需的

**VALIDATE**：`curl "http://localhost:3000/api/podcast-search?q=tech"` 返回 JSON

---

### 任务 5：CREATE src/lib/podcast-search.ts

**IMPLEMENT**：创建前端搜索服务函数

**PATTERN**：参考 `src/services/supabase.ts` 的服务函数结构

**IMPORTS**：
```typescript
import type { Podcast } from '@/types/simpod'
```

**关键代码**：
```typescript
interface PodcastIndexResult {
  id: number
  title: string
  url: string
  originalUrl: string
  description: string
  author: string
  ownerName: string
  image: string
  artwork: string
}

interface PodcastIndexResponse {
  status: string
  feeds: PodcastIndexResult[]
}

export async function searchPodcasts(query: string): Promise<Podcast[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(`/api/podcast-search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data: PodcastIndexResponse = await response.json()

    return data.feeds.map((feed) => ({
      id: String(feed.id),
      title: feed.title,
      author: feed.author || feed.ownerName,
      feedUrl: feed.url || feed.originalUrl,
      artwork: feed.image || feed.artwork,
      description: feed.description,
      source: 'podcastindex' as const,
    }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}
```

**VALIDATE**：在浏览器控制台调用 `searchPodcasts('tech')` 返回数组

---

### 任务 6：UPDATE src/app/page.tsx - 连接搜索功能

**IMPLEMENT**：修改首页搜索框，调用真实搜索 API

**关键修改**：

```typescript
import { searchPodcasts } from '@/lib/podcast-search'

// 在组件内添加
const [searchResults, setSearchResults] = useState<Podcast[]>([])
const [isSearching, setIsSearching] = useState(false)

const handleSearch = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()
  if (!searchQuery.trim()) return

  setIsSearching(true)
  try {
    const results = await searchPodcasts(searchQuery)
    setSearchResults(results)
    console.log('Search results:', results)
  } finally {
    setIsSearching(false)
  }
}, [searchQuery])
```

**PATTERN**：参考 `src/app/discover/page.tsx` 的搜索 UI

**GOTCHA**：
- 需要添加搜索结果显示逻辑
- 可以导航到 Discover 页面并传递搜索结果

**VALIDATE**：在首页输入搜索词，点击 Start，控制台显示搜索结果

---

## 测试策略

### 单元测试

- 测试 `searchPodcasts` 函数的参数验证和错误处理
- 测试 `processAnchorsToHotzones` 的锚点处理逻辑

### 集成测试

- 测试 `/api/podcast-search` 端点返回正确格式
- 测试 MARK 按钮点击后热区创建流程

### 边缘情况

- 搜索空字符串
- 搜索无结果
- MARK 按钮在音频未加载时点击
- 热区重叠时的合并逻辑

---

## 验证命令

### 级别 1：语法与样式

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
3. 点击任意项目卡片，验证播放器页面加载（修复 404）
4. 在播放器页面点击 MARK，验证热区创建
5. 在首页搜索框输入 "tech"，验证搜索请求发出

---

## 验收标准

- [ ] 访问 `/workspace/ep-1` 不再显示 404，而是显示播放器界面
- [ ] 播放器可以播放/暂停、跳转进度、调整速度
- [ ] 点击 MARK 按钮后，侧边栏出现新热区
- [ ] 首页搜索框输入关键词后，控制台显示搜索结果
- [ ] 所有验证命令通过零错误
- [ ] 无 TypeScript 类型错误
- [ ] 无 ESLint 错误

---

## 完成后：更新 PROGRESS.md

执行完成后，必须更新 PROGRESS.md：

```markdown
### 2026-03-08: MVP 核心功能修复与实现
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**:
1. 修复 workspace 播放器页面 404 问题
2. 连接 Zustand store 实现播放状态管理
3. 集成热区服务实现 MARK 功能
4. 实现播客搜索 API 代理
```

---

## 完成清单

- [ ] 任务 1：创建 workspace/[id]/page.tsx 路由
- [ ] 任务 2：PodcastPlayerPage 连接 Zustand
- [ ] 任务 3：集成热区服务
- [ ] 任务 4：创建 podcast-search API
- [ ] 任务 5：创建搜索服务函数
- [ ] 任务 6：首页连接搜索功能
- [ ] 所有验证命令通过
- [ ] PROGRESS.md 已更新

---

## 注意事项

1. **环境变量**：确保 `.env` 文件包含以下变量：
   ```
   PODCAST_INDEX_KEY=your-key
   PODCAST_INDEX_SECRET=your-secret
   GROQ_API_KEY=your-groq-key
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Groq API**：热区转录需要 `GROQ_API_KEY`，确保已配置

3. **Supabase**：保存热区需要 Supabase 连接，确保配置正确

4. **CORS**：远程音频 URL 可能需要 CORS 代理，当前使用的是公开示例音频

5. **Mock 数据**：在服务层未完全连接前，可以继续使用 mock 数据进行 UI 测试

---

**信心评分**：8/10

**风险评估**：
- 低风险：任务 1（创建路由文件）是简单复制
- 中风险：任务 2-3（连接 store 和服务）需要正确处理异步逻辑
- 中风险：任务 4-6（搜索功能）依赖外部 API，需要正确配置环境变量

**预计完成时间**：3-4 小时
