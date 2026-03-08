/**
 * Supabase 数据库操作服务
 *
 * 从 legacy 项目迁移的核心数据库操作函数
 */

import { supabase, Hotzone, Anchor, TranscriptSegment } from '../lib/supabase';

/**
 * 保存或更新热区
 *
 * 注意：将 transcript_words 从顶层移动到 metadata.transcript_words
 * 以兼容数据库schema
 */
export const saveHotzone = async (hotzone: Hotzone) => {
  // Database Schema Compatibility Fix:
  // The 'hotzones' table in Supabase likely does not have a 'transcript_words' column.
  // We must move 'transcript_words' from the top-level object into the 'metadata' JSONB column
  // before sending it to the database.

  // Create a copy to avoid mutating the original object used in the UI
  const payload = { ...hotzone };

  // If transcript_words exists at top level, move it to metadata
  if (payload.transcript_words) {
      payload.metadata = {
          ...payload.metadata,
          transcript_words: payload.transcript_words
      };
      // Remove the top-level property so Supabase doesn't complain about missing column
      delete (payload as any).transcript_words;
  }

  const { data, error } = await supabase
    .from('hotzones')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving hotzone:', error);
    throw error;
  }
  return data;
};

/**
 * 保存锚点
 */
export const saveAnchor = async (anchor: Anchor) => {
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
  const { data, error } = await supabase
    .from('hotzones')
    .select('*')
    .eq('audio_id', audioId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching hotzones:', error);
    throw error;
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
};

/**
 * 查找已存在的转录
 *
 * 查找覆盖请求范围的转录片段
 * 容差：±1秒
 */
export const findExistingTranscript = async (audioId: string, startTime: number, endTime: number): Promise<TranscriptSegment | null> => {
    // Look for any transcript that overlaps with the requested range
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
        const perfectMatch = data.find(t =>
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
    const { error } = await supabase
      .from('transcripts')
      .upsert({
          audio_id: audioId,
          start_time: startTime,
          end_time: endTime,
          text,
          words
      }, { onConflict: 'audio_id,start_time,end_time' }) // Assuming a composite unique key exists
      .select()
      .single();

    if (error) {
        console.error('Error saving transcript:', error);
        // Don't throw, just log. Saving transcript is a side-effect optimization.
    }
};
