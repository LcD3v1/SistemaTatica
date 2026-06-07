import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { requireAuth } from '../middleware/auth'
import { modOrAdmin, adminOnly } from '../middleware/roles'
import { readData, writeData } from '../data'
import { Conta, SwatData } from '../types'

const router = Router()

// ─── QRUs ────────────────────────────────────────────────────────────────────

router.get('/qrus', requireAuth, (_req, res) => {
  res.json(readData().qrus)
})

router.post('/qrus', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { nome } = req.body as { nome?: string }
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const data = readData()
  if (data.qrus.includes(nome.trim())) { res.status(409).json({ error: 'QRU já existe' }); return }
  data.qrus.push(nome.trim())
  writeData(data)
  res.status(201).json(data.qrus)
})

router.delete('/qrus/:nome', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const nome = decodeURIComponent(String(req.params.nome))
  const data = readData()
  data.qrus = data.qrus.filter(q => q !== nome)
  writeData(data)
  res.json(data.qrus)
})

// ─── Patentes ────────────────────────────────────────────────────────────────

router.get('/patentes', requireAuth, (_req, res) => {
  res.json(readData().patentes)
})

router.post('/patentes', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { nome } = req.body as { nome?: string }
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const data = readData()
  data.patentes.push(nome.trim())
  writeData(data)
  res.status(201).json(data.patentes)
})

router.put('/patentes/reorder', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { patentes } = req.body as { patentes?: string[] }
  if (!Array.isArray(patentes)) { res.status(400).json({ error: 'patentes deve ser um array' }); return }
  const data = readData()
  data.patentes = patentes
  writeData(data)
  res.json(data.patentes)
})

router.delete('/patentes/:nome', requireAuth, adminOnly, (req: Request, res: Response): void => {
  const nome = decodeURIComponent(String(req.params.nome))
  const data = readData()
  data.patentes = data.patentes.filter(p => p !== nome)
  writeData(data)
  res.json(data.patentes)
})

// ─── Cargos ──────────────────────────────────────────────────────────────────

router.get('/cargos', requireAuth, (_req, res) => {
  res.json(readData().cargos)
})

router.post('/cargos', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { nome } = req.body as { nome?: string }
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome é obrigatório' }); return }
  const data = readData()
  data.cargos.push(nome.trim())
  writeData(data)
  res.status(201).json(data.cargos)
})

router.delete('/cargos/:nome', requireAuth, adminOnly, (req: Request, res: Response): void => {
  const nome = decodeURIComponent(String(req.params.nome))
  const data = readData()
  data.cargos = data.cargos.filter(c => c !== nome)
  writeData(data)
  res.json(data.cargos)
})

// ─── Contas (admin only) ──────────────────────────────────────────────────────

router.get('/contas', requireAuth, adminOnly, (_req, res) => {
  const data = readData()
  const contas = data.contas.map(({ password: _p, ...rest }) => rest)
  res.json(contas)
})

router.post('/contas', requireAuth, adminOnly, async (req: Request, res: Response): Promise<void> => {
  const { username, password, nivel } = req.body as {
    username?: string; password?: string; nivel?: string
  }

  if (!username?.trim() || !password || !nivel) {
    res.status(400).json({ error: 'Usuário, senha e nível são obrigatórios' }); return
  }

  if (!['admin', 'moderador', 'membro'].includes(nivel)) {
    res.status(400).json({ error: 'Nível inválido' }); return
  }

  const data = readData()
  if (data.contas.some(c => c.username === username.trim())) {
    res.status(409).json({ error: 'Nome de usuário já existe' }); return
  }

  const novaConta: Conta = {
    id: data.nextContaId,
    username: username.trim(),
    password: await bcrypt.hash(password, 12),
    nivel: nivel as Conta['nivel'],
    ativo: true,
  }

  data.contas.push(novaConta)
  data.nextContaId++
  writeData(data)

  const { password: _p, ...semSenha } = novaConta
  res.status(201).json(semSenha)
})

router.put('/contas/:id', requireAuth, adminOnly, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10)
  const data = readData()
  const conta = data.contas.find(c => c.id === id)

  if (!conta) { res.status(404).json({ error: 'Conta não encontrada' }); return }

  const { nivel, ativo, password } = req.body as {
    nivel?: string; ativo?: boolean; password?: string
  }

  if (nivel && ['admin', 'moderador', 'membro'].includes(nivel)) {
    conta.nivel = nivel as Conta['nivel']
  }
  if (typeof ativo === 'boolean') conta.ativo = ativo
  if (password && password.length >= 6) {
    conta.password = await bcrypt.hash(password, 12)
  }

  writeData(data)
  const { password: _p, ...semSenha } = conta
  res.json(semSenha)
})

router.delete('/contas/:id', requireAuth, adminOnly, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)

  if (req.user!.contaId === id) {
    res.status(400).json({ error: 'Não é possível excluir sua própria conta' }); return
  }

  const data = readData()
  const idx = data.contas.findIndex(c => c.id === id)
  if (idx === -1) { res.status(404).json({ error: 'Conta não encontrada' }); return }

  data.contas.splice(idx, 1)
  writeData(data)
  res.json({ ok: true })
})

// ─── Logo ─────────────────────────────────────────────────────────────────────

router.get('/logo', (_req, res) => {
  res.json({ logo: readData().logo })
})

router.put('/logo', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { logo } = req.body as { logo?: string }
  if (!logo) { res.status(400).json({ error: 'Logo é obrigatório' }); return }
  // ~2MB base64 ≈ 2.73MB string
  if (logo.length > 2_900_000) { res.status(400).json({ error: 'Logo excede 2MB' }); return }
  const data = readData()
  data.logo = logo
  writeData(data)
  res.json({ ok: true })
})

router.delete('/logo', requireAuth, modOrAdmin, (_req, res) => {
  const data = readData()
  data.logo = ''
  writeData(data)
  res.json({ ok: true })
})

// ─── Configuração de Recrutamento ─────────────────────────────────────────────

router.get('/recrutamento', requireAuth, (_req, res) => {
  res.json(readData().recCfg)
})

router.put('/recrutamento', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const data = readData()
  const { notaMinima, categorias } = req.body
  if (typeof notaMinima === 'number') data.recCfg.notaMinima = notaMinima
  if (Array.isArray(categorias)) data.recCfg.categorias = categorias
  writeData(data)
  res.json(data.recCfg)
})

// ─── Backup / Restore ─────────────────────────────────────────────────────────

router.get('/backup', requireAuth, adminOnly, (_req, res) => {
  const data = readData()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="swat-backup-${new Date().toISOString().slice(0,10)}.json"`)
  res.send(JSON.stringify(data, null, 2))
})

router.post('/restore', requireAuth, adminOnly, (req: Request, res: Response): void => {
  const body = req.body as Partial<SwatData>

  const required: (keyof SwatData)[] = ['membros', 'acoes', 'contas']
  if (!required.every(k => Array.isArray(body[k]))) {
    res.status(400).json({ error: 'Backup inválido — campos obrigatórios ausentes' }); return
  }

  writeData(body as SwatData)
  res.json({ ok: true })
})

export default router
