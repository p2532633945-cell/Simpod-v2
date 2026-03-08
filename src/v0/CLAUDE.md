# Simpod Developer Guide

> **重要提示**：这是项目的"单一事实来源"(SSOT)。在开始任何开发任务前，请先阅读本文档。
>
> **新工作流系统**：本项目采用系统化的开发工作流，详见 [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)。

---

## 快速开始

### 首次开发？请按顺序阅读

1. **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** - 了解我们的工作流程和命令系统
2. **本文档** - 技术规则、架构和约定
3. **[PROGRESS.md](PROGRESS.md)** - ⭐ 项目开发进度跟踪（多工具协作必读）
4. **[ACTION_GUIDE.md](ACTION_GUIDE.md)** - 当前开发任务和下一步计划
5. **[.claude/PRD.md](.claude/PRD.md)** - 产品需求（如已创建）

### 标准开发流程

```
用户：/prime                    # 加载项目上下文
     ↓
用户：/plan-feature "功能描述"  # 创建实施计划
     ↓
用户：/execute 计划文件          # 执行实施
     ↓
用户：/validate                # 验证质量
     ↓
用户：/commit "提交信息"        # 标准化提交
```

---

## 工作流命令参考

### 基础命令

| 命令 | 用途 | 何时使用 |
|------|------|----------|
| `/prime` | 加载项目上下文 | 新对话、恢复工作 |
| `/create-prd` | 创建产品需求文档 | 项目初期、功能规划 |
| `/plan-feature` | 创建实施计划 | 开发新功能、重构 |
| `/execute` | 执行计划 | 规划完成后 |
| `/validate` | 验证代码 | 提交前、开发完成 |
| `/commit` | 标准化提交 | 任何需要提交的更改 |

### 命令位置

所有命令位于 `.claude/commands/` 目录：
- `create-prd.md` - PRD 生成
- `core_piv_loop/` - 核心 PIV 循环（prime、plan、execute）
- `validation/` - 验证命令
- `commit.md` - Git 提交

---

## 进度跟踪（多工具协作）

### PROGRESS.md 文件

**用途**：项目开发进度跟踪和多 AI 工具协作的同步文档。

#### 为什么需要 PROGRESS.md？

当你使用多个 AI 工具时（Claude Code、Antigravity、Roo Code），每个工具可能在不同的会话中工作，无法共享上下文。PROGRESS.md 作为"进度事实来源"，确保：

- ✅ 不同工具之间共享最新的项目状态
- ✅ 避免重复已完成的工作
- ✅ 保持任务优先级清晰
- ✅ 记录技术决策和问题

#### 何时更新 PROGRESS.md？

**必须在以下情况更新**：

1. **完成任何功能或任务后**
2. **开始新任务前**（先读取当前状态）
3. **遇到阻塞问题时**（记录到"已知问题"）
4. **做出技术决策时**（记录到"技术决策记录"）
5. **更改分支或阶段时**

#### 如何使用 PROGRESS.md？

**读取（任务开始前）**：
```markdown
在任何任务开始前，先阅读 PROGRESS.md 了解：
- 当前项目阶段
- 已完成的工作
- 待办事项优先级
- 已知问题
```

**更新（任务完成后）**：
```markdown
# 更新模板示例

### 2026-03-07: 初始化 Next.js 项目
**状态**: ✅ 已完成
**更新者**: Claude Code
**描述**: 使用 npx create-next-app 创建项目基础结构
```

#### PROGRESS.md 内容结构

| 章节 | 内容 |
|------|------|
| 当前状态 | 项目阶段、当前分支、更新信息 |
| 已完成的工作 | 已完成的功能和任务清单 |
| 进行中的任务 | 当前正在开发的功能 |
| 待办事项 | 按优先级排序的任务列表 |
| 技术栈确认 | 技术选择和版本 |
| 已知问题 | 当前存在的问题和解决状态 |
| 技术决策记录 | 重要的技术决策和理由 |

#### AI 工具协作规则

**对于任何 AI 工具**：

