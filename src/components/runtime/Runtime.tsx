import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import {
  getRuntimeTypeLabel,
  getRuntimeStatusLabel,
  getRuntimeStatusColor
} from '@/utils/format'
import {
  Cpu,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Runtime() {
  const { runtimes, isLoadingRuntimes, loadRuntimes } = useAppStore()
  const [expandedRuntime, setExpandedRuntime] = useState<string | null>(null)

  useEffect(() => {
    loadRuntimes()
  }, [])

  const installedCount = runtimes.filter((r) => r.isInstalled).length
  const healthyCount = runtimes.filter((r) => r.status === 'healthy').length
  const missingCount = runtimes.filter((r) => !r.isInstalled).length

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          运行时检测
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          检测系统中安装的运行库和依赖项
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">已安装</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {installedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">运行正常</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {healthyCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">未安装</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {missingCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <button
          onClick={loadRuntimes}
          disabled={isLoadingRuntimes}
          className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoadingRuntimes ? 'animate-spin' : ''}`}
          />
          {isLoadingRuntimes ? '检测中...' : '刷新检测'}
        </button>
      </div>

      {/* 运行时列表 */}
      <div className="space-y-4">
        {runtimes.map((runtime, index) => {
          const isExpanded = expandedRuntime === runtime.id
          const statusColors = getRuntimeStatusColor(runtime.status)

          return (
            <motion.div
              key={runtime.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* 运行时头部 */}
              <div
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedRuntime(isExpanded ? null : runtime.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 图标 */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        runtime.isInstalled
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <Cpu
                        className={`w-6 h-6 ${
                          runtime.isInstalled
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>

                    {/* 信息 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {runtime.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getRuntimeTypeLabel(runtime.type)}
                        </span>
                        {runtime.version && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">
                              •
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              v{runtime.version}
                            </span>
                          </>
                        )}
                        {runtime.isEssential && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">
                              •
                            </span>
                            <span className="text-sm text-orange-500 dark:text-orange-400">
                              重要组件
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* 状态标签 */}
                    <span
                      className={`px-3 py-1 text-sm ${statusColors.bg} ${statusColors.text} rounded-full`}
                    >
                      {getRuntimeStatusLabel(runtime.status)}
                    </span>

                    {/* 展开/折叠 */}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* 展开详情 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
                  >
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                      {/* 描述 */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {runtime.description}
                      </p>

                      {/* 详细信息 */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            安装路径
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                            {runtime.installPath || '未安装'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            版本
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {runtime.version || '未知'}
                          </p>
                        </div>
                      </div>

                      {/* 依赖软件 */}
                      {runtime.dependentSoftware.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            依赖此运行时的软件
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {runtime.dependentSoftware.map((software) => (
                              <span
                                key={software.name}
                                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                              >
                                {software.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2">
                        {!runtime.isInstalled && runtime.downloadUrl && (
                          <a
                            href={runtime.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载安装
                            <ExternalLink className="w-3 h-3 ml-1.5" />
                          </a>
                        )}
                        {runtime.isInstalled && (
                          <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Package className="w-4 h-4 mr-2" />
                            查看详情
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* 空状态 */}
      {!isLoadingRuntimes && runtimes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-100 dark:border-gray-700 text-center"
        >
          <Cpu className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            未检测到运行时
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            点击"刷新检测"按钮重新扫描系统中的运行库
          </p>
        </motion.div>
      )}

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 什么是运行时？
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          运行时（Runtime）是程序运行所需要的基础库和环境。例如 Visual C++
          Redistributable 是许多Windows应用程序运行的必要组件，.NET Framework
          是.NET程序的基础，Java运行时是Java程序的基础。删除运行时可能导致依赖它的软件无法运行。
        </p>
      </div>
    </div>
  )
}
