import { NextRequest, NextResponse } from 'next/server'
import { saveTranscript, findExistingTranscript } from '@/services/supabase'

const BITRATE_ESTIMATE = 16 * 1024 // 128kbps = 16KB/s 估算

/**
 * POST /api/transcribe-segment
 * 前瞻式分段预转录 API（服务端实现）
 *
 * 关键设计：MP3 Range 截取的中间片段缺少文件头，Groq 无法解析。
 * 解决方案：始终从 byte=0 下载到 endTime 对应的字节，确保 MP3 帧完整。
 * 代价：10min 段约下载 9.6MB，但 Groq 只转录 endTime 范围内的内容。
 */
export async function POST(req: NextRequest) {
  try {
    const { audioUrl, audioId, startTime, endTime } = await req.json()

    if (!audioUrl || !audioId || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: audioUrl, audioId, startTime, endTime' },
        { status: 400 }
      )
    }

    console.log(`[TranscribeSegment] Request: ${audioId} [${startTime}s-${endTime}s]`)

    // 检查是否已有缓存
    const existing = await findExistingTranscript(audioId, startTime, endTime)
    if (existing) {
      console.log(`[TranscribeSegment] Cache hit: ${audioId} [${startTime}s-${endTime}s]`)
      return NextResponse.json({ success: true, cached: true })
    }

    // 始终从 byte=0 开始下载，确保 MP3 文件头完整，Groq 才能解析
    const endByte = Math.floor((endTime + 30) * BITRATE_ESTIMATE) // +30s buffer
    const baseUrl = req.nextUrl.origin
    const proxyUrl = `${baseUrl}/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`

    console.log(`[TranscribeSegment] Fetching bytes 0-${endByte} (~${(endByte/1024/1024).toFixed(1)}MB)...`)

    const audioRes = await fetch(proxyUrl, {
      headers: { Range: `bytes=0-${endByte}` },
    })

    if (!audioRes.ok && audioRes.status !== 206) {
      throw new Error(`Audio proxy returned ${audioRes.status}`)
    }

    const audioBuffer = await audioRes.arrayBuffer()
    console.log(`[TranscribeSegment] Downloaded ${(audioBuffer.byteLength / 1024).toFixed(0)}KB`)

    if (audioBuffer.byteLength === 0) {
      throw new Error('Audio proxy returned empty response')
    }

    // 直接发给 Groq API（不经过 groq-proxy，避免 FormData 二次封装问题）
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured')
    }

    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    formData.append('file', audioBlob, 'segment.mp3')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')

    console.log(`[TranscribeSegment] Sending to Groq API...`)
    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error ${groqRes.status}: ${errText.slice(0, 300)}`)
    }

    const groqData = await groqRes.json()
    const text: string = groqData.text || ''
    const rawWords: Array<{ word: string; start: number; end: number }> = groqData.words || []

    // 词级时间戳从文件头开始计算，已经是绝对时间，不需要偏移
    const words = rawWords
      .filter(w => w.start >= startTime && w.end <= endTime + 5) // 只保留目标时间段内的词
      .map(w => ({ word: w.word, start: w.start, end: w.end }))

    // 保存到 transcripts 表（保存整个下载范围，方便后续查询）
    const saveResult = await saveTranscript(audioId, startTime, endTime, text, words)
    if (!saveResult.success) {
      console.warn(`[TranscribeSegment] Failed to save: ${saveResult.error}`)
    }

    console.log(`[TranscribeSegment] Success: ${audioId} [${startTime}s-${endTime}s], ${words.length} words`)
    return NextResponse.json({ success: true, cached: false, wordCount: words.length })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[TranscribeSegment] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
