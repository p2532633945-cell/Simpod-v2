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
export const saveHotzone = async (hotzone: Hotzone, audioUrl?: string) => {
  const supabase = createClient();

  // Create a copy to avoid mutating original object used in UI
  const payload = { ...hotzone } as Hotzone & { user_id?: string };

  // P1-4: 关联当前登录用户
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    payload.user_id = user.id;
    console.log('[Supabase] Attaching user_id to hotzone:', user.id);
  }

  // 关键修复：将 transcript_words 从顶层移到 metadata 中
  // 数据库 schema 中 transcript_words 不是顶层列，而是在 metadata JSONB 中
  const dbPayload: Record<string, unknown> = { ...payload };
  if (dbPayload.transcript_words) {
    console.log('[Supabase] Moving transcript_words to metadata for schema compatibility');
    dbPayload.metadata = {
      ...(payload.metadata as object),
      transcript_words: payload.transcript_words
    };
    delete dbPayload.transcript_words;
  }

  // P4-5 性能优化：保存 audioUrl 到 metadata 以便从复盘页面跳转时使用
  if (audioUrl) {
    dbPayload.metadata = {
      ...(dbPayload.metadata as object),
      audioUrl: audioUrl
    };
    console.log('[Supabase] Saving audioUrl to metadata for playback');
  }

  try {
    console.log('[Supabase] Saving hotzone:', { id: dbPayload.id, audioId: dbPayload.audio_id });
    const { data, error } = await supabase
      .from('hotzones')
      .upsert(dbPayload, { onConflict: 'id' })
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
 * 获取所有热区（复盘页面用）
 *
 * 将 metadata.transcript_words 拉到顶层供UI使用
 */
export const fetchAllHotzones = async (): Promise<Hotzone[]> => {
  const supabase = createClient();

  try {
    // P1-4: 只获取当前用户的热区
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Supabase] DIAG: fetchAllHotzones - user_id:', user?.id);
    
    let query = supabase
      .from('hotzones')
      .select('*')
      .order('created_at', { ascending: false });
    if (user) {
      query = query.eq('user_id', user.id);
      console.log('[Supabase] DIAG: Added user_id filter to fetchAllHotzones query');
    } else {
      console.log('[Supabase] DIAG: No user logged in, returning empty hotzones from fetchAllHotzones');
      return [];
    }
    const { data, error } = await query;

    if (error) {
      const errorInfo = {
        message: String(error.message || 'Unknown error'),
        code: String(error.code || 'UNKNOWN'),
      };
      console.error('[Supabase] Error fetching all hotzones:', errorInfo);
      throw new Error(errorInfo.message);
    }

    console.log('[Supabase] DIAG: fetchAllHotzones result count:', data?.length);

    return (data as any[]).map(hz => {
      if (hz.metadata && hz.metadata.transcript_words) {
        return { ...hz, transcript_words: hz.metadata.transcript_words };
      }
      return hz;
    }) as Hotzone[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Supabase] fetchAllHotzones exception:', { message });
    throw err;
  }
};

/**
 * 更新热区状态
 */
export const updateHotzoneStatus = async (
  hotzoneId: string,
  status: 'pending' | 'reviewed' | 'archived'
): Promise<void> => {
  const supabase = createClient();

  const { error } = await supabase
    .from('hotzones')
    .update({ status })
    .eq('id', hotzoneId);

  if (error) {
    console.error('[Supabase] Error updating hotzone status:', { message: error.message, hotzoneId });
    throw new Error(error.message);
  }
  console.log(`[Supabase] Hotzone ${hotzoneId} status updated to: ${status}`);
};

/**
 * 获取指定音频的所有热区
 *
 * 将 metadata.transcript_words 拉到顶层供UI使用
 */
export const fetchHotzones = async (audioId: string): Promise<Hotzone[]> => {
  const supabase = createClient();

  try {
    // P1-4: 只获取当前用户的热区
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Supabase] DIAG: fetchHotzones - user_id:', user?.id, 'audio_id:', audioId);
    
    let query = supabase
      .from('hotzones')
      .select('*')
      .eq('audio_id', audioId)
      .order('start_time', { ascending: true });
    if (user) {
      query = query.eq('user_id', user.id);
      console.log('[Supabase] DIAG: Added user_id filter to query');
    } else {
      console.log('[Supabase] DIAG: No user logged in, returning empty hotzones');
      return [];
    }
    
    const { data, error } = await query;

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

    console.log('[Supabase] DIAG: Query result count:', data?.length);
    console.log('[Supabase] DIAG: Raw hotzones data:', data?.map((hz: any) => ({
      id: hz.id,
      audio_id: hz.audio_id,
      user_id: hz.user_id,
      start_time: hz.start_time,
      end_time: hz.end_time
    })));

    // Transform back for UI: pull transcript_words from metadata to top-level
    const transformed = (data as any[]).map(hz => {
        if (hz.metadata && hz.metadata.transcript_words) {
            return {
                ...hz,
                transcript_words: hz.metadata.transcript_words
            };
        }
        return hz;
    }) as Hotzone[];
    
    console.log('[Supabase] DIAG: Transformed hotzones for UI:', transformed.length);
    return transformed;
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
