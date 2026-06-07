import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useRecrutos, useCreateRecruta, useDeleteRecruta } from '@/hooks/useRecrutos'
import { useRecCfg } from '@/hooks/useConfig'
import { useUIStore } from '@/store/uiStore'
import GlowCard from '@/components/ui/GlowCard'
import HudButton from '@/components/ui/HudButton'
import LoadingHud from '@/components/ui/LoadingHud'
import { formatDate } from '@/lib/utils'
import type { Recruta } from '@/types'

interface FormData {
  nome: string
  data: string
  observacoes: string
}

export default function RecrutamentoPage() {
  const { addToast } = useUIStore()
  const { data: recCfg, isLoading: cfgLoading } = useRecCfg()
  const { data: recrutas, isLoading } = useRecrutos()
  const createRecruta = useCreateRecruta()
  const deleteRecruta = useDeleteRecruta()

  const [scores, setScores] = useState<Record<number, number>>({})

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { data: new Date().toISOString().slice(0, 10) },
  })

  const categorias = recCfg?.categorias ?? []
  const notaMinima = recCfg?.notaMinima ?? 7

  const total = useMemo(() => {
    if (categorias.length === 0) return 0
    const totalPeso = categorias.reduce((s, c) => s + c.peso, 0)
    const soma = categorias.reduce((s, c) => s + (scores[c.id] ?? 0) * c.peso, 0)
    return totalPeso > 0 ? parseFloat((soma / totalPeso).toFixed(2)) : 0
  }, [scores, categorias])

  const aprovado = total >= notaMinima

  async function onSubmit(data: FormData) {
    try {
      await createRecruta.mutateAsync({
        nome: data.nome,
        data: data.data,
        scores,
        total,
        resultado: aprovado ? 'Aprovado' : 'Reprovado',
        observacoes: data.observacoes,
      })
      addToast('success', 'Avaliação registrada!')
      reset({ data: new Date().toISOString().slice(0, 10) })
      setScores({})
    } catch {
      addToast('error', 'Erro ao registrar avaliação.')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apagar avaliação?')) return
    try {
      await deleteRecruta.mutateAsync(id)
      addToast('success', 'Avaliação removida.')
    } catch {
      addToast('error', 'Erro ao remover.')
    }
  }

  if (isLoading || cfgLoading) return <LoadingHud />

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Formulário */}
        <GlowCard>
          <div className="p-6">
            <h2 className="font-orbitron text-xs font-bold text-gold tracking-wider mb-6">NOVA AVALIAÇÃO</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">NOME DO CANDIDATO</label>
                <input
                  {...register('nome', { required: true })}
                  className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">DATA</label>
                <input
                  {...register('data')}
                  type="date"
                  className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt"
                />
              </div>

              {/* Sliders por categoria */}
              {categorias.length === 0 ? (
                <p className="font-mono text-xs text-txt3 py-4 text-center">
                  Configure as categorias em Configurações
                </p>
              ) : (
                <div className="space-y-4">
                  {categorias.map(cat => (
                    <div key={cat.id}>
                      <div className="flex justify-between mb-1.5">
                        <label className="font-mono text-xs text-txt2">{cat.nome}</label>
                        <span className="font-orbitron text-xs text-gold">
                          {scores[cat.id] ?? 0}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={scores[cat.id] ?? 0}
                        onChange={e => setScores(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) }))}
                        className="hud-slider w-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de pontuação */}
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-xs text-txt2">PONTUAÇÃO TOTAL</span>
                  <span className="font-orbitron text-lg font-bold" style={{ color: aprovado ? '#27ae60' : '#c0392b' }}>
                    {total}/10
                  </span>
                </div>
                <div className="h-2 bg-bdrg rounded overflow-hidden">
                  <motion.div
                    className="h-full rounded"
                    style={{ background: aprovado ? '#27ae60' : '#c0392b' }}
                    animate={{ width: `${(total / 10) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="font-mono text-[10px] text-txt3">mínimo: {notaMinima}</span>
                </div>
              </div>

              {/* Badge resultado */}
              {categorias.length > 0 && (
                <motion.div
                  animate={{ scale: [0.95, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  key={aprovado ? 'ap' : 'rep'}
                  className={`text-center py-3 rounded border font-orbitron text-sm tracking-widest ${
                    aprovado
                      ? 'border-green/50 bg-green/10 text-green'
                      : 'border-red/50 bg-red/10 text-red'
                  }`}
                >
                  {aprovado ? '✓ APROVADO' : '✕ REPROVADO'}
                </motion.div>
              )}

              <div>
                <label className="font-mono text-xs text-txt2 tracking-wider block mb-1.5">OBSERVAÇÕES</label>
                <textarea
                  {...register('observacoes')}
                  rows={2}
                  className="input-gold w-full bg-card2 border border-bdr2 rounded px-3 py-2 text-sm font-mono text-txt resize-none"
                />
              </div>

              <HudButton type="submit" loading={createRecruta.isPending} size="md" className="w-full justify-center">
                REGISTRAR AVALIAÇÃO
              </HudButton>
            </form>
          </div>
        </GlowCard>

        {/* Histórico */}
        <GlowCard>
          <div className="p-4">
            <h3 className="font-orbitron text-xs text-txt2 tracking-wider mb-4">HISTÓRICO DE AVALIAÇÕES</h3>
            {(recrutas ?? []).length === 0 ? (
              <p className="font-mono text-xs text-txt3 text-center py-8">Nenhuma avaliação registrada</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(recrutas ?? []).map((r: Recruta) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-card2 rounded border border-bdr group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        r.resultado === 'Aprovado' ? 'bg-green' : 'bg-red'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-txt truncate">{r.nome}</p>
                      <p className="font-mono text-[10px] text-txt3">{formatDate(r.data)}</p>
                    </div>
                    <span className="font-orbitron text-xs" style={{ color: r.resultado === 'Aprovado' ? '#27ae60' : '#c0392b' }}>
                      {r.total.toFixed(1)}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-red transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