1. **任务开始前**：
   ```
   → 阅读 PROGRESS.md 获取最新状态
   → 确认要处理的任务在待办事项中
   ```

2. **任务完成后**：
   ```
   → 将任务从"待办事项"移动到"已完成的工作"
   → 更新"最后更新"和"更新者"
   → 添加简要的任务描述
   ```

3. **遇到问题时**：
   ```
   → 在"已知问题"部分记录
   → 描述问题、原因和可能的解决方案
   ```

4. **做出决策时**：
   ```
   → 在"技术决策记录"部分添加
   → 说明决策、理由和影响
   ```

#### 关键原则

1. **保持同步**：每次完成任务后立即更新
2. **保持简洁**：用简单标记（✅、🔥、⚡）表示状态
3. **保持准确**：不要重复记录已完成的工作
4. **保持协作**：所有工具都应该遵守更新规则

---

## Section 1: Project Overview

### Product Vision

Simpod is a podcast learning platform focused on **English extensive listening and podcast study**. The core user flow is:

> **"盲听插锚 → AI智能热区 → 批量复盘"**
>
> Blind listening anchor placement → AI smart hotzones → Batch review

### Core Value Proposition

- **Minimal interruption**: Users can place anchors during continuous listening without pausing
- **AI-powered**: Automatically transcribes and contextualizes highlighted segments
- **Batch processing**: Review all highlights in a focused session
- **Cost-optimized**: Shared transcript caching reduces API costs

### Target Users

- **Efficient learners**: People who want to extract value from podcasts efficiently
- **Podcast content learners**: Users studying content through podcasts
- **Advanced language users**: High-level English learners seeking targeted practice

### Key Concepts

| Term | Definition |
|------|------------|
| **Anchor** | A timestamp marker placed by user or automatically detected |
| **Hotzone** | A time-based audio segment (±10s around anchor) with transcribed content |
| **Transcript** | Shared cached transcription data to avoid redundant API calls |
| **audio_id** | Unique identifier for a podcast episode or audio file |

---

## Section 2: Development Guidelines

### 2.1 Code Organization

```
src/
├── lib/              # Core library functions
│   ├── supabase.ts   # Database client setup
│   └── groq.ts       # Groq API integration
├── services/          # Business logic services
│   ├── groq.ts       # Groq transcription
│   ├── supabase.ts   # Database operations
│   └── hotzone.ts    # Hotzone processing
├── utils/             # Utility functions
│   └── audio.ts      # Audio slicing with Web Audio API
├── components/        # UI components (legacy - to be replaced)
└── types.ts           # TypeScript type definitions
```

### 2.2 TypeScript Type Conventions

- Use explicit types for all function parameters and return values
- Define types in `src/types.ts` or inline for single-use cases
- Use discriminated unions for state management
- Keep type definitions close to their usage

### 2.3 Database Interaction Patterns

**Supabase Client Setup:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Common Patterns:**

1. **Insert:**
```typescript
const { data, error } = await supabase
  .from('hotzones')
  .insert(hotzone)
  .select()
  .single();
```

2. **Upsert (Insert or Update):**
```typescript
const { data, error } = await supabase
  .from('hotzones')
  .upsert(payload, { onConflict: 'id' })
  .select()
  .single();
```

3. **Query with Filter:**
```typescript
const { data, error } = await supabase
  .from('hotzones')
  .select('*')
  .eq('audio_id', audioId)
  .order('start_time', { ascending: true });
```

4. **Error Handling:**
```typescript
if (error) {
  console.error('Error saving hotzone:', error);
  throw error;
}
return data;
```

### 2.4 Schema Compatibility Notes

**Important:** The `transcript_words` field was moved from top-level to `metadata.transcript_words`.

**When Saving:**
```typescript
// Move transcript_words to metadata before saving
if (payload.transcript_words) {
  payload.metadata = { ...payload.metadata, transcript_words: payload.transcript_words };
  delete payload.transcript_words;
}
```

