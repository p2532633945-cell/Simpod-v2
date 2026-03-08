# Next.js 最佳实践参考

构建生产级 Next.js 应用程序的简明参考指南。

---

## 目录

1. [项目结构](#1-项目结构)
2. [路由与页面](#2-路由与页面)
3. [服务端组件 vs 客户端组件](#3-服务端组件-vs-客户端组件)
4. [数据获取](#4-数据获取)
5. [状态管理](#5-状态管理)
6. [API 路由](#6-api-路由)
7. [表单处理](#7-表单处理)
8. [性能优化](#8-性能优化)
9. [测试](#9-测试)
10. [部署](#10-部署)

---

## 1. 项目结构

### App Router 推荐结构

```
src/
├── app/
│   ├── (auth)/                 # 路由组
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── player/
│   │       └── page.tsx
│   ├── api/                    # API 路由
│   │   ├── groq-proxy/
│   │   │   └── route.ts
│   │   └── hotzones/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # Shadcn/UI 组件
│   ├── player/                # 播放器相关
│   ├── hotzone/               # 热区相关
│   └── shared/                # 共享组件
├── lib/
│   ├── supabase.ts           # Supabase 客户端
│   └── utils.ts
├── services/
│   ├── groq.ts               # Groq API
│   └── supabase.ts          # 数据库操作
├── stores/
│   └── playerStore.ts       # Zustand stores
├── hooks/
│   ├── useAudioPlayer.ts
│   └── useHotzones.ts
├── types/
│   └── index.ts
└── middleware.ts
```

### 关键原则

- **路由组**：使用 `(group)` 语法组织相关路由，不影响 URL
- **分离关注点**：保持 UI、服务、状态管理分离
- **功能文件夹**：相关文件放在一起（`components/player/`）

---

## 2. 路由与页面

### 基础路由

```typescript
// app/page.tsx
export default function HomePage() {
  return <div>Welcome to Simpod</div>
}
```

### 动态路由

```typescript
// app/episodes/[id]/page.tsx
export default function EpisodePage({ params }: { params: { id: string } }) {
  return <div>Episode {params.id}</div>
}
```

### 布局

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

---

## 3. 服务端组件 vs 客户端组件

### 服务端组件（默认）

```typescript
// 默认为服务端组件
export default async function HotzoneList() {
  const hotzones = await fetchHotzones()

  return (
    <ul>
      {hotzones.map(hz => (
        <li key={hz.id}>{hz.transcript_snippet}</li>
      ))}
    </ul>
  )
}
```

### 客户端组件

```typescript
'use client'

import { useState } from 'react'

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)

  return <button onClick={() => setIsPlaying(!isPlaying)}>
    {isPlaying ? '暂停' : '播放'}
  </button>
}
```

### 何时使用客户端组件

- 需要 React Hooks（useState、useEffect）
- 事件处理器（onClick、onChange）
- 浏览器 API（localStorage、Audio API）
- 第三方 UI 库（需要交互）

---

## 4. 数据获取

### 服务端获取

```typescript
// app/page.tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // 每 60 秒重新验证
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()

  return <div>{data.name}</div>
}
```

### 客户端获取（使用 SWR）

```typescript
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HotzoneList() {
  const { data, error, isLoading } = useSWR('/api/hotzones', fetcher)

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return <div>{/* 渲染数据 */}</div>
}
```

### Server Actions（服务端操作）

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { saveHotzone } from '@/services/supabase'

export async function createHotzone(formData: FormData) {
  const hotzone = await saveHotzone({
    audio_id: formData.get('audio_id') as string,
    // ...
  })

  revalidatePath('/dashboard')
  return hotzone
}
```

---

## 5. 状态管理

### Zustand Store

```typescript
// stores/playerStore.ts
import { create } from 'zustand'

interface PlayerState {
  currentTime: number
  isPlaying: boolean
  audioUrl: string | null
  duration: number
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setAudioUrl: (url: string) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  audioUrl: null,
  duration: 0,

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAudioUrl: (url) => set({ audioUrl: url }),
}))
```

### 在组件中使用

```typescript
'use client'

import { usePlayerStore } from '@/stores/playerStore'

export default function PlayerControls() {
  const { isPlaying, setIsPlaying, currentTime } = usePlayerStore()

  return (
    <button onClick={() => setIsPlaying(!isPlaying)}>
      {isPlaying ? '暂停' : '播放'} - {currentTime}s
    </button>
  )
}
```

---

## 6. API 路由

### 基础 API 路由

```typescript
// app/api/hotzones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchHotzones } from '@/services/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const audioId = searchParams.get('audio_id')

  const hotzones = await fetchHotzones(audioId || '')

  return NextResponse.json(hotzones)
}
```

### POST 端点

```typescript
// app/api/hotzones/route.ts
import { saveHotzone } from '@/services/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const hotzone = await saveHotzone(body)
    return NextResponse.json(hotzone, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    )
  }
}
```

### 动态 API 路由

```typescript
// app/api/hotzones/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchHotzoneById } from '@/services/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const hotzone = await fetchHotzoneById(params.id)

  if (!hotzone) {
    return NextResponse.json(
      { error: '未找到' },
      { status: 404 }
    )
  }

  return NextResponse.json(hotzone)
}
```

---

## 7. 表单处理

### Server Actions 表单

```typescript
'use client'

import { createHotzone } from '@/app/actions'

export default function HotzoneForm() {
  async function handleSubmit(formData: FormData) {
    await createHotzone(formData)
  }

  return (
    <form action={handleSubmit}>
      <input name="audio_id" required />
      <input name="start_time" type="number" required />
      <button type="submit">创建热区</button>
    </form>
  )
}
```

### 客户端表单（使用 react-hook-form）

```typescript
'use client'

import { useForm } from 'react-hook-form'

interface FormData {
  audio_id: string
  start_time: number
}

export default function HotzoneForm() {
  const { register, handleSubmit } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/hotzones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    // 处理响应
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('audio_id')} required />
      <input {...register('start_time')} type="number" required />
      <button type="submit">创建</button>
    </form>
  )
}
```

---

## 8. 性能优化

### 图片优化

```typescript
import Image from 'next/image'

<Image
  src="/podcast-cover.jpg"
  alt="播客封面"
  width={300}
  height={300}
  priority // 首屏图片
/>
```

### 动态导入

```typescript
import dynamic from 'next/dynamic'

const WaveformVisualizer = dynamic(
  () => import('@/components/WaveformVisualizer'),
  { ssr: false, loading: () => <div>加载中...</div> }
)
```

### 缓存策略

```typescript
// 数据缓存（1 小时）
const data = await fetch(url, { next: { revalidate: 3600 } })

// 静态生成（每次部署时重建）
const data = await fetch(url, { next: { revalidate: false } })

// 无缓存（每次请求）
const data = await fetch(url, { cache: 'no-store' })
```

---

## 9. 测试

### 使用 Vitest

```typescript
// tests/components/Player.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from '@/components/player/PlayerControls'

describe('PlayerControls', () => {
  it('切换播放状态', () => {
    render(<PlayerControls />)

    const button = screen.getByRole('button', { name: /播放/ })
    fireEvent.click(button)

    expect(screen.getByRole('button', { name: /暂停/ })).toBeInTheDocument()
  })
})
```

### Playwright E2E 测试

```typescript
// tests/e2e/player.spec.ts
import { test, expect } from '@playwright/test'

test('播放音频', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("播放")')

  await expect(page.locator('.progress-bar')).toBeVisible()
})
```

---

## 10. 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 环境变量

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
GROQ_API_KEY=xxx
```

### Docker（可选）

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 快速参考

### 常用导入

```typescript
// Next.js
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// App Router
import { revalidatePath } from 'next/cache'

// 状态管理
import { create } from 'zustand'

// UI 组件
import { Button } from '@/components/ui/button'
```

### 命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 类型检查
npx tsc --noEmit

# Lint
npm run lint
```

---

## 资源

- [Next.js 文档](https://nextjs.org/docs)
- [App Router 文档](https://nextjs.org/docs/app)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Shadcn/UI](https://ui.shadcn.com/)
