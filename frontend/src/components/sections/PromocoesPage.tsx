import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpNarrowWide, ChevronsUp, Calendar, Clock, ChevronDown, Save, FileText } from 'lucide-react'
import { useMembros, useUpdateMembro } from '@/hooks/useMembros'
import { useAllAcoes } from '@/hooks/useAcoes'
import { usePatentes } from '@/hooks/useConfig'
import { usePerms } from '@/hooks/usePerms'
import { useUIStore } from '@/store/uiStore'
import LoadingHud from '@/components/ui/LoadingHud'
import type { Membro, Acao } from '@/types'

function fmt(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function diasDesde(d: string) {
  if (!d) return null
  const ms = Date.now() - new Date(d + 'T12:00:00').getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}
function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}
function avaliar(winRate: number, total: number) {
  if (total < 3) return { label: 'Sem dados', cls: 'text-txt3 border-bdr2 bg-white/5' }
  if (winRate >= 75) return { label: 'Excelente', cls: 'text-green border-green/40 bg-green/10' }
  if (winRate >= 55) return { label: 'Bom', cls: 'text-gold3 border-gold/40 bg-gold/10' }
  if (winRate >= 35) return { label: 'Regular', cls: 'text-blue border-blue/40 bg-blue/10' }
  return { label: 'Baixo', cls: 'text-red border-red/40 bg-red/10' }
}

const GRID = 'grid grid-cols-[1.6fr_1fr_0.55fr_0.55fr_0.7fr_0.9fr_auto] gap-3'

