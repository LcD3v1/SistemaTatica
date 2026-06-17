import { motion, AnimatePresence } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, History, BarChart2,
  Users, Settings, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useLogo } from '@/hooks/useConfig'

const NAV_ITEMS = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',         nivel: 'membro'    },
  { to: '/acoes/nova',      icon: PlusCircle,      label: 'Registrar Ação',    nivel: 'moderador' },
  { to: '/acoes/historico', icon: History,          label: 'Histórico',         nivel: 'membro'    },
  { to: '/estatisticas',    icon: BarChart2,        label: 'Estatísticas',      nivel: 'membro'    },
  { to: '/recrutamento',    icon: UserPlus,         label: 'Recrutamento',      nivel: 'moderador' },
  { to: '/membros',         icon: Users,            label: 'Membros',           nivel: 'membro'    },
  { to: '/configuracoes',   icon: Settings,         label: 'Configurações',     nivel: 'moderador' },
] as const

const RANK = { membro: 0, moderador: 1, admin: 2 } as const

export default function Sidebar() {
  const { user } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const { data: logoData } = useLogo()

  const userRank = user ? RANK[user.nivel] : 0
  const visibleItems = NAV_ITEMS.filter(item => userRank >= RANK[item.nivel])

  return (
    <motion.nav
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className={`
        bg-sb border-r border-bdr flex flex-col shrink-0 overflow-hidden
        transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo + nome */}
      <div className="flex flex-col items-center py-6 px-3 border-b border-bdr gap-3">
        <div className="logo-ring" style={{ width: 56, height: 56 }}>
          {logoData?.logo ? (
            <img src={logoData.logo} alt="Logo" className="logo-circle" />
          ) : (
            <span className="logo-fallback" style={{ fontSize: 9 }}>PMC<br />TÁTICA</span>
          )}
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-center overflow-hidden whitespace-nowrap"
            >
              <p className="font-orbitron text-xs font-bold text-gold tracking-widest">TÁTICA</p>
              <p className="font-mono text-[10px] text-txt3 tracking-wider">SISTEMA INTERNO</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group
              ${isActive
                ? 'bg-bdrg border-l-2 border-gold text-gold'
                : 'text-txt2 hover:text-txt hover:bg-bdr border-l-2 border-transparent'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs tracking-wide whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 border-t border-bdr"
          >
            <p className="font-mono text-[9px] text-txt3 text-center tracking-widest">
              © SISTEMA TÁTICA v2.0
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
