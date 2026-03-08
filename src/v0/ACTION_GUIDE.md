# Simpo-v2 开发行动指南 (Action Guide)

> **项目目标**: 用最小的代价和成本，在新的工具链（Antigravity + Roo Code + Claude Code）下，基于legacy项目60%的进度，快速构建一个稳定可用的MVP。

---

## 📋 目录

1. [快速开始 - 当你打开这个项目时](#快速开始)
2. [工具分工 - 三剑客定位](#工具分工)
3. [已完成的迁移工作](#已完成的迁移工作)
4. [下一步任务序列](#下一步任务序列)
5. [项目约束 - 技术栈与架构](#项目约束)
6. [核心功能说明](#核心功能说明)
7. [命令参考](#命令参考)
8. [成本控制策略](#成本控制策略)

---

## 🚀 快速开始

当你第一次在新文件夹中开启 Simpo-v2 开发时，请按以下顺序操作：

### Step 1: 读取项目宪法
```
打开并阅读: CLAUDE.md
```
这是项目的"单一事实来源(SSOT)"，包含所有技术决策、API定义、命名规范。

### Step 2: 检查环境配置
```
检查: .env 文件是否包含所有必需变量
```
已配置:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ GROQ_API_KEY
- ✅ PODCAST_INDEX_KEY
- ✅ PODCAST_INDEX_SECRET

⚠️ **注意**: Supabase的URL和Key需要更新为新的项目值（见下方待办事项）

### Step 3: 创建进度跟踪
```
创建: PROGRESS.md
```
记录当前进度和下一步计划。这是工具间同步的关键。

---

## 🛠️ 工具分工

| 工具 | 角色 | 最佳使用场景 |
|------|------|-------------|
| **Antigravity** | 任务指挥官 (Orchestrator) | 高层规划、环境验证、跨平台自动化测试、外部文档调研 |
| **Roo Code** | IDE 贴身助手 (Co-pilot) | 高频、局部的代码编写与重构、索引代码库并给出精准建议 |
| **Claude Code** | 资深架构师 (Architect) | 顶层设计、解决复杂算法难题、生产级代码审计、生成PRD和技术规范 |

### 使用原则

**不要让工具"打架"**，按场景派发任务：
- 📖 **文档/架构讨论** → Claude Code
- 🎨 **UI组件调整/样式微调** → Roo Code
- 🔄 **重复性代码任务** → 自定义命令脚本
- 🌐 **浏览器自动化/E2E测试** → Antigravity

---

## ✅ 已完成的迁移工作

### 直接复制的文件
- ✅ `.env` - 包含所有API密钥（Supabase、Groq、Podcast Index）
- ✅ `supabase/migrations/` - 数据库迁移脚本
- ✅ `architecture.md` - 技术架构文档
- ✅ `CLAUDE.md` - 开发者指南

### 重构后复制的核心逻辑
- ✅ `src/services/groq.ts` - Groq Whisper API集成
- ✅ `src/services/supabase.ts` - 数据库操作（saveHotzone、fetchHotzones、findExistingTranscript、saveTranscript）
- ✅ `src/services/hotzone.ts` - 热区处理流程
- ✅ `src/utils/audio.ts` - Web Audio API音频切片
- ✅ `src/lib/supabase.ts` - Supabase客户端配置

### 不需要迁移的部分（将重建）
- ❌ UI组件 - 将用v0重新生成
- ❌ API路由 - 将在Next.js中重新实现
- ❌ 状态管理 - 将用Zustand重新实现
- ❌ 构建配置 - 将使用Next.js配置

---

## 📝 下一步任务序列

### Phase 1: 基础设施 (Infrastructure) - 约2小时

#### 1.1 创建新的Supabase项目 ⚠️ 必做

**为什么**: 需要全新的数据库实例

**步骤**:
1. 访问 https://supabase.com/
2. 创建新项目，命名为 `simpo-v2`
3. 记录数据库密码
4. 等待项目创建完成

**在Antigravity中进行**: 可以自动化网页操作并验证

#### 1.2 运行数据库迁移

**使用Claude Code**:
```
提示: "阅读 supabase/migrations/ 目录中的SQL文件，理解表结构，然后指导我如何在新Supabase项目中运行这些迁移。"
```

迁移文件:
- `20250227000000_create_tables.sql` - 创建anchors、hotzones表
- `20260301000000_create_transcripts_table.sql` - 创建transcripts表

#### 1.3 更新.env文件

**获取新凭证**:
1. 进入Supabase Dashboard → Settings → API
2. 复制Project URL和anon key
3. 更新 `.env` 文件

---

### Phase 2: 产品定义 (Product Definition) - 约3小时

#### 2.1 编写PRD v2.0

**使用Claude Code**:
```
提示: "基于legacy项目的经验（参考architecture.md），编写一份清晰的PRD.md。核心功能是'智能回溯'和'热区规划'。明确：
1. 用户故事
2. 核心功能描述（智能回溯、智能热区、播客搜索）
3. 技术约束（Next.js + Zustand + Shadcn/UI）
4. 数据流图
5. 可选功能的优先级"
```

**PRD中必须明确**:
- **智能回溯**: 点击MARK按钮，根据词级时间戳回退到语义段落开头
- **智能热区**: LLM对转录文本评分，重要性高的区域在波形上高亮显示

#### 2.2 更新CLAUDE.md的技术规范

**使用Claude Code**:
```
提示: "基于PRD，更新CLAUDE.md，增加：
1. 状态管理规范（Zustand store结构）
2. API调用规范（如何调用Groq、Supabase）
3. 组件命名规范
4. 事件处理规范（onMark、onPlay、onPause等）"
```

---

### Phase 3: 视觉外壳 (Visual Shell) - 约4小时

#### 3.1 用v0生成UI组件

**使用v0.dev**:
```
提示: "生成Simpod播放器页面UI，风格参考'Simple'。包含：
1. 播放控制组件（播放、暂停、进度条）
2. 转录文本显示区域
3. MARK按钮（用于添加热区）
4. 波形可视化区域（先用占位符）
5. 侧边栏（显示已保存的热区列表）

**约束**:
- 使用Shadcn/UI组件库
- 生成占位符数据用于热区显示
- 在代码中注释出接口定义（如 // TODO: 接入onMark函数）"
```

#### 3.2 组织v0代码

**操作**:
1. 创建 `src/components/v0/` 目录
2. 将v0生成的代码放入
3. 在代码中添加详细的TODO注释

---

### Phase 4: 逻辑移植 (Logic Integration) - 约6小时

#### 4.1 建立状态管理

**使用Roo Code**:
```
提示: "创建 Zustand store，包含：
1. playerStore: { currentTime, isPlaying, audioUrl, duration }
2. hotzoneStore: { hotzones, currentHotzone }
3. transcriptStore: { currentTranscript }

参考CLAUDE.md中的类型定义"
```

文件位置: `src/stores/playerStore.ts`

#### 4.2 接入音频逻辑

**使用Roo Code**:
```
提示: "参考旧项目中的音频播放逻辑，将v0的播放器组件接入真实的音频控制：
1. 连接play/pause按钮到audio元素
2. 实现进度条拖拽跳转
3. 接入音频URL从hotzone数据"

关键文件: src/utils/audio.ts (已迁移)"
```

#### 4.3 实现基础热区创建

**使用Roo Code**:
```
提示: "实现点击MARK按钮时创建机械热区（±10s, -2s偏移）：
1. 调用processAnchorsToHotzones生成热区
2. 调用saveHotzone保存到数据库
3. 更新hotzoneStore状态

参考已迁移的 src/services/hotzone.ts"
```

---

### Phase 5: 智能功能 (Smart Features) - 约8小时

#### 5.1 实现智能回溯 ⭐ 核心难点

**使用Claude Code** (这是复杂逻辑):
```
提示: "实现智能回溯功能：
1. 利用Groq返回的词级时间戳（word-level timestamps）
2. 当点击MARK时，找到当前时间对应最近的词
3. 寻找该词之前的Full Stop（句号、问号等）
4. 跳转到该Full Stop的时间戳

关键挑战: 如何准确定位语义段落边界？是否需要调用LLM进行文本分割？"
```

**可能的突破点**:
- 查找类似 `wavesurfer-regions` 的开源项目参考
- 考虑使用VibeVoice等语义标记模型

#### 5.2 实现智能热区 ⭐ 核心难点

**使用Claude Code**:
```
提示: "实现基于LLM评分的智能热区：
1. 获取转录文本和词级时间戳
2. 调用LLM（Claude 3.5）对文本进行重要性评分或知识点提取
3. 将评分结果映射回音频时间轴
4. 在波形上用不同颜色/阴影高亮显示高重要性区域

API调用: 需要创建一个API endpoint接收文本并返回分段评分"
```

**数据流**:
```
转录文本 → LLM评分 → 时间轴映射 → 波形可视化
```

---

### Phase 6: 播客发现 (Podcast Discovery) - 约4小时

#### 6.1 实现搜索功能

**使用Roo Code**:
```
提示: "实现播客搜索功能：
1. 使用Podcast Index API（HMAC SHA1认证）
2. 同时查询iTunes API
3. 合并并去重结果（按feedUrl）
4. 在搜索页面显示结果

参考architecture.md中的API模式"
```

#### 6.2 实现RSS解析

**使用Roo Code**:
```
提示: "实现RSS feed解析：
1. 选择播客后获取feedUrl
2. 使用DOMParser解析XML
3. 提取episode列表
4. 显示episode选择页面

参考已迁移的API函数"
```

---

## ⚙️ 项目约束

### 技术栈

```
前端框架:    Next.js (推荐，App Router)
样式系统:    Tailwind CSS
UI组件库:   Shadcn/UI
状态管理:    Zustand
动效库:      Framer Motion
数据库:       Supabase (PostgreSQL)
转录服务:    Groq (Whisper-large-v3)
播客搜索:   Podcast Index + iTunes
```

### 强制性规范

#### 代码规范
- ✅ 使用严格TypeScript（no `any`类型）
- ✅ 为所有API调用定义接口
- ✅ 所有函数添加JSDoc注释
- ✅ 错误必须有清晰的错误处理

#### 命名规范
- 组件: PascalCase (如 `AudioPlayer.tsx`)
- 文件夹: kebab-case (如 `audio-player/`)
- 变量/函数: camelCase (如 `currentTime`)
- 常量: UPPER_SNAKE_CASE (如 `MAX_HOTZONE_DURATION`)

#### Git提交规范
```
feat: 新功能
fix: 修复bug
refactor: 重构代码
docs: 文档更新
style: 代码格式调整
test: 测试相关
```

---

## 🎯 核心功能说明

### 智能回溯 (Intelligent Backtracking)

**问题**: 传统回溯只是按固定秒数倒退（如-5s），不准确且打乱语义流

**解决方案**: 利用词级时间戳，回退到语义段落开头

**实现步骤**:
1. 获取Groq返回的 `words` 数组: `[{word, start, end}, ...]`
2. 找到当前播放时间对应的词索引
3. 向前搜索句子结束符（`.`, `!`, `?`, `;`）
4. 跳转到该字符的时间戳

**伪代码**:
```typescript
function findPreviousSentenceStart(currentTime: number, words: Word[]): number {
  const currentWord = words.find(w => w.start <= currentTime && w.end >= currentTime);
  if (!currentWord) return 0;

  // 搜索前面的句子结束符
  for (let i = words.indexOf(currentWord); i >= 0; i--) {
    const word = words[i];
    if (/[.!?;]$/.test(word.word)) {
      return word.end;
    }
  }

  return 0;
}
```

### 智能热区 (Intelligent Hotzones)

**问题**: 机械热区（±10s固定窗口）可能包含过多无关内容

**解决方案**: LLM对转录文本进行语义分析和重要性评分

**实现步骤**:
1. 获取完整转录文本
2. 调用LLM进行段落分割和评分
3. 将高评分段落映射回时间轴
4. 在波形上用视觉层次呈现

**LLM Prompt示例**:
```
分析以下播客转录文本，识别重要的知识点或论述段落。
返回JSON格式: [{"text": "段落内容", "importance": "高/中/低", "start_char": 0, "end_char": 100}]
```

**可视化**:
- 高重要性: 红色波形，高阴影
- 中重要性: 橙色波形
- 低重要性: 蓝色波形

---

## 🔧 命令参考

### 常用命令建议

**Git提交**:
```bash
git add .
git commit -m "feat: 添加播放器基础UI"
```

**依赖安装**:
```bash
npm install zustand framer-motion @supabase/supabase-js
```

**开发服务器**:
```bash
npm run dev
```

**类型检查**:
```bash
npx tsc --noEmit
```

### 推荐的自定义命令

未来可以在 `commands/` 目录中创建脚本:
- `/commit [message]` - 标准化git提交
- `/groq-test` - 测试Groq API连接
- `/audit` - 代码审计

---

## 💰 成本控制策略

### 工具使用优先级

| 任务类型 | 优先工具 | 原因 |
|---------|-----------|------|
| 文档/架构讨论 | **Claude Code** | 深度推理能力强 |
| UI组件编写 | **Roo Code** | 高效，IDE集成 |
| 简单代码重构 | **Roo Code** | 快速迭代 |
| 复杂算法设计 | **Claude Code** | 架构能力强 |
| 浏览器自动化 | **Antigravity** | 自动化测试 |
| 外部文档调研 | **Antigravity** | 节省Token |

### 同步机制

**单一事实来源 (SSOT)**:
- `CLAUDE.md` - 项目宪法，包含所有技术决策
- `PROGRESS.md` - 进度日志，记录完成项和待办项
- `PRD.md` - 产品需求文档

**同步协议**:
1. 每个工具开始任务前: "Read CLAUDE.md"
2. 每个工具结束任务时: "Update PROGRESS.md with current status"
3. 发现架构问题时: "Update CLAUDE.md with new decision"

---

## 📊 进度追踪模板

### PROGRESS.md 建议结构

```markdown
# Simpo-v2 开发进度

## 当前阶段
- 阶段: Phase X - [阶段名称]
- 开始日期: YYYY-MM-DD
- 预计完成: YYYY-MM-DD

## 已完成功能
- [x] 环境配置
- [ ] 数据库迁移
- [ ] PRD编写
- [ ] UI组件生成
- [ ] 状态管理实现
- [ ] 基础热区创建
- [ ] 智能回溯
- [ ] 智能热区
- [ ] 播客搜索
- [ ] RSS解析
- [ ] 部署测试

## 遇到的Blockers
- [ ] 无
- [ ]
```

---

## 🚦 投产比 (Deployment Readiness) 评估

建议设立"三周止损线":

### 纯Vibe Coding的边界信号
- AI连续三次修改未解决同一报错
- 改好一个功能导致其他功能崩溃
- 完全看不懂AI写的复杂算法逻辑

### 触发评估的问题
- 智能回溯算法是否在3天内能跑通？
- 波形可视化是否流畅？
- Supabase RLS权限是否正确配置？

### 何时考虑替代方案
- 如果3周内无法实现核心功能
- 考虑使用开源库替代自行开发
- 参考 `wavesurfer.js`, `media-chrome` 等项目

---

## 📚 参考资源

### 已迁移的核心资产
- `architecture.md` - 完整技术架构
- `CLAUDE.md` - 开发指南
- `MIGRATION_CHECKLIST.md` - 迁移清单

### 待研究的开源项目
- `wavesurfer.js` - 音频波形可视化
- `wavesurfer-regions` - 区域标记
- `media-chrome` - Chrome媒体扩展示例

### API文档
- Groq: https://console.groq.com/docs
- Supabase: https://supabase.com/docs
- Podcast Index: https://podcastindex-org.github.io/docs/

---

## ⚡ 给Claude Code的初始指令模板

当你准备好开始Phase 2（产品定义）时，使用以下指令：

```
Claude, 请基于我们的legacy项目和architecture.md，为Simpo-v2编写一份PRD.md。

核心功能要求:
1. 智能回溯 - 利用词级时间戳，点击MARK时回退到语义段落开头
2. 智能热区 - LLM对转录文本评分，高重要性区域在波形上高亮
3. 播客搜索 - Podcast Index + iTunes混合搜索
4. 热区管理 - 创建、查看、扩展热区

技术约束:
- Next.js + TypeScript + Tailwind CSS
- Zustand状态管理
- Supabase数据库
- Groq API (Whisper-large-v3)

请输出结构清晰、可直接执行的PRD文档。
```

---

## 🎬 总结

**你的心态**: 这是一次"从玩具到作品"的系统化升级，不是重新开始

**核心原则**:
1. 不要丢弃，要"榨干" - legacy项目的60%进度是我们的财富
2. 先立规矩，后写代码 - PRD和CLAUDE.md是导航图
3. 工具各司其职 - 按场景派发，不混用
4. 建立SSOT - CLAUDE.md和PROGRESS.md是单一事实来源

**预期结果**:
- 3-4周后，一个稳定可用的MVP
- 清晰的架构，易于后续迭代
- 掌握新的工作流，为下一个项目打基础

---

**文档版本**: 1.0
**创建日期**: 2026-03-07
**适用于**: Simpo-v2开发阶段
