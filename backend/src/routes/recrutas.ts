import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { modOrAdmin } from '../middleware/roles'
import { readData, writeData } from '../data'
import { Recruta } from '../types'

const router = Router()

// GET /api/recrutas
router.get('/', requireAuth, modOrAdmin, (_req: Request, res: Response): void => {
  const data = readData()
  res.json([...data.recrutas].sort((a, b) => b.id - a.id))
})

// POST /api/recrutas
router.post('/', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const body = req.body as Omit<Recruta, 'id'>
  const data = readData()

  if (!body.nome) {
    res.status(400).json({ error: 'Nome é obrigatório' })
    return
  }

  const novoRecruita: Recruta = {
    id: data.nextRecId,
    nome: body.nome,
    data: body.data || new Date().toISOString().slice(0, 10),
    scores: body.scores || {},
    total: body.total ?? 0,
    resultado: body.resultado || 'Reprovado',
    observacoes: body.observacoes || '',
  }

  data.recrutas.push(novoRecruita)
  data.nextRecId++
  writeData(data)

  res.status(201).json(novoRecruita)
})

// DELETE /api/recrutas/:id
router.delete('/:id', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)
  const data = readData()
  const idx = data.recrutas.findIndex(r => r.id === id)

  if (idx === -1) {
    res.status(404).json({ error: 'Avaliação não encontrada' })
    return
  }

  data.recrutas.splice(idx, 1)
  writeData(data)

  res.json({ ok: true })
})

export default router
