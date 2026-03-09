# 功能：修复播客播放流程并参考 AntennaPod 优化架构

以下计划应该是完整的，但开始实施前验证文档和代码库模式及任务合理性很重要。

特别注意现有 utils、types 和 models 的命名。从正确的文件导入等。

## PROGRESS.md 关联

**实现任务**：测试完整播放流程
**优先级**：🔥 高
**更新后操作**：完成后更新 PROGRESS.md，将此任务移至"已完成的工作"

## 功能描述

本计划解决两个核心问题：

1. **紧急修复**：修复播客搜索→详情→播放的完整流程，使用户能够正常播放播客内容
2. **架构优化**：参考 AntennaPod 的模块化架构，优化我们的播客管理和播放逻辑

## 用户故事

作为一个播客学习者
我想要搜索并播放真实的播客内容
以便我使用 Simpod 的核心功能（盲听插锚、AI 转录、批量复盘）

## 问题陈述

### 当前问题（阻塞性）

1. **点击搜索结果后无法播放**
   - 用户能够搜索到播客（如 BBC）
   - 点击播客进入详情页
   - 但点击剧集播放按钮后无法正常播放

2. **主界面项目卡片缺少有效 URL**
   - `mockProjects` 使用 `https://example.com/audio/...` 无效 URL
   - 点击卡片后无法播放

3. **可能的根因**
   - RSS 解析可能有问题
   - 音频 URL 可能是 HTTP 而非 HTTPS（混合内容问题）
   - 播放器页面没有正确接收 `audioUrl` 参数
   - 音频 URL 可能需要代理（CORS）

### 架构改进需求

当前架构缺少：
- 清晰的订阅管理模块
- 统一的播客数据模型
- 播放器状态管理的集中化
- RSS 解析的错误恢复机制

## 解决方案陈述

### 短期方案（紧急修复）

1. 诊断并修复 RSS 解析问题
2. 确保音频 URL 正确传递到播放器
3. 添加音频 URL 验证和错误处理
4. 修复 mock 数据使用有效音频 URL

### 长期方案（架构优化）

参考 AntennaPod 的模块化架构：
- 创建专门的 `podcast-manager` 服务
- 优化播放器状态管理
- 改进 RSS 解析的健壮性
- 添加订阅管理功能

## 功能元数据

**功能类型**：缺陷修复 + 增强重构
**估计复杂度**：中
**受影响的主要系统**：RSS 解析器、播放器、播客搜索
**依赖项**：iTunes Search API、RSS feeds

---

## 上下文引用

### 相关代码库文件 重要：实施前必须阅读这些文件！

- `src/lib/rss-parser.ts` (完整文件)
  - 原因：RSS 解析逻辑，需要验证和增强
  - 当前使用 DOMParser，需要添加错误处理

- `src/lib/podcast-search.ts` (完整文件)
  - 原因：播客搜索逻辑，刚简化为仅使用 iTunes
  - 确保 feedUrl 正确传递

- `src/app/podcast/[id]/page.tsx` (完整文件)
  - 原因：播客详情页，调用 parseFeed
  - 需要添加错误边界和加载状态

- `src/components/podcast/EpisodeList.tsx` (完整文件)
  - 原因：剧集列表组件，生成播放链接
  - 确认 audioUrl 正确编码

- `src/app/workspace/[id]/page.tsx` (完整文件)
  - 原因：播放器页面入口，接收 audioUrl 参数
  - 验证参数正确传递

- `src/components/player/PodcastPlayerPage.tsx` (第64行, 第286行)
  - 原因：播放器组件，使用 audioUrl
  - 第64行：`currentAudioUrl` 状态初始化
  - 第286行：`handleMark` 使用 currentAudioUrl

- `src/lib/mock-data.ts` (第61, 70, 79行)
  - 原因：mock 数据，需要更新为有效音频 URL
  - 第61行：ep-1 audioUrl
  - 第70行：ep-2 audioUrl
  - 第79行：ep-3 audioUrl

