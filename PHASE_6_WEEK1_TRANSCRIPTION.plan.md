# Phase 6 Week 1：转录质量优化 — 执行计划

> **目标**：实现转录来源标记 + 多模型置信度评分
> **周期**：5 个工作日
> **交付物**：转录质量评分系统 + 来源标记 UI

---

## 🎯 本周目标

### 1.1 官方转录识别与优先级 ✅
- [ ] RSS 解析时标记转录来源（official / groq / user）
- [ ] 数据库 hotzones 表添加 `transcript_source` 字段
- [ ] 播放器 UI 显示转录来源图标
- [ ] 复盘页面按来源过滤

### 1.2 多模型转录对比 ✅
- [ ] 集成 OpenAI Whisper API（备选）
- [ ] 实现相似度对比逻辑（Levenshtein distance）
- [ ] 数据库添加 `transcript_confidence` 字段
- [ ] UI 显示置信度指示（绿/黄/红）

### 1.3 转录缓存优化 ✅
- [ ] 计算音频片段内容哈希（MD5）
- [ ] 改进缓存键策略
- [ ] 设置缓存过期时间

---

## 📋 详细任务分解

### Task 1.1.1：数据库 Schema 更新
**时间**：0.5 day
**文件**：`src/services/supabase.ts`

```sql
-- 添加字段到 hotzones 表
ALTER TABLE hotzones ADD COLUMN transcript_source TEXT DEFAULT 'groq';
-- 值：'official' | 'groq' | 'user'

ALTER TABLE hotzones ADD COLUMN transcript_confidence INT DEFAULT 100;
-- 值：0-100，表示置信度百分比
```

**代码变更**：
- [ ] 更新 `Hotzone` 类型定义（`src/types/simpod.ts`）
- [ ] 更新 `saveHotzone` 函数，保存 `transcript_source` 和 `transcript_confidence`
- [ ] 更新 `fetchHotzones` 函数，返回这两个字段

---

### Task 1.1.2：RSS 解析时标记来源
**时间**：1 day
**文件**：`src/lib/rss-parser-v2.ts`

**逻辑**：
```typescript
// 在 parseEpisodes 中
if (episode.podcast_transcript) {
  // 官方转录
  transcript_source = 'official'
  transcript_confidence = 100
} else {
  // Groq 转录（后续生成）
  transcript_source = 'groq'
  transcript_confidence = 85  // 默认置信度
}
```

**代码变更**：
- [ ] 在 `parseEpisodes` 中检测 `podcast:transcript` 命名空间
- [ ] 标记 `transcript_source = 'official'`
- [ ] 返回 `transcript_source` 信息

---

### Task 1.1.3：播放器 UI 显示来源
**时间**：1 day
**文件**：`src/components/transcript/TranscriptStream.tsx`

**UI 设计**：
```
转录来源指示：
✓ 官方转录  (绿色)
⚡ Groq 转录 (蓝色)
✏️ 用户编辑  (灰色)
```

**代码变更**：
- [ ] 在 TranscriptStream 顶部添加来源徽章
- [ ] 根据 `transcript_source` 显示不同图标和颜色
- [ ] 添加 tooltip 说明来源含义

---

### Task 1.2.1：集成 OpenAI Whisper API
**时间**：1.5 day
**文件**：`src/services/groq.ts` → 新建 `src/services/transcription.ts`

**步骤**：
1. 添加 OpenAI API key 到环境变量
2. 创建 `transcribeWithOpenAI` 函数
3. 创建 `compareTranscriptions` 函数（计算相似度）

**代码框架**：
```typescript
// src/services/transcription.ts

export async function transcribeWithOpenAI(audioBuffer: ArrayBuffer): Promise<string> {
  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: formData
  })

  const data = await response.json()
  return data.text
}

export function calculateSimilarity(text1: string, text2: string): number {
  // Levenshtein distance 实现
  const distance = levenshteinDistance(text1, text2)
  const maxLength = Math.max(text1.length, text2.length)
  return Math.round((1 - distance / maxLength) * 100)
}

function levenshteinDistance(s1: string, s2: string): number {
  // 标准 Levenshtein 算法
  // ...
}
```