export default function PromocoesPage() {
  const { data: membros, isLoading: lm } = useMembros()
  const { data: acoesData, isLoading: la } = useAllAcoes()
  const { data: patentes = [] } = usePatentes()
  const updateMembro = useUpdateMembro()
  const { canEdit } = usePerms()
  const { addToast } = useUIStore()

  const isMod = canEdit('promocoes')

  const [openId, setOpenId] = useState<number | null>(null)
  const [form, setForm] = useState<{ horasSemana: number; observacoes: string }>({ horasSemana: 0, observacoes: '' })

  const rows = useMemo(() => {
    const acoes: Acao[] = (acoesData?.acoes ?? []).filter(a => (a.status ?? 'aprovada') === 'aprovada')
    return (membros ?? []).map((m: Membro) => {
      const mine = acoes.filter(a => a.participants.some(p => p.memberId === m.id))
      const vitorias = mine.filter(a => a.resultado === 'Vitória').length
      const derrotas = mine.filter(a => a.resultado === 'Derrota').length
      const fechadas = vitorias + derrotas
      const winRate = fechadas ? Math.round((vitorias / fechadas) * 100) : 0
      return { m, vitorias, derrotas, winRate, aval: avaliar(winRate, fechadas), dias: diasDesde(m.promocao) }
    }).sort((a, b) => b.winRate - a.winRate || b.vitorias - a.vitorias)
  }, [membros, acoesData])

  function promover(m: Membro) {
    const idx = patentes.indexOf(m.patenteInterna)
    const proxima = idx >= 0 && idx < patentes.length - 1 ? patentes[idx + 1] : null
    if (!proxima) { addToast('error', `${m.policial} já está na patente máxima.`); return }
    if (!confirm(`Promover ${m.policial} de "${m.patenteInterna || '—'}" para "${proxima}"?`)) return
    updateMembro.mutate(
      { id: m.id, patenteInterna: proxima, promocao: new Date().toISOString().slice(0, 10) },
      { onSuccess: () => addToast('success', `${m.policial} promovido a ${proxima}!`) },
    )
  }

  function toggle(m: Membro) {
    if (openId === m.id) { setOpenId(null); return }
    setOpenId(m.id)
    setForm({ horasSemana: m.horasSemana ?? 0, observacoes: m.observacoes ?? '' })
  }

  function salvarDetalhes(m: Membro) {
    const horas = Math.max(0, Math.min(168, Number(form.horasSemana) || 0))
    updateMembro.mutate(
      { id: m.id, horasSemana: horas, observacoes: form.observacoes.trim() },
      { onSuccess: () => { addToast('success', `Registro de ${m.policial} atualizado.`); setOpenId(null) } },
    )
  }

  if (lm || la) return <LoadingHud />

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <p className="font-mono text-[10px] text-txt2 tracking-[0.2em] uppercase mb-1">Efetivo</p>
        <h1 className="text-3xl font-bold text-txt flex items-center gap-2">
          <ArrowUpNarrowWide size={26} className="text-gold" /> Promoções
        </h1>
        <p className="text-sm text-txt2 mt-1">Analise o desempenho do efetivo, registre a carga horária semanal e promova quem merece.</p>
      </div>

      {rows.length === 0 ? (
        <div className="border border-bdr rounded-xl bg-card py-20 text-center">
          <ArrowUpNarrowWide size={30} className="text-txt3 mx-auto mb-3" />
          <p className="text-txt2 text-sm">Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-bdr rounded-xl overflow-hidden">
          {/* Header */}
          <div className={`${GRID} px-4 py-2.5 border-b border-bdr font-mono text-[10px] text-txt3 tracking-wider uppercase`}>
            <span>Membro</span>
            <span className="flex items-center gap-1"><Calendar size={11} /> Última promoção</span>
            <span className="text-center text-green">Vitórias</span>
            <span className="text-center text-red">Derrotas</span>
            <span className="flex items-center gap-1"><Clock size={11} /> Carga sem.</span>
            <span>Avaliação</span>
            <span className="text-right">Ações</span>
          </div>

          {rows.map(({ m, vitorias, derrotas, winRate, aval, dias }, i) => {
            const aberto = openId === m.id
            const horas = m.horasSemana ?? 0
            const temObs = !!(m.observacoes && m.observacoes.trim())
            return (
              <div key={m.id} className="border-b border-bdr/50 last:border-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`${GRID} px-4 py-3 items-center transition-colors ${aberto ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 shrink-0">{initials(m.policial)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-txt truncate">{m.policial}</p>
                      <p className="text-[11px] text-txt2 truncate">{m.patenteInterna || m.patenteNPD || '—'}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-txt">{fmt(m.promocao)}</p>
                    {dias !== null && <p className="text-[11px] text-txt3">há {dias} dia{dias === 1 ? '' : 's'}</p>}
                  </div>

                  <p className="text-center text-green font-semibold">{vitorias}</p>
                  <p className="text-center text-red font-semibold">{derrotas}</p>

                  <div className="min-w-0">
                    <p className="text-sm text-txt font-mono">{horas}h</p>
                    {temObs && <p className="text-[10px] text-txt3 flex items-center gap-1"><FileText size={10} /> obs.</p>}
                  </div>

                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wider uppercase ${aval.cls}`}>{aval.label}</span>
                    <p className="text-[11px] text-txt3 mt-1">{winRate}% aproveitamento</p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggle(m)}
                      title="Carga horária e observações"
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${aberto ? 'border-gold/50 text-gold3 bg-gold/10' : 'border-bdr2 text-txt2 hover:text-txt hover:border-bdrg'}`}>
                      <FileText size={13} />
                      <ChevronDown size={13} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {isMod ? (
                      <button
                        onClick={() => promover(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/40 text-gold3 text-xs font-medium hover:bg-gold/25 transition-colors">
                        <ChevronsUp size={14} /> Promover
                      </button>
                    ) : <span className="text-txt3 text-xs font-mono">—</span>}
                  </div>
                </motion.div>

                {/* Painel: carga horária + observações */}
                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-black/20"
                    >
                      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 border-t border-bdr/50">
                        {/* Carga horária semanal */}
                        <div>
                          <label className="font-mono text-[10px] text-txt2 tracking-wider uppercase flex items-center gap-1 mb-1.5">
                            <Clock size={11} /> Carga horária semanal
                          </label>
                          {isMod ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min={0} max={168} step={0.5}
                                value={form.horasSemana}
                                onChange={e => setForm(f => ({ ...f, horasSemana: e.target.valueAsNumber }))}
                                className="input-gold w-24 bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                              />
                              <span className="text-sm text-txt2 font-mono">horas / semana</span>
                            </div>
                          ) : (
                            <p className="text-lg font-mono text-txt">{horas}<span className="text-xs text-txt2"> h/sem</span></p>
                          )}
                          <p className="text-[10px] text-txt3 mt-1.5">Horas em que o membro ficou logado nesta semana.</p>
                        </div>

                        {/* Observações / ocorridos */}
                        <div>
                          <label className="font-mono text-[10px] text-txt2 tracking-wider uppercase flex items-center gap-1 mb-1.5">
                            <FileText size={11} /> Observações / ocorridos
                          </label>
                          {isMod ? (
                            <textarea
                              value={form.observacoes}
                              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                              rows={3} maxLength={1000}
                              placeholder="Registre ocorridos, elogios, advertências verbais, notas para a próxima avaliação…"
                              className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm text-txt placeholder-txt3 resize-y"
                            />
                          ) : (
                            <p className="text-sm text-txt whitespace-pre-wrap min-h-[1.5rem]">{m.observacoes?.trim() || <span className="text-txt3">Sem observações.</span>}</p>
                          )}

                          {isMod && (
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => salvarDetalhes(m)}
                                disabled={updateMembro.isPending}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold2 transition-colors disabled:opacity-50">
                                <Save size={14} /> {updateMembro.isPending ? 'Salvando…' : 'Salvar registro'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
