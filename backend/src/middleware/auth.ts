import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthPayload } from '../types'

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente' })
    return
  }
  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
