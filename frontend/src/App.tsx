import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import type { Nivel } from '@/types'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/components/sections/LoginPage'
import DashboardPage from '@/components/sections/DashboardPage'
import RegistrarAcaoPage from '@/components/sections/RegistrarAcaoPage'
import HistoricoPage from '@/components/sections/HistoricoPage'
import EstatisticasPage from '@/components/sections/EstatisticasPage'
import RecrutamentoPage from '@/components/sections/RecrutamentoPage'
import MembrosPage from '@/components/sections/MembrosPage'
import ConfiguracoesPage from '@/components/sections/ConfiguracoesPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  minNivel?: Nivel
}

function ProtectedRoute({ children, minNivel = 'membro' }: ProtectedRouteProps) {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  const RANK: Record<Nivel, number> = { membro: 0, moderador: 1, admin: 2 }
  if (RANK[user.nivel] < RANK[minNivel]) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute><AppShell /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="acoes/nova" element={
              <ProtectedRoute minNivel="moderador"><RegistrarAcaoPage /></ProtectedRoute>
            } />
            <Route path="acoes/historico" element={<HistoricoPage />} />
            <Route path="estatisticas" element={<EstatisticasPage />} />
            <Route path="recrutamento" element={
              <ProtectedRoute minNivel="moderador"><RecrutamentoPage /></ProtectedRoute>
            } />
            <Route path="membros" element={<MembrosPage />} />
            <Route path="configuracoes" element={
              <ProtectedRoute minNivel="moderador"><ConfiguracoesPage /></ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
