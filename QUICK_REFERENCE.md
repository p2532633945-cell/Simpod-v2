# 快速参考指南

## 开发命令

### 启动开发服务器
```bash
npm run dev
# 访问: http://localhost:3000
```

### 构建项目
```bash
npm run build
```

### 类型检查
```bash
npx tsc --noEmit
```

### 代码格式化
```bash
npm run format
```

### 代码检查
```bash
npm run lint
```

---

## 测试命令

### 测试 RSS 解析器 v2
```bash
# 在浏览器控制台测试
const result = await fetch('/api/rss-proxy?url=https://feeds.bbci.co.uk/news/world/rss.xml')
const xml = await result.text()
console.log(xml.substring(0, 500))
```

### 测试音频 URL 验证
```bash
curl "http://localhost:3000/api/audio-test?url=https://example.com/audio.mp3"

# 预期响应:
# {
#   "valid": true,
#   "contentType": "audio/mpeg",
#   "contentLength": 12345
# }
```

### 测试播客搜索
```bash
curl "http://localhost:3000/api/podcast-search?query=BBC"
```

---

## 关键文件位置

### RSS 解析
- **旧版本**: `src/lib/rss-parser.ts`
- **新版本**: `src/lib/rss-parser-v2.ts` ⭐

### 音频验证
- **验证工具**: `src/lib/audio-validator.ts`
- **测试工具**: `src/lib/audio-tester.ts` ⭐
- **测试 API**: `src/app/api/audio-test/route.ts` ⭐

### 诊断工具
- **RSS 诊断**: `src/lib/rss-diagnostics.ts` ⭐
- **测试用例**: `src/lib/test-podcasts.ts` ⭐
- **测试指南**: `src/lib/TESTING_GUIDE.ts` ⭐

### 服务层
- **播客管理**: `src/services/podcast-manager.ts` (已更新)
- **热区服务**: `src/services/hotzone.ts`
- **Supabase**: `src/services/supabase.ts`

### 页面和组件
- **播客详情页**: `src/app/podcast/[id]/page.tsx` (已更新)
- **播放器**: `src/components/player/PodcastPlayerPage.tsx` (已更新)
- **剧集列表**: `src/components/podcast/EpisodeList.tsx`

---

## 调试技巧

### 启用 Debug 模式
```
http://localhost:3000/podcast/[id]?feedUrl=...&debug=true
```

### 查看控制台日志
打开浏览器开发者工具 (F12)，查看以下日志前缀：
- `[RSS Parser v2]` - RSS 解析日志
- `[PodcastManager]` - 播客管理日志
- `[Player]` - 播放器日志
- `[AudioValidator]` - 音频验证日志
- `[AudioTester]` - 音频测试日志
- `[RssDiagnostics]` - 诊断日志

### 测试真实播客
```javascript
// 在浏览器控制台运行
import { TEST_PODCASTS } from '@/lib/test-podcasts'
console.log(TEST_PODCASTS)
```

---

## 常见问题

### Q: 如何测试新的 RSS 解析器？
A: 
1. 打开播客详情页
2. 添加 `?debug=true` 参数
3. 查看诊断面板

### Q: 如何测试音频 URL 验证？
A:
```bash
curl "http://localhost:3000/api/audio-test?url=https://feeds.bbci.co.uk/news/world/rss.xml"
```

### Q: 如何查看详细的错误信息？
A:
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签
3. 搜索 `[Player] Audio error` 或 `[RSS Parser v2] Error`

### Q: 如何清除缓存？
A:
```javascript
// 在浏览器控制台运行
import { podcastManager } from '@/services/podcast-manager'
podcastManager.clearCache()
```

---

## 性能优化

### 缓存策略
- PodcastManager: 5 分钟内存缓存
- 音频 URL 测试: 5 秒超时

### 网络优化
- RSS 代理: 通过 `/api/rss-proxy` 处理 CORS
- 音频测试: HEAD 请求优先，Fallback 到 GET

### 日志优化
- 生产环境: 仅记录错误
- 开发环境: 记录所有日志

---

## 部署检查清单

- [ ] TypeScript 编译通过
- [ ] 项目构建成功
- [ ] 所有依赖安装
- [ ] 环境变量配置
- [ ] 数据库迁移完成
- [ ] 手动测试通过
- [ ] 性能指标达标

---

## 相关文档

- [CLAUDE.md](../CLAUDE.md) - 项目宪法
- [PROGRESS.md](../PROGRESS.md) - 开发进度
- [PRD.md](../PRD.md) - 产品需求
- [TESTING_GUIDE.ts](./src/lib/TESTING_GUIDE.ts) - 测试指南
- [EXECUTION_SUMMARY.md](./.agents/plans/fix-rss-parsing-and-playback-EXECUTION_SUMMARY.md) - 执行总结
- [COMPLETION_CHECKLIST.md](./.agents/plans/fix-rss-parsing-and-playback-COMPLETION_CHECKLIST.md) - 完成清单

---

## 快速链接

### 本地开发
- 首页: http://localhost:3000
- 播客搜索: http://localhost:3000 (搜索框)
- 播客详情: http://localhost:3000/podcast/[id]?feedUrl=...
- 播放器: http://localhost:3000/workspace/[id]

### API 端点
- RSS 代理: `/api/rss-proxy?url=...`
- 音频测试: `/api/audio-test?url=...`
- 播客搜索: `/api/podcast-search?query=...`
- 热区管理: `/api/hotzones`
- Groq 代理: `/api/groq-proxy`

### 外部资源
- [fast-xml-parser 文档](https://github.com/NaturalIntelligence/fast-xml-parser)
- [RSS 2.0 规范](https://www.rssboard.org/rss-specification)
- [iTunes Podcast 命名空间](https://podcasters.apple.com/support/1691-what-tags-do-i-need)

---

## 版本信息

- **Node.js**: 18+
- **Next.js**: 15.2.0
- **TypeScript**: 5.7.2
- **fast-xml-parser**: 最新版本
- **Supabase**: 2.46.2

---

**最后更新**: 2026-03-12  
**维护者**: Claude Code
