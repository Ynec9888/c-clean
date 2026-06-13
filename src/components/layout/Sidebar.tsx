import { useAppStore } from '@/stores/appStore'
import {
  LayoutDashboard,
  Search,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    description: '概览和快速操作'
  },
  {
    id: 'scanner',
    label: '文件扫描',
    icon: Search,
    description: '扫描和清理文件'
  },
  {
    id: 'runtime',
    label: '运行时检测',
    icon: Cpu,
    description: '检测运行库状态'
  },
  {
    id: 'settings',
    label: '设置',
    icon: Settings,
    description: '配置和API设置'
  }
]

export default function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      className="fixed left-0 top-10 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-10"
    >
      {/* 导航项 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : ''
                }`}
              />
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-3 text-left"
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {item.description}
                  </div>
                </motion.div>
              )}
            </button>
          )
        })}
      </nav>

      {/* 折叠按钮 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
