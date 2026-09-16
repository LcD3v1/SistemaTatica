export interface TierBanner {
  key: string
  label: string
  sub: string
  rank: number      // desbloqueado APENAS para quem está EXATAMENTE nesta posição
  css: string       // fundo do banner (gradiente medalhado)
  overlay?: string  // camada opcional sobre o fundo
  glow: string
}
export interface PresetBanner {
  key: string
  label: string
  img?: string
  css?: string
}

// Exclusivos — tratamento ouro/prata/bronze. Só o dono da posição usa.
export const TIER_BANNERS: TierBanner[] = [
  {
    key: 'top1', label: 'Campeão', sub: 'Nº 1 do ranking', rank: 1, glow: '#f5c451',
    css: 'linear-gradient(105deg, #1c1402 0%, #785a0f 48%, #f5c451 100%)',
    overlay: 'radial-gradient(120% 140% at 85% 0%, rgba(245,196,81,0.35), transparent 60%)',
  },
  {
    key: 'top2', label: 'Vice-líder', sub: 'Nº 2 do ranking', rank: 2, glow: '#cbd5e1',
    css: 'linear-gradient(105deg, #10141a 0%, #55606f 50%, #cbd5e1 100%)',
    overlay: 'radial-gradient(120% 140% at 85% 0%, rgba(203,213,225,0.32), transparent 60%)',
  },
  {
    key: 'top3', label: 'Pódio', sub: 'Nº 3 do ranking', rank: 3, glow: '#cd7f45',
    css: 'linear-gradient(105deg, #1a0d04 0%, #7a4322 52%, #cd7f45 100%)',
    overlay: 'radial-gradient(120% 140% at 85% 0%, rgba(205,127,69,0.32), transparent 60%)',
  },
]

// Liberados para todos (gradientes táticos)
export const PRESET_BANNERS: PresetBanner[] = [
  { key: 'midnight',  label: 'Meia-noite',   css: 'linear-gradient(120deg, #0c0c0c, #0a0a0a 55%, #050505)' },
  { key: 'aco',       label: 'Aço',          css: 'linear-gradient(120deg, #101010, #2a2a2a 60%, #b8b8b8)' },
  { key: 'carbono',   label: 'Carbono',      css: 'linear-gradient(135deg, #0a0a0a, #17171a 50%, #0a0a0a)' },
  { key: 'patrulha',  label: 'Patrulha',     css: 'linear-gradient(120deg, #0a0a0a 0%, #303030 55%, #0f0f0f 100%)' },
  { key: 'operacao',  label: 'Operação',     css: 'linear-gradient(120deg, #0d0d0d, #1e1e1e 55%, #363636)' },
  { key: 'sentinela', label: 'Sentinela',    css: 'linear-gradient(120deg, #101010, #3a3a3a 60%, #e0e0e0)' },
  { key: 'brasa',     label: 'Ferro',        css: 'linear-gradient(120deg, #141414, #2c2c2c 50%, #0a0a0a)' },
  { key: 'abismo',    label: 'Abismo',       css: 'radial-gradient(120% 120% at 20% 0%, #232323, #050505 70%)' },
  { key: 'neon',      label: 'Grafite',      css: 'linear-gradient(120deg, #050505, #171717 40%, #2e2e2e 85%)' },
  { key: 'gelo',      label: 'Prata',        css: 'linear-gradient(120deg, #141414, #4a4a4a 60%, #f2f2f2)' },
]

export interface ResolvedBanner { img?: string; css?: string; overlay?: string; tier?: TierBanner }

export function unlockedTiers(rankPos: number | null): TierBanner[] {
  if (!rankPos) return []
  return TIER_BANNERS.filter(t => t.rank === rankPos)
}

export function resolveBanner(banner: string | null, rankPos: number | null): ResolvedBanner {
  if (banner && banner.startsWith('data:')) return { img: banner }

  const tier = TIER_BANNERS.find(t => t.key === banner)
  if (tier && rankPos === tier.rank) return { css: tier.css, overlay: tier.overlay, tier }

  const preset = PRESET_BANNERS.find(p => p.key === banner)
  if (preset) return preset.img ? { img: preset.img } : { css: preset.css }

  // padrão: se está no pódio e não escolheu nada, ganha o banner da sua posição
  const own = TIER_BANNERS.find(t => t.rank === rankPos)
  if (own) return { css: own.css, overlay: own.overlay, tier: own }

  return { css: 'linear-gradient(120deg, #0c1526, #0a1120 55%, #05070c)' }
}
