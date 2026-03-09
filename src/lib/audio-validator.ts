/**
 * Audio URL Validator
 *
 * 验证和清理音频 URL，处理常见的音频 URL 问题
 */

/**
 * 验证音频 URL 是否有效
 * 检查协议、格式、基本可用性
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
  let cleanedUrl = url
  if (url.startsWith('http://')) {
    cleanedUrl = url.replace('http://', 'https://')
    console.log('[AudioValidator] Converting HTTP to HTTPS:', url, '→', cleanedUrl)
  }

  // 检查是否是音频文件
  const audioExtensions = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.aac', '.m3u8', '.m4v']
  const hasAudioExtension = audioExtensions.some(ext => cleanedUrl.toLowerCase().endsWith(ext))

  // 检查常见音频托管域名
  const audioHosts = [
    'soundhelix.com',
    'archive.org',
    'bbc.co.uk',
    'podcasts.apple.com',
    'cdn',
    'media',
    'audio',
    'traffic.megaphone.fm',
    'simplecast.com',
    'buzzsprout.com',
    'libsyn.com',
    'megaphone.fm',
    'omnystudio.com',
    'podtrac.com'
  ]
  const hasAudioHost = audioHosts.some(host => cleanedUrl.toLowerCase().includes(host))

  if (!hasAudioExtension && !hasAudioHost) {
    console.warn('[AudioValidator] URL may not be an audio file:', cleanedUrl)
  }

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
