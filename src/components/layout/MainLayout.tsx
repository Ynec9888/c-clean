import { ReactNode } from 'react'
import { useAppStore } from '@/stores/appStore'
import Sidebar from './Sidebar'
import TitleBar from './TitleBar'
import { motion, AnimatePresence } from 'framer-motion'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed, theme } = useAppStore()

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 标题栏 */}
      <TitleBar />

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <main
          className={`flex-1 overflow-auto transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={useAppStore.getState().currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
