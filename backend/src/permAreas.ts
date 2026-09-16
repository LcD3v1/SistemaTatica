// Áreas do painel controladas pelo sistema de cargos de permissão.
// A ordem aqui é a ordem exibida na tela de configuração.
export const PERM_AREAS = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'avisos',        label: 'Comunicados' },
  { id: 'registrar_acao',label: 'Registrar Ação' },
  { id: 'pendentes',     label: 'Aprovações' },
  { id: 'historico',     label: 'Histórico' },
  { id: 'estatisticas',  label: 'Estatísticas' },
  { id: 'ranking',       label: 'Ranking' },
  { id: 'membros',       label: 'Membros' },
  { id: 'ausencias',     label: 'Ausências' },
  { id: 'promocoes',     label: 'Promoções' },
  { id: 'recrutamento',  label: 'Recrutamento' },
  { id: 'anuncio',       label: 'Gerar Anúncio' },
  { id: 'configuracoes', label: 'Configurações' },
] as const

export type AreaId = typeof PERM_AREAS[number]['id']
export const AREA_IDS: string[] = PERM_AREAS.map(a => a.id)

export interface PermArea { ver: boolean; editar: boolean }
export type PermMap = Record<string, PermArea>

/** Normaliza um mapa parcial para conter TODAS as áreas (faltantes = false). */
export function normalizePermMap(parcial?: Partial<Record<string, Partial<PermArea>>>): PermMap {
  const out: PermMap = {}
  for (const { id } of PERM_AREAS) {
    const p = parcial?.[id]
    out[id] = { ver: Boolean(p?.ver), editar: Boolean(p?.editar) }
  }
  return out
}

/** Mapa com acesso total (usado por cargo admin). */
export function fullPermMap(): PermMap {
  const out: PermMap = {}
  for (const { id } of PERM_AREAS) out[id] = { ver: true, editar: true }
  return out
}

import type { Conta, CargoPermissao } from './types'

/** Cargo da conta (ou undefined se não tiver). */
export function contaCargo(conta: Conta, cargos: CargoPermissao[]): CargoPermissao | undefined {
  return conta.cargoPermId ? cargos.find(c => c.id === conta.cargoPermId) : undefined
}

/** A conta é super-usuário (cargo com flag admin)? */
export function isAdminConta(conta: Conta, cargos: CargoPermissao[]): boolean {
  return !!contaCargo(conta, cargos)?.admin
}

/** Mapa de permissões efetivo da conta. Cargo admin = tudo; senão o cargo; sem cargo = nada. */
export function resolvePermissoes(conta: Conta, cargos: CargoPermissao[]): PermMap {
  const cargo = contaCargo(conta, cargos)
  if (cargo?.admin) return fullPermMap()
  if (cargo) return normalizePermMap(cargo.permissoes)
  return normalizePermMap({})
}
