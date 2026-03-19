/**
 * transcript-parser.ts
 * 解析 VTT / SRT / JSON 格式的官方转录文件
 * 统一输出格式：{ start: number, end: number, text: string }[]
 */

export interface TranscriptCue {
  start: number  // 秒
  end: number    // 秒
  text: string
}

/**
 * 解析时间字符串为秒数
 * 支持 HH:MM:SS.mmm 和 MM:SS.mmm 两种格式
 */
function parseTime(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':')
  if (parts.length === 3) {
    const [h, m, s] = parts
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s)
  } else if (parts.length === 2) {
    const [m, s] = parts
    return parseInt(m) * 60 + parseFloat(s)
  }
  return 0
}

/**
 * 解析 WebVTT 格式
 * https://www.w3.org/TR/webvtt1/
 */
export function parseVTT(content: string): TranscriptCue[] {
  const cues: TranscriptCue[] = []
  // 移除 BOM 和 WEBVTT 头
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)
  let i = 0

  // 跳过 WEBVTT 头
  while (i < lines.length && !lines[i].includes('-->')) i++

  while (i < lines.length) {
    const line = lines[i].trim()
    if (line.includes('-->')) {
      // 时间轴行：00:00:01.000 --> 00:00:03.000
      const [startStr, endStr] = line.split('-->').map(s => s.trim().split(' ')[0])
      const start = parseTime(startStr)
      const end = parseTime(endStr)

      // 收集文本行
      const textLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '') {
        const t = lines[i].trim()
        // 移除 VTT 标签 (<b>, <i>, <00:00:01.000> 等)
        const clean = t.replace(/<[^/>][^\s>]*(?:\s[^>]*)?>/g, '').replace(/<\/[^>]+>/g, '').trim()
        if (clean) textLines.push(clean)
        i++
      }

      if (textLines.length > 0) {
        cues.push({ start, end, text: textLines.join(' ') })
      }
    }
    i++
  }

  return mergeDuplicateCues(cues)
}

/**
 * 解析 SRT 格式
 */
export function parseSRT(content: string): TranscriptCue[] {
  const cues: TranscriptCue[] = []
  const blocks = content.replace(/^\uFEFF/, '').split(/\r?\n\r?\n/)

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    // 找时间轴行
    const timeLine = lines.find(l => l.includes('-->'))
    if (!timeLine) continue

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim())
    const start = parseTime(startStr)
    const end = parseTime(endStr)

    // 文本是时间轴之后的所有行
    const timeIdx = lines.indexOf(timeLine)
    const text = lines.slice(timeIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim()

    if (text) cues.push({ start, end, text })
  }

  return mergeDuplicateCues(cues)
}

/**
 * 解析 JSON 格式（Podcast Index transcript JSON）
 * https://podcastindex.org/namespace/1.0#transcript
 */
export function parseTranscriptJSON(content: string): TranscriptCue[] {
  try {
    const data = JSON.parse(content)
    // 支持两种 JSON 结构：
    // { segments: [{startTime, endTime, body}] }
    // { transcripts: [{startTime, endTime, text}] }
    const segments = data.segments || data.transcripts || []
    return segments.map((s: Record<string, unknown>) => ({
      start: Number(s.startTime || s.start || 0),
      end: Number(s.endTime || s.end || 0),
      text: String(s.body || s.text || '').trim(),
    })).filter((c: TranscriptCue) => c.text)
  } catch {
    return []
  }
}

/**
 * 自动检测格式并解析
 */
export function parseTranscript(content: string, mimeType?: string): TranscriptCue[] {
  const trimmed = content.trim()

  // JSON
  if (mimeType?.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseTranscriptJSON(trimmed)
  }
  // VTT
  if (mimeType?.includes('vtt') || trimmed.startsWith('WEBVTT')) {
    return parseVTT(trimmed)
  }
  // SRT（有序号行 + 时间轴）
  if (trimmed.match(/^\d+\r?\n\d{2}:\d{2}:\d{2}/m)) {
    return parseSRT(trimmed)
  }
  // 默认尝试 VTT
  return parseVTT(trimmed)
}

/**
 * 合并相邻的重复/极短 cue（VTT 里常见的字幕滚动问题）
 */
function mergeDuplicateCues(cues: TranscriptCue[]): TranscriptCue[] {
  if (cues.length === 0) return cues
  const merged: TranscriptCue[] = [cues[0]]
  for (let i = 1; i < cues.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = cues[i]
    // 相邻且文本完全相同：合并（扩展结束时间）
    if (curr.text === prev.text && curr.start < prev.end + 0.1) {
      prev.end = Math.max(prev.end, curr.end)
    } else {
      merged.push(curr)
    }
  }
  return merged
}
