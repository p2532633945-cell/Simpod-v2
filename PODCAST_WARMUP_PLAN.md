# 播客预热库建设计划

> 记录于 PHASE_6_WEEK3_PLAN.md 附属文档
> 目标：对主流英文播客每集前 5 分钟批量预转录，实现用户首次播放即命中缓存（模式 B 冷启动窗口 = 0）

---

## 核心逻辑

```
用户打开剧集列表 → 后台预转录前 5 分钟（30s 完成）
用户浏览列表（10-30s）→ 预转录已完成
用户点播 → 第一个 MARK 直接命中缓存 → 模式 B
```

成本：$0.009/集（¥0.06），300 集 = ¥20，一次性投入。

---

## 阶段 A：人工种子库（现在可做）

**做法**：
- 手动收集 20-30 个优质英文学习播客 RSS 地址
- 编写一次性脚本 `scripts/warmup-podcasts.ts`
- 遍历每个播客最新 10 集，调用 `/api/transcribe-segment`（startTime=0, endTime=300）
- 脚本可手动运行，也可部署为 Vercel Cron Job（每天补充新集）

**预计覆盖**：30 播客 × 10 集 = 300 集
**预计成本**：300 × $0.009 = $2.7（¥20），一次性

**种子播客候选列表**：
- BBC Global News / Newshour
- BBC 6 Minute English
- BBC The English We Speak
- NPR Up First
- NPR Planet Money
- The Economist
- TED Talks Daily
- Lex Fridman Podcast
- Huberman Lab
- All Ears English
- Speak English Now Podcast
- ESLPod
- Luke's English Podcast
- 待补充...

---

## 阶段 B：用户行为驱动（用户量 > 50 后）

**做法**：
- Supabase 新增 `play_events` 表，记录每个 audio_id 的播放次数
- 每天查询 play_count > 3 的剧集，自动触发预转录
- 热门剧集自动进入预热库，长尾剧集按需付费

**优势**：完全按用户实际需求付费，不浪费

---

## 阶段 C：Vercel Cron 自动化（用户量 > 200 后）

**做法**：
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/warmup-new-episodes",
    "schedule": "0 2 * * *"
  }]
}
```
- 每天凌晨 2 点爬取种子库播客的最新剧集
- 自动转录前 5 分钟，更新缓存
- 可选：对 ≤30min 的剧集做全集转录

---

## 实施时间表

| 条件 | 行动 |
|------|------|
| **现在** | 编写并运行阶段 A 种子库脚本（一次性，¥20） |
| **用户量 > 50** | 开启阶段 B 行为驱动预热 |
| **用户量 > 200** | 配置阶段 C Cron 自动化 |
| **用户量 > 1000** | 评估 Podscribe.ai 批量转录数据（$99/月） |

---

## 阶段 A 脚本实现（待开发）

文件：`scripts/warmup-podcasts.ts`

```typescript
// 运行方式：npx ts-node scripts/warmup-podcasts.ts
const SEED_PODCASTS = [
  { name: 'BBC 6 Minute English', rss: 'https://podcasts.files.bbci.co.uk/p02pc9zn.rss' },
  { name: 'NPR Up First', rss: 'https://feeds.npr.org/510318/podcast.xml' },
  // ...更多
]

const EPISODES_PER_PODCAST = 10
const WARMUP_DURATION = 300 // 5 分钟

// 遍历 → 解析 RSS → 取最新 N 集 → 调用 transcribe-segment
```

**触发时机提醒**：
- 收到第一个用户注册 → 运行阶段 A 脚本
- 每次新播客被多个用户搜索 → 手动加入种子库
