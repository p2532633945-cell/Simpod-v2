# Simpod v2 项目进度

> **最后更新**：2026-03-18
> **当前阶段**：Phase 6 Week 3 — 回溯精准优化
> **版本**：2.2

---

## 📊 完成度统计

### Phase 1-4：基础功能 ✅ 100%
- ✅ MVP 播放器
- ✅ MARK 热区
- ✅ 用户隔离
- ✅ 复盘界面

### Phase 5：核心功能 ✅ 100%
- ✅ 热区档位（3s/10s/20s）
- ✅ 即时回溯（Instant Replay）
- ✅ RSS 官方转录解析
- ✅ PlaybackControls 重设计
- ✅ PWA manifest + SW + PNG icons
- ✅ 热区编辑 / 统计 / 转录搜索

### Phase 6 Week 1：转录质量 ✅ 100%
- ✅ 官方转录来源识别（剧集列表 Transcript Tag）
- ✅ 转录来源徽章 UI（官方/Groq/用户）
- ✅ 置信度评分系统（启发式算法）
- ✅ 置信度进度条 UI（绿/黄/红）
- ✅ 数据库字段迁移（transcript_source + transcript_confidence）
- ✅ 音频切片性能优化（13MB → 480KB，快 20-30 倍）
- ✅ Duplicate Key 崩溃修复
- ✅ 竞态条件修复（cancelled flag）
- ✅ 档位切换 useCallback 依赖修复

### Phase 6 Week 2：泛听体验 ✅ 100%（已完成）
- ✅ Task 2.1 倍速记忆（localStorage 持久化，刷新自动恢复）
- ✅ Task 2.2 后台播放稳定性 + Media Session API（锁屏通知栏控制）
- ✅ Task 2.3 播放进度持久化（每5秒写入，canplay 时恢复）
- ✅ Task 2.4 键盘快捷键扩展（J/K/L/[/]/M 全部实现）
- ✅ Task 2.5 缓冲进度显示（进度条灰色缓冲层）

### Phase 6 Week 3-4：回溯精准 + 定位智能 ⏳ 待规划

---

## 🛠️ 技术债清单

| 项目 | 状态 | 优先级 |
|------|------|--------|
| PWA 安装横幅 | ⏳ 待做 | P2 |
| 手机端 HotzoneSidebar | ⏳ 待优化 | P2 |
| 首页搜索滚动 | ⏳ 待优化 | P2 |
| 哈希缓存（Task 1.3） | ❌ 暂缓 | 收益不够大 |

---

## 📋 活跃文档

| 文档 | 用途 |
|------|------|
| `PHASE_6_WEEK2_PLAN.md` | 当前周执行计划 |
| `PHASE_6_CORE_EXPERIENCE.plan.md` | 全局战略（Week 3-4 参考）|
| `PHASE_6_WEEK1_TRANSCRIPTION.plan.md` | Week 1 原始计划（存档）|
| `ROADMAP.md` | 产品路线图 |
| `CLAUDE.md` | 开发规范（必读）|

---

## 📈 关键指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 音频切片下载量 | ~480KB | < 500KB ✅ |
| 转录缓存命中率 | 未测 | > 80% |
| 倍速记忆 | 未实现 | 刷新后自动恢复 |
| 后台播放 | 未验证 | 切换 Tab 不中断 |
| 锁屏通知栏控制 | 未实现 | Media Session API |

---

**版本历史**：
- v2.0（2026-03-17）：市场驱动版
- v2.1（2026-03-18）：质量驱动版
- v2.2（2026-03-18）：Week 1 完成，进入 Week 2
- v2.3（2026-03-18）：Week 2 完成（泛听体验全部 5 项），进入 Week 3 ← 当前
