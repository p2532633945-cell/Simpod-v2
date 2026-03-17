# Simpod v2 开发进度

> **市场驱动的开发进度**：结合实际推进中的优先级、风险控制和成本考量。

---

## 当前状态

### 最后更新
- **更新时间**: 2026-03-17 (今天)
- **更新者**: Claude Code
- **当前分支**: master

### 项目阶段
- **当前阶段**: ⏳ Phase 5 - 核心功能完善 + PWA（进行中）
- **下一步**: Phase 5 第三阶段（集成测试、性能优化、Bug 修复）

### 市场目标
- 积累早期试水用户（手机端 PWA）
- 打磨核心体验（热区、转录、回溯）
- 建立护城河功能（智能时间范围、质量改进）

---

## 进行中的任务

### 当前任务：Phase 5 第二阶段 - PWA + 护城河
**状态**: ✅ 已完成
**完成时间**: 2026-03-17
**耗时**: ~2 小时

**完成内容**：
1. ✅ **P6-1**: PWA 手机端支持
   - `public/manifest.json`（name、icons、shortcuts、theme）
   - `public/sw.js` Service Worker（静态缓存 + network-first HTML）
   - `next.config.mjs` 添加 SW/manifest 正确 HTTP headers
   - `layout.tsx` iOS apple-touch-icon、apple-mobile-web-app-capable 等 meta
   - SVG 图标自动生成（72/96/128/144/152/192/384/512px）

2. ✅ **P6-2**: 中途回溯开关（Instant Replay Mode）
   - `playerStore` 添加 `instantReplayMode` + `toggleInstantReplayMode`（localStorage 持久化）
   - 播放器界面添加 Replay 开关按钮（带亮绿色激活状态）
   - MARK 后若开启则自动 seek 到热区起点

3. ✅ **P6-3**: 智能热区时间范围档位
   - `playerStore` 添加 `hotzoneRange: 'tight' | 'normal' | 'wide'`（localStorage 持久化）
   - 播放器界面添加 3 档按钮（3s / 10s / 20s）
   - `hotzone.ts` `generateHotzoneFromAnchor` 支持 `bufferSeconds` 参数
   - `processAnchorsToHotzones` 新增 `hotzoneRange` 参数

4. ✅ **P6-4**: RSS 官方转录解析（Podcast Namespace 2.0）
   - `rss-parser-v2.ts` 解析 `<podcast:transcript>` 标签
   - 支持 SRT / VTT / JSON / HTML 格式优先级排序
   - `Episode` 类型新增 `officialTranscript?: OfficialTranscript` 字段
   - 统计并日志输出有官方转录的集数

### 之前完成任务：Phase 5 第一阶段 - 核心功能完善
**状态**: ✅ 已完成
**完成时间**: 2026-03-17
**耗时**: ~3 小时

**完成内容**：
1. ✅ **P5-4**: 热区编辑功能
   - HotzoneEditModal 组件（时间范围、标题、描述编辑）
   - PATCH/DELETE API 端点（用户隔离验证）
   - HotzoneSidebar 集成编辑按钮（hover 显示）

2. ✅ **P5-5**: 热区回溯功能
   - PlaybackControls 添加 5s/10s/30s 快进/快退按钮
   - 键盘快捷键（← → 跳转，Space 播放/暂停）
   - 进度条拖拽改进

3. ✅ **P5-6**: 热区统计分析
   - AnalyticsDashboard 组件（总览卡片、进度条、7天柱状图）
   - 学习时长统计、本周创建/复习数量
   - hotzones 页面 header 添加统计按钮（折叠展示）

4. ✅ **P5-7**: 转录编辑功能
   - TranscriptEditor 组件（内联编辑、撤销/重做、注释）
   - updateHotzoneTranscript API（用户隔离）
   - 集成到 HotzoneCard

5. ✅ **P5-8**: 转录搜索
   - TranscriptSearch 组件（全文搜索、关键词高亮）
   - 搜索历史（localStorage 持久化）
   - 替换 hotzones 页面原有简单搜索框

---

## 已完成的任务

### Phase 5 第零阶段：用户系统 ✅
**状态**: ✅ 已完成
**完成时间**: 2026-03-17
**耗时**: 45 min

**完成内容**：
- ✅ **P5-1**: 用户认证系统
  - 登录/注册
  - 密码重置
  - 个人资料编辑
  - 账户状态查看
  - 偏好设置