---

### Task 1.2.2：多模型对比逻辑
**时间**：1 day
**文件**：`src/services/hotzone.ts`

**流程**：
```
1. 用户 MARK → 生成热区
2. 切片音频
3. 用 Groq 转录 → 获得 text1
4. 用 OpenAI 转录 → 获得 text2
5. 计算相似度 → confidence = similarity
6. 保存 hotzone，记录 confidence
```

**代码变更**：
- [ ] 在 `processAnchorsToHotzones` 中添加多模型对比逻辑
- [ ] 如果相似度 < 70%，标记为"需人工审核"
- [ ] 保存 `transcript_confidence` 到数据库

---

### Task 1.2.3：UI 显示置信度
**时间**：0.5 day
**文件**：`src/components/hotzones/HotzoneSidebar.tsx`

**UI 设计**：
```
热区卡片：
┌─────────────────────┐
│ 5:10 - 5:19         │
│ "One, two, two..."  │
│ 置信度: ████░░░░░░ 85% │  ← 绿色
└─────────────────────┘

置信度 > 90%：绿色 ✓
置信度 70-90%：黄色 ⚠️
置信度 < 70%：红色 ✗ (需人工审核)
```

**代码变更**：
- [ ] 在 HotzoneCard 中添加置信度进度条
- [ ] 根据置信度显示不同颜色
- [ ] 添加 tooltip 说明

---

### Task 1.3.1：内容哈希缓存
**时间**：1 day
**文件**：`src/services/supabase.ts`

**逻辑**：
```typescript
// 计算音频片段哈希
const audioHash = md5(audioBuffer)
const cacheKey = `transcript_${audioHash}_${timestamp}`

// 查询缓存
const cached = await supabase
  .from('transcript_cache')
  .select('*')
  .eq('hash', audioHash)
  .single()

if (cached && !isExpired(cached.created_at)) {
  return cached.text  // 命中缓存
}

// 未命中，调用 API
const text = await transcribeWithGroq(audioBuffer)
await saveToCache(audioHash, text)
return text
```

**代码变更**：
- [ ] 创建 `transcript_cache` 表（hash, text, created_at, expires_at）
- [ ] 实现 `calculateAudioHash` 函数
- [ ] 实现 `getCachedTranscript` 和 `saveTranscriptCache` 函数
- [ ] 在 `processAnchorsToHotzones` 中使用缓存

---

## 🧪 测试计划

### 单元测试
- [ ] `levenshteinDistance` 函数测试
- [ ] `calculateSimilarity` 函数测试
- [ ] `calculateAudioHash` 函数测试

### 集成测试
- [ ] 官方转录识别测试（找 3+ 个支持官方转录的播客）
- [ ] 多模型对比测试（同一音频用 Groq + OpenAI 转录，对比相似度）
- [ ] 缓存命中测试（同一音频第二次转录应该从缓存返回）

### 手动测试
- [ ] 播放器显示转录来源图标
- [ ] 复盘页面显示置信度指示
- [ ] 置信度 < 70% 的热区标记为"需人工审核"

---

## 📊 验收标准

| 任务 | 完成标准 |
|------|---------|
| 1.1 官方转录识别 | 播放器正确显示来源图标，复盘页面可按来源过滤 |
| 1.2 多模型对比 | 相似度计算准确，置信度显示正确 |
| 1.3 缓存优化 | 缓存命中率 > 80%，API 调用减少 30% |

---

## 🚀 下周预告

**Week 2：泛听体验优化**
- 后台播放稳定性
- 倍速播放优化
- 音量归一化
- 播放流畅性

---

**版本**：1.0
**创建日期**：2026-03-18
**预计完成**：2026-03-22
