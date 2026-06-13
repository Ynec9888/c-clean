import { motion } from 'framer-motion'
import { ScanProgress as ScanProgressType } from '@/types/electron'
import { formatFileSize } from '@/utils/format'

interface ScanProgressProps {
  progress: ScanProgressType
}

export default function ScanProgress({ progress }: ScanProgressProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700"
    >
      {/* 进度条 */}
      <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>

      {/* 进度信息 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">扫描进度</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {progress.percentage}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">发现文件</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {progress.filesFound}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">总大小</p>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {formatFileSize(progress.totalSize)}
          </p>
        </div>
      </div>

      {/* 当前扫描路径 */}
      <div className="mt-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          正在扫描: {progress.currentPath}
        </p>
      </div>

      {/* 扫描动画 */}
      <div className="mt-4 flex items-center justify-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 bg-blue-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 bg-blue-500 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 bg-blue-500 rounded-full"
        />
      </div>
    </motion.div>
  )
}
