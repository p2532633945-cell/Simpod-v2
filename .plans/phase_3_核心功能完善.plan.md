# Phase 3: 核心功能完善 - 热区隔离、复盘界面、用户系统

## 目标
- ✅ 修复热区按 audio_id 隔离（P0-1）
- ✅ 优化热区时间范围计算（P0-2）
- ✅ 实现 `/hotzones` 复盘界面（P1-3）
- ✅ 添加 Supabase 用户认证系统（P1-4）

## 执行计划

### P0-1: 修复热区 audio_id 隔离（10 分钟）

**问题**：所有剧集的热区标记显示在同一位置，没有按 audio_id 分别记录

**根本原因**：Zustand store 中的 `hotzones` 是全局的，切换剧集时没有清理

**修复步骤**：
1. 在 `PodcastPlayerPage` 的 `loadHotzones` useEffect 中添加清理逻辑
2. 切换 audioId 时，先清空 store 中的 hotzones
3. 然后加载新的 hotzones
4. 验证：切换剧集时热区标记应该改变

**关键代码**：
```typescript
useEffect(() => {
  const loadHotzones = async () => {
    try {
      // 清理旧的热区
      const { setHotzones } = usePlayerStore.getState()
      setHotzones([])
      
      // 加载新的热区
      const fetchedHotzones = await fetchHotzones(audioId)
      fetchedHotzones.forEach(hz => addHotzone(hz))
    } catch (err) {
      // 错误处理
    }
  }
  
  loadHotzones()
}, [audioId, addHotzone])
```

---

### P0-2: 优化热区时间范围计算（30 分钟）

**问题**：热区只是简单地往后翻译 20s（±10s），不够智能

**改进方案**：
1. 根据转录内容长度动态调整 end_time
2. 确保热区包含完整的转录内容
3. 添加合理的 buffer（前后各 2-3 秒）

**修复步骤**：
1. 在 `services/hotzone.ts` 中修改 `processAnchorsToHotzones()`
2. 获取转录内容后，计算其实际时长
3. 根据时长调整 end_time
4. 添加日志验证时间范围

**关键代码**：
```typescript
// 改进前：固定 ±10s
const start_time = Math.max(0, anchor.timestamp - 10)
const end_time = anchor.timestamp + 10

// 改进后：根据转录长度动态调整
const transcriptDuration = words.length > 0 
  ? words[words.length - 1].end - words[0].start 
  : 20
const buffer = 2  // 前后各 2 秒 buffer
const start_time = Math.max(0, anchor.timestamp - buffer)
const end_time = anchor.timestamp + transcriptDuration + buffer
```

---

### P1-3: 实现 `/hotzones` 复盘界面（2-3 小时）

**目标**：用户可以查看和复盘所有热区

**需要实现**：
1. 创建 `src/app/hotzones/page.tsx`（已存在，需要完善）
2. 列出用户的所有热区（按创建时间倒序）
3. 支持按状态过滤（pending/reviewed/archived）
4. 点击热区可以播放对应的音频片段
5. 支持标记为"已复盘"（更新 status）

**实现步骤**：
1. 创建 `HotzoneList` 组件（显示热区列表）
2. 创建 `HotzoneCard` 组件（单个热区卡片）
3. 创建 `HotzoneFilter` 组件（状态过滤）
4. 在 page.tsx 中组合这些组件
5. 添加"播放"按钮，跳转到播放器
6. 添加"标记为已复盘"按钮，更新 Supabase

---

### P1-4: 添加 Supabase 用户认证系统（2-3 小时）

**目标**：用户可以登录，热区数据与用户关联

**需要实现**：
1. 在 Supabase 中启用 Auth
2. 创建登录/注册页面
3. 在 hotzones 表中添加 `user_id` 字段
4. 修改所有查询以过滤 `user_id`
5. 添加登出功能

---

## 验收标准

### P0-1
- [ ] 切换不同剧集时，热区标记位置改变
- [ ] 同一剧集的热区标记位置一致
- [ ] 浏览器控制台无错误

### P0-2
- [ ] 热区时间范围根据转录长度动态调整
- [ ] 热区包含完整的转录内容
- [ ] 日志显示正确的时间范围

### P1-3
- [ ] `/hotzones` 页面显示所有热区列表
- [ ] 支持按状态过滤
- [ ] 点击热区可以播放对应的音频
- [ ] 支持标记为"已复盘"

### P1-4
- [ ] 用户可以注册和登录
- [ ] 登录后热区数据与用户关联
- [ ] 不同用户的热区数据隔离
- [ ] 支持登出

---

## 时间估计
- P0-1: 10 分钟
- P0-2: 30 分钟
- P1-3: 2-3 小时
- P1-4: 2-3 小时
- **总计**: 5-6 小时

## 下一步
完成此计划后，进入 Phase 4（性能优化和 ML 改进）
