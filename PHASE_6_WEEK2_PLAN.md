# Phase 6 Week 2：泛听体验优化

> **目标**：让播放体验从「能用」→「舒适」
> **周期**：2026-03-19 ~ 2026-03-22
> **前提**：Week 1 已完成（转录质量框架、音频切片优化、Bug 修复）

---

## 📦 Week 1 完成状态（已交付）

### 核心功能
- ✅ 官方转录来源识别（Transcript Tag 在剧集列表显示）
- ✅ 转录来源徽章 UI（✓官方 / ⚡Groq / ✏️用户）
- ✅ 置信度评分系统（启发式算法，无需 OpenAI Key）
- ✅ 置信度进度条 UI（绿/黄/红）
- ✅ 数据库字段（transcript_source + transcript_confidence）已迁移

### Bug 修复
- ✅ Groq 403 定位（.env 文件问题）
- ✅ Duplicate Key 崩溃（addHotzone/setHotzones 去重）
- ✅ 竞态条件（cancelled flag 防 StrictMode 双执行）
- ✅ 档位切换无响应（useCallback 依赖数组修复）
- ✅ 音频切片性能（下载量从 13MB → 480KB，快 20-30 倍）

### 暂缓
- ⏳ Task 1.3 哈希缓存（收益不够大，现有时间段缓存已够用）

---

## 🎯 Week 2 任务清单

### Task 2.1：倍速记忆（0.5 day）
**文件**：`src/stores/playerStore.ts`、`src/components/player/PlaybackControls.tsx`

**问题**：每次进入播放器都重置为 1x，用户需要重新设置。

**实现**：
- [ ] `setPlaybackRate` 时同步写入 `localStorage('simpod_playback_rate')`
- [ ] Store 初始化时从 localStorage 读取上次倍速
- [ ] 进入播放器后自动应用

**验收**：设置 1.5x → 刷新页面 → 倍速自动恢复为 1.5x

---

### Task 2.2：后台播放稳定性（1 day）
**文件**：`src/components/player/PodcastPlayerPage.tsx`

**问题**：切换 Tab 或锁屏时音频可能中断。

**实现**：
- [ ] 检查是否有 `visibilitychange` 事件意外 pause
- [ ] 添加 `pagehide`/`pageshow` 事件处理
- [ ] 添加 Media Session API（锁屏通知栏控制）
  ```typescript
  navigator.mediaSession.metadata = new MediaMetadata({
    title: episodeTitle,
    artist: podcastTitle,
    artwork: [{ src: artwork }]
  })
  navigator.mediaSession.setActionHandler('play', () => handlePlayPause())
  navigator.mediaSession.setActionHandler('pause', () => handlePlayPause())
  ```
- [ ] 测试：切换 Tab → 返回，音频继续
- [ ] 测试：手机锁屏 → 解锁，通知栏显示播放控制

**验收**：切换 Tab 后返回，音频不中断；手机锁屏后通知栏可控制播放

---

### Task 2.3：播放进度持久化（0.5 day）
**文件**：`src/stores/playerStore.ts`

**问题**：刷新页面后播放进度丢失，用户需要手动拖回原位。

**实现**：
- [ ] 每 5 秒将 `currentTime` 写入 `localStorage('simpod_progress_{audioId}')`
- [ ] 进入播放器时读取上次进度并自动 seek
- [ ] 已完成（进度 > 95%）时不恢复（从头开始）

**验收**：播放到 300s → 刷新 → 自动跳回 300s 附近

---

### Task 2.4：键盘快捷键扩展（0.5 day）
**文件**：`src/components/player/PodcastPlayerPage.tsx`

**现有**：← → Space

**新增**：
- [ ] `J` / `L`：后退/快进 10s（YouTube 风格）
- [ ] `K`：播放/暂停
- [ ] `[` / `]`：降低/提高播放速度
- [ ] `M`：触发 MARK（当前时间打点）

**验收**：按 M 键创建热区，按 ] 提速

---

### Task 2.5：缓冲进度显示（0.5 day）
**文件**：`src/components/player/PlaybackControls.tsx`

**问题**：用户不知道音频缓冲到哪里了，等待时体验差。

**实现**：
- [ ] 监听 `audio.buffered` TimeRanges
- [ ] 在进度条下方显示灰色缓冲条
- [ ] 每秒更新一次

**验收**：进度条显示已缓冲区域（灰色）和已播放区域（主色）

---

## 📊 优先级排序

| 优先级 | 任务 | 工作量 | 用户感知 |
|--------|------|--------|----------|
| P0 | 2.1 倍速记忆 | 0.5 day | 高频用，每次都要重设 |
| P0 | 2.2 后台播放 + Media Session | 1 day | 手机用户核心需求 |
| P1 | 2.3 播放进度持久化 | 0.5 day | 长播客必需 |
| P1 | 2.4 键盘快捷键 | 0.5 day | 键盘党效率 |
| P2 | 2.5 缓冲进度显示 | 0.5 day | 视觉反馈 |

---

## 🔬 技术说明

### Media Session API
让手机锁屏通知栏显示播放控制按钮，是「后台播放」体验的关键：
```typescript
// 设置当前播放信息
navigator.mediaSession.metadata = new MediaMetadata({ ... })
// 注册操作处理器
navigator.mediaSession.setActionHandler('seekbackward', () => seek(currentTime - 10))
navigator.mediaSession.setActionHandler('seekforward', () => seek(currentTime + 10))
```
支持：Chrome Android、Safari iOS 15+、桌面 Chrome

### 倍速记忆实现
```typescript
// playerStore.ts
playbackRate: typeof window !== 'undefined'
  ? parseFloat(localStorage.getItem('simpod_playback_rate') || '1') || 1
  : 1,

setPlaybackRate: (rate) => {
  localStorage.setItem('simpod_playback_rate', String(rate))
  // ... 现有逻辑
}
```

---

## 🧪 测试清单

- [ ] 倍速：设置 1.5x → 刷新 → 自动恢复
- [ ] 后台：切换 Tab → 返回 → 不中断
- [ ] 后台：手机锁屏 → 通知栏显示控制
- [ ] 进度：播放 300s → 刷新 → 自动跳回
- [ ] 快捷键：M 键 MARK，] 键提速
- [ ] 缓冲：弱网下进度条显示灰色缓冲区域

---

## 🔮 Week 3 预告

**回溯精准优化**：
- 智能时间范围（句子边界感知）
- 热区间快速跳转快捷键（J/K 跳上一个/下一个热区）
- 回溯历史记录面板

---

**版本**：1.0
**创建日期**：2026-03-18
**预计完成**：2026-03-22