**When Fetching:**
```typescript
// Pull transcript_words from metadata for UI
return data.map(hz => {
  if (hz.metadata?.transcript_words) {
    return { ...hz, transcript_words: hz.metadata.transcript_words };
  }
  return hz;
});
```

### 2.5 API Proxy Patterns

When implementing API proxies in v2, follow these patterns:

**CORS Headers:**
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') return res.status(200).end();
```

**Streaming Responses:**
```typescript
upstreamResponse.pipe(res);
req.pipe(upstreamRequest);
```

**Error Handling:**
```typescript
try {
  // API logic
} catch (error: any) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
}
```

---

## Section 3: Key Functions Reference

### 3.1 Groq Service (`src/services/groq.ts`)

#### `transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>`

Transcribes an audio segment using Groq's Whisper API.

**Parameters:**
- `audioBlob`: WAV audio blob to transcribe

**Returns:**
```typescript
{
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}
```

**Usage:**
```typescript
import { transcribeAudio } from '@/services/groq';

const result = await transcribeAudio(audioSlice);
console.log(result.text); // Transcribed text
console.log(result.words); // Word-level timestamps
```

**Notes:**
- Uses `whisper-large-v3` model
- Requests word-level timestamps
- Communicates via proxy endpoint (`/api/groq-proxy`)

---

### 3.2 Supabase Operations (`src/services/supabase.ts`)

#### `saveHotzone(hotzone: Hotzone): Promise<Hotzone>`

Saves or updates a hotzone in the database.

**Parameters:**
- `hotzone`: Hotzone object (see types)

**Returns:** Saved hotzone object

**Usage:**
```typescript
import { saveHotzone } from '@/services/supabase';

const saved = await saveHotzone({
  id: generateId(),
  audio_id: 'episode-123',
  start_time: 10.5,
  end_time: 30.5,
  transcript_snippet: 'Transcribed text...',
  source: 'manual',
  metadata: { confidence: 0.9 },
  status: 'pending',
  created_at: new Date().toISOString(),
});
```

**Notes:**
- Uses `upsert` (insert or update)
- Moves `transcript_words` to metadata for schema compatibility

---

#### `fetchHotzones(audioId: string): Promise<Hotzone[]>`

Fetches all hotzones for a given audio episode.

**Parameters:**
- `audioId`: Audio episode identifier

**Returns:** Array of hotzones, ordered by start_time

**Usage:**
```typescript
import { fetchHotzones } from '@/services/supabase';

const hotzones = await fetchHotzones('episode-123');
// Returns: Array of hotzones with transcript_words at top-level
```

**Notes:**
- Returns `transcript_words` at top-level (pulled from metadata)
- Ordered by `start_time` ascending

---

#### `findExistingTranscript(audioId: string, startTime: number, endTime: number): Promise<TranscriptSegment | null>`

Looks for a cached transcript that matches the requested time range.

**Parameters:**
- `audioId`: Audio episode identifier
- `startTime`: Start time of requested segment
- `endTime`: End time of requested segment

**Returns:** Matching transcript or `null`

**Usage:**
```typescript
import { findExistingTranscript } from '@/services/supabase';

const existing = await findExistingTranscript('episode-123', 10, 30);
if (existing) {
  // Reuse cached transcript
  console.log(existing.text);
}
```

**Notes:**
- Tolerance: ±1 second
- Returns `null` if no match found

---

#### `saveTranscript(audioId: string, startTime: number, endTime: number, text: string, words: any): Promise<void>`

Saves a transcript to the shared cache.

**Parameters:**
- `audioId`: Audio episode identifier
- `startTime`: Start time of segment
- `endTime`: End time of segment
- `text`: Transcribed text
- `words`: Word-level timestamps

**Usage:**
```typescript
import { saveTranscript } from '@/services/supabase';

