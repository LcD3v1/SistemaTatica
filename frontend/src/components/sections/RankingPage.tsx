import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Medal, Award, Target, Flame, TrendingUp, Star, Shield, Hash, CalendarDays } from 'lucide-react'
import { useAllAcoes } from '@/hooks/useAcoes'
import { useMembros } from '@/hooks/useMembros'
import { usePublicPerfis } from '@/hooks/usePublic'
import { resolveBanner } from '@/lib/banners'
import LoadingHud from '@/components/ui/LoadingHud'
import type { Membro, Acao } from '@/types'

const BANNER = 'linear-gradient(120deg, #0a0a0a 0%, #242424 45%, #3a3a3a 100%)'
const EASE = [0.16, 1, 0.3, 1] as const

type Win = 'all' | '7' | '15' | '30'
const WINDOWS: { key: Win; label: string }[] = [
  { key: 'all', label: 'Todo o período' },
  { key: '7', label: '7 dias' },
  { key: '15', label: '15 dias' },
  { key: '30', label: '30 dias' },
]

const MEDALS = ['#f5c451', '#cbd5e1', '#cd7f45'] // ouro, prata, bronze

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}
function isoDaysAgo(n: number) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function fmtDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return day && m && y ? `${day}/${m}/${y}` : d
}

interface Row {
  id: number; nome: string; patente: string
  sucedidas: number; derrotas: number; total: number; winRate: number
  topQru: string | null; topQruCount: number
  badge: string; passaporte: string; entrada: string
}

const MEDAL_LABEL = ['Campeão', 'Vice-líder', 'Pódio']

function Detail({ icon, label, value, valueCls = 'text-txt' }: {
  icon: React.ReactNode; label: string; value: string; valueCls?: string
}) {
  return (
    <div className="px-4 py-[7px] flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-txt2">{icon} {label}</span>
      <span className={`font-medium truncate max-w-[130px] ${valueCls}`}>{value}</span>
    </div>
  )
}

/** Card de perfil que aparece ao passar o mouse sobre um membro do ranking. */
function HoverCard({ row, place, avatar, banner, x, y }: {
  row: Row; place: number; avatar?: string | null; banner?: string | null; x: number; y: number
}) {
  const bn = resolveBanner(banner ?? null, place + 1)
  const CARD_W = 288
  const left = Math.round(Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1400) - CARD_W - 14))
  const top = Math.round(Math.min(Math.max(12, y), (typeof window !== 'undefined' ? window.innerHeight : 900) - 420))
  const medalCls = place < 3 ? { color: MEDALS[place] } : { color: 'var(--txt2)' }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.14 }}
      className="fixed z-[9998] pointer-events-none"
      style={{ left, top, width: CARD_W }}
    >
      <div className="rounded-xl border border-bdr2 bg-card shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Banner */}
        <div className="relative h-20">
          {bn.img
            ? <img src={bn.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: bn.css }} />}
          {bn.overlay && <div className="absolute inset-0" style={{ background: bn.overlay }} />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,0.15), rgba(14,14,14,0.95))' }} />
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur border border-white/15 font-mono text-[10px] tracking-wider uppercase" style={medalCls}>
            <Trophy size={10} /> Nº {place + 1}{place < 3 ? ` · ${MEDAL_LABEL[place]}` : ''}
          </span>
        </div>

        {/* Identidade */}
        <div className="px-4 relative -mt-8">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-card bg-white/10 flex items-center justify-center text-lg font-bold text-white/85">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : initials(row.nome)}
          </div>
          <p className="mt-2 text-sm font-semibold text-txt truncate">{row.nome}</p>
          <p className="text-[10px] text-txt2 font-mono tracking-wider uppercase truncate">{row.patente || '—'}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-px bg-bdr/60 mt-3 border-t border-bdr">
          <div className="bg-card px-2 py-2.5 text-center">
            <p className="text-lg font-bold text-gold3 leading-none">{row.sucedidas}</p>
            <p className="font-mono text-[8px] text-txt3 tracking-widest uppercase mt-1">Sucedidas</p>
          </div>
          <div className="bg-card px-2 py-2.5 text-center">
            <p className="text-lg font-bold text-green leading-none">{row.winRate}%</p>
            <p className="font-mono text-[8px] text-txt3 tracking-widest uppercase mt-1">Aproveit.</p>
          </div>
          <div className="bg-card px-2 py-2.5 text-center">
            <p className="text-lg font-bold text-txt leading-none">{row.total}</p>
            <p className="font-mono text-[8px] text-txt3 tracking-widest uppercase mt-1">Ações</p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="border-t border-bdr divide-y divide-bdr/60 text-[11px]">
          <Detail icon={<Star size={12} className="text-gold3" />} label="QRU favorita" value={row.topQru ? `${row.topQru} (${row.topQruCount})` : '—'} valueCls="text-gold3" />
          <Detail icon={<TrendingUp size={12} className="text-green" />} label="Vitórias / Derrotas" value={`${row.sucedidas} / ${row.derrotas}`} />
          <Detail icon={<Shield size={12} className="text-txt2" />} label="Badge" value={row.badge || '—'} />
          <Detail icon={<Hash size={12} className="text-txt2" />} label="Passaporte" value={row.passaporte || '—'} />
          <Detail icon={<CalendarDays size={12} className="text-txt2" />} label="Entrada" value={fmtDate(row.entrada)} />
        </div>
      </div>
    </motion.div>
  )
}

