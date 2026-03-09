/**
 * Supabase 数据库操作服务
 *
 * 从 legacy 项目迁移的核心数据库操作函数
 */

import { createClient } from '@/lib/supabase/client';
import { Hotzone, Anchor, TranscriptSegment } from '@/types';

/**
 * 保存或更新热区
 *
 * 注意：将 transcript_words 从顶层移动到 metadata.transcript_words
 * 以兼容数据库schema
 */
export const saveHotzone = async (hotzone: Hotzone) => {
  const supabase = createClient();

  // Create a copy to avoid mutating original object used in UI
  const payload = { ...hotzone };

  // If transcript_words exists at top level, move it to metadata
  if (payload.transcript_words) {
      payload.metadata = {
          ...payload.metadata,
          transcript_words: payload.transcript_words
      };
      // Remove top-level property so Supabase doesn't complain about missing column
      delete (payload as any).transcript_words;
  }

  try {
    const { data, error } = await supabase
      .from('hotzones')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      // Extract error info early to avoid serialization issues
      const errorInfo = {
        message: String(error.message || 'Unknown error'),
        code: String(error.code || 'UNKNOWN'),
        details: String(error.details || 'No details'),
        hint: String(error.hint || 'No hint'),
        hotzoneId: hotzone.id
      };
      console.error('[Supabase] Error saving hotzone:', errorInfo);
      throw new Error(errorInfo.message);
    }

    return data;
  } catch (err) {
    // Catch all errors including network errors
    const message = err instanceof Error ? err.message : 'Unknown error';
    const name = err instanceof Error ? err.name : 'Unknown';
    console.error('[Supabase] saveHotzone exception:', {
      message,
      name,
      hotzoneId: hotzone.id
    });
    throw err; // Re-throw for upper layer handling
  }
};

/**
 * 保存锚点
 */
export const saveAnchor = async (anchor: Anchor) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('anchors')
    .insert(anchor)
    .select()
    .single();

  if (error) {
    console.error('Error saving anchor:', error);
    throw error;
  }
  return data;
};

/**
 * 获取指定音频的所有热区
 *
 * 将 metadata.transcript_words 拉到顶层供UI使用
 */
export const fetchHotzones = async (audioId: string): Promise<Hotzone[]> => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hotzones')
      .select('*')
      .eq('audio_id', audioId)
      .order('start_time', { ascending: true });

    if (error) {
      // Extract error info early to avoid serialization issues
      const errorInfo = {
        message: String(error.message || 'Unknown error'),
        code: String(error.code || 'UNKNOWN'),
        details: String(error.details || 'No details'),
        hint: String(error.hint || 'No hint'),
        audioId
      };
      console.error('[Supabase] Error fetching hotzones:', errorInfo);
      throw new Error(errorInfo.message);
    }

    // Transform back for UI: pull transcript_words from metadata to top-level
    return (data as any[]).map(hz => {
        if (hz.metadata && hz.metadata.transcript_words) {
            return {
                ...hz,
                transcript_words: hz.metadata.transcript_words
            };
        }
        return hz;
    }) as Hotzone[];
  } catch (err) {
    // Catch all errors, including network errors
    const message = err instanceof Error ? err.message : 'Unknown error';
    const name = err instanceof Error ? err.name : 'Unknown';
    console.error('[Supabase] fetchHotzones exception:', {
      message,
      name,
      audioId
    });
    throw err; // Re-throw for upper layer handling
  }
};

/**
 * 查找已存在的转录
 *
 * 查找覆盖请求范围的转录片段
 * 容差：±1秒
 */
export const findExistingTranscript = async (audioId: string, startTime: number, endTime: number): Promise<TranscriptSegment | null> => {
    const supabase = createClient();

    // Look for any transcript that overlaps with requested range
    // We will do a smarter client-side check after fetching candidates.
    // Fetch any transcript where (start <= requested_end) AND (end >= requested_start)
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('audio_id', audioId)
      .lte('start_time', endTime)
      .gte('end_time', startTime);

    if (error) {
      console.error('Error finding transcript:', error);
      return null;
    }

    // Find the best match: one that fully covers the requested range
    if (data && data.length > 0) {
        // Tolerance: 1 second
        const perfectMatch = data.find((t: TranscriptSegment) =>
            t.start_time <= startTime + 1 &&
            t.end_time >= endTime - 1
        );
        if (perfectMatch) return perfectMatch;

        // Future TODO: Stitch multiple partial transcripts together?
        // For MVP, if no single transcript covers the whole range, we treat it as a "miss" and re-transcribe.
        // Or we could return the best partial match, but that might lead to incomplete sentences.
    }

    return null;
};

/**
 * 保存转录到共享缓存
 */
export const saveTranscript = async (
    audioId: string,
    startTime: number,
    endTime: number,
    text: string,
    words: any
): Promise<void> => {
    const supabase = createClient();

    const { error } = await supabase
      .from('transcripts')
      .upsert({
          audio_id: audioId,
          start_time: startTime,
          end_time: endTime,
          text,
          words
      }, { onConflict: 'audio_id,start_time,end_time' })
      .select()
      .single();

    if (error) {
        console.error('Error saving transcript:', error);
        // Don't throw, just log. Saving transcript is a side-effect optimization.
    }
};
