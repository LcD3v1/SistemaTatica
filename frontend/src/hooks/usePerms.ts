import { useMe } from './useMe'
import type { AreaId } from '@/lib/permAreas'

/**
 * Permissões efetivas do usuário atual (sistema de cargos).
 * - Cargo com flag admin = acesso total.
 * - Senão, respeita o mapa de permissões do cargo (ver/editar por área).
 */
export function usePerms() {
  const { data: me } = useMe()
  const perms = me?.permissoes ?? null
  const isAdmin = Boolean(me?.admin)

  const canView = (area: AreaId): boolean => isAdmin || Boolean(perms?.[area]?.ver)
  const canEdit = (area: AreaId): boolean => isAdmin || Boolean(perms?.[area]?.editar)

  return { canView, canEdit, isAdmin, perms }
}