await saveTranscript(
  'episode-123',
  10.5,
  30.5,
  'Transcribed text...',
  [{ word: 'Hello', start: 0, end: 0.5 }, ...]
);
```

**Notes:**
- Uses `upsert` with conflict on `(audio_id, start_time, end_time)`
- Errors are logged but not thrown (side-effect optimization)

---

### 3.3 Audio Utilities (`src/utils/audio.ts`)

#### `sliceRemoteAudio(url: string, startTime: number, endTime: number): Promise<Blob>`

Slices a remote audio file by time range.

**Parameters:**
- `url`: Remote audio URL
- `startTime`: Start time in seconds
- `endTime`: End time in seconds

**Returns:** WAV audio blob

**Usage:**
```typescript
import { sliceRemoteAudio } from '@/utils/audio';

const audioSlice = await sliceRemoteAudio(
  'https://example.com/episode.mp3',
  10.5,
  30.5
);
```

**Notes:**
- Fetches from byte 0 to get valid WAV headers
- Uses `/api/audio-proxy` for CORS/range requests
- Decodes with AudioContext
- Re-encodes as WAV

---

#### `sliceAudio(file: File, startTime: number, endTime: number): Promise<Blob>`

Slices a local audio file by time range.

**Parameters:**
- `file`: Local audio file
- `startTime`: Start time in seconds
- `endTime`: End time in seconds

**Returns:** WAV audio blob

**Usage:**
```typescript
import { sliceAudio } from '@/utils/audio';

const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const audioSlice = await sliceAudio(file, 10.5, 30.5);
```

---

### 3.4 Hotzone Pipeline (`src/services/hotzone.ts`)

#### `generateHotzoneFromAnchor(anchor: Anchor, transcript?: TranscriptSegment[]): Hotzone`

Creates a hotzone from an anchor point.

**Parameters:**
- `anchor`: Anchor object
- `transcript`: Optional full transcript for contextual alignment

**Returns:** Hotzone object

**Usage:**
```typescript
import { generateHotzoneFromAnchor } from '@/services/hotzone';

const hotzone = generateHotzoneFromAnchor(
  { id: 'a1', audio_id: 'ep-123', timestamp: 25, source: 'manual', created_at: '...' },
  fullTranscript // Optional
);
// Creates hotzone from ~13s to ~33s (±10s, -2s reaction offset)
```

**Notes:**
- Mechanical: ±10 seconds, -2s reaction offset
- Contextual: Expands to sentence boundaries if transcript available

---

#### `processAnchorsToHotzones(anchors: Anchor[], ...): Promise<Hotzone[]>`

Processes multiple anchors into transcribed hotzones.

**Parameters:**
- `anchors`: Array of anchor objects
- `transcript`: Optional full transcript
- `audioFile`: Optional local audio file
- `audioUrl`: Optional remote audio URL
- `transcriptInfo`: Optional official transcript metadata
- `existingHotzones`: Optional array of existing hotzones (for extension)

**Returns:** Array of processed hotzones

**Usage:**
```typescript
import { processAnchorsToHotzones } from '@/services/hotzone';

const hotzones = await processAnchorsToHotzones(
  anchors,
  fullTranscript,
  undefined,
  'https://example.com/episode.mp3',
  undefined,
  existingHotzones
);
```

**Notes:**
- Filters anchors already covered by existing hotzones
- Detects and extends nearby hotzones
- Merges overlapping new hotzones
- Uses transcript caching
- Refines boundaries using word-level timestamps

---

## Section 4: Environment Variables

### Required Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Groq API (for transcription)
GROQ_API_KEY=gsk_your-groq-api-key
# Alternative: VITE_OPENAI_API_KEY=your-key

# Podcast Index API (for podcast search)
PODCAST_INDEX_KEY=your-podcast-index-key
PODCAST_INDEX_SECRET=your-podcast-index-secret
```

### Variable Descriptions

| Variable | Purpose | Source |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard |
| `GROQ_API_KEY` | Groq API key for transcription | Groq Console |
| `VITE_OPENAI_API_KEY` | Alternative to GROQ_API_KEY | OpenAI Dashboard |
| `PODCAST_INDEX_KEY` | Podcast Index API key | Podcast Index |
| `PODCAST_INDEX_SECRET` | Podcast Index API secret | Podcast Index |

