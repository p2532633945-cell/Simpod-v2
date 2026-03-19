import { NextRequest, NextResponse } from 'next/server'
import { sliceRemoteAudio } from '@/utils/audio'
import { transcribeAudio } from '@/services/groq'
import { saveTranscript, findExistingTranscript } from '@/services/supabase'

/**
 * POST /api/transcribe-segment
 * 前瞻式分段预转录 API
 * 
 * 用户播放时后台静默调用，转录当前位置往后 10 分钟
 * 存入 transcripts 表，MARK 时直接命中缓存
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
      return NextResponse.json({ 
        success: true, 
        cached: true,
        text: existing.text,
        words: existing.words 
      })
    }

    // 切片音频
    console.log(`[TranscribeSegment] Slicing audio: ${audioUrl} [${startTime}s-${endTime}s]`)
    const audioSlice = await sliceRemoteAudio(audioUrl, startTime, endTime)

    // 转录
    console.log(`[TranscribeSegment] Transcribing segment...`)
    const result = await transcribeAudio(audioSlice)

    // 保存到 transcripts 表
    const saveResult = await saveTranscript(audioId, startTime, endTime, result.text, result.words)
    if (!saveResult.success) {
      console.warn(`[TranscribeSegment] Failed to save transcript: ${saveResult.error}`)
    }

    console.log(`[TranscribeSegment] Success: ${audioId} [${startTime}s-${endTime}s], ${result.words.length} words`)

    return NextResponse.json({
      success: true,
      cached: false,
      text: result.text,
      words: result.words,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[TranscribeSegment] Error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