- ✅ **P5-2**: 用户数据隔离
  - fetchHotzones 按 user_id 过滤
  - fetchAllHotzones 按 user_id 过滤
  - saveHotzone 保存 user_id
  - updateHotzoneStatus 按 user_id 过滤

**关键改进**：
- 添加密码重置功能
- 创建用户资料页面
- 强制用户数据隔离
- 安全审计通过

---

### Phase 4: 核心 Bug 修复与性能优化 ✅
**状态**: ✅ 已完成
**完成时间**: 2026-03-17
**耗时**: 1.5 小时

**完成内容**：
- ✅ **P4-0**: 诊断热区重叠问题
- ✅ **P4-1**: 修复热区 audio_id 隔离
- ✅ **P4-2**: 修复播放器状态同步
- ✅ **P4-3**: 修复用户热区隔离
- ✅ **P4-4**: 调整热区 buffer 值
- ✅ **P4-5**: 性能优化

**关键改进**：
- 添加 5 个数据库索引
- RSS 缓存 TTL 增加到 10 分钟
- 热区列表实现分页加载
- 复盘页面自动播放优化
- 修复无限循环问题

---

### Phase 1-3: MVP + 核心功能 ✅
**状态**: ✅ 已完成
**完成时间**: 2026-03-15

**完成内容**：
- ✅ 项目初始化
- ✅ 前端组件集成
- ✅ 音频播放修复
- ✅ MARK 功能
- ✅ 热区隔离
- ✅ 复盘界面
- ✅ 用户系统

---

## 待办事项

### 高优先级 🔴

#### Phase 5 第一阶段：核心功能完善（1 周）
- [x] **P5-4**: 热区编辑功能 ✅
- [x] **P5-5**: 热区回溯功能 ✅
- [x] **P5-6**: 热区统计分析 ✅
- [x] **P5-7**: 转录编辑功能 ✅
- [x] **P5-8**: 转录搜索 ✅

#### Phase 5 第二阶段：PWA + 护城河（1 周）
- [x] **P5-9 / P6-1**: PWA 设计 ✅
- [x] **P6-2**: 中途回溯开关 ✅
- [x] **P6-3**: 智能热区时间范围档位（POC）✅
- [x] **P6-4**: 转录来源优化（RSS 官方转录解析）✅

#### Phase 5 第三阶段：系统稳定（1 周）
- [ ] 集成测试（1 day）
- [ ] 性能优化（1 day）
- [ ] Bug 修复（1 day）

### 中优先级 🟡

#### Phase 6：后期优化（后续）
- [ ] 热区分享功能
- [ ] 多语言支持
- [ ] 推荐系统
- [ ] 高级功能开发

---

## 技术债务

### 已清理 ✅
- 删除 `.agents/` 目录
- 删除冗余文档
- 删除 `src/pages-legacy/`
- 删除过度工程化文件

### 待处理
- [ ] 合并 `types/index.ts` 和 `types/simpod.ts`
- [ ] 删除或隐藏 `src/app/test-env/`
- [ ] 评估 `podcastStore.ts` 是否需要

---

## 关键指标

| 指标 | 当前值 | 目标值 | 优先级 |
|------|--------|--------|--------|
| 播放成功率 | ✅ 100% | 100% | P0 |
| MARK 成功率 | ✅ 100% | 100% | P0 |
| 热区隔离 | ✅ 100% | 100% | P0 |
| 用户系统 | ✅ 100% | 100% | P0 |
| 页面加载时间 | ~2-3s | < 2s | P1 |
| PWA 支持 | ❌ 0% | ✅ 100% | P1 |
| 热区编辑 | ❌ 0% | ✅ 100% | P1 |
| 转录搜索 | ❌ 0% | ✅ 100% | P1 |

---

## 风险跟踪

### 当前风险

| 风险 | 影响 | 状态 | 缓解措施 |
|------|------|------|---------|
| 热区智能时间范围 NLP 效果 | 核心体验 | 🟡 中 | 提前 POC |
| PWA 兼容性 | 用户安装 | 🟡 中 | 充分测试 |
| 转录质量不稳定 | 用户体验 | 🟡 中 | 多模型对比 |

---

**最后更新**：2026-03-17
**版本**：5.0（市场驱动版）
