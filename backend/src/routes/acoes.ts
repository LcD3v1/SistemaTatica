import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { modOrAdmin } from '../middleware/roles'
import { readData, writeData } from '../data'
import { Acao } from '../types'

const router = Router()

// GET /api/acoes/export/csv — deve vir antes de /:id
router.get('/export/csv', requireAuth, modOrAdmin, (_req: Request, res: Response): void => {
  const data = readData()
  const membroMap = new Map(data.membros.map(m => [m.id, m]))

  const rows: string[] = ['ID,Data,QRU,Resultado,Participantes']

  const sorted = [...data.acoes].sort((a, b) => b.id - a.id)

  for (const acao of sorted) {
    const participantes = acao.participants
      .map(p => {
        const m = membroMap.get(p.memberId)
        return m ? `${p.patenteUnidade} ${m.policial}` : `ID:${p.memberId}`
      })
      .join(' | ')

    const row = [
      acao.id,
      acao.data,
      acao.qru,
      acao.resultado,
      `"${participantes}"`,
    ].join(',')

    rows.push(row)
  }

  const csv = rows.join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="acoes.csv"')
  res.send('﻿' + csv) // BOM para Excel reconhecer UTF-8
})

// GET /api/acoes
router.get('/', requireAuth, (req: Request, res: Response): void => {
  const data = readData()
  const { qru, resultado, page, limit } = req.query

  let acoes = [...data.acoes].sort((a, b) => b.id - a.id)

  if (qru) acoes = acoes.filter(a => a.qru === qru)
  if (resultado) acoes = acoes.filter(a => a.resultado === resultado)

  const pageNum = parseInt(String(page || '1'), 10)
  const limitNum = parseInt(String(limit || '50'), 10)
  const total = acoes.length
  const paginated = acoes.slice((pageNum - 1) * limitNum, pageNum * limitNum)

  res.json({ acoes: paginated, total, page: pageNum, limit: limitNum })
})

// POST /api/acoes
router.post('/', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const body = req.body as Omit<Acao, 'id'>
  const data = readData()

  if (!body.data || !body.qru || !body.resultado) {
    res.status(400).json({ error: 'Data, QRU e resultado são obrigatórios' })
    return
  }

  const novaAcao: Acao = {
    id: data.nextAcId,
    data: body.data,
    qru: body.qru,
    resultado: body.resultado,
    participants: Array.isArray(body.participants) ? body.participants : [],
  }

  data.acoes.push(novaAcao)
  data.nextAcId++
  writeData(data)

  res.status(201).json(novaAcao)
})

// DELETE /api/acoes/:id
router.delete('/:id', requireAuth, modOrAdmin, (req: Request, res: Response): void => {
  const id = parseInt(String(req.params.id), 10)
  const data = readData()
  const idx = data.acoes.findIndex(a => a.id === id)

  if (idx === -1) {
    res.status(404).json({ error: 'Ação não encontrada' })
    return
  }

  data.acoes.splice(idx, 1)
  writeData(data)

  res.json({ ok: true })
})

export default router
