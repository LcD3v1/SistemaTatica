import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/ToastNotification'
import ScanlineOverlay from '@/components/ui/ScanlineOverlay'

export default function AppShell() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <ScanlineOverlay />
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
