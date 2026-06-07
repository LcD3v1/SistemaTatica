import { Request, Response, NextFunction } from 'express'
import { Nivel } from '../types'

const RANK: Record<Nivel, number> = { membro: 0, moderador: 1, admin: 2 }

export function requireRole(...minRoles: Nivel[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user) {
      res.status(401).json({ error: 'Não autenticado' })
      return
    }
    const userRank = RANK[user.nivel]
    const minRank = Math.min(...minRoles.map(r => RANK[r]))
    if (userRank >= minRank) {
      next()
      return
    }
    res.status(403).json({ error: 'Acesso negado — nível insuficiente' })
  }
}

export const modOrAdmin = requireRole('moderador')
export const adminOnly = requireRole('admin')
export const anyAuth = requireRole('membro')
