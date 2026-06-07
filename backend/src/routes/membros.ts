import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { modOrAdmin, adminOnly } from '../middleware/roles'
import { readData, writeData } from '../data'
import { Membro } from '../types'

const router = Router()

// GET /api/membros
router.get('/', requireAuth, (_req: Request, res: Response): void => {
  const data = readData()
  const order = data.membrosOrder
  let membros = data.membros

  if (order.length > 0) {
    const orderMap = new Map(order.map((id, idx) => [id, idx]))
    membros = [...membros].sort((a, b) => {
      const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
      const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999
      return ia - ib
    })
  }

  res.json(membros)
})

// POST /api/membros
router.post('/', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const data = readData()
  const body = req.body as Omit<Membro, 'id'>

  if (!body.policial || !body.badge) {
    res.status(400).json({ error: 'Nome e badge são obrigatórios' })
    return
  }

  const novoMembro: Membro = {
    id: data.nextMemId,
    badge: body.badge || '',
    passaporte: body.passaporte || '',
    policial: body.policial,
    patenteNPD: body.patenteNPD || '',
    patenteInterna: body.patenteInterna || '',
    status: body.status || 'Ativo',
    entrada: body.entrada || new Date().toISOString().slice(0, 10),
    promocao: body.promocao || new Date().toISOString().slice(0, 10),
    adv1: body.adv1 || false,
    adv2: body.adv2 || false,
    adv3: body.adv3 || false,
  }

  data.membros.push(novoMembro)
  data.membrosOrder.push(novoMembro.id)
  data.nextMemId++
  writeData(data)

  res.status(201).json(novoMembro)
})

// PUT /api/membros/reorder — deve vir antes de /:id
router.put('/reorder', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const { orderedIds } = req.body as { orderedIds: number[] }

  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'orderedIds deve ser um array' })
    return
  }

  const data = readData()
  data.membrosOrder = orderedIds
  writeData(data)

  res.json({ ok: true })
})

// PUT /api/membros/:id
router.put('/:id', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)
  const data = readData()
  const idx = data.membros.findIndex(m => m.id === id)

  if (idx === -1) {
    res.status(404).json({ error: 'Membro não encontrado' })
    return
  }

  const allowed: (keyof Membro)[] = [
    'badge', 'passaporte', 'policial', 'patenteNPD', 'patenteInterna',
    'status', 'entrada', 'promocao', 'adv1', 'adv2', 'adv3',
  ]

  const body = req.body as Partial<Membro>
  allowed.forEach(field => {
    if (field in body) {
      (data.membros[idx] as unknown as Record<string, unknown>)[field] = body[field]
    }
  })

  writeData(data)
  res.json(data.membros[idx])
})

// DELETE /api/membros/:id
router.delete('/:id', requireAuth, adminOnly, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)
  const data = readData()
  const idx = data.membros.findIndex(m => m.id === id)

  if (idx === -1) {
    res.status(404).json({ error: 'Membro não encontrado' })
    return
  }

  data.membros.splice(idx, 1)
  data.membrosOrder = data.membrosOrder.filter(oid => oid !== id)
  writeData(data)

  res.json({ ok: true })
})

export default router
