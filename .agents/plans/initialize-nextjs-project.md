# 功能：初始化 Next.js 项目

以下计划应该是完整的，但开始实施前验证文档和代码库模式及任务合理性很重要。

特别注意现有 utils、types 和 models 的命名。从正确的文件导入等。

## PROGRESS.md 关联

**实现任务**：初始化 Next.js 项目
**优先级**：🔥 高
**更新后操作**：完成后更新 PROGRESS.md，将此任务移至"已完成的工作"

## 功能描述

初始化 Simpod v2 的 Next.js 项目基础结构，包括：
- 创建 Next.js 15 项目（使用 App Router）
- 配置 TypeScript、Tailwind CSS、ESLint、Prettier
- 设置项目目录结构（按 `.claude/reference/nextjs-best-practices.md` 中的最佳实践）
- 迁移现有的 `src/` 服务代码到新结构
- 配置环境变量模板
- 设置 Supabase 客户端

## 用户故事

作为一个 开发者
我想要 初始化 Next.js 项目基础结构
以便 开始构建 Simpod v2 应用的核心功能

## 问题陈述

当前项目只有部分源代码（`src/services/`、`src/lib/`、`src/utils/`），缺少 Next.js 项目配置、构建工具和完整的项目结构。无法运行开发服务器或进行开发工作。

## 解决方案陈述

使用 `npx create-next-app@latest` 初始化 Next.js 15 项目，然后配置必要的依赖和工具，最后迁移现有代码到标准的项目结构中。

## 功能元数据

**功能类型**：新能力
**估计复杂度**：中
**受影响的主要系统**：整个项目结构
**依赖项**：Node.js 18+、npm/pnpm

---

## 上下文引用

### 相关代码库文件 重要：实施前必须阅读这些文件！

- `CLAUDE.md` - 项目宪法，包含技术栈确认和开发规范
- `PROGRESS.md` (48-63行) - 待办事项中的初始化任务
- `.claude/reference/nextjs-best-practices.md` (22-61行) - 推荐的项目结构
- `.claude/reference/supabase-integration.md` (19-81行) - Supabase 客户端设置
- `src/lib/supabase.ts` - 现有 Supabase 客户端实现（需要迁移）
- `src/services/groq.ts` - Groq API 服务（需要迁移）
- `src/services/supabase.ts` - Supabase 服务层（需要迁移）
- `src/services/hotzone.ts` - Hotzone 服务（需要迁移）
- `src/utils/audio.ts` - 音频工具（需要迁移）
- `supabase/migrations/` - 数据库迁移文件（需要保留）

### 要创建的新文件
- `package.json` - 项目配置和依赖
- `tsconfig.json` - TypeScript 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `postcss.config.mjs` - PostCSS 配置
- `next.config.mjs` - Next.js 配置
- `.env.example` - 环境变量模板
- `.eslintrc.json` - ESLint 配置
- `.prettierrc` - Prettier 配置
- `src/app/layout.tsx` - 根布局
- `src/app/page.tsx` - 首页
- `src/app/api/groq-proxy/route.ts` - Groq API 代理
- `src/lib/supabase/client.ts` - Supabase 客户端客户端
- `src/lib/supabase/server.ts` - Supabase 服务端客户端
- `src/lib/supabase/middleware.ts` - Supabase 中间件

### 相关文档 实施前应该阅读这些！