export default function RankingPage() {
  const { data: acoesData, isLoading: la } = useAllAcoes()
  const { data: membros, isLoading: lm } = useMembros()
  const { data: perfis } = usePublicPerfis()
  const [win, setWin] = useState<Win>('all')
  const [hover, setHover] = useState<{ id: number; place: number; x: number; y: number } | null>(null)

  function onEnter(e: React.MouseEvent, id: number, place: number) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setHover({ id, place, x: rect.right + 12, y: rect.top })
  }
  function onLeave() { setHover(null) }

  const perfilMap = useMemo(() => new Map((perfis ?? []).map(p => [p.membroId, p])), [perfis])

  const acoes: Acao[] = (acoesData?.acoes ?? []).filter(a => (a.status ?? 'aprovada') === 'aprovada')
  const membrosList: Membro[] = membros ?? []

  const { rows, totalSucedidas, topQru } = useMemo(() => {
    const from = win === 'all' ? null : isoDaysAgo(parseInt(win, 10))
    const scoped = from ? acoes.filter(a => a.data >= from) : acoes

    const rows: Row[] = membrosList.map(m => {
      const mine = scoped.filter(a => a.participants.some(p => p.memberId === m.id))
      const wins = mine.filter(a => a.resultado === 'Vitória')
      const sucedidas = wins.length
      const derrotas = mine.filter(a => a.resultado === 'Derrota').length
      const qruCount = new Map<string, number>()
      wins.forEach(a => qruCount.set(a.qru, (qruCount.get(a.qru) ?? 0) + 1))
      const topEntry = [...qruCount.entries()].sort((a, b) => b[1] - a[1])[0]
      return {
        id: m.id, nome: m.policial, patente: m.patenteInterna || m.patenteNPD,
        sucedidas, derrotas, total: mine.length,
        winRate: mine.length ? Math.round((sucedidas / mine.length) * 100) : 0,
        topQru: topEntry?.[0] ?? null, topQruCount: topEntry?.[1] ?? 0,
        badge: m.badge, passaporte: m.passaporte, entrada: m.entrada,
      }
    }).filter(r => r.sucedidas > 0)
      .sort((a, b) => b.sucedidas - a.sucedidas || b.winRate - a.winRate)

    const totalSucedidas = scoped.filter(a => a.resultado === 'Vitória').length

    const qruCount = new Map<string, number>()
    scoped.filter(a => a.resultado === 'Vitória').forEach(a => qruCount.set(a.qru, (qruCount.get(a.qru) ?? 0) + 1))
    const topQru = [...qruCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

    return { rows, totalSucedidas, topQru }
  }, [acoes, membrosList, win])

  if (la || lm) return <LoadingHud />

  const podium = rows.slice(0, 3)
  const resto = rows.slice(3)
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as Row[] // 2º,1º,3º
  const maxSucedidas = rows[0]?.sucedidas ?? 1

  return (
    <div className="p-6 max-w-[1400px]">
      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-bdr mb-6">
        <div className="absolute inset-0" style={{ background: BANNER }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,5,5,0.95) 0%, rgba(5,7,12,0.75) 45%, rgba(200,200,200,0.25) 100%)' }} />
        <div className="relative p-6 md:p-8">
          <p className="font-mono text-[10px] text-gold3 tracking-[0.25em] uppercase mb-1 flex items-center gap-2">
            <Trophy size={13} /> Destaques operacionais
          </p>
          <h1 className="wordmark text-3xl md:text-4xl text-white tracking-wide">Ranking de QRUs</h1>
          <p className="text-sm text-white/70 mt-1">Classificação por operações bem-sucedidas da unidade.</p>

          <div className="flex items-center gap-4 mt-5 flex-wrap">
            <div className="flex gap-0.5 bg-black/40 backdrop-blur rounded-lg p-1">
              {WINDOWS.map(w => (
                <button key={w.key} onClick={() => setWin(w.key)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono transition-colors ${win === w.key ? 'bg-gold text-white' : 'text-white/60 hover:text-white'}`}>
                  {w.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-white/80 text-sm"><Flame size={15} className="text-gold3" /> {totalSucedidas} QRUs sucedidas</span>
              {topQru && <span className="flex items-center gap-1.5 text-white/80 text-sm"><Target size={15} className="text-gold3" /> Top QRU: <span className="text-white font-medium">{topQru[0]}</span></span>}
            </div>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-bdr rounded-xl bg-card py-20 text-center">
          <Trophy size={32} className="text-txt3 mx-auto mb-3" />
          <p className="text-txt2 text-sm">Nenhuma QRU bem-sucedida registrada no período.</p>
        </div>
      ) : (
        <>
          {/* ── Pódio ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4 items-end mb-6">
            {podiumOrder.map(r => {
              const place = rows.indexOf(r) // 0,1,2
              const isFirst = place === 0
              const medal = MEDALS[place]
              const MedalIcon = place === 0 ? Crown : place === 1 ? Medal : Award
              const perfil = perfilMap.get(r.id)
              const bn = resolveBanner(perfil?.banner ?? null, place + 1)
              const avSize = isFirst ? 76 : 60
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: place * 0.1 }}
                  onMouseEnter={(e) => onEnter(e, r.id, place)}
                  onMouseLeave={onLeave}
                  className={`relative rounded-2xl border overflow-hidden p-5 text-center cursor-default ${isFirst ? 'border-gold/50 pb-8' : 'border-bdr'}`}
                  style={isFirst ? { boxShadow: '0 24px 60px -24px rgba(200,200,200,0.6)' } : undefined}
                >
                  {/* Banner de fundo (escolha do usuário / tier) */}
                  {bn.img
                    ? <img src={bn.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0" style={{ background: bn.css }} />}
                  {bn.overlay && <div className="absolute inset-0" style={{ background: bn.overlay }} />}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,0.30) 0%, rgba(5,7,12,0.62) 52%, rgba(5,7,12,0.9) 100%)' }} />

                  <div className="relative flex flex-col items-center">
                    <MedalIcon size={isFirst ? 24 : 20} style={{ color: medal }} className="mb-2" />
                    <div className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-white mb-3 border-2 bg-white/[0.06]"
                      style={{ width: avSize, height: avSize, fontSize: isFirst ? 22 : 17, borderColor: medal }}>
                      {perfil?.avatar
                        ? <img src={perfil.avatar} alt="" className="w-full h-full object-cover" />
                        : initials(r.nome)}
                    </div>
                    <p className="font-mono text-[11px] font-bold tracking-widest" style={{ color: medal }}>{place + 1}º</p>
                    <p className={`font-semibold text-txt truncate max-w-full ${isFirst ? 'text-lg' : 'text-sm'}`}>{r.nome}</p>
                    <p className="text-[11px] text-txt2 truncate max-w-full">{r.patente}</p>
                    <div className="mt-3">
                      <p className={`font-bold ${isFirst ? 'text-4xl' : 'text-3xl'}`} style={{ color: medal }}>{r.sucedidas}</p>
                      <p className="font-mono text-[9px] text-txt3 tracking-widest uppercase">QRUs sucedidas</p>
                    </div>
                    <p className="mt-2 text-[11px] text-txt2 flex items-center gap-1"><TrendingUp size={11} className="text-green" /> {r.winRate}% aproveitamento</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── Restante ──────────────────────────────────────── */}
          {resto.length > 0 && (
            <div className="bg-card border border-bdr rounded-xl overflow-hidden">
              {resto.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  onMouseEnter={(e) => onEnter(e, r.id, i + 3)}
                  onMouseLeave={onLeave}
                  className="flex items-center gap-4 px-4 py-3 border-b border-bdr/60 last:border-0 hover:bg-white/[0.02] transition-colors cursor-default"
                >
                  <span className="font-mono text-sm text-txt3 w-7 text-right">{i + 4}º</span>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 shrink-0">
                    {perfilMap.get(r.id)?.avatar
                      ? <img src={perfilMap.get(r.id)!.avatar!} alt="" className="w-full h-full object-cover" />
                      : initials(r.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt truncate">{r.nome}</p>
                    <p className="text-[11px] text-txt2 truncate">{r.patente}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-40">
                    <div className="flex-1 h-1.5 rounded-full bg-bdr overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round((r.sucedidas / maxSucedidas) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-txt3 font-mono w-9 text-right">{r.winRate}%</span>
                  </div>
                  <div className="text-right shrink-0 w-14">
                    <p className="text-lg font-bold text-gold3 leading-none">{r.sucedidas}</p>
                    <p className="font-mono text-[8px] text-txt3 tracking-widest uppercase">QRUs</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Card de perfil ao passar o mouse */}
      <AnimatePresence>
        {hover && (() => {
          const r = rows.find(x => x.id === hover.id)
          if (!r) return null
          const p = perfilMap.get(hover.id)
          return <HoverCard key={hover.id} row={r} place={hover.place} avatar={p?.avatar} banner={p?.banner} x={hover.x} y={hover.y} />
        })()}
      </AnimatePresence>
    </div>
  )
}
