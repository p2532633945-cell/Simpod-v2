# 修复计划：Supabase 错误和 API 问题

## 计划日期
2026-03-08

## 问题描述

### 错误 1: Supabase 错误对象仍然为空
```
[Supabase] Error fetching hotzones: {}
```
**位置**: `src/services/supabase.ts:79`
**问题**: 即使修改了错误日志，错误对象仍然被序列化为空对象
**根因**: Supabase 错误对象可能不可序列化，需要在创建新 Error 时传递更多信息

### 错误 2: 网络请求失败
```
TypeError: Failed to fetch
```
**位置**: 未知
**问题**: 网络请求失败，可能是 CORS 或网络问题
**根因**: 需要确定是哪个请求失败

### 错误 3: Podcast Index API 返回 500
```
[Podcast Index] API error: 500 "Internal Server Error"
```
**位置**: `src/lib/podcast-search.ts:52-54`
**问题**: Podcast Index API 返回内部服务器错误
**根因**: 可能是 API 密钥问题、认证失败或服务端问题

### 错误 4: 搜索错误对象为空
```
[Podcast Index Search] Error: {}
```
**位置**: `src/lib/podcast-search.ts:70-73`
**问题**: catch 块中的错误对象被序列化为空对象
**根因**: 与错误1相同的问题

---

## 修复计划

### 阶段 1：修复 Supabase 错误序列化（10分钟）

**任务 1.1：改进 Supabase 错误处理**
```typescript
// src/services/supabase.ts

export const fetchHotzones = async (audioId: string): Promise<Hotzone[]> => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hotzones')
      .select('*')
      .eq('audio_id', audioId)
      .order('start_time', { ascending: true });

    if (error) {
      // 提前提取错误信息，避免序列化问题
      const errorInfo = {
        message: String(error.message || 'Unknown error'),
        code: String(error.code || 'UNKNOWN'),
        details: String(error.details || 'No details'),
        hint: String(error.hint || 'No hint'),
        audioId
      };
      console.error('[Supabase] Error fetching hotzones:', errorInfo);
      throw new Error(errorInfo.message);
    }

    // ... 处理数据
  } catch (err) {
    // 捕获所有错误，包括网络错误
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Supabase] fetchHotzones exception:', { message, audioId });
    throw err; // 重新抛出以便上层处理
  }
};
```

**任务 1.2：同样修复 saveHotzone**
```typescript
export const saveHotzone = async (hotzone: Hotzone) => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hotzones')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      const errorInfo = {
        message: String(error.message || 'Unknown error'),
        code: String(error.code || 'UNKNOWN'),
        details: String(error.details || 'No details'),
        hint: String(error.hint || 'No hint')
      };
      console.error('[Supabase] Error saving hotzone:', errorInfo);
      throw new Error(errorInfo.message);
    }

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Supabase] saveHotzone exception:', { message });
    throw err;
  }
};
```

---

### 阶段 2：检查并修复 Podcast Index API（15分钟）

**任务 2.1：检查 API 密钥配置**
```bash
# 验证环境变量
echo $PODCAST_INDEX_KEY
echo $PODCAST_INDEX_SECRET
```

**任务 2.2：改进 API 错误处理**
```typescript
// src/lib/podcast-search.ts

async function searchPodcastIndex(query: string): Promise<Podcast[]> {
  if (!query.trim()) return []

  try {
    const response = await fetch(`/api/podcast-search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('[Podcast Index] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        query
      })
      throw new Error(`Podcast Index API error: HTTP ${response.status} - ${errorText}`)
    }

    const data: PodcastIndexResponse = await response.json()

    return data.feeds.map((feed) => ({
      id: `pi-${feed.id}`,
      title: feed.title,
      author: feed.author || feed.ownerName,
      feedUrl: feed.feedUrl || feed.url || feed.originalUrl,
      artwork: feed.image || feed.artwork,
      description: feed.description,
      source: 'podcastindex' as const,
    }))
  } catch (err) {
    const error = err as Error
    console.error('[Podcast Index Search] Error:', {
      message: error.message || 'Unknown error',
      name: error.name || 'Unknown',
      stack: error.stack,
      query
    })
    return []
  }
}
```

**任务 2.3：检查 API 代理实现**
```typescript
// src/app/api/podcast-search/route.ts

// 添加更详细的日志
console.log('[Podcast Search API] Request received:', {
  query,
  hasKey: !!process.env.PODCAST_INDEX_KEY,
  hasSecret: !!process.env.PODCAST_INDEX_SECRET
})