- [Next.js 文档 - 创建项目](https://nextjs.org/docs/app/api-reference/create-next-app)
  - 原因：了解 create-next-app 的选项和最佳实践
- [Next.js App Router 文档](https://nextjs.org/docs/app)
  - 原因：理解新的路由系统和目录结构
- [Supabase Next.js 集成指南](https://supabase.com/docs/guides/with-nextjs)
  - 原因：了解如何在 Next.js 中正确配置 Supabase
- [Tailwind CSS Next.js 指南](https://tailwindcss.com/docs/guides/nextjs)
  - 原因：正确配置 Tailwind CSS
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
  - 原因：了解 Zustand 状态管理库的使用

### 要遵循的模式

**项目结构**（参考 `.claude/reference/nextjs-best-practices.md:22-61`）：
```
src/
├── app/              # App Router
│   ├── (auth)/       # 路由组
│   ├── (dashboard)/  # 路由组
│   ├── api/          # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── player/
│   ├── hotzone/
│   └── shared/
├── lib/
│   ├── supabase/     # Supabase 客户端
│   └── utils.ts
├── services/         # 业务逻辑服务
├── stores/           # Zustand stores
├── hooks/            # 自定义 hooks
├── types/            # TypeScript 类型
└── middleware.ts
```

**Supabase 客户端模式**（参考 `.claude/reference/supabase-integration.md:38-81`）：
- 使用 `@supabase/ssr` 包
- 分离客户端和服务端客户端
- 客户端：`createBrowserClient()`
- 服务端：`createServerClient()` with cookies

**环境变量命名**（参考 `CLAUDE.md:146-162` 和 `PROGRESS.md:145-162`）：
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥
- `GROQ_API_KEY` - Groq API 密钥
- `PODCAST_INDEX_KEY` - Podcast Index 密钥
- `PODCAST_INDEX_SECRET` - Podcast Index 密钥

**错误处理模式**（参考 `src/services/groq.ts:28-49`）：
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error (${response.status}): ${errorText}`)
  }
  return data
} catch (error) {
  console.error("Operation failed:", error)
  throw error
}
```

---

## 实施计划

### 阶段 1：初始化 Next.js 项目

**任务：**

- 使用 `npx create-next-app@latest` 创建项目
- 选择 TypeScript、ESLint、Tailwind CSS、App Router
- 配置项目基础设置

### 阶段 2：配置开发工具

**任务：**

- 配置 Prettier
- 更新 ESLint 规则
- 配置 TypeScript 路径别名
- 设置 .gitignore

### 阶段 3：设置 Supabase 客户端

**任务：**

- 安装 Supabase 依赖
- 创建客户端和服务端客户端
- 设置中间件
- 配置环境变量模板

### 阶段 4：迁移现有代码

**任务：**

- 迁移服务层代码到新结构
- 迁移工具函数
- 迁移类型定义
- 创建 API 路由（Groq 代理等）

### 阶段 5：创建基础页面和组件

**任务：**

- 创建根布局
- 创建首页
- 创建基础组件结构
- 设置 Zustand store

---

## 分步任务

重要：按顺序执行每个任务，从上到下。每个任务都是原子的且可独立测试。

### CREATE 初始化 Next.js 项目
- **IMPLEMENT**: 在项目根目录运行 `npx create-next-app@latest . --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*"`
- **PATTERN**: Next.js 官方推荐（[Next.js 文档](https://nextjs.org/docs/app/api-reference/create-next-app)）
- **IMPORTS**: 无
- **GOTCHA**: 使用 `--no-src-dir` 选项，因为项目已经有 `src/` 目录结构，需要手动组织。如果 create-next-app 创建了自己的 src 目录，需要调整。
- **VALIDATE**: `ls -la` 确认 package.json、tsconfig.json、next.config.mjs 已创建

### CREATE Prettier 配置
- **IMPLEMENT**: 创建 `.prettierrc` 文件，包含标准 Prettier 配置
- **PATTERN**: 标准前端项目配置
- **IMPORTS**: 无
- **GOTCHA**: 确保与 ESLint 规则兼容
- **VALIDATE**: `cat .prettierrc` 确认文件存在

### UPDATE ESLint 配置
- **IMPLEMENT**: 更新 `.eslintrc.json`，添加 Next.js 和 TypeScript 规则
- **PATTERN**: Next.js 默认配置
- **IMPORTS**: 无
- **GOTCHA**: 确保 `@typescript-eslint` 规则正确配置
- **VALIDATE**: `npx eslint . --max-warnings 0` 确认无 ESLint 错误

### UPDATE tsconfig.json 路径别名
- **IMPLEMENT**: 在 `tsconfig.json` 中添加路径别名配置
- **PATTERN**: `@/*` 指向 `./src/*` 或 `./`（取决于项目结构）
- **GOTCHA**: 如果使用 `--no-src-dir`，需要指向 `./`，否则指向 `./src/*`
- **VALIDATE**: `npx tsc --noEmit` 确认类型检查通过

### CREATE 环境变量模板
- **IMPLEMENT**: 创建 `.env.example` 文件，包含所有必需的环境变量
- **PATTERN**: 参考 `PROGRESS.md:145-162`
- **GOTCHA**: 区分公开变量（`NEXT_PUBLIC_`）和私有变量
- **VALIDATE**: `cat .env.example` 确认所有变量都在

### MIGRATE 更新 .gitignore
- **IMPLEMENT**: 合并现有的 `.gitignore` 和 create-next-app 生成的 `.gitignore`
- **PATTERN**: 标准的 Node.js 和 Next.js 忽略规则
- **GOTCHA**: 确保不删除现有的自定义忽略规则
- **VALIDATE**: `cat .gitignore` 确认包含 `.env`、`.next/`、`node_modules/`

### INSTALL 安装 Supabase 依赖
- **IMPLEMENT**: 运行 `npm install @supabase/supabase-js @supabase/ssr`
- **PATTERN**: 参考 `.claude/reference/supabase-integration.md:22-25`
- **IMPORTS**: 无
- **GOTCHA**: `@supabase/ssr` 是 Next.js SSR 支持所需的
- **VALIDATE**: `npm list @supabase/supabase-js @supabase/ssr` 确认安装成功

### INSTALL 安装 Zustand
- **IMPLEMENT**: 运行 `npm install zustand`
- **PATTERN**: 参考 `PROGRESS.md:91`
- **IMPORTS**: 无
- **GOTCHA**: 无
- **VALIDATE**: `npm list zustand` 确认安装成功

### CREATE Supabase 客户端客户端
- **IMPLEMENT**: 创建 `src/lib/supabase/client.ts`，使用 `createBrowserClient()`
- **PATTERN**: 参考 `.claude/reference/supabase-integration.md:38-47`
- **IMPORTS**: `createBrowserClient` from `@supabase/ssr`
- **GOTCHA**: 必须导出函数而非实例，以支持 SSR
- **VALIDATE**: `cat src/lib/supabase/client.ts` 确认函数存在

### CREATE Supabase 服务端客户端
- **IMPLEMENT**: 创建 `src/lib/supabase/server.ts`，使用 `createServerClient()` 和 cookies
- **PATTERN**: 参考 `.claude/reference/supabase-integration.md:51-81`
- **IMPORTS**: `createServerClient` from `@supabase/ssr`, `cookies` from `next/headers`
- **GOTCHA**: 服务端客户端需要处理 cookie 设置错误（在服务端组件中可能失败）
- **VALIDATE**: `npx tsc --noEmit src/lib/supabase/server.ts` 确认类型正确

### DELETE 旧的 Supabase 客户端文件
- **IMPLEMENT**: 删除 `src/lib/supabase.ts`（已迁移到新结构）
- **PATTERN**: 清理旧代码
- **IMPORTS**: 无
- **GOTCHA**: 确保新客户端已创建且工作正常
- **VALIDATE**: `! test -f src/lib/supabase.ts` 确认文件已删除

### CREATE Supabase 中间件
- **IMPLEMENT**: 创建 `src/middleware.ts`，配置 Supabase 认证中间件
- **PATTERN**: 参考 [Supabase Next.js 认证](https://supabase.com/docs/guides/auth/server-side/next-js)
- **IMPORTS**: `createServerClient` from `@supabase/ssr`, `NextResponse`, `NextRequest` from `next/server`
- **GOTCHA**: 中间件需要正确处理 cookie 的获取和设置
- **VALIDATE**: `npx tsc --noEmit src/middleware.ts` 确认类型正确

### MIGRATE 服务层代码
- **IMPLEMENT**: 将 `src/services/` 下的文件迁移到新结构，更新导入路径
- **PATTERN**: 参考现有代码结构，保持逻辑不变
- **IMPORTS**: 更新为从 `@/lib/supabase/client` 或 `@/lib/supabase/server` 导入
- **GOTCHA**: 根据使用场景选择正确的客户端（服务端组件用 server，客户端组件用 client）
- **VALIDATE**: `npx tsc --noEmit src/services/` 确认服务层无类型错误

### MIGRATE 工具函数
- **IMPLEMENT**: 将 `src/utils/` 下的文件迁移到新结构，更新导入路径
- **PATTERN**: 保持函数逻辑不变，仅更新导入路径
- **IMPORTS**: 更新为使用新的项目路径别名
- **GOTCHA**: 音频工具可能需要在客户端使用，注意浏览器 API 限制
- **VALIDATE**: `npx tsc --noEmit src/utils/` 确认工具函数无类型错误

### CREATE 统一的 types 文件
- **IMPLEMENT**: 创建 `src/types/index.ts`，集中管理所有 TypeScript 类型定义
- **PATTERN**: 参考 `src/lib/supabase.ts:24-59` 中的类型定义
- **IMPORTS**: 无
- **GOTCHA**: 确保 Anchor、Hotzone、TranscriptSegment 等类型都被包含
- **VALIDATE**: `npx tsc --noEmit src/types/index.ts` 确认类型定义正确

### CREATE API 路由 - Groq 代理
- **IMPLEMENT**: 创建 `src/app/api/groq-proxy/route.ts`，实现 Groq API 代理
- **PATTERN**: 参考 `src/services/groq.ts:6-50` 中的 API 调用逻辑
- **IMPORTS**: `NextRequest`, `NextResponse` from `next/server`
- **GOTCHA**: API 路由需要处理 CORS，设置正确的响应头
- **VALIDATE**: `npx tsc --noEmit src/app/api/groq-proxy/route.ts` 确认类型正确

### CREATE API 路由 - Hotzones
- **IMPLEMENT**: 创建 `src/app/api/hotzones/route.ts`，实现热区的 CRUD 操作
- **PATTERN**: 参考 `.claude/reference/supabase-integration.md:268-303` 中的 API 路由模式
- **IMPORTS**: `NextRequest`, `NextResponse` from `next/server`, 服务层函数
- **GOTCHA**: 实现所有必要的 HTTP 方法（GET、POST、PUT、DELETE）
- **VALIDATE**: `npx tsc --noEmit src/app/api/hotzones/route.ts` 确认类型正确

### CREATE Zustand Store - Player
- **IMPLEMENT**: 创建 `src/stores/playerStore.ts`，实现播放器状态管理
- **PATTERN**: 参考 `.claude/reference/nextjs-best-practices.md:218-243`
- **IMPORTS**: `create` from `zustand`
- **GOTCHA**: Store 结构应包含 currentTime、isPlaying、audioUrl、duration 等状态
- **VALIDATE**: `npx tsc --noEmit src/stores/playerStore.ts` 确认类型正确

### CREATE 根布局
- **IMPLEMENT**: 更新或创建 `src/app/layout.tsx`，设置全局布局
- **PATTERN**: 参考 `.claude/reference/nextjs-best-practices.md:91-106`
- **IMPORTS**: `Inter` font from `next/font/google`, 现有布局组件（如果有）
- **GOTCHA**: 确保使用正确的 `html` 和 `body` 标签结构
- **VALIDATE**: `npm run build` 确认构建成功

### CREATE 首页
- **IMPLEMENT**: 更新或创建 `src/app/page.tsx`，设置首页内容
- **PATTERN**: 可以暂时使用占位内容，后续会实现真正的 landing page
- **IMPORTS**: 无
- **GOTCHA**: 确保页面是服务端组件（默认）或正确标记客户端组件
- **VALIDATE**: `npm run build` 确认构建成功

### CREATE 组件目录结构
- **IMPLEMENT**: 创建 `src/components/` 下的子目录：`ui/`、`player/`、`hotzone/`、`shared/`
- **PATTERN**: 参考 `.claude/reference/nextjs-best-practices.md:42-56`
- **IMPORTS**: 无
- **GOTCHA**: 创建 `index.ts` 文件导出所有组件，方便导入
- **VALIDATE**: `ls -la src/components/` 确认目录结构正确

### UPDATE 更新服务层导入路径
- **IMPLEMENT**: 更新所有服务文件中的 Supabase 导入，使用新的客户端结构
- **PATTERN**: 使用 `import { createClient } from '@/lib/supabase/client'` 或 `server`
- **IMPORTS**: 无（更新现有导入）
- **GOTCHA**: 根据使用场景选择正确的客户端（服务端用 server，客户端用 client）
- **VALIDATE**: `npx tsc --noEmit` 确认所有导入路径正确

### VERIFY 运行开发服务器
- **IMPLEMENT**: 运行 `npm run dev` 启动开发服务器
- **PATTERN**: Next.js 标准开发流程
- **IMPORTS**: 无
- **GOTCHA**: 确认端口 3000 可用，或检查终端输出确认实际端口
- **VALIDATE**: 访问 `http://localhost:3000` 确认页面正常加载

---

## 测试策略

### 单元测试

暂不实施单元测试，优先完成项目初始化。后续任务会添加测试。

### 集成测试

- 启动开发服务器并访问首页
- 检查 API 路由是否可访问
- 测试 Supabase 客户端是否正确初始化

### 边缘情况

- 环境变量缺失时的错误处理
- Supabase 连接失败时的降级处理
- 浏览器和服务端的客户端切换

---

## 验证命令

执行每个命令以确保零回归和 100% 功能正确性。

### 级别 1：语法与样式

```bash
# ESLint 检查
npm run lint

# Prettier 检查
npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

# TypeScript 类型检查
npx tsc --noEmit
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

1. 访问 `http://localhost:3000` 确认首页加载
2. 访问 `http://localhost:3000/api/hotzones` 确认 API 路由响应
3. 检查浏览器控制台无错误
4. 检查服务器终端无错误或警告

### 级别 5：依赖验证

```bash
# 确认所有依赖正确安装
npm list --depth=0

# 确认 TypeScript 版本
npm list typescript

# 确认 Next.js 版本
npm list next
```

---

## 验收标准

- [ ] Next.js 15 项目成功初始化
- [ ] TypeScript 配置正确，类型检查通过
- [ ] Tailwind CSS 配置正确，样式正常工作
- [ ] ESLint 和 Prettier 配置正确
- [ ] Supabase 客户端正确设置（客户端和服务端）
- [ ] 现有服务层代码成功迁移
- [ ] API 路由正确实现
- [ ] Zustand store 正确设置
- [ ] 开发服务器可以正常启动
- [ ] 生产构建成功
- [ ] 所有验证命令通过
- [ ] 环境变量模板完整

---

## 完成后：更新 PROGRESS.md

执行完成后，必须更新 PROGRESS.md：

1. 将任务从"待办事项"移至"已完成的工作"
2. 添加完成日期和简要描述
3. 更新"最后更新"和"更新者"

**示例**：
```markdown
### 2026-03-08: 初始化 Next.js 项目
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 使用 npx create-next-app 创建 Next.js 15 项目，配置 TypeScript、Tailwind CSS、ESLint、Prettier，设置 Supabase 客户端和 API 路由
```

---

## 完成清单

- [ ] 所有任务按顺序完成
- [ ] 每个任务验证立即通过
- [ ] 所有验证命令成功执行
- [ ] 开发服务器正常启动
- [ ] 生产构建成功
- [ ] 无 lint 或类型检查错误
- [ ] 手动测试确认功能工作
- [ ] 所有验收标准都满足
- [ ] 代码已审查质量和可维护性
- [ ] PROGRESS.md 已更新

---

## 注意事项

1. **项目结构冲突**：如果 create-next-app 创建了自己的 `src/` 目录，需要手动合并现有的 `src/` 内容。建议使用 `--no-src-dir` 选项，然后手动组织现有代码。

2. **环境变量安全**：`.env.example` 不应包含真实的 API 密钥，仅提供变量名和示例值。

3. **Supabase 客户端**：必须区分客户端和服务端客户端，在正确的场景使用正确的客户端。

4. **浏览器 API 限制**：音频处理等需要浏览器 API 的功能必须在客户端组件中实现。

5. **Git 提交**：完成初始化后，建议创建初始提交。可以使用 `/commit` 命令创建标准化的提交。

6. **数据库迁移**：`supabase/migrations/` 目录已经存在，需要确保新项目结构能够正确访问和应用这些迁移。
