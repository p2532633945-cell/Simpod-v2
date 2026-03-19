import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/services/groq'
import { saveTranscript, findExistingTranscript } from '@/services/supabase'

const SEGMENT_DURATION = 600 // 10 分钟
const BITRATE_ESTIMATE = 16 * 1024 // 128kbps = 16KB/s 估算

/**
 * POST /api/transcribe-segment
 * 前瞻式分段预转录 API（服务端实现）
 *
 * 注意：服务端无法使用 AudioContext，改为：
 * 1. 通过 audio-proxy 下载原始音频字节
 * 2. 直接把音频 Blob 发给 groq-proxy 转录
 * 3. 存入 transcripts 表
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

    // 检查是否已有缓存（整集转录命中也算）
    const existing = await findExistingTranscript(audioId, startTime, endTime)
    if (existing) {
      console.log(`[TranscribeSegment] Cache hit: ${audioId} [${startTime}s-${endTime}s]`)
      return NextResponse.json({ success: true, cached: true })
    }

    // 通过 audio-proxy 下载对应字节范围
    const BUFFER = 15 // ±15s buffer 保证帧对齐
    const startByte = Math.max(0, Math.floor((startTime - BUFFER) * BITRATE_ESTIMATE))
    const endByte = Math.floor((endTime + BUFFER) * BITRATE_ESTIMATE)

    const baseUrl = req.nextUrl.origin
    const proxyUrl = `${baseUrl}/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`

    console.log(`[TranscribeSegment] Fetching bytes ${startByte}-${endByte} from audio proxy...`)

    const audioRes = await fetch(proxyUrl, {
      headers: { Range: `bytes=${startByte}-${endByte}` },
    })

    if (!audioRes.ok && audioRes.status !== 206) {
      throw new Error(`Audio proxy returned ${audioRes.status}`)
    }

    const audioBuffer = await audioRes.arrayBuffer()
    console.log(`[TranscribeSegment] Downloaded ${(audioBuffer.byteLength / 1024).toFixed(0)}KB`)

    if (audioBuffer.byteLength === 0) {
      throw new Error('Audio proxy returned empty response')
    }

    // 发给 groq-proxy 转录（直接发原始 MP3 字节，Groq 服务端处理）
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    formData.append('file', audioBlob, 'segment.mp3')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')

    console.log(`[TranscribeSegment] Sending to Groq...`)
    const groqRes = await fetch(`${baseUrl}/api/groq-proxy`, {
      method: 'POST',
      body: formData,
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq proxy error ${groqRes.status}: ${errText.slice(0, 200)}`)
    }

    const groqData = await groqRes.json()
    const text: string = groqData.text || ''
    const rawWords: Array<{ word: string; start: number; end: number }> = groqData.words || []

    // 修正词级时间戳：加上 startTime 偏移
    const timeOffset = startByte / BITRATE_ESTIMATE
    const words = rawWords.map(w => ({
      word: w.word,
      start: w.start + timeOffset,
      end: w.end + timeOffset,
    }))

    // 保存到 transcripts 表
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