### Getting API Keys

#### Groq
1. Go to https://console.groq.com/
2. Create an account
3. Generate an API key

#### Podcast Index
1. Go to https://podcastindex.org/
2. Register for an API key
3. Get your key and secret

#### Supabase
1. Go to https://supabase.com/
2. Create a new project
3. Get URL and anon key from Settings > API

---

## Section 5: Common Patterns

### 5.1 UUID Generation

Simple UUID generator for client-side use:

```typescript
const generateId = () => Math.random().toString(36).substr(2, 9);
```

### 5.2 RSS Parsing

Use browser's `DOMParser` (preferred over rss-parser):

```typescript
const parser = new DOMParser();
const doc = parser.parseFromString(xmlString, 'application/xml');

// Extract items
const items = doc.querySelectorAll('item');
items.forEach(item => {
  const title = item.querySelector('title')?.textContent;
  const enclosure = item.querySelector('enclosure')?.getAttribute('url');
  // ...
});
```

### 5.3 Word-Level Timestamp Adjustment

When merging transcriptions, adjust timestamps:

```typescript
const adjustedWords = result.words.map(w => ({
  ...w,
  start: globalStartTime + w.start,
  end: globalStartTime + w.end,
}));
```

### 5.4 Hotzone Boundary Refinement

Use first/last word to "magnet" boundaries to speech:

```typescript
if (words && words.length > 0) {
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const newStartTime = hotzoneStart + firstWord.start;
  const newEndTime = hotzoneStart + lastWord.end;

  return { ...hotzone, start_time: newStartTime, end_time: newEndTime };
}
```

---

## Section 6: Data Flow Diagrams

### Podcast Discovery Flow

```
User Search
    ↓
searchPodcasts() → Parallel Search
    ├─→ Podcast Index API (HMAC auth)
    └─→ iTunes API (direct + CORS proxy)
    ↓
Merge + Deduplicate (by feedUrl)
    ↓
Display Results
```

### Transcription Flow

```
User Creates Anchor
    ↓
Generate Hotzone (±10s, -2s offset)
    ↓
Check Existing Hotzones
    ↓
Find Neighbors → Detect Extension
    ↓
Slice Audio (remote/local)
    ↓
Check Transcript Cache
    ├─→ Found → Reuse
    └─→ Not Found → Call Groq API → Save to Cache
    ↓
Save Hotzone
```

---

## Section 7: Testing Guidelines

### 7.1 Unit Testing

Focus on pure functions:
- `generateHotzoneFromAnchor()`
- Audio slicing logic
- Timestamp calculations

### 7.2 Integration Testing

Test with:
- Real Supabase instance (use test project)
- Mock Groq API responses
- Sample RSS feeds
- Sample audio files

### 7.3 E2E Testing

Key user flows:
1. Search for podcast
2. Select episode
3. Create anchor
4. View transcribed hotzone
5. Extend hotzone with new anchor

---

## Section 8: Common Issues and Solutions

### Issue: Transcription Caching Not Working

**Solution:** Check that unique constraint on `transcripts` table:
```sql
CONSTRAINT transcripts_audio_time_unique UNIQUE (audio_id, start_time, end_time)
```

### Issue: Audio Decoding Fails

**Solution:** Ensure you're fetching from byte 0 to get WAV headers:
```typescript
const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
const response = await fetch(proxyUrl, {
  headers: { 'Range': `bytes=0-${endByte}` }
});
```

### Issue: Podcast Index API Returns 401

**Solution:** Verify HMAC SHA1 authentication:
```typescript
const data4Hash = apiKey + apiSecret + apiHeaderTime;
const hash = crypto.createHash('sha1').update(data4Hash).digest('hex');
```

### Issue: Hotzone transcript_words Missing

**Solution:** Remember to move `transcript_words` to `metadata` when saving:
```typescript
payload.metadata = { ...payload.metadata, transcript_words: payload.transcript_words };
delete payload.transcript_words;
```

