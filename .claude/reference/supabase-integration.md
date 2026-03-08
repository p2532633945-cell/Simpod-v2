# Supabase 集成最佳实践

在 Next.js 项目中使用 Supabase 的简明参考指南。

---

## 目录

1. [客户端设置](#1-客户端设置)
2. [认证](#2-认证)
3. [数据库查询](#3-数据库查询)
4. [RLS（行级安全）](#4-rls行级安全)
5. [实时订阅](#5-实时订阅)
6. [存储](#6-存储)
7. [Edge Functions](#7-edge-functions)
8. [测试](#8-测试)

---

## 1. 客户端设置

### 安装

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 客户端初始化

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 服务端客户端

```typescript
// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            )
          } catch {
            // setAll 方法在服务端组件中可能会失败
          }
        },
      },
    }
  )
}
```

---

## 2. 认证

### 登录

```typescript
const supabase = createClient()

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

if (error) {
  console.error('登录失败', error.message)
}
```

### 注册

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})
```

### 获取当前用户

```typescript
// 客户端组件
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// 服务端组件
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
```

### 登出

```typescript
await supabase.auth.signOut()
```

---

## 3. 数据库查询

### 基础查询

```typescript
const supabase = createClient()

// 选择所有热区
const { data, error } = await supabase
  .from('hotzones')
  .select('*')

// 选择特定列
const { data, error } = await supabase
  .from('hotzones')
  .select('id, start_time, transcript_snippet')
```

### 过滤

```typescript
// 等于
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .eq('audio_id', 'episode-123')

// 不等于
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .neq('status', 'archived')

// 范围
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .gte('created_at', '2026-01-01')
```

### 排序

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .order('start_time', { ascending: true })
```

### 限制和分页

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .range(0, 9) // 前 10 个

// 使用 cursor 分页
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .gt('id', lastId)
  .order('id', { ascending: true })
  .limit(10)
```

### 关联查询

```typescript
// 热区关联 transcripts
const { data, error } = await supabase
  .from('hotzones')
  .select(`
    *,
    transcripts (
      text,
      words
    )
  `)
```

### 插入

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .insert({
    audio_id: 'episode-123',
    start_time: 10.5,
    end_time: 30.5,
    transcript_snippet: '转录文本',
    metadata: { confidence: 0.9 },
  })
  .select()
  .single()
```

### 更新

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .update({ status: 'reviewed' })
  .eq('id', 'hotzone-123')
  .select()
  .single()
```

### Upsert（插入或更新）

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .upsert({
    id: 'hotzone-123',
    transcript_snippet: '更新后的文本',
  }, {
    onConflict: 'id'
  })
  .select()
  .single()
```

### 删除

```typescript
const { error } = await supabase
  .from('hotzones')
  .delete()
  .eq('id', 'hotzone-123')
```

---

## 4. RLS（行级安全）

### 在 SQL 中创建策略

```sql
-- 用户只能访问自己的热区
CREATE POLICY "Users can only access their own hotzones"
ON hotzones
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 所有人可以读取公开数据
CREATE POLICY "Public read access"
ON hotzones
FOR SELECT
USING (true);
```

### 使用 Service Role 绕过 RLS

```typescript
// 仅在服务器端使用！
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 此客户端可以绕过 RLS
```

---

## 5. 实时订阅

### 订阅变更

```typescript
// 客户端组件
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useHotzoneSubscription(audioId: string) {
  const [hotzones, setHotzones] = useState([])

  useEffect(() => {
    const supabase = createClient()

    // 订阅插入和更新
    const channel = supabase
      .channel('hotzones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotzones',
          filter: `audio_id=eq.${audioId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHotzones(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setHotzones(prev =>
              prev.map(hz =>
                hz.id === payload.new.id ? payload.new : hz
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setHotzones(prev =>
              prev.filter(hz => hz.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [audioId])

  return hotzones
}
```

---

## 6. 存储

### 上传文件

```typescript
const { data, error } = await supabase.storage
  .from('audio-files')
  .upload(`episodes/${episodeId}.mp3`, audioFile, {
    cacheControl: '3600',
    upsert: false,
  })
```

### 获取公开 URL

```typescript
const { data } = supabase.storage
  .from('audio-files')
  .getPublicUrl(`episodes/${episodeId}.mp3`)

console.log(data.publicUrl)
```

### 生成签名 URL（私有文件）

```typescript
const { data, error } = await supabase.storage
  .from('audio-files')
  .createSignedUrl(`episodes/${episodeId}.mp3`, 3600) // 1 小时有效期
```

---

## 7. Edge Functions

### 创建 Edge Function

```typescript
// supabase/functions/transcribe-audio/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { audioUrl } = await req.json()

  // 调用 Groq API
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  })

  const result = await response.json()

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## 8. 测试

### Mock Supabase 客户端

```typescript
// tests/__mocks__/supabase.ts
import { vi } from 'vitest'

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: 'test-id' },
          error: null,
        })),
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => ({
      data: { user: { id: 'user-123' } },
    })),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))
```

---

## 快速参考

### 常见模式

```typescript
// 服务端组件中获取数据
export default async function Page() {
  const supabase = createClient()
  const { data: hotzones } = await supabase
    .from('hotzones')
    .select('*')

  return <div>{/* 渲染 */}</div>
}

// Server Action
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/client'

export async function deleteHotzone(id: string) {
  const supabase = createClient()
  await supabase.from('hotzones').delete().eq('id', id)
  revalidatePath('/dashboard')
}
```

### 错误处理

```typescript
const { data, error } = await supabase
  .from('hotzones')
  .select('*')

if (error) {
  console.error('查询失败:', error.message)
  // 处理错误
}

if (!data) {
  // 无数据情况
}
```

---

## 资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript)
- [Next.js + Supabase](https://supabase.com/docs/guides/with-nextjs)
- [RLS 策略](https://supabase.com/docs/guides/auth/row-level-security)
