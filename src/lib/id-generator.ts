/**
 * 统一的 ID 生成工具库
 *
 * 提供多种 ID 生成策略：
 * - 随机 ID（快速，适合客户端）
 * - UUID v4（标准，适合全局唯一）
 * - 时间戳 ID（有序，适合排序）
 * - 纳秒 ID（高精度，适合并发）
 */

/**
 * 生成随机 ID（9 位字母数字）
 * 
 * 优点：快速，简洁
 * 缺点：可能冲突（概率极低）
 * 用途：客户端临时 ID、热区 ID、锚点 ID
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * 生成带前缀的随机 ID
 * 
 * 示例：
 * - generatePrefixedId('hz') → 'hz_a1b2c3d4e'
 * - generatePrefixedId('anc') → 'anc_f5g6h7i8j'
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${generateRandomId()}`;
}

/**
 * 生成时间戳 ID（有序）
 * 
 * 格式：timestamp_randomSuffix
 * 优点：有序，便于排序和索引
 * 缺点：可能冲突（同一毫秒内）
 * 用途：需要排序的 ID（如日志、事件）
 */
export function generateTimestampId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成纳秒精度 ID（高精度）
 * 
 * 优点：高精度，极低冲突概率
 * 缺点：依赖 performance.now()
 * 用途：高并发场景
 */
export function generateNanoId(): string {
  const timestamp = Date.now();
  const nanoTime = Math.floor(performance.now() * 1000000) % 1000000;
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${nanoTime}_${random}`;
}

/**
 * 生成 UUID v4（标准格式）
 * 
 * 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 优点：标准，全局唯一
 * 缺点：较长，生成较慢
 * 用途：需要标准 UUID 的场景
 */
export function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ID 生成器工厂
 * 
 * 根据类型选择合适的生成策略
 */
export type IdType = 'random' | 'timestamp' | 'nano' | 'uuid';

export function generateId(type: IdType = 'random'): string {
  switch (type) {
    case 'random':
      return generateRandomId();
    case 'timestamp':
      return generateTimestampId();
    case 'nano':
      return generateNanoId();
    case 'uuid':
      return generateUUIDv4();
    default:
      return generateRandomId();
  }
}

/**
 * 生成带前缀的 ID
 */
export function generateIdWithPrefix(prefix: string, type: IdType = 'random'): string {
  return `${prefix}_${generateId(type)}`;
}

/**
 * ID 验证工具
 */
export const IdValidator = {
  /**
   * 验证随机 ID 格式
   */
  isRandomId(id: string): boolean {
    return /^[a-z0-9]{9}$/.test(id);
  },

  /**
   * 验证带前缀的 ID 格式
   */
  isPrefixedId(id: string, prefix: string): boolean {
    return id.startsWith(`${prefix}_`) && this.isRandomId(id.substring(prefix.length + 1));
  },

  /**
   * 验证时间戳 ID 格式
   */
  isTimestampId(id: string): boolean {
    const parts = id.split('_');
    return parts.length === 2 && !isNaN(Number(parts[0]));
  },

  /**
   * 验证 UUID v4 格式
   */
  isUUIDv4(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  },

  /**
   * 验证任何 ID 格式
   */
  isValidId(id: string): boolean {
    return (
      this.isRandomId(id) ||
      this.isTimestampId(id) ||
      this.isUUIDv4(id) ||
      /^[a-z]+_/.test(id) // 带前缀的 ID
    );
  },
};

/**
 * ID 统计工具（用于调试）
 */
export class IdGenerator {
  private generatedIds = new Set<string>();
  private collisions = 0;

  /**
   * 生成 ID 并记录
   */
  generate(type: IdType = 'random', prefix?: string): string {
    const id = prefix ? generateIdWithPrefix(prefix, type) : generateId(type);

    if (this.generatedIds.has(id)) {
      this.collisions++;
      console.warn(`[IdGenerator] Collision detected: ${id}`);
    }

    this.generatedIds.add(id);
    return id;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    collisions: number;
    collisionRate: number;
  } {
    const total = this.generatedIds.size;
    const collisionRate = total > 0 ? (this.collisions / total) * 100 : 0;

    return {
      total,
      collisions: this.collisions,
      collisionRate,
    };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.generatedIds.clear();
    this.collisions = 0;
  }
}

// 全局单例
let globalIdGenerator: IdGenerator | null = null;

/**
 * 获取全局 ID 生成器
 */
export function getIdGenerator(): IdGenerator {
  if (!globalIdGenerator) {
    globalIdGenerator = new IdGenerator();
  }
  return globalIdGenerator;
}