---

## Section 9: Performance Tips

1. **Use transcript caching** - Always check `transcripts` table before calling Groq
2. **Parallel operations** - Use `Promise.all()` for independent operations
3. **Merge overlapping hotzones** - Reduces transcription count
4. **Index optimization** - Ensure composite index on `(audio_id, start_time, end_time)`

---

## Section 10: Architecture Decisions Rationale

### Why Web Audio API over ffmpeg.wasm?

- **Lighter weight**: No external binary dependencies
- **Browser native**: Works in all modern browsers
- **Sufficient for MVP**: Basic slicing and WAV encoding is enough

### Why Shared Transcript Table?

- **Cost optimization**: Reuse transcriptions across users
- **Performance**: Faster to fetch from database than call API
- **Crowdsourcing**: Users contribute to shared knowledge base

### Why Audio-Centric Data Model?

- **Focus on content**: The app is about podcasts, not users
- **Simpler queries**: All data accessible via `audio_id`
- **Future flexibility**: Easy to add user-specific views later

### Why Hybrid Podcast Search?

- **Coverage**: Podcast Index + iTunes = broader coverage
- **Redundancy**: If one fails, the other works
- **Quality**: Cross-reference results for better quality

---

## Section 11: v2 Migration Notes

When migrating to Simpod v2:

### Keep (Refactor)
- Database schema (apply migrations to new project)
- Core business logic (`src/services/`)
- Transcription caching pattern
- Hotzone extension logic

### Replace
- Build tooling (Vite → Next.js or similar)
- UI components (complete redesign)
- API routes (reimplement patterns in new framework)
- State management (Zustand → new approach)

### Reuse Patterns
- CORS proxy pattern
- Bearer token authentication
- HMAC SHA1 authentication
- Streaming response pattern
- Error handling pattern

---

## Appendix: TypeScript Type Definitions

```typescript
// Anchor
export interface Anchor {
  id: string;
  audio_id: string;
  timestamp: number;
  source: 'manual' | 'auto';
  created_at: string;
}

// Hotzone
export interface Hotzone {
  id: string;
  audio_id: string;
  start_time: number;
  end_time: number;
  transcript_snippet?: string;
  transcript_words?: Array<{ word: string; start: number; end: number }>;
  source: 'manual' | 'auto';
  metadata: {
    confidence?: number;
    difficulty_score?: number;
    user_adjustment_history?: Array<{
      action: string;
      timestamp: string;
    }>;
    transcript_words?: Array<{ word: string; start: number; end: number }>;
  };
  status: 'pending' | 'reviewed' | 'archived';
  created_at: string;
}

// Transcript
export interface TranscriptSegment {
  audio_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

// Podcast
export interface Podcast {
  title: string;
  author: string;
  feedUrl: string;
  artwork: string;
  source?: 'podcastindex' | 'itunes';
}

// Episode
export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  transcriptUrl?: string;
  duration?: number;
}
```

---

## Quick Reference

### Function Locations

| Function | File |
|----------|------|
| `transcribeAudio()` | `src/services/groq.ts` |
| `saveHotzone()` | `src/services/supabase.ts` |
| `fetchHotzones()` | `src/services/supabase.ts` |
| `findExistingTranscript()` | `src/services/supabase.ts` |
| `saveTranscript()` | `src/services/supabase.ts` |
| `sliceRemoteAudio()` | `src/utils/audio.ts` |
| `sliceAudio()` | `src/utils/audio.ts` |
| `generateHotzoneFromAnchor()` | `src/services/hotzone.ts` |
| `processAnchorsToHotzones()` | `src/services/hotzone.ts` |

### Environment Variables

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
GROQ_API_KEY
PODCAST_INDEX_KEY
PODCAST_INDEX_SECRET
```

### Database Tables

- `anchors` - Timestamp markers
- `hotzones` - Transcribed segments
- `transcripts` - Shared cache

---

**Last Updated:** 2026-03-07
**Version:** 2.0 (工作流系统集成)
