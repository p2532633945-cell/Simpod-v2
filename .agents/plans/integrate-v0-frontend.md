# 功能：集成 v0 前端组件到 Next.js

以下计划应该是完整的，但开始实施前验证文档和代码库模式及任务合理性很重要。

特别注意现有 utils、types 和 models 的命名。从正确的文件导入等。

## PROGRESS.md 关联

**实现任务**：实现播客搜索功能
**优先级**：🔥 高
**更新后操作**：完成后更新 PROGRESS.md，将此任务移至"已完成的工作"

## 功能描述

将 v0 文件夹中包含的完整前端库和组件集成到我们的 Next.js App Router 项目中。v0 包含用户喜欢的风格的前端组件、页面、stores 和工具函数。

## 用户故事

作为一个 开发者
我想要 将 v0 文件夹中的前端组件和页面集成到我们的 Next.js 项目中
以便 在后端重构完成的基础上，继续开发前端功能
从而 实现完整的 Simpod v2 MVP

## 问题陈述

v0 文件夹包含一个完整的前端库实现，包括：
- App Router 页面结构（discover、hotzones、settings、workspace）
- 完整的组件库（播放器、热区、转录、波形等）
- Zustand store 实现
- 完整的 TypeScript 类型定义
- 工具函数（clsx、tailwind-merge 等）

当前 Next.js 项目只有后端基础设施（API 路由、服务），需要集成这些前端组件以构建完整的 MVP 应用。

## 解决方案陈述

通过以下步骤将 v0 前端组件集成到我们的 Next.js 项目：
1. 安装缺失的依赖（clsx、tailwind-merge、lucide-react、framer-motion 等）
2. 复制和合并类型定义
3. 复制工具函数
4. 迁移组件到标准目录结构
5. 迁移页面到 App Router
6. 迁移 stores
7. 清理 v0 目录
8. 构建和验证

## 功能元数据

**功能类型**：新能力/集成
**估计复杂度**：高
**受影响的主要系统**：整个前端应用架构
**依赖项**：clsx、tailwind-merge、lucide-react、framer-motion、next-themes、class-variance-authority

---

## 上下文引用

### 相关代码库文件 重要：实施前必须阅读这些文件！

#### v0 源文件（分析中已读取）
- `src/v0/package.json` - v0 的依赖配置，需要了解要安装的包
- `src/v0/types/simpod.ts` - 完整的类型定义系统
- `src/v0/lib/utils.ts` - 工具函数（clsx、tailwind-merge）
- `src/v0/stores/playerStore.ts` - 播放器状态管理
- `src/v0/components/` - 所有组件源码
- `src/v0/app/` - 页面结构

#### 当前项目文件
- `package.json` - 当前依赖
- `src/types/index.ts` - 当前类型定义
- `src/lib/supabase/client.ts` - Supabase 客户端
- `src/lib/supabase/server.ts` - Supabase 服务端客户端
- `src/stores/playerStore.ts` - 当前 player store（需要合并或替换）

#### 要创建的新文件
- `src/lib/utils.ts` - 合并后的工具函数文件
- `src/components/ui/` - 通用 UI 组件
- `src/components/player/` - 播放器组件
- `src/components/hotzone/` - 热区组件
- `src/components/review/` - 复习组件
- `src/components/transcript/` - 转录组件
- `src/components/waveform/` - 波形组件
- `src/components/theme-provider.tsx` - 主题提供器
- `src/app/discover/page.tsx` - 发现页面
- `src/app/hotzones/page.tsx` - 热区页面
- `src/app/player/[id]/page.tsx` - 播放器页面

### 相关文档 实施前应该阅读这些！

