/**
 * Supabase Client Setup
 *
 * 注意：根据v2项目使用的框架，环境变量的访问方式可能不同
 * - Vite: import.meta.env.VITE_SUPABASE_URL
 * - Next.js: process.env.NEXT_PUBLIC_SUPABASE_URL
 * - 其他框架：根据实际情况调整
 */

import { createClient } from '@supabase/supabase-js';

// 根据你的框架调整环境变量访问方式
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

/**
 * TypeScript 类型定义
 */
export interface Anchor {
  id: string;
  audio_id: string;
  timestamp: number;
  source: 'manual' | 'auto';
  created_at: string;
}

export interface Hotzone {
  id: string;
  audio_id: string;
  start_time: number;
  end_time: number;
  transcript_snippet?: string;
  transcript_words?: Array<{ word: string; start: number; end: number }>;
  source: 'manual' | 'auto';
  metadata: {
    confidence?: number;
    difficulty_score?: number;
    user_adjustment_history?: Array<{
      action: string;
      timestamp: string;
    }>;
    transcript_words?: Array<{ word: string; start: number; end: number }>;
  };
  status: 'pending' | 'reviewed' | 'archived';
  created_at: string;
}

export interface TranscriptSegment {
  audio_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}
