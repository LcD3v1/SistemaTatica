import { Request, Response, NextFunction } from 'express'
import { readData } from '../data'
import { resolvePermissoes, isAdminConta } from '../permAreas'

/** Exige que a conta tenha permissão numa área ('ver' ou 'editar'). Cargo admin passa sempre. */
export function requireArea(area: string, mode: 'ver' | 'editar' = 'editar') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user) { res.status(401).json({ error: 'Não autenticado' }); return }
    const data = readData()
    const conta = data.contas.find(c => c.id === user.contaId)
    if (!conta) { res.status(401).json({ error: 'Não autenticado' }); return }
    if (isAdminConta(conta, data.cargosPermissao)) { next(); return }
    const perms = resolvePermissoes(conta, data.cargosPermissao)
    if (perms[area]?.[mode]) { next(); return }
    res.status(403).json({ error: 'Acesso negado — sem permissão para esta ação' })
  }
}

/** Exige cargo com flag admin (gerenciar contas, cargos, solicitações, backup/restore). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.user
  if (!user) { res.status(401).json({ error: 'Não autenticado' }); return }
  const data = readData()
  const conta = data.contas.find(c => c.id === user.contaId)
  if (!conta || !isAdminConta(conta, data.cargosPermissao)) {
    res.status(403).json({ error: 'Acesso negado — requer cargo administrador' })
    return
  }
  next()
}
