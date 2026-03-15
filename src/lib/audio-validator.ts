/**
 * Audio URL Validator
 *
 * 验证和清理音频 URL，处理常见的音频 URL 问题
 */

/**
 * 验证音频 URL 是否有效
 * 采用宽松策略：只检查基本 URL 格式有效性
 * 实际可访问性通过 audio-tester 工具进行二次验证
 */
export function validateAudioUrl(url: string): {
  valid: boolean
  cleanedUrl: string
  error?: string
} {
  if (!url || typeof url !== 'string') {
    return { valid: false, cleanedUrl: '', error: 'Invalid URL' }
  }

  // 转换 HTTP→HTTPS
  let cleanedUrl = url.trim()
  if (cleanedUrl.startsWith('http://')) {
    cleanedUrl = cleanedUrl.replace('http://', 'https://')
    console.log('[AudioValidator] Converting HTTP to HTTPS:', url, '→', cleanedUrl)
  }

  // 基本 URL 格式检查
  if (!cleanedUrl.startsWith('https://') && !cleanedUrl.startsWith('http://')) {
    return { valid: false, cleanedUrl: '', error: 'URL must start with http:// or https://' }
  }

  // 尝试解析 URL 以验证格式
  try {
    new URL(cleanedUrl)
  } catch {
    return { valid: false, cleanedUrl: '', error: 'Invalid URL format' }
  }

  // 宽松策略：允许任何有效的 URL
  // 实际可访问性由 audio-tester 工具验证
  console.log('[AudioValidator] URL validated (basic check):', cleanedUrl)

  return { valid: true, cleanedUrl }
}

/**
 * 测试音频 URL 是否可访问
 * 注意：这会发起实际请求，仅在必要时使用
 */
export async function testAudioUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type') || ''
    const isAudio = contentType.startsWith('audio/')
    console.log('[AudioValidator] Test result:', { url, contentType, isAudio })
    return isAudio
  } catch (error) {
    console.error('[AudioValidator] Test failed:', error)
    return false
  }
}

/**
 * 提取音频文件扩展名
 */
export function getAudioExtension(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot > 0) {
      return pathname.substring(lastDot)
    }
    return null
  } catch {
    return null
  }
}

/**
 * 判断是否为流式音频 URL
 */
export function isStreamUrl(url: string): boolean {
  return url.toLowerCase().includes('.m3u8') ||
         url.toLowerCase().includes('stream') ||
         url.toLowerCase().includes('live')
}
