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

  // 关键修复：将 transcript_words 从顶层移到 metadata 中
  // 数据库 schema 中 transcript_words 不是顶层列，而是在 metadata JSONB 中
  if (payload.transcript_words) {
    console.log('[Supabase] Moving transcript_words to metadata for schema compatibility');
    payload.metadata = {
      ...payload.metadata,
      transcript_words: payload.transcript_words
    };
    delete (payload as any).transcript_words;
  }

  try {
    console.log('[Supabase] Saving hotzone:', { id: payload.id, audioId: payload.audio_id });
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

    console.log('[Supabase] Hotzone saved successfully:', data.id);
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
 * 改进：
 * - 区分"无结果"和"查询失败"
 * - 添加重试机制
 * - 返回详细的查询结果
 */
export const findExistingTranscript = async (
    audioId: string,
    startTime: number,
    endTime: number,
    retries = 1
): Promise<TranscriptSegment | null> => {
    const supabase = createClient();

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Fetch any transcript where (start <= requested_end) AND (end >= requested_start)
            const { data, error } = await supabase
              .from('transcripts')
              .select('*')
              .eq('audio_id', audioId)
              .lte('start_time', endTime)
              .gte('end_time', startTime);

            if (error) {
                // 业务错误
                const errorInfo = {
                    message: String(error.message || 'Unknown error'),
                    code: String(error.code || 'UNKNOWN'),
                    audioId,
                    timeRange: `${startTime}-${endTime}`
                };
                console.error('[Supabase] Error finding transcript:', errorInfo);
                
                // 网络错误则重试
                if (error.message?.includes('fetch') && attempt < retries) {
                    const delay = Math.pow(2, attempt) * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                return null;
            }

            // 查询成功，查找最佳匹配
            if (data && data.length > 0) {
                // Tolerance: 1 second
                const perfectMatch = data.find((t: TranscriptSegment) =>
                    t.start_time <= startTime + 1 &&
                    t.end_time >= endTime - 1
                );
                if (perfectMatch) {
                    console.log(`[Supabase] Found transcript match: ${audioId} [${startTime}-${endTime}]`);
                    return perfectMatch;
                }
            }

            console.log(`[Supabase] No transcript match found: ${audioId} [${startTime}-${endTime}]`);
            return null;

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Supabase] Exception finding transcript:', {
                message,
                audioId,
                timeRange: `${startTime}-${endTime}`,
                attempt: attempt + 1
            });
            
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            return null;
        }
    }

    return null;
};

/**
 * 保存转录到共享缓存
 * 
 * 改进：
 * - 区分网络错误和业务错误
 * - 添加重试机制
 * - 返回成功/失败状态
 */
export const saveTranscript = async (
    audioId: string,
    startTime: number,
    endTime: number,
    text: string,
    words: any,
    retries = 2
): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient();

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
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
                // 业务错误（如约束冲突）
                const errorInfo = {
                    message: String(error.message || 'Unknown error'),
                    code: String(error.code || 'UNKNOWN'),
                    details: String(error.details || 'No details'),
                    audioId,
                    timeRange: `${startTime}-${endTime}`
                };
                console.error('[Supabase] Error saving transcript:', errorInfo);
                return { success: false, error: error.message };
            }

            console.log(`[Supabase] Transcript saved: ${audioId} [${startTime}-${endTime}]`);
            return { success: true };

        } catch (err) {
            // 网络错误或其他异常
            const message = err instanceof Error ? err.message : 'Unknown error';
            const isNetworkError = message.includes('fetch') || message.includes('network');
            
            if (isNetworkError && attempt < retries) {
                // 网络错误，重试
                const delay = Math.pow(2, attempt) * 1000; // 指数退避
                console.warn(`[Supabase] Network error, retrying in ${delay}ms...`, message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // 最后一次尝试或非网络错误
            console.error('[Supabase] Failed to save transcript after retries:', {
                message,
                audioId,
                timeRange: `${startTime}-${endTime}`,
                attempts: attempt + 1
            });
            return { success: false, error: message };
        }
    }

    return { success: false, error: 'Max retries exceeded' };
};
