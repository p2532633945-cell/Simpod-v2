---
name: "Phase 4: 核心 Bug 修复与性能优化"
overview: Simpod v2 第四阶段：修复 Phase 3 遗留的关键 bug（热区重叠、播放状态、用户隔离），然后进行性能优化和 ML 改进。完成后系统稳定可用。
todos:
  - id: p4-0-hotzone-overlap-diag
    content: 诊断热区重叠问题 - 添加详细日志确认数据流
    status: pending
  - id: p4-1-hotzone-isolation-fix
    content: 修复热区 audio_id 隔离 - 确保 fetchHotzones 按 user_id 过滤
    status: pending
  - id: p4-2-playback-state-sync
    content: 修复播放器状态同步 - 进度条和播放按钮跨剧集刷新
    status: pending
  - id: p4-3-user-hotzone-isolation
    content: 修复用户热区隔离 - 确保每个用户只看到自己的热区
    status: pending
  - id: p4-4-buffer-tuning
    content: 调整热区 buffer 值 - 根据实际转录效果优化 2s buffer
    status: pending
  - id: p4-5-performance-opt
    content: 性能优化 - 缓存、查询优化、前端渲染优化
    status: pending
isProject: false
---

# Phase 4: 核心 Bug 修复与性能优化

## 目标
- ✅ 修复热区重叠和用户隔离问题（P0）
- ✅ 修复播放器状态同步问题（P0）
- ✅ 调整热区 buffer 值（P1）
- ✅ 性能优化（P2）

---

## 执行计划

### P4-0: 诊断热区重叠问题（30 分钟）

**症状**：
- 打开任意剧集都显示相同的 2 个热区
- 热区不随 audioId 变化而改变
- 用户 A 的热区在用户 B 账户中也可见

**诊断步骤**：
1. 在 `PodcastPlayerPage.tsx` 的 `loadHotzones` effect 中添加详细日志：
   - 记录 audioId 变化
   - 记录 setHotzones([]) 执行前后的 store 状态
   - 记录 fetchHotzones 返回的数据（包括 audio_id、user_id）
   - 记录 addHotzone 执行次数

2. 在 `services/supabase.ts` 的 `fetchHotzones` 中添加日志：
   - 记录当前用户 ID
   - 记录 SQL 查询条件（audio_id、user_id）
   - 记录返回的热区数量和详情

3. 在浏览器控制台观察日志，确认：
   - [ ] 切换剧集时 audioId 确实改变
   - [ ] setHotzones([]) 确实被调用
   - [ ] fetchHotzones 返回的热区 audio_id 与当前 audioId 匹配
   - [ ] 返回的热区 user_id 与当前登录用户匹配

**关键日志代码**：
```typescript
// PodcastPlayerPage.tsx
console.log('[Player] DIAG: audioId changed to:', audioId)
console.log('[Player] DIAG: Fetched hotzones:', fetchedHotzones.map(hz => ({ 
  id: hz.id, 
  audio_id: hz.audio_id, 
  user_id: hz.metadata?.user_id,
  start: hz.start_time 
})))

// supabase.ts fetchHotzones
const { data: { user } } = await supabase.auth.getUser()
console.log('[Supabase] fetchHotzones - user_id:', user?.id, 'audio_id:', audioId)
console.log('[Supabase] Query result count:', data?.length)
```

---

### P4-1: 修复热区 audio_id 隔离（20 分钟）

**根本原因**（基于诊断结果）：
- 可能 1：`fetchHotzones` 没有正确过滤 user_id
- 可能 2：`saveHotzone` 没有正确保存 user_id
- 可能 3：Supabase 表中 user_id 列为 NULL

**修复步骤**：
1. 验证 Supabase `hotzones` 表中 user_id 列存在且有数据
2. 确认 `saveHotzone` 中 `payload.user_id = user.id` 正确执行
3. 确认 `fetchHotzones` 中 `.eq('user_id', user.id)` 正确执行
4. 如果用户未登录，返回空数组（不显示任何热区）

**关键代码**：
```typescript
export const fetchHotzones = async (audioId: string): Promise<Hotzone[]> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 未登录用户不显示热区
  if (!user) {
    console.log('[Supabase] User not logged in, returning empty hotzones')
    return []
  }
  
  let query = supabase
    .from('hotzones')
    .select('*')
    .eq('audio_id', audioId)
    .eq('user_id', user.id)  // 关键：按 user_id 过滤
    .order('start_time', { ascending: true })
  
  const { data, error } = await query
  console.log('[Supabase] fetchHotzones result:', { user_id: user.id, audio_id: audioId, count: data?.length })
  // ...
}
```

---

### P4-2: 修复播放器状态同步（20 分钟）

**症状**：
- 切换剧集后，进度条仍在上一个剧集的位置
- 播放按钮显示 "||"（暂停）但实际没在播放

