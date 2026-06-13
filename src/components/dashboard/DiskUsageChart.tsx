import { useAppStore } from '@/stores/appStore'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function DiskUsageChart() {
  const { diskInfo } = useAppStore()

  // 安全的数据转换
  const safeNumber = (val: any): number => {
    const num = Number(val)
    return isNaN(num) || !isFinite(num) ? 0 : num
  }

  const size = safeNumber(diskInfo?.size)
  const used = safeNumber(diskInfo?.used)
  const available = safeNumber(diskInfo?.available)

  // 转换为 GB
  const toGB = (bytes: number) => bytes / (1024 * 1024 * 1024)

  const totalGB = toGB(size)
  const usedGB = toGB(used)
  const freeGB = toGB(available)
  const usedPercent = totalGB > 0 ? (usedGB / totalGB) * 100 : 0

  const data = [
    { name: '已使用', value: Math.max(0, usedGB) },
    { name: '可用空间', value: Math.max(0, freeGB) }
  ]

  const getUsageColor = () => {
    if (usedPercent > 90) return 'text-red-500'
    if (usedPercent > 80) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (!diskInfo || size === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          C盘使用情况
        </h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">正在获取磁盘信息...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        C盘使用情况
      </h3>

      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS[0] : '#E5E7EB'}
                    className="dark:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)} GB`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 中心文字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getUsageColor()}`}>
              {usedPercent.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              已使用
            </span>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">总容量</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {totalGB.toFixed(0)} GB
          </p>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">已使用</p>
          <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
            {usedGB.toFixed(0)} GB
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">可用</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {freeGB.toFixed(0)} GB
          </p>
        </div>
      </div>

      {/* 使用率提示 */}
      {usedPercent > 80 && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            usedPercent > 90
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          <p className="text-sm">
            {usedPercent > 90
              ? '⚠️ C盘空间严重不足，建议立即清理'
              : '⚡ C盘空间不足，建议清理不需要的文件'}
          </p>
        </div>
      )}
    </motion.div>
  )
}
