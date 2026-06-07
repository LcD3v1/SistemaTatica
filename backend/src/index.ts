import 'dotenv/config'
import path from 'path'
import { existsSync } from 'fs'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { ensureDefaultAdmin } from './data'
import authRoutes from './routes/auth'
import membrosRoutes from './routes/membros'
import acoesRoutes from './routes/acoes'
import configRoutes from './routes/config'
import recrutasRoutes from './routes/recrutas'

const app = express()
const PROD = process.env.NODE_ENV === 'production'

// CORS só em desenvolvimento (Vite em :5173)
if (!PROD) {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }))
}

app.use(express.json({ limit: '5mb' }))

// ── API routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/membros', membrosRoutes)
app.use('/api/acoes', acoesRoutes)
app.use('/api/config', configRoutes)
app.use('/api/recrutas', recrutasRoutes)
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// ── Serve frontend buildado ───────────────────────────────────
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist')
if (existsSync(frontendDist)) {
  // Assets com hash (js/css) ficam em cache longo; HTML nunca cacheado
  app.use(express.static(frontendDist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      } else if (/\.(js|css|woff2?|ttf|otf|eot)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        // Favicon e outros: sempre revalidar
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  }))
  // catch-all: devolve index.html para o React Router lidar com as rotas
  app.use((_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
  console.log('[SWAT] Servindo frontend de:', frontendDist)
} else {
  console.log('[SWAT] Frontend dist não encontrado — rode: npm run build')
}

const PORT = parseInt(process.env.PORT || '3001', 10)

ensureDefaultAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`[SWAT] Sistema rodando em http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('[SWAT] Erro ao inicializar:', err)
  process.exit(1)
})
