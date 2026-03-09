/**
 * Supabase Connection Test Utility
 *
 * 用于测试 Supabase 数据库连接
 */

import { createClient } from '@/lib/supabase/client';

export async function testSupabaseConnection() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('hotzones')
      .select('count')
      .limit(1);

    if (error) {
      console.error('[Test] Supabase connection failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    console.log('[Test] Supabase connection OK');
    return { success: true, data };
  } catch (err) {
    const error = err as Error;
    console.error('[Test] Supabase exception:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      error: {
        message: error.message,
        name: error.name
      }
    };
  }
}

/**
 * 测试完整的 hotzone 操作流程
 */
export async function testHotzoneOperations(audioId: string) {
  const results = {
    connection: false,
    fetch: false,
    save: false,
    errors: [] as string[]
  };

  // Test 1: Connection
  try {
    const connResult = await testSupabaseConnection();
    results.connection = connResult.success;
    if (!connResult.success) {
      results.errors.push(`Connection failed: ${connResult.error?.message}`);
      return results;
    }
  } catch (err) {
    results.errors.push(`Connection exception: ${err}`);
    return results;
  }

  // Test 2: Fetch hotzones
  try {
    const { fetchHotzones } = await import('@/services/supabase');
    const hotzones = await fetchHotzones(audioId);
    results.fetch = true;
    console.log(`[Test] Fetched ${hotzones.length} hotzones for audioId: ${audioId}`);
  } catch (err) {
    const error = err as Error;
    results.errors.push(`Fetch failed: ${error.message}`);
  }

  return results;
}
