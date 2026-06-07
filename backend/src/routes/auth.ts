import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/auth'
import { readData, writeData } from '../data'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios' })
    return
  }

  const data = readData()
  const conta = data.contas.find(c => c.username === username)

  if (!conta || !conta.ativo) {
    res.status(401).json({ error: 'Credenciais inválidas ou conta desativada' })
    return
  }

  const senhaCorreta = await bcrypt.compare(password, conta.password)
  if (!senhaCorreta) {
    res.status(401).json({ error: 'Credenciais inválidas ou conta desativada' })
    return
  }

  const token = jwt.sign(
    { contaId: conta.id, username: conta.username, nivel: conta.nivel },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: { contaId: conta.id, username: conta.username, nivel: conta.nivel },
  })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const data = readData()
  const conta = data.contas.find(c => c.id === req.user!.contaId)

  if (!conta || !conta.ativo) {
    res.status(401).json({ error: 'CONTA_DESATIVADA' })
    return
  }

  res.json({
    contaId: conta.id,
    username: conta.username,
    nivel: conta.nivel,
  })
})

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string
    newPassword?: string
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
    return
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
    return
  }

  const data = readData()
  const conta = data.contas.find(c => c.id === req.user!.contaId)

  if (!conta) {
    res.status(404).json({ error: 'Conta não encontrada' })
    return
  }

  const senhaCorreta = await bcrypt.compare(currentPassword, conta.password)
  if (!senhaCorreta) {
    res.status(401).json({ error: 'Senha atual incorreta' })
    return
  }

  conta.password = await bcrypt.hash(newPassword, 12)
  writeData(data)

  res.json({ ok: true })
})

export default router
