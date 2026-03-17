/**
 * 日志工具 - Phase 5 性能优化
 * 
 * 在开发环境显示详细日志，生产环境只显示错误
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (module: string, message: string, data?: any) => {
    if (isDev) {
      console.log(`[${module}] ${message}`, data || '')
    }
  },
  
  info: (module: string, message: string, data?: any) => {
    if (isDev) {
      console.log(`[${module}] ${message}`, data || '')
    }
  },
  
  warn: (module: string, message: string, data?: any) => {
    console.warn(`[${module}] ${message}`, data || '')
  },
  
  error: (module: string, message: string, data?: any) => {
    console.error(`[${module}] ${message}`, data || '')
  },
  
  // 诊断日志（只在开发环境显示）
  diag: (module: string, message: string, data?: any) => {
    if (isDev) {
      console.log(`[${module}] DIAG: ${message}`, data || '')
    }
  }
}
