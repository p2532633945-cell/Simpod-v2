/**
 * 转录服务 - 支持多模型转录和相似度对比
 *
 * Phase 6.1.2: 多模型转录对比
 * - Groq Whisper（快速、免费）
 * - OpenAI Whisper（准确率更高，可选）
 * - 计算相似度，生成置信度评分
 * - 无 OpenAI Key 时使用启发式算法估算置信度
 */

/**
 * 使用 OpenAI Whisper API 转录音频
 *
 * @param audioBuffer 音频数据
 * @returns 转录文本
 */
export async function transcribeWithOpenAI(audioBuffer: ArrayBuffer): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    console.log('[Transcription] Calling OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Transcription] OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('[Transcription] OpenAI transcription completed');
    return data.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Transcription] OpenAI transcription failed:', message);
    throw err;
  }
}

/**
 * 计算 Levenshtein 距离
 *
 * 用于衡量两个字符串的相似度
 * 距离越小，相似度越高
 *
 * @param s1 第一个字符串
 * @param s2 第二个字符串
 * @returns Levenshtein 距离
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const dp: number[][] = Array(s1.length + 1)
    .fill(null)
    .map(() => Array(s2.length + 1).fill(0));

  // 初始化第一行和第一列
  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  // 填充 DP 表
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],      // 删除
          dp[i][j - 1],      // 插入
          dp[i - 1][j - 1]   // 替换
        );
      }
    }
  }

  return dp[s1.length][s2.length];
}

/**
 * 计算两个转录文本的相似度
 *
 * 基于 Levenshtein 距离，返回 0-100 的相似度百分比
 *
 * @param text1 第一个转录文本
 * @param text2 第二个转录文本
 * @returns 相似度百分比 (0-100)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // 标准化文本：转小写、去除多余空格
  const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);

  // 计算 Levenshtein 距离
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  // 避免除以零
  if (maxLength === 0) return 100;

  // 转换为相似度百分比
  const similarity = (1 - distance / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * 对比两个转录文本并生成置信度评分
 *
 * 规则：
 * - 相似度 > 90%：高置信度（100）
 * - 相似度 70-90%：中置信度（相似度值）
 * - 相似度 < 70%：低置信度（相似度值），标记为需人工审核
 *
 * @param groqText Groq 转录文本
 * @param openaiText OpenAI 转录文本
 * @returns { similarity, confidence, needsReview }
 */
export function compareTranscriptions(
  groqText: string,
  openaiText: string
): {
  similarity: number;
  confidence: number;
  needsReview: boolean;
} {
  const similarity = calculateSimilarity(groqText, openaiText);

  let confidence: number;
  let needsReview: boolean;

  if (similarity > 90) {
    confidence = 100;
    needsReview = false;
  } else if (similarity >= 70) {
    confidence = similarity;
    needsReview = false;
  } else {
    confidence = similarity;
    needsReview = true;
  }

  console.log('[Transcription] Comparison result:', {
    similarity,
    confidence,
    needsReview
  });

  return { similarity, confidence, needsReview };
}

/**
 * 计算音频片段的哈希值
 *
 * 用于缓存键生成
 *
 * @param audioBuffer 音频数据
 * @returns SHA-256 哈希值
 */
export async function calculateAudioHash(audioBuffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', audioBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('[Transcription] Audio hash calculated:', hashHex.slice(0, 16) + '...');
    return hashHex;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Transcription] Failed to calculate audio hash:', message);
    throw err;
  }
}

/**
 * 启发式置信度估算（无需 OpenAI API）
 *
 * 开发阶段替代方案：基于转录文本质量特征估算置信度
 * - 文本长度合理（非空、非极短）
 * - 没有大量重复词（ASR 幻觉的典型特征，如 "the the the..."）
 * - 没有过多特殊字符
 *
 * 当没有配置 OPENAI_API_KEY 时自动使用此函数。
 * 生产阶段可配置 OpenAI Key 切换为真实双模型对比。
 *
 * @param text Groq 转录文本
 * @returns 估算的置信度百分比 (0-100)
 */
export function estimateConfidenceFromText(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  // 太短（可能是背景噪音或转录失败）
  if (wordCount < 3) return 40;

  // 检查重复词（ASR 幻觉："the the the the..."）
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const uniqueRatio = uniqueWords.size / wordCount;
  if (uniqueRatio < 0.3) return 50;

  // 检查是否含有失败标记（如 [BLANK_AUDIO]）
  if (/\[.*?\]/.test(text)) return 45;

  // 检查字母/汉字比例（正常转录应以字母为主）
  const alphaCount = (text.match(/[a-zA-Z\u4e00-\u9fa5]/g) || []).length;
  const alphaRatio = alphaCount / text.length;
  if (alphaRatio < 0.5) return 55;

  // 正常文本：词数越多说明转录越完整
  if (wordCount >= 20) return 88;
  if (wordCount >= 10) return 85;
  return 80;
}