**根本原因**：
- `setCurrentTime(0)` 和 `setIsPlaying(false)` 在 effect cleanup 中执行，但 UI 没有立即刷新
- 可能是 `<audio>` 元素的 `currentTime` 没有同步重置

**修复步骤**：
1. 在 effect 中同时重置 `audioRef.current.currentTime = 0`
2. 确保 `setIsPlaying(false)` 在 `<audio>` 元素上调用 `.pause()`
3. 添加日志验证状态重置

**关键代码**：
```typescript
useEffect(() => {
  const loadHotzones = async () => {
    const { setHotzones, setCurrentTime, setIsPlaying } = usePlayerStore.getState()
    
    // 重置播放器状态
    setHotzones([])
    setCurrentTime(0)
    setIsPlaying(false)
    
    // 同时重置 audio 元素
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
      console.log('[Player] Audio element reset:', { currentTime: 0, paused: true })
    }
    
    // 加载新热区...
  }
  
  loadHotzones()
  
  return () => {
    // Cleanup 也要重置
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
    }
    usePlayerStore.getState().setHotzones([])
    usePlayerStore.getState().setCurrentTime(0)
    usePlayerStore.getState().setIsPlaying(false)
  }
}, [audioId, addHotzone])
```

---

### P4-3: 修复用户热区隔离（15 分钟）

**症状**：
- 用户 A 创建的热区在用户 B 账户中也可见

**根本原因**：
- `fetchAllHotzones()` 没有按 user_id 过滤（用于 `/hotzones` 复盘页面）

**修复步骤**：
1. 在 `fetchAllHotzones()` 中添加 user_id 过滤
2. 在 `saveHotzone()` 中确保 user_id 被保存
3. 在 `/hotzones` 页面中验证只显示当前用户的热区

**关键代码**：
```typescript
export const fetchAllHotzones = async (): Promise<Hotzone[]> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []  // 未登录返回空
  
  const { data, error } = await supabase
    .from('hotzones')
    .select('*')
    .eq('user_id', user.id)  // 关键：只获取当前用户的热区
    .order('created_at', { ascending: false })
  
  // ...
}
```

---

### P4-4: 调整热区 buffer 值（30 分钟）

**当前状态**：
- buffer = 2s（前后各 2 秒）
- 转录内容比较完整，但可能需要微调

**调整步骤**：
1. 收集 5-10 个不同长度的转录样本
2. 测试不同 buffer 值：1s、2s、3s、5s
3. 评估标准：
   - 转录内容是否完整（不被截断）
   - 音频片段是否过长（包含无关内容）
4. 选择最优值并更新 `services/hotzone.ts`

**当前代码**（`services/hotzone.ts`）：
```typescript
const BUFFER = 2  // 可调整为 1, 3, 5
const newStartTime = Math.max(0, hz.start_time + transcriptRelativeStart - BUFFER)
const newEndTime = hz.start_time + transcriptRelativeEnd + BUFFER
```

---

### P4-5: 性能优化（1-2 小时）

**优化方向**：
1. **缓存优化**：
   - 增加 `fetchHotzones` 的缓存 TTL（从 5 分钟改为 10 分钟）
   - 在 `/hotzones` 页面添加本地缓存，避免频繁刷新

2. **查询优化**：
   - 在 `hotzones` 表中添加复合索引：`(user_id, audio_id, created_at)`
   - 在 `hotzones` 表中添加索引：`(user_id, created_at)`

3. **前端优化**：
   - 虚拟滚动（`/hotzones` 页面如果热区超过 100 个）
   - 分页加载（每页 20 个热区）

---

## 验收标准

### P4-0 诊断
- [ ] 浏览器控制台显示详细的 audioId、user_id、热区数据日志
- [ ] 日志清晰显示数据流向

### P4-1 热区隔离
- [ ] 切换不同剧集，热区标记位置改变
- [ ] 同一剧集的热区位置一致
- [ ] 不同用户的热区完全隔离

### P4-2 播放状态
- [ ] 切换剧集后，进度条立即回到 0
- [ ] 播放按钮显示 ">"（停止状态）
- [ ] 音频元素的 currentTime 为 0

### P4-3 用户隔离
- [ ] 用户 A 的热区在用户 B 账户中不可见
- [ ] `/hotzones` 页面只显示当前用户的热区

### P4-4 Buffer 调整
- [ ] 转录内容完整，不被截断
- [ ] 音频片段长度合理

### P4-5 性能
- [ ] 页面加载时间 < 2s
- [ ] 热区列表滚动流畅（60fps）

---

## 时间估计
- P4-0: 30 分钟
- P4-1: 20 分钟
- P4-2: 20 分钟
- P4-3: 15 分钟
- P4-4: 30 分钟
- P4-5: 1-2 小时
- **总计**: 2.5-3.5 小时

## 下一步
完成 Phase 4 后，进入 Phase 5（ML 改进和高级功能）