### 要创建的新文件
- `src/services/podcast-manager.ts` - 播客管理服务（参考 AntennaPod）
- `src/lib/audio-validator.ts` - 音频 URL 验证工具
- `src/types/podcast.ts` - 播客相关类型定义（从现有 types 提取）

### 相关文档 实施前应该阅读这些！

- [AntennaPod Repository](https://github.com/AntennaPod/AntennaPod)
  - 模块：parser, storage, playback, net, model
  - 原因：参考模块化架构设计

- [AntennaPod Wiki](https://github.com/AntennaPod/AntennaPod/wiki)
  - 架构概述和数据库设计
  - 原因：理解订阅管理和数据持久化

- [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
  - 章节：URL 参数处理
  - 原因：正确使用 searchParams

### 要遵循的模式

**命名约定：**
- 文件名：kebab-case (`podcast-manager.ts`)
- 组件名：PascalCase (`EpisodeList.tsx`)
- 函数名：camelCase (`parseFeed`, `validateAudioUrl`)
- 常量：UPPER_SNAKE_CASE (`MAX_EPISODES`)

**错误处理：**
```typescript
// 从 src/app/api/itunes-proxy/route.ts:60-66 参考模式
try {
  // API logic
} catch (error: any) {
  console.error('[Context] Error:', error)
  return NextResponse.json(
    { error: error.message || 'Internal Server Error' },
    { status: 500 }
  )
}
```

**日志模式：**
```typescript
// 统一的日志前缀格式
console.log('[ModuleName] Action:', details)
console.error('[ModuleName] Error:', error)
```

**Zustand Store 模式：**
- 参考 `src/stores/playerStore.ts`
- 使用 slice 模式组织状态
- 保持 action 纯函数化

---

## 实施计划

### 阶段 1：诊断和紧急修复（30分钟）

**目标**：快速恢复基本播放功能

**任务：**
1. 添加详细的调试日志
2. 验证 RSS 解析结果
3. 检查音频 URL 传递链
4. 修复 mock 数据

### 阶段 2：核心稳定性改进（1小时）

**目标**：确保播放流程稳定可靠

**任务：**
1. 创建音频 URL 验证工具
2. 改进 RSS 解析错误处理
3. 添加加载和错误状态
4. 实现音频 URL HTTP→HTTPS 转换

### 阶段 3：架构优化（参考 AntennaPod）（2小时）

**目标**：建立可扩展的模块化架构

**任务：**
1. 创建 PodcastManager 服务
2. 优化播放器状态管理
3. 改进数据流和错误恢复
4. 添加订阅管理基础

### 阶段 4：测试与验证（30分钟）

**目标**：确保完整流程正常工作

**任务：**
1. 端到端测试搜索→播放流程
2. 测试错误场景
3. 验证 MARK 功能
4. 性能测试

---

## 分步任务

重要：按顺序执行每个任务，从上到下。每个任务都是原子的且可独立测试。

### 阶段 1：诊断和紧急修复

### 1. DIAGNOSE 添加调试日志
- **IMPLEMENT**：在关键路径添加 console.log
- **LOCATIONS**：
  - `src/app/podcast/[id]/page.tsx` - parseFeed 调用前后
  - `src/components/podcast/EpisodeList.tsx` - playUrl 生成
  - `src/app/workspace/[id]/page.tsx` - audioUrl 接收
  - `src/components/player/PodcastPlayerPage.tsx` - currentAudioUrl 使用
- **LOG FORMAT**：`[ComponentName] Key: value`
- **VALIDATE**：`npm run dev` 并查看浏览器控制台

### 2. UPDATE 修复 mock 数据音频 URL
- **IMPLEMENT**：将 mockEpisodes 中的 audioUrl 替换为有效的测试音频
- **FILE**：`src/lib/mock-data.ts`
- **REPLACEMENT**：
  ```typescript
  // 使用公开可用的测试音频
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  ```
- **PATTERN**：参考 `src/constants/audio.ts:12` 的 `REMOTE_DEMO_AUDIO_URLS`
- **GOTCHA**：确保音频 URL 支持 CORS
- **VALIDATE**：访问首页，点击项目卡片，检查是否播放

### 3. ADD RSS 解析结果验证
- **IMPLEMENT**：在 parseFeed 中添加详细日志和验证
- **FILE**：`src/lib/rss-parser.ts`
- **IMPORTS**：无需额外导入
- **CHANGES**：
  ```typescript
  // 在 parseFeed 函数开始添加
  console.log('[RSS Parser] Parsing feed:', feedUrl)

  // 在 episodes 映射后添加
  console.log('[RSS Parser] Parsed episodes:', episodes.length)
  if (episodes.length > 0) {
    console.log('[RSS Parser] First episode audioUrl:', episodes[0].audioUrl)
  }
  ```
- **PATTERN**：参考 `src/lib/podcast-search.ts:48` 的日志模式
- **VALIDATE**：搜索播客，点击进入详情页，查看控制台日志

### 4. UPDATE 播客详情页错误处理
- **IMPLEMENT**：添加加载状态和错误边界
- **FILE**：`src/app/podcast/[id]/page.tsx`
- **PATTERN**：参考 Next.js 错误处理模式
- **CHANGES**：
  ```typescript
  // 在 try-catch 中添加更详细的错误信息
  } catch (error: any) {
    console.error('[Podcast Page] Error:', {
      message: error.message,
      feedUrl,
      error
    })
    // ... 显示错误页面
  }
  ```
- **VALIDATE**：使用无效 feedUrl 测试，应显示友好错误

### 阶段 2：核心稳定性改进

### 5. CREATE 音频 URL 验证工具
- **IMPLEMENT**：创建验证和清理音频 URL 的工具函数
- **FILE**：`src/lib/audio-validator.ts`
- **IMPORTS**：
  ```typescript
  /**
   * 验证音频 URL 是否有效
   * 检查协议、格式、基本可用性
   */
  export function validateAudioUrl(url: string): {
    valid: boolean
    cleanedUrl: string
    error?: string
  } {
    if (!url || typeof url !== 'string') {
      return { valid: false, cleanedUrl: '', error: 'Invalid URL' }
    }

    // 转换 HTTP→HTTPS
    let cleanedUrl = url
    if (url.startsWith('http://')) {
      cleanedUrl = url.replace('http://', 'https://')
      console.log('[AudioValidator] Converting HTTP to HTTPS:', url, '→', cleanedUrl)
    }

    // 检查是否是音频文件
    const audioExtensions = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.aac']
    const hasAudioExtension = audioExtensions.some(ext => cleanedUrl.toLowerCase().endsWith(ext))

    // 检查常见音频托管域名
    const audioHosts = [
      'soundhelix.com',
      'archive.org',
      'bbc.co.uk',
      'podcasts.apple.com',
      'cdn',
      'media',
      'audio'
    ]
    const hasAudioHost = audioHosts.some(host => cleanedUrl.toLowerCase().includes(host))

    if (!hasAudioExtension && !hasAudioHost) {
      console.warn('[AudioValidator] URL may not be an audio file:', cleanedUrl)
    }

    return { valid: true, cleanedUrl }
  }

  /**
   * 测试音频 URL 是否可访问
   * 注意：这会发起实际请求，仅在必要时使用
   */
  export async function testAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type') || ''
      const isAudio = contentType.startsWith('audio/')
      console.log('[AudioValidator] Test result:', { url, contentType, isAudio })
      return isAudio
    } catch (error) {
      console.error('[AudioValidator] Test failed:', error)
      return false
    }
  }
  ```
- **PATTERN**：参考 `src/lib/time.ts` 的工具函数模式
- **VALIDATE**：创建测试文件 `src/lib/__tests__/audio-validator.test.ts`

### 6. UPDATE RSS 解析器使用音频验证
- **IMPLEMENT**：在解析 episodes 时验证和清理音频 URL
- **FILE**：`src/lib/rss-parser.ts`
- **IMPORTS**：`import { validateAudioUrl } from '@/lib/audio-validator'`
- **CHANGES**：在 episodes 映射中添加验证
  ```typescript
  .map((item) => {
    const enclosure = item.querySelector('enclosure')
    const rawAudioUrl = enclosure?.getAttribute('url') || ''

    // 验证和清理音频 URL
    const { valid, cleanedUrl } = validateAudioUrl(rawAudioUrl)
    if (!valid) {
      console.warn('[RSS Parser] Invalid audio URL:', rawAudioUrl)
    }

    return {
      // ...
      audioUrl: cleanedUrl,
      // ...
    }
  })
  ```
- **PATTERN**：MIRROR `src/lib/rss-parser.ts:72-90` 的 episodes 映射模式
- **VALIDATE**：解析包含 HTTP 音频 URL 的 feed，检查是否转换为 HTTPS

### 7. UPDATE EpisodeList 添加加载和错误状态
- **IMPLEMENT**：添加播放失败时的错误提示
- **FILE**：`src/components/podcast/EpisodeList.tsx`
- **CHANGES**：
  ```typescript
  // 在 EpisodeItem 组件中
  const [playError, setPlayError] = useState<string | null>(null)

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 验证 audioUrl
    if (!episode.audioUrl || !episode.audioUrl.startsWith('http')) {
      setPlayError('Invalid audio URL')
      return
    }
    setPlayError(null)
  }

  // 在播放按钮旁边显示错误
  {playError && (
    <span className="text-xs text-red-500">{playError}</span>
  )}
  ```
- **PATTERN**：参考 `src/app/page.tsx:164-168` 的错误显示模式
- **VALIDATE**：尝试播放无效音频 URL 的剧集，应显示错误

### 8. UPDATE 播放器页面添加音频 URL 诊断
- **IMPLEMENT**：在播放器中显示当前音频 URL 和状态
- **FILE**：`src/components/player/PodcastPlayerPage.tsx`
- **CHANGES**：在音频错误消息中添加 URL 信息
  ```typescript
  {audioError && (
    <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-500">{audioError}</p>
          {currentAudioUrl && (
            <p className="text-xs text-red-400 mt-1 break-all">
              URL: {currentAudioUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  )}
  ```
- **PATTERN**：MIRROR 现有错误显示模式 `src/components/player/PodcastPlayerPage.tsx:413-428`
- **VALIDATE**：触发音频错误，检查是否显示 URL

### 阶段 3：架构优化（参考 AntennaPod）

### 9. CREATE PodcastManager 服务
- **IMPLEMENT**：创建统一的播客管理服务
- **FILE**：`src/services/podcast-manager.ts`
- **REFERENCE**：AntennaPod 的订阅管理模块
- **IMPORTS**：
  ```typescript
  import { parseFeed } from '@/lib/rss-parser'
  import { validateAudioUrl, testAudioUrl } from '@/lib/audio-validator'
  import type { Podcast, Episode } from '@/types/simpod'
  ```
- **IMPLEMENTATION**：
  ```typescript
  /**
   * PodcastManager - 统一的播客管理服务
   *
   * 参考 AntennaPod 的订阅管理架构：
   * - parser 模块：RSS 解析
   * - storage 模块：本地缓存
   * - model 模块：数据模型
   */
  export class PodcastManager {
    private cache = new Map<string, { podcast: Podcast; episodes: Episode[] }>()
    private readonly CACHE_TTL = 5 * 60 * 1000 // 5 分钟

    /**
     * 获取播客及其剧集（带缓存）
     */
    async getPodcast(feedUrl: string): Promise<{ podcast: Podcast; episodes: Episode[] }> {
      // 检查缓存
      const cached = this.cache.get(feedUrl)
      if (cached && Date.now() - this.getCacheTime(feedUrl) < this.CACHE_TTL) {
        console.log('[PodcastManager] Cache hit:', feedUrl)
        return cached
      }

      console.log('[PodcastManager] Fetching podcast:', feedUrl)

      // 解析 feed
      const result = await parseFeed(feedUrl)

      // 验证音频 URL
      const validEpisodes = result.episodes.map(ep => ({
        ...ep,
        audioUrl: validateAudioUrl(ep.audioUrl).cleanedUrl
      }))

      const data = {
        podcast: result.podcast,
        episodes: validEpisodes
      }

      // 缓存结果
      this.cache.set(feedUrl, data)
      this.setCacheTime(feedUrl)

      return data
    }

    /**
     * 搜索剧集
     */
    searchEpisodes(feedUrl: string, query: string): Episode[] {
      const cached = this.cache.get(feedUrl)
      if (!cached) return []

      const lowerQuery = query.toLowerCase()
      return cached.episodes.filter(ep =>
        ep.title.toLowerCase().includes(lowerQuery) ||
        ep.description.toLowerCase().includes(lowerQuery)
      )
    }

    /**
     * 获取最近更新的剧集
     */
    getRecentEpisodes(feedUrl: string, limit = 10): Episode[] {
      const cached = this.cache.get(feedUrl)
      if (!cached) return []

      return [...cached.episodes]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, limit)
    }

    /**
     * 清除缓存
     */
    clearCache(feedUrl?: string): void {
      if (feedUrl) {
        this.cache.delete(feedUrl)
      } else {
        this.cache.clear()
      }
    }

    // 私有辅助方法
    private cacheTimes = new Map<string, number>()

    private getCacheTime(feedUrl: string): number {
      return this.cacheTimes.get(feedUrl) || 0
    }

    private setCacheTime(feedUrl: string): void {
      this.cacheTimes.set(feedUrl, Date.now())
    }
  }

  // 单例导出
  export const podcastManager = new PodcastManager()
  ```
- **PATTERN**：参考 AntennaPod 的模块化设计
- **GOTCHA**：客户端缓存，刷新页面会丢失（可接受）
- **VALIDATE**：创建测试验证缓存功能

### 10. UPDATE 播客详情页使用 PodcastManager
- **IMPLEMENT**：替换 parseFeed 直接调用为 podcastManager.getPodcast
- **FILE**：`src/app/podcast/[id]/page.tsx`
- **IMPORTS**：`import { podcastManager } from '@/services/podcast-manager'`
- **CHANGES**：
  ```typescript
  // 替换
  const { episodes, podcast } = await parseFeed(feedUrl)
  // 为
  const { episodes, podcast } = await podcastManager.getPodcast(feedUrl)
  ```
- **PATTERN**：保持现有接口不变
- **VALIDATE**：访问播客详情页，检查是否正常工作

### 11. CREATE 播放器状态管理优化
- **IMPLEMENT**：创建专门的播放器状态管理 slice
- **FILE**：`src/stores/podcastStore.ts`（如果不存在）
- **REFERENCE**：AntennaPod 的 playback 模块
- **IMPORTS**：
  ```typescript
  import { create } from 'zustand'
  import type { Podcast, Episode } from '@/types/simpod'
  ```
- **IMPLEMENTATION**：
  ```typescript
  /**
   * Podcast Store - 播客相关状态管理
   *
   * 参考 AntennaPod 的 playback 模块架构
   */
  interface PodcastState {
    // 当前播放的播客和剧集
    currentPodcast: Podcast | null
    currentEpisode: Episode | null

    // 播放列表
    queue: Episode[]

    // Actions
    setCurrentPodcast: (podcast: Podcast) => void
    setCurrentEpisode: (episode: Episode) => void
    setQueue: (episodes: Episode[]) => void
    addToQueue: (episode: Episode) => void
    removeFromQueue: (episodeId: string) => void
    clearQueue: () => void

    // 播放控制
    playNext: () => Episode | null
    playPrevious: () => Episode | null
  }

  export const usePodcastStore = create<PodcastState>((set, get) => ({
    currentPodcast: null,
    currentEpisode: null,
    queue: [],

    setCurrentPodcast: (podcast) => set({ currentPodcast: podcast }),
    setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

    setQueue: (episodes) => set({ queue: episodes }),

    addToQueue: (episode) => set((state) => ({
      queue: [...state.queue, episode]
    })),

    removeFromQueue: (episodeId) => set((state) => ({
      queue: state.queue.filter(ep => ep.id !== episodeId)
    })),

    clearQueue: () => set({ queue: [] }),

    playNext: () => {
      const state = get()
      const currentIndex = state.queue.findIndex(ep => ep.id === state.currentEpisode?.id)
      const nextEpisode = state.queue[currentIndex + 1]
      if (nextEpisode) {
        set({ currentEpisode: nextEpisode })
      }
      return nextEpisode || null
    },

    playPrevious: () => {
      const state = get()
      const currentIndex = state.queue.findIndex(ep => ep.id === state.currentEpisode?.id)
      const prevEpisode = state.queue[currentIndex - 1]
      if (prevEpisode) {
        set({ currentEpisode: prevEpisode })
      }
      return prevEpisode || null
    },
  }))
  ```
- **PATTERN**：参考 `src/stores/playerStore.ts` 的 Zustand 模式
- **GOTCHA**：暂时不需要实现，为未来功能预留
- **VALIDATE**：TypeScript 类型检查通过

### 阶段 4：测试与验证

### 12. TEST 端到端播放流程
- **IMPLEMENT**：手动测试完整流程
- **TEST CASES**：
  1. 搜索 "bbc" → 点击播客 → 点击第一集 → 检查是否播放
  2. 搜索 "ted" → 点击播客 → 查看剧集列表 → 验证音频 URL
  3. 播放中点击 MARK → 检查热区是否创建
  4. 刷新页面 → 检查热区是否保留
- **VALIDATE**：所有测试用例通过

### 13. TEST 错误场景
- **IMPLEMENT**：测试各种错误情况
- **TEST CASES**：
  1. 无效的 feedUrl
  2. 空的 RSS feed
  3. HTTP 音频 URL（应转换为 HTTPS）
  4. 无效的音频 URL
  5. 网络错误
- **VALIDATE**：所有错误显示友好提示

### 14. TEST MARK 功能
- **IMPLEMENT**：验证 MARK 转录功能与真实音频配合
- **TEST CASES**：
  1. 播放真实播客
  2. 在不同时间点点击 MARK
  3. 检查热区是否正确创建
  4. 检查转录是否正常工作
- **VALIDATE**：MARK 功能与真实音频配合正常

### 15. VERIFY 性能
- **IMPLEMENT**：检查加载时间和响应性
- **METRICS**：
  1. 搜索响应时间 < 2 秒
  2. RSS 解析时间 < 1 秒
  3. 音频加载时间 < 5 秒
  4. MARK 创建时间 < 10 秒
- **VALIDATE**：所有性能指标满足要求

---

## 测试策略

### 手动测试（主要方法）

由于项目尚未配置测试框架，主要使用手动测试：

**搜索→播放流程：**
1. 访问首页
2. 搜索 "bbc"
3. 点击 "Global News Podcast"
4. 点击第一集的播放按钮
5. 验证音频是否播放

**MARK 功能：**
1. 播放播客
2. 等待几秒
3. 点击 MARK 按钮
4. 验证热区是否创建
5. 检查转录是否显示

**错误处理：**
1. 尝试使用无效 feedUrl
2. 验证是否显示友好错误
3. 尝试播放无效音频
4. 验证是否显示错误消息

### 单元测试（可选）

如果添加测试框架，使用 Vitest：
- `audio-validator.test.ts` - 测试音频 URL 验证
- `podcast-manager.test.ts` - 测试缓存逻辑

---

## 验证命令

### 级别 1：语法与样式

```bash
# TypeScript 类型检查
npx tsc --noEmit

# ESLint 检查
npm run lint
```

### 级别 2：开发服务器验证

```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问
# http://localhost:3000
```

### 级别 3：手动验证

**测试清单：**
- [ ] 搜索播客正常
- [ ] 点击播客显示剧集列表
- [ ] 点击剧集播放按钮跳转到播放器
- [ ] 播放器显示正确的音频 URL
- [ ] 音频正常播放
- [ ] MARK 功能正常工作
- [ ] 热区正确保存
- [ ] 刷新页面热区仍然存在

### 级别 4：控制台检查

在浏览器开发者工具中：
- [ ] 无错误信息
- [ ] 日志信息清晰
- [ ] 音频 URL 正确打印

---

## 验收标准

- [ ] 播客搜索功能正常，返回有效结果
- [ ] 点击播客显示剧集列表
- [ ] 点击剧集播放按钮正常播放音频
- [ ] 播放器显示当前播放的剧集信息
- [ ] MARK 功能与真实音频配合正常
- [ ] 热区正确保存到数据库
- [ ] 错误场景显示友好提示
- [ ] 控制台无错误日志
- [ ] 性能指标满足要求
- [ ] 代码遵循项目约定

---

## 完成后：更新 PROGRESS.md

执行完成后，必须更新 PROGRESS.md：

1. 将任务从"待办事项"移至"已完成的工作"
2. 添加完成日期和简要描述
3. 更新"最后更新"和"更新者"

**示例**：
```markdown
### 2026-03-09: 修复播客播放流程并优化架构
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 修复播客搜索→详情→播放的完整流程，参考 AntennaPod 创建 PodcastManager 服务，添加音频 URL 验证，改进错误处理
```

---

## 完成清单

- [ ] 所有 15 个任务按顺序完成
- [ ] 每个任务验证立即通过
- [ ] 所有验证命令成功执行
- [ ] 手动测试清单全部通过
- [ ] 无 lint 或类型检查错误
- [ ] 控制台无错误日志
- [ ] 所有验收标准都满足
- [ ] 代码已审查质量和可维护性
- [ ] PROGRESS.md 已更新

---

## 注意事项

### AntennaPod 参考原则

**借鉴而非复制：**
- AntennaPod 是 Android/Kotlin 项目
- 我们是 Next.js/TypeScript 项目
- 只参考架构设计理念，不直接复制代码

**值得借鉴的概念：**
1. **模块化架构**：parser, storage, playback, net 分离
2. **订阅管理**：统一的 feed 管理和缓存
3. **数据模型**：清晰的 Podcast/Episode 关系
4. **错误恢复**：健壮的 RSS 解析和错误处理

**不需要借鉴：**
- Android 特定的实现（如 SQLite、Service）
- 复杂的下载管理（我们使用流式播放）
- 队列管理（暂时不需要）

### 音频 URL 处理

**混合内容问题：**
- 许多播客仍使用 HTTP 音频 URL
- HTTPS 页面不能加载 HTTP 资源
- 解决方案：自动转换 HTTP→HTTPS

**CORS 问题：**
- 某些音频服务器不允许跨域访问
- 可能需要实现音频代理
- 当前阶段：先测试，遇到问题再解决

### 优先级

**紧急（必须完成）：**
- 任务 1-8：诊断和修复
- 任务 12：端到端测试

**重要（应该完成）：**
- 任务 9-11：架构优化
- 任务 13-14：错误和 MARK 测试

**可选（可以延后）：**
- 任务 15：性能验证

---

## 附录：AntennaPod 架构参考

### 目录结构

```
AntennaPod/
├── app/           # 主应用层
├── core/          # 核心业务逻辑
│   ├── feed/      # Feed 订阅管理
│   ├── playback/  # 播放器核心
│   └── storage/   # 数据库操作
├── model/         # 数据模型
│   ├── Feed.kt
│   ├── Episode.kt
│   └── Playable.kt
├── net/           # 网络操作
│   ├── download/
│   └── feed/
├── parser/        # RSS/Atom 解析
│   ├── feed/
│   └── media/
└── ui/            # 用户界面
```

### 数据流

```
用户搜索
    ↓
net.download_feed()
    ↓
parser.feed_handler.parse()
    ↓
storage.feed_repo.save()
    ↓
core.playback.play_episode()
```

### 关键设计模式

1. **Repository Pattern**：数据访问抽象
2. **Service Layer**：业务逻辑封装
3. **Event Bus**：模块间通信
4. **Cache Strategy**：二级缓存（内存 + 数据库）

---

**信心评分**：8/10

**风险评估**：
- 低风险：任务 1-8（诊断和修复）
- 中风险：任务 9-11（架构重构，可能影响现有功能）
- 低风险：任务 12-15（测试验证）

**关键成功因素**：
1. 正确识别音频 URL 传递链的断裂点
2. 音频 URL 验证逻辑准确
3. PodcastManager 缓存正确工作
4. 保持现有组件接口不变
