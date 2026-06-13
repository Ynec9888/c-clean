import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { formatFileSize, formatPercentage } from '@/utils/format'
import {
  HardDrive,
  Trash2,
  Shield,
  Zap,
  TrendingUp,
  FileSearch,
  Cpu,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import DiskUsageChart from './DiskUsageChart'
import QuickActions from './QuickActions'

export default function Dashboard() {
  const {
    diskInfo,
    scannedFiles,
    runtimes,
    loadDiskInfo,
    setCurrentView,
    getStats
  } = useAppStore()

  const stats = getStats()

  useEffect(() => {
    loadDiskInfo()
  }, [])

  const cards = [
    {
      title: 'C盘使用情况',
      value: diskInfo ? formatPercentage(diskInfo.used, diskInfo.size) : '加载中...',
      subtitle: diskInfo
        ? `已用 ${formatFileSize(diskInfo.used)} / ${formatFileSize(diskInfo.size)}`
        : '',
      icon: HardDrive,
      color: 'from-blue-500 to-cyan-500',
      onClick: () => {}
    },
    {
      title: '可清理文件',
      value: `${stats.safeFiles} 个文件`,
      subtitle: `预计释放 ${formatFileSize(stats.selectedSize)}`,
      icon: Trash2,
      color: 'from-green-500 to-emerald-500',
      onClick: () => setCurrentView('scanner')
    },
    {
      title: '风险文件',
      value: `${stats.cautionFiles + stats.dangerousFiles} 个`,
      subtitle: `${stats.cautionFiles} 谨慎 / ${stats.dangerousFiles} 危险`,
      icon: Shield,
      color: 'from-yellow-500 to-orange-500',
      onClick: () => setCurrentView('scanner')
    },
    {
      title: '运行时状态',
      value: `${runtimes.filter((r) => r.isInstalled).length} 已安装`,
      subtitle: `${runtimes.filter((r) => r.status === 'healthy').length} 正常运行`,
      icon: Cpu,
      color: 'from-purple-500 to-pink-500',
      onClick: () => setCurrentView('runtime')
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          仪表盘
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          查看C盘状态和快速操作
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={card.onClick}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 图表和快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 磁盘使用图表 */}
        <div className="lg:col-span-2">
          <DiskUsageChart />
        </div>

        {/* 快速操作 */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* 最近扫描结果 */}
      {scannedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              最近扫描结果
            </h3>
            <button
              onClick={() => setCurrentView('scanner')}
              className="text-blue-500 hover:text-blue-600 flex items-center text-sm"
            >
              查看详情
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <FileSearch className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalFiles}
              </p>
              <p className="text-sm text-gray-500">扫描文件</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Trash2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.safeFiles}
              </p>
              <p className="text-sm text-gray-500">可安全清理</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.cautionFiles}
              </p>
              <p className="text-sm text-gray-500">需要谨慎</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Zap className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.dangerousFiles}
              </p>
              <p className="text-sm text-gray-500">高风险文件</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
