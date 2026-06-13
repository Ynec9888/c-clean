/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) {
    return `${Math.floor(days / 30)} 个月前`
  } else if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

/**
 * 获取风险等级颜色
 */
export function getRiskColor(risk: 'safe' | 'caution' | 'dangerous'): {
  bg: string
  text: string
  border: string
  icon: string
} {
  switch (risk) {
    case 'safe':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500'
      }
    case 'caution':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500'
      }
    case 'dangerous':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500'
      }
  }
}

/**
 * 获取风险等级标签
 */
export function getRiskLabel(risk: 'safe' | 'caution' | 'dangerous'): string {
  switch (risk) {
    case 'safe':
      return '安全'
    case 'caution':
      return '谨慎'
    case 'dangerous':
      return '危险'
  }
}

/**
 * 获取文件类别标签
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    temp: '临时文件',
    cache: '缓存文件',
    log: '日志文件',
    download: '下载文件',
    dump: '转储文件',
    recycle: '回收站',
    update: '更新缓存',
    thumbnail: '缩略图',
    crash: '崩溃报告',
    other: '其他'
  }
  return labels[category] || category
}

/**
 * 获取文件类别图标
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    temp: 'FileTemp',
    cache: 'Database',
    log: 'FileText',
    download: 'Download',
    dump: 'HardDrive',
    recycle: 'Trash2',
    update: 'RefreshCw',
    thumbnail: 'Image',
    crash: 'AlertTriangle',
    other: 'File'
  }
  return icons[category] || 'File'
}

/**
 * 获取运行时类型标签
 */
export function getRuntimeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    vcredist: 'Visual C++',
    dotnet: '.NET',
    java: 'Java',
    python: 'Python',
    nodejs: 'Node.js',
    directx: 'DirectX',
    opengl: 'OpenGL',
    vulkan: 'Vulkan',
    msvc: 'MSVC',
    other: '其他'
  }
  return labels[type] || type
}

/**
 * 获取运行时状态标签
 */
export function getRuntimeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    healthy: '正常',
    corrupted: '损坏',
    outdated: '过时',
    missing: '未安装'
  }
  return labels[status] || status
}

/**
 * 获取运行时状态颜色
 */
export function getRuntimeStatusColor(status: string): {
  bg: string
  text: string
} {
  switch (status) {
    case 'healthy':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300'
      }
    case 'corrupted':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300'
      }
    case 'outdated':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300'
      }
    case 'missing':
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-700 dark:text-gray-300'
      }
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-700 dark:text-gray-300'
      }
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}