// 改进错误响应
if (!apiKey || !apiSecret) {
  console.error('[Podcast Search API] Missing credentials')
  return NextResponse.json(
    { error: 'Server configuration error: API credentials not found' },
    { status: 500 }
  )
}
```

---

### 阶段 3：改进 PodcastPlayerPage 错误处理（10分钟）

**任务 3.1：使用 try-catch 包装所有异步操作**
```typescript
// src/components/player/PodcastPlayerPage.tsx

useEffect(() => {
  const loadHotzones = async () => {
    try {
      console.log("[Player] Loading hotzones for audioId:", audioId)
      const fetchedHotzones = await fetchHotzones(audioId)
      console.log("[Player] Loaded hotzones:", fetchedHotzones.length)
      fetchedHotzones.forEach(hz => addHotzone(hz))
    } catch (err) {
      const error = err as Error
      const errorInfo = {
        message: error.message || 'Unknown error',
        name: error.name || 'Unknown',
        stack: error.stack,
        audioId
      }
      console.error("[Player] Failed to load hotzones:", errorInfo)

      // Fallback to mock data if database fetch fails
      const { mockHotzones } = await import("@/lib/mock-data")
      const filteredHotzones = mockHotzones.filter((hz) => hz.audio_id === audioId)
      filteredHotzones.forEach(hz => addHotzone(hz))
    }
  }

  if (isMounted) {
    loadHotzones()
  }
}, [audioId, addHotzone, isMounted])
```

---

### 阶段 4：验证和测试（10分钟）

**任务 4.1：检查 Supabase 连接**
```typescript
// 创建测试脚本 src/lib/test-supabase.ts
import { createClient } from '@/lib/supabase/client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('hotzones')
      .select('count')
      .limit(1)

    if (error) {
      console.error('[Test] Supabase connection failed:', {
        message: error.message,
        code: error.code
      })
      return false
    }

    console.log('[Test] Supabase connection OK')
    return true
  } catch (err) {
    console.error('[Test] Supabase exception:', err)
    return false
  }
}
```

**任务 4.2：测试 API 密钥**
```bash
# 测试 Podcast Index API
curl -X GET "https://api.podcastindex.org/api/1.0/search/by?q=ted" \
  -H "User-Agent: Simpod/2.0" \
  -H "Authentication: ${PODCAST_INDEX_KEY}:${PODCAST_INDEX_SECRET_HASH}"
```

---

## 文件修改清单

### 需要修改的文件：
1. `src/services/supabase.ts` - 改进错误序列化
2. `src/lib/podcast-search.ts` - 改进错误处理和日志
3. `src/components/player/PodcastPlayerPage.tsx` - 改进 catch 块错误处理
4. `src/app/api/podcast-search/route.ts` - 添加详细日志和配置检查

### 可选创建的文件：
1. `src/lib/test-supabase.ts` - Supabase 连接测试工具
2. `src/lib/test-api.ts` - API 测试工具

---

## 验证命令

```bash
# 类型检查
npx tsc --noEmit

# Lint
npm run lint

# 构建
npm run build

# 测试（如果有）
npm test
```

---

## 预期结果

### 修复后应该看到：

1. **Supabase 错误** - 显示详细的错误信息：
```
[Supabase] Error fetching hotzones: {
  message: "relation 'hotzones' does not exist",
  code: "42P01",
  details: "...",
  hint: "...",
  audioId: "test-123"
}
```

2. **Podcast Index 错误** - 显示 API 错误详情：
```
[Podcast Index] API error: {
  status: 500,
  statusText: "Internal Server Error",
  body: "API authentication failed",
  query: "ted"
}
```

3. **搜索 catch 块** - 显示错误信息：
```
[Podcast Index Search] Error: {
  message: "Podcast Index API error: HTTP 500",
  name: "Error",
  stack: "...",
  query: "ted"
}
```

---

## 根本原因分析

### 为什么错误对象是空的？

1. **Supabase 错误对象**：可能是 Proxy 或特殊对象，属性不可枚举
2. **Fetch 错误**：TypeError: Failed to fetch 通常没有详细属性
3. **自定义错误**：需要提前提取属性值

### 解决方案：

1. **提前提取属性值**：使用 `String()` 或 `||` 提供默认值
2. **使用类型断言**：`err as Error` 确保可以访问 message 属性
3. **结构化日志**：创建新的普通对象，只包含可序列化的值

---

## 下一步行动

1. 首先检查环境变量配置是否正确
2. 按照阶段1-4的顺序执行修复
3. 每个阶段完成后测试验证
4. 记录任何新的问题

---

**优先级**: 🔥 高（影响用户体验）
**预计完成时间**: 45分钟
**信心评分**: 9/10
