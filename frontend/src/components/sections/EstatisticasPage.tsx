import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts'
import { useAllAcoes } from '@/hooks/useAcoes'
import { useMembros } from '@/hooks/useMembros'
import { useQrus } from '@/hooks/useConfig'
import GlowCard from '@/components/ui/GlowCard'
import LoadingHud from '@/components/ui/LoadingHud'
import { calcWinRate } from '@/lib/utils'
import type { Membro, Acao } from '@/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}
const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-bdr rounded p-2 text-xs font-mono">
      <p className="text-txt2 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function EstatisticasPage() {
  const { data: acoesData, isLoading: acoesLoading } = useAllAcoes()
  const { data: membros, isLoading: membrosLoading } = useMembros()
  const { data: qrus } = useQrus()

  const acoes = acoesData?.acoes ?? []

  // Ações por dia da semana
  const weekdayData = useMemo(() => {
    const counts = Array(7).fill(0)
    acoes.forEach(a => {
      const d = new Date(a.data + 'T12:00:00')
      counts[d.getDay()]++
    })
    return WEEKDAYS.map((day, i) => ({ dia: day, ações: counts[i] }))
  }, [acoes])

  // Performance por operador
  const operatorData = useMemo(() => {
    if (!membros) return []
    return membros
      .map((m: Membro) => {
        const memAcoes = acoes.filter(a => a.participants.some(p => p.memberId === m.id))
        return {
          nome: m.policial,
          total: memAcoes.length,
          vitorias: memAcoes.filter(a => a.resultado === 'Vitória').length,
          derrotas: memAcoes.filter(a => a.resultado === 'Derrota').length,
          winRate: calcWinRate(memAcoes),
        }
      })
      .filter(o => o.total > 0)
      .sort((a, b) => b.winRate - a.winRate)
  }, [membros, acoes])

  // Resultados por QRU (stacked)
  const qruData = useMemo(() => {
    return (qrus ?? []).map(q => {
      const qAcoes = acoes.filter(a => a.qru === q)
      return {
        qru: q,
        Vitórias: qAcoes.filter(a => a.resultado === 'Vitória').length,
        Derrotas: qAcoes.filter(a => a.resultado === 'Derrota').length,
        Participações: qAcoes.filter(a => a.resultado === 'Participação').length,
      }
    }).filter(q => q.Vitórias + q.Derrotas + q.Participações > 0)
  }, [acoes, qrus])

  if (acoesLoading || membrosLoading) return <LoadingHud />

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Ações por dia da semana */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">AÇÕES POR DIA DA SEMANA</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekdayData}>
                <XAxis dataKey="dia" tick={{ fill: '#8a7a55', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <YAxis tick={{ fill: '#8a7a55', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ações" radius={[3, 3, 0, 0]}>
                  {weekdayData.map((_, i) => (
                    <Cell key={i} fill={i === 0 || i === 6 ? '#2980b9' : '#c9a227'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Resultados por QRU */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">RESULTADOS POR QRU</h3>
            {qruData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={qruData}>
                  <XAxis dataKey="qru" tick={{ fill: '#8a7a55', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                  <YAxis tick={{ fill: '#8a7a55', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span className="font-mono text-[10px] text-txt2">{v}</span>} />
                  <Bar dataKey="Vitórias" stackId="a" fill="#27ae60" />
                  <Bar dataKey="Derrotas" stackId="a" fill="#c0392b" />
                  <Bar dataKey="Participações" stackId="a" fill="#2980b9" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="font-mono text-xs text-txt3">Sem dados</p>
              </div>
            )}
          </div>
        </GlowCard>
      </div>

      {/* Tabela de performance por operador */}
      <GlowCard>
        <div className="p-4">
          <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">PERFORMANCE POR OPERADOR</h3>
          {operatorData.length === 0 ? (
            <p className="font-mono text-xs text-txt3 text-center py-8">Sem dados suficientes</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bdr">
                  {['Operador', 'Total', 'Vitórias', 'Derrotas', 'Win Rate'].map(h => (
                    <th key={h} className="text-left font-mono text-xs text-txt3 tracking-wider px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={CONTAINER_VARIANTS} initial="hidden" animate="visible">
                {operatorData.map(op => (
                  <motion.tr
                    key={op.nome}
                    variants={ITEM_VARIANTS}
                    className="border-b border-bdr/50 hover:bg-bdr/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-txt">{op.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-txt2">{op.total}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green">{op.vitorias}</td>
                    <td className="px-4 py-3 font-mono text-xs text-red">{op.derrotas}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded bg-bdrg overflow-hidden">
                          <motion.div
                            className="h-full rounded bg-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${op.winRate}%` }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                        <span className="font-orbitron text-xs text-gold w-10 text-right">{op.winRate}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </GlowCard>
    </div>
  )
}