- [CLAUDE.md](../CLAUDE.md) - 项目宪法，包含技术栈确认和开发规范
- [PROGRESS.md](../PROGRESS.md) - 项目开发进度跟踪
- [PRD.md](../PRD.md) - 产品需求文档
- [Next.js App Router 文档](https://nextjs.org/docs/app) - 理解 App Router 模式
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - 样式系统参考
- [Framer Motion 文档](https://www.framer.com/motion) - 动效库文档
- [Lucide React 文档](https://lucide.dev/) - 图标库文档

### 要遵循的模式

#### 项目结构模式（参考 CLAUDE.md:22-61）
```
src/
├── app/              # App Router
│   ├── discover/     # 发现页面
│   ├── hotzones/     # 热区页面
│   ├── player/       # 播放器页面（动态路由）
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/          # 通用 UI 组件
│   ├── player/       # 播放器组件
│   ├── hotzone/      # 热区组件
│   ├── review/       # 复习组件
│   ├── transcript/    # 转录组件
│   ├── waveform/     # 波形组件
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/     # Supabase 客户端和服务端
│   └── utils.ts      # 工具函数
├── stores/          # Zustand stores
│   ├── playerStore.ts
│   ├── hotzoneStore.ts
│   └── transcriptStore.ts
├── types/           # TypeScript 类型
│   ├── index.ts       # 统一类型入口
│   └── simpod.ts     # 保留 v0 完整类型（可能需要合并）
└── middleware.ts
```

#### 错误处理模式（参考 CLAUDE.md:131-143）
```typescript
try {
  // 操作
} catch (error) {
  console.error('操作失败:', error);
  throw error;  // 或者返回错误状态
}
```

#### Supabase 客户端模式（参考 supabase-integration.md:38-47）
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### 类型命名约定
- 组件 Props 接口：`<ComponentName>Props`
- 函数参数：使用显式类型
- 避免 `any` 类型，除非必要

---

## 实施计划

### 阶段 1：依赖安装

**任务**：

#### 1.1 分析 v0 依赖并添加到 package.json
- **IMPLEMENT**: 阅读 v0 的 package.json，识别所有需要添加到我们项目的依赖
- **PATTERN**: NPM 包管理
- **IMPORTS**: 无
- **GOTCHA**: v0 使用 pnpm，但我们使用 npm；需要注意可能的差异
- **VALIDATE**: `npm list --depth=0` 确认依赖已安装

需要安装的依赖：
- `clsx` ^2.1.1 - 条件类名工具函数
- `tailwind-merge` ^2.6.0 - Tailwind 类合并工具
- `lucide-react` ^0.468.0 - 图标库
- `framer-motion` ^11.0.0 - 动效库
- `next-themes` ^0.4.0 - 主题支持
- `class-variance-authority` ^0.7.1 - CSS 动画工具

#### 1.2 安装依赖
- **IMPLEMENT**: 运行 `npm install` 安装所有依赖
- **PATTERN**: NPM 标准安装
- **IMPORTS**: 无
- **GOTCHA**: 某些依赖可能需要特定配置（如 next-themes）
- **VALIDATE**: `npm list clsx tailwind-merge lucide-react framer-motion next-themes` 确认安装

### 阶段 2：工具函数合并

**任务**：

#### 2.1 合并 clsx 和 tailwind-merge 工具函数
- **IMPLEMENT**: 将 v0 的工具函数合并到我们的 src/lib/utils.ts
- **PATTERN**: 参考 v0/src/v0/lib/utils.ts
- **IMPORTS**: 无（保留原有的 audio.ts 等函数）
- **GOTCHA**: 确保函数签名与类型定义一致
- **VALIDATE**: `npm run build` 确认类型检查通过

要合并的函数：
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 阶段 3：类型定义合并

**任务**：

#### 3.1 分析并合并类型定义
- **IMPLEMENT**: 将 v0 的完整类型定义与我们的 types/index.ts 合并
- **PATTERN**: 类型合并和扩展
- **IMPORTS**: 无
- **GOTCHA**: v0 使用严格的类型系统（禁止 any），需要检查是否有冲突
- **VALIDATE**: `npx tsc --noEmit` 确认类型检查通过

合并策略：
- 保留现有的基础类型（Anchor、Hotzone、TranscriptSegment）
- 添加 v0 的扩展类型（PlayerState、Podcast、Episode、Project、组件 Props 等）
- 考虑将 v0 类型放入单独文件（types/simpod.ts）以保持清晰

### 阶段 4：组件迁移 - 播放器组件

**任务**：

#### 4.1 迁移 MarkButton 组件
- **IMPLEMENT**: 将 v0/components/player/MarkButton.tsx 迁移到 src/components/player/
- **PATTERN**: 参考 v0 源码，适配我们的项目结构
- **IMPORTS**: `@/lib/supabase/client`（需要 Supabase 客户端）
- **GOTCHA**: 确保组件标记为 'use client'
- **VALIDATE**: `npm run build` 确认无类型错误

#### 4.2 迁移 PlaybackControls 组件
- **IMPLEMENT**: 将 v0/components/player/PlaybackControls.tsx 迁移到 src/components/player/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/stores/playerStore`（需要使用我们的 player store 或合并 v0 store）
- **GOTCHA**: 考虑是否需要修改以适应我们的 store 结构
- **VALIDATE**: `npm run build` 确认无类型错误

#### 4.3 迁移 PodcastPlayerPage 组件
- **IMPLEMENT**: 将 v0/components/player/PodcastPlayerPage.tsx 迁移到 src/components/player/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: 需要的组件和 store
- **GOTCHA**: 此组件可能包含多个其他组件，需要正确处理导入
- **VALIDATE**: `npm run build` 确认无类型错误

### 阶段 5：组件迁移 - 热区组件

**任务**：

#### 5.1 迁移 HotzoneSidebar 组件
- **IMPLEMENT**: 将 v0/components/hotzones/HotzoneSidebar.tsx 迁移到 src/components/hotzone/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/types/simpod`（Hotzone、HotzoneSidebarProps）
- **GOTCHA**: 需要连接到我们的 Supabase 客户端
- **VALIDATE**: `npm run build` 确认无类型错误

#### 5.2 迁移 HotzoneWaveform 组件
- **IMPLEMENT**: 将 v0/components/waveform/HotzoneWaveform.tsx 迁移到 src/components/waveform/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/types/simpod`（HotzoneWaveformProps）
- **GOTCHA**: 可能需要特殊的样式配置
- **VALIDATE**: `npm run build` 确认无类型错误

### 阶段 6：组件迁移 - 复习和转录组件

**任务**：

#### 6.1 迁移 ReviewQueuePanel 组件
- **IMPLEMENT**: 将 v0/components/review/ReviewQueuePanel.tsx 迁移到 src/components/review/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/types/simpod`（ReviewQueuePanelProps）
- **GOTCHA**: 确保与热区和 store 集成正确
- **VALIDATE**: `npm run build` 确认无类型错误

#### 6.2 迁移 TranscriptStream 组件
- **IMPLEMENT**: 将 v0/components/transcript/TranscriptStream.tsx 迁移到 src/components/transcript/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/types/simpod`（TranscriptStreamProps、Word）
- **GOTCHA**: 确保词级时间戳和播放器集成
- **VALIDATE**: `npm run build` 确认无类型错误

### 阶段 7：其他组件迁移

**任务**：

#### 7.1 迁移 theme-provider 组件
- **IMPLEMENT**: 将 v0/components/theme-provider.tsx 迁移到 src/components/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `next-themes`（如果决定使用主题系统）
- **GOTCHA**: 确保主题提供者包装在布局中
- **VALIDATE**: `npm run build` 确认无类型错误

### 阶段 8：页面迁移

**任务**：

#### 8.1 迁移发现页面（discover）
- **IMPLEMENT**: 将 v0/app/discover/page.tsx 迁移到 src/app/discover/
- **PATTERN**: 参考 v0 源码，适配 App Router
- **IMPORTS**: `@/types/simpod`（Podcast、Episode）
- **GOTCHA**: 需要连接到我们的 store 和 services
- **VALIDATE**: `npm run build` 确认页面正常渲染

#### 8.2 迁移热区页面（hotzones）
- **IMPLEMENT**: 将 v0/app/hotzones/page.tsx 迁移到 src/app/hotzones/
- **PATTERN**: 参考 v0 源码
- **IMPORTS**: `@/types/simpod`（Hotzone、HotzoneFilter）
- **GOTCHA**: 需要连接到我们的 store
- **VALIDATE**: `npm run build` 确认页面正常渲染

#### 8.3 创建播放器动态路由页面
- **IMPLEMENT**: 创建 src/app/player/[id]/page.tsx
- **PATTERN**: 参考 v0/app/workspace/[id]/page.tsx 模式
- **IMPORTS**: `@/types/simpod`（Episode）
- **GOTCHA**: 需要连接到 Supabase 和相关 store
- **VALIDATE**: `npm run build` 确认页面正常渲染

### 阶段 9：Store 迁移和合并

**任务**：

#### 9.1 分析和合并 playerStore
- **IMPLEMENT**: 将 v0/stores/playerStore.ts 与我们现有的 playerStore.ts 合并
- **PATTERN**: 参考两个 store，保留各自优点
- **IMPORTS**: 无
- **GOTCHA**: 我们的 store 使用 `create()`，v0 store 可能使用不同的模式
- **VALIDATE**: `npm run build` 确认 store 类型正确

合并决策：
- 比较两个 store 的接口和方法
- 保留我们的 store 结构（已配置好）
- 添加 v0 store 中有用的额外方法或状态（如果有）

### 阶段 10：清理和验证

**任务**：

#### 10.1 删除 v0 目录
- **IMPLEMENT**: 删除 src/v0/ 目录及其所有内容
- **PATTERN**: Git 清理或直接删除
- **IMPORTS**: 无
- **GOTCHA**: 确保没有其他文件引用 v0 中的内容
- **VALIDATE**: `ls -la src/v0` 确认目录已删除

#### 10.2 移除 v0 目录的 ESLint 排除
- **IMPLEMENT**: 从 tsconfig.json 和 .eslintrc.json 中移除 src/v0 排除
- **PATTERN**: 项目配置清理
- **IMPORTS**: 无
- **GOTCHA**: 确保后续 linting 不再检查 v0 目录
- **VALIDATE**: `npm run build` 确认构建成功

#### 10.3 运行最终构建和验证
- **IMPLEMENT**: 运行 `npm run build` 验证整个项目
- **PATTERN**: Next.js 标准构建
- **IMPORTS**: 无
- **GOTCHA**: 检查是否有任何类型错误或警告
- **VALIDATE**: 构建应该成功且无错误

---

## 分步任务

重要：按顺序执行每个任务，从上到下。每个任务都是原子的且可独立测试。

### 阶段 1：依赖安装

#### INSTALL 添加 v0 依赖到 package.json
- **IMPLEMENT**: 更新 package.json，添加 clsx、tailwind-merge、lucide-react、framer-motion、next-themes、class-variance-authority
- **PATTERN**: NPM 依赖管理
- **IMPORTS**: 无
- **GOTCHA**: 检查依赖版本兼容性
- **VALIDATE**: `npm install` 安装成功，`npm list` 确认所有依赖存在

#### INSTALL 安装新依赖
- **IMPLEMENT**: 运行 `npm install` 安装所有依赖
- **PATTERN**: NPM 标准安装
- **IMPORTS**: 无
- **GOTCHA**: 某些包可能需要额外配置步骤
- **VALIDATE**: 依赖安装成功，无版本冲突

### 阶段 2：工具函数合并

#### CREATE 合并工具函数到 src/lib/utils.ts
- **IMPLEMENT**: 在 src/lib/utils.ts 中添加 cn() 函数（clsx + tailwind-merge）
- **PATTERN**: 参考 v0/src/v0/lib/utils.ts:4-7
- **IMPORTS**: 无
- **GOTCHA**: 保留现有的 audio.ts 函数，不要意外删除
- **VALIDATE**: `npm run build` 确认类型检查通过

### 阶段 3：类型定义合并

#### CREATE v0 类型文件
- **IMPLEMENT**: 创建 src/types/simpod.ts，包含 v0 的完整类型定义
- **PATTERN**: 参考 v0/src/v0/types/simpod.ts:1-176
- **IMPORTS**: 无
- **GOTCHA**: 确保所有类型定义都包含严格的类型标注
- **VALIDATE**: `npx tsc --noEmit` 确认类型检查通过

#### UPDATE 合并 types/index.ts
- **IMPLEMENT**: 更新 src/types/index.ts，导出所有类型（包括 v0 类型）
- **PATTERN**: 类型导出中心
- **IMPORTS**: `./simpod`（导入 v0 类型）
- **GOTCHA**: 确保没有重复的类型定义或冲突
- **VALIDATE**: `npx tsc --noEmit` 确认类型检查通过

### 阶段 4：组件迁移 - 播放器组件

#### COPY 迁移 MarkButton 组件
- **IMPLEMENT**: 复制 v0/components/player/MarkButton.tsx 到 src/components/player/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/lib/supabase/client`, `@/types/simpod`
- **GOTCHA**: 确保组件标记为 'use client'
- **VALIDATE**: `npm run build` 确认组件类型正确

#### COPY 迁移 PlaybackControls 组件
- **IMPLEMENT**: 复制 v0/components/player/PlaybackControls.tsx 到 src/components/player/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/stores/playerStore`, `@/lib/utils`
- **GOTCHA**: 可能需要调整 store 调用以适应我们的 store
- **VALIDATE**: `npm run build` 确认组件类型正确

#### COPY 迁移 PodcastPlayerPage 组件
- **IMPLEMENT**: 复制 v0/components/player/PodcastPlayerPage.tsx 到 src/components/player/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: 需要的所有子组件和 stores
- **GOTCHA**: 这是一个较大的复合组件，需要仔细处理所有导入
- **VALIDATE**: `npm run build` 确认组件类型正确

### 阶段 5：组件迁移 - 热区组件

#### COPY 迁移 HotzoneSidebar 组件
- **IMPLEMENT**: 复制 v0/components/hotzones/HotzoneSidebar.tsx 到 src/components/hotzone/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/types/simpod`, `@/lib/supabase/client`
- **GOTCHA**: 确保所有热区操作使用我们的 Supabase 客户端
- **VALIDATE**: `npm run build` 确认组件类型正确

#### COPY 迁移 HotzoneWaveform 组件
- **IMPLEMENT**: 复制 v0/components/waveform/HotzoneWaveform.tsx 到 src/components/waveform/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/types/simpod`, `@/lib/utils`
- **GOTCHA**: 波形组件可能需要特殊的样式处理
- **VALIDATE**: `npm run build` 确认组件类型正确

### 阶段 6：组件迁移 - 复习和转录组件

#### COPY 迁移 ReviewQueuePanel 组件
- **IMPLEMENT**: 复制 v0/components/review/ReviewQueuePanel.tsx 到 src/components/review/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/types/simpod`, `@/stores/playerStore`
- **GOTCHA**: 确保与热区 store（如果创建）集成正确
- **VALIDATE**: `npm run build` 确认组件类型正确

#### COPY 迁移 TranscriptStream 组件
- **IMPLEMENT**: 复制 v0/components/transcript/TranscriptStream.tsx 到 src/components/transcript/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `@/types/simpod`, `@/lib/utils`
- **GOTCHA**: 转录组件需要与播放器时间同步
- **VALIDATE**: `npm run build` 确认组件类型正确

### 阶段 7：其他组件迁移

#### COPY 迁移 theme-provider 组件
- **IMPLEMENT**: 复制 v0/components/theme-provider.tsx 到 src/components/
- **PATTERN**: 组件迁移，保留功能逻辑
- **IMPORTS**: `next-themes`（如果使用）
- **GOTCHA**: 确保主题提供者在根布局中正确设置
- **VALIDATE**: `npm run build` 确认组件类型正确

### 阶段 8：页面迁移

#### COPY 迁移发现页面
- **IMPLEMENT**: 复制 v0/app/discover/page.tsx 到 src/app/discover/
- **PATTERN**: 页面迁移到 App Router
- **IMPORTS**: `@/types/simpod`, `@/stores/playerStore`
- **GOTCHA**: 确保页面使用正确的 store 和 services
- **VALIDATE**: `npm run build` 确认页面正常渲染

#### COPY 迁移热区页面
- **IMPLEMENT**: 复制 v0/app/hotzones/page.tsx 到 src/app/hotzones/
- **PATTERN**: 页面迁移到 App Router
- **IMPORTS**: `@/types/simpod`, `@/stores/playerStore`, `@/services/supabase`
- **GOTCHA**: 确保页面正确连接到我们的 Supabase 客户端和服务
- **VALIDATE**: `npm run build` 确认页面正常渲染

#### CREATE 创建播放器页面
- **IMPLEMENT**: 创建 src/app/player/[id]/page.tsx，基于 v0/app/workspace/[id]/page.tsx 模式
- **PATTERN**: 动态路由页面创建
- **IMPORTS**: `@/types/simpod`, `@/stores/playerStore`, `@/services/supabase`
- **GOTCHA**: 需要从数据库获取剧集数据
- **VALIDATE**: `npm run build` 确认页面正常渲染

### 阶段 9：Store 合并和清理

#### UPDATE 合并 playerStore
- **IMPLEMENT**: 将 v0 playerStore 的有用功能合并到我们的 playerStore.ts
- **PATTERN**: Store 合并，保留最优结构
- **IMPORTS**: 无
- **GOTCHA**: 可能需要调整某些方法以保持一致性
- **VALIDATE**: `npm run build` 确认 store 类型正确

### 阶段 10：清理和验证

#### DELETE 删除 v0 目录
- **IMPLEMENT**: 删除 src/v0/ 目录及其所有内容
- **PATTERN**: 项目清理
- **IMPORTS**: 无
- **GOTCHA**: 确保没有其他文件引用 v0 中的内容
- **VALIDATE**: `ls -la src/v0` 确认目录已删除，`npm run build` 确认构建成功

#### UPDATE 移除 v0 排除
- **IMPLEMENT**: 从 tsconfig.json 移除 "src/v0" 排除
- **PATTERN**: 项目配置清理
- **IMPORTS**: 无
- **GOTCHA**: 确保后续构建只处理我们的源文件
- **VALIDATE**: `npm run build` 确认构建成功且不再检查 v0

#### BUILD 最终验证
- **IMPLEMENT**: 运行 `npm run build` 验证整个项目
- **PATTERN**: Next.js 标准构建
- **IMPORTS**: 无
- **GOTCHA**: 检查是否有任何类型错误或警告
- **VALIDATE**: 构建成功，可以提交代码

---

## 测试策略

### 单元测试

暂不实施单元测试，优先完成前端集成。后续任务会添加测试。

### 集成测试

- 启动开发服务器：`npm run dev`
- 访问各个页面确认正常加载
- 测试基本用户交互（播放、标记、导航）
- 验证组件渲染正确

### 边缘情况

- 依赖安装冲突
- 组件导入路径错误
- Store 状态同步问题
- 样式或主题问题

---

## 验证命令

执行每个命令以确保零回归和 100% 功能正确性。

### 级别 1：语法与样式

```bash
# TypeScript 类型检查
npx tsc --noEmit

# ESLint 检查
npm run lint

# Prettier 检查
npm run format:check
```

### 级别 2：构建测试

```bash
# 生产构建
npm run build

# 预览构建结果
npm run start
```

### 级别 3：开发服务器

```bash
# 启动开发服务器
npm run dev
```

### 级别 4：手动验证

1. 访问 http://localhost:3000 确认首页加载
2. 测试导航到各个页面
3. 检查控制台无错误
4. 验证组件渲染正确

---

## 验收标准

- [ ] 所有 v0 依赖已添加到 package.json
- [ ] 所有依赖已成功安装
- [ ] 工具函数（cn）已合并到 src/lib/utils.ts
- [ ] v0 类型定义已创建（types/simpod.ts）
- [ ] types/index.ts 已更新导出所有类型
- [ ] 所有播放器组件已迁移（MarkButton、PlaybackControls、PodcastPlayerPage）
- [ ] 所有热区组件已迁移（HotzoneSidebar、HotzoneWaveform）
- [ ] 所有复习组件已迁移（ReviewQueuePanel、TranscriptStream）
- [ ] theme-provider 组件已迁移
- [ ] 所有页面已迁移（discover、hotzones、player/[id]）
- [ ] playerStore 已合并有用功能
- [ ] v0 目录已删除
- [ ] v0 从 tsconfig.json 和 .eslintrc.json 排除已移除
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm run build` 构建成功
- [ ] `npm run lint` 无错误
- [ ] 开发服务器正常启动
- [ ] 所有页面可以正常访问

---

## 完成后：更新 PROGRESS.md

执行完成后，必须更新 PROGRESS.md：

1. 将任务从"待办事项"移至"已完成的工作"
2. 添加完成日期和简要描述
3. 更新"最后更新"和"更新者"

**示例**：
```markdown
### 2026-03-08: 集成 v0 前端组件
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 将 v0 文件夹中的完整前端库集成到 Next.js App Router 项目中，包括播放器、热区、转录等所有组件，添加必要依赖（clsx、tailwind-merge、lucide-react、framer-motion），迁移页面和 stores，清理 v0 目录。
```

---

## 完成清单

- [ ] 所有任务按顺序完成
- [ ] 每个任务验证立即通过
- [ ] 所有验证命令成功执行
- [ ] 开发服务器正常启动
- [ ] 无 lint 或类型检查错误
- [ ] 手动测试确认功能工作
- [ ] 所有验收标准都满足
- [ ] 代码已审查质量和可维护性
- [ ] PROGRESS.md 已更新

---

## 注意事项

### 依赖版本兼容性
- v0 使用 next ^15.2.0，我们的项目使用 ^15.5.12，应该兼容
- React 19.0.0 应该兼容
- 检查是否有版本冲突需要解决

### 组件导入路径
- 迁移后需要更新所有导入路径为 `@/` 别名
- v0 使用相对导入（如 `../lib/utils`），需要改为 `@/lib/utils`

### Store 状态管理
- 我们已经有 playerStore.ts，需要决定如何与 v0 的 store 合并或替换
- 考虑创建额外的 stores（hotzoneStore、transcriptStore）如果需要

### 样式和主题
- v0 使用 next-themes，需要决定是否集成主题系统
- 确保 Tailwind 配置与所有组件样式需求兼容

### 数据库连接
- v0 组件使用 Supabase 客户端，需要确保正确连接到我们的客户端
- 检查是否需要创建额外的服务层函数

---

## 用户建议

**用户建议**：如果现在适合先提交（后端重构完成，还未融合前端），可以执行 `/commit` 命令，附上说明

**我的建议**：
根据用户建议，现在是一个好的提交时机。当前状态：
- ✅ Next.js 项目基础架构已完成（后端重构）
- ✅ API 路由和服务层已迁移
- ✅ Supabase 客户端配置完成
- ✅ 构建和开发服务器可以正常运行
- ⏳ v0 前端组件集成尚未开始

建议执行 `/commit` 命令，提交信息为：
```
refactor: refactor: 重构后端基础设施并配置 Supabase 客户端

- 手动创建 Next.js 项目结构
- 配置 TypeScript、Tailwind CSS、ESLint、Prettier
- 设置 Supabase 客户端和服务端客户端
- 创建 API 路由（Groq 代理、Hotzones API）
- 迁移服务层代码并更新导入路径
- 设置 Zustand playerStore
- 成功构建并验证开发服务器

下一步：集成 v0 前端组件
```

这样可以为后续的 v0 集成工作提供一个清晰的提交分界点。
