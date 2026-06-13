import { useAppStore } from '@/stores/appStore'
import { formatFileSize } from '@/utils/format'
import {
  Scan,
  Trash2,
  RefreshCw,
  Cpu,
  FileSearch,
  Zap,
  Shield
} from 'lucide-react'
import { motion } from 'framer-motion'

const actions = [
  {
    id: 'quick-scan',
    label: '快速扫描',
    description: '扫描临时文件和缓存',
    icon: Scan,
    color: 'from-blue-500 to-cyan-500',
    view: 'scanner' as const
  },
  {
    id: 'clean-temp',
    label: '清理临时文件',
    description: '删除系统和用户临时文件',
    icon: Trash2,
    color: 'from-green-500 to-emerald-500',
    view: 'scanner' as const
  },
  {
    id: 'detect-runtime',
    label: '检测运行时',
    description: '检查C++、.NET、Java等',
    icon: Cpu,
    color: 'from-purple-500 to-pink-500',
    view: 'runtime' as const
  },
  {
    id: 'full-scan',
    label: '深度扫描',
    description: '全面扫描C盘文件',
    icon: FileSearch,
    color: 'from-orange-500 to-red-500',
    view: 'scanner' as const
  }
]

export default function QuickActions() {
  const { setCurrentView, startScan, scannedFiles, getStats } = useAppStore()
  const stats = getStats()

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'quick-scan':
        startScan({ categories: ['temp', 'cache'] })
        setCurrentView('scanner')
        break
      case 'clean-temp':
        startScan({ categories: ['temp'] })
        setCurrentView('scanner')
        break
      case 'detect-runtime':
        setCurrentView('runtime')
        break
      case 'full-scan':
        startScan()
        setCurrentView('scanner')
        break
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        快速操作
      </h3>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleAction(action.id)}
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* 快速统计 */}
      {scannedFiles.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            扫描统计
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  安全文件
                </span>
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {stats.safeFiles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  谨慎文件
                </span>
              </div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {stats.cautionFiles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  可释放空间
                </span>
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {formatFileSize(stats.selectedSize)}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
