import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'
import { FastData, CargoPermissao } from './types'
import { normalizePermMap, fullPermMap } from './permAreas'

const DATA_PATH = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.resolve(__dirname, '..', 'data.json')

const DEFAULT_DATA: FastData = {
  membros: [],
  acoes: [],
  qrus: ['QRU-1', 'QRU-2', 'QRU-3'],
  recrutas: [],
  recCfg: {
    notaMinima: 7,
    categorias: [
      { id: 1, nome: 'Comunicação', peso: 1 },
      { id: 2, nome: 'Tiro', peso: 1 },
      { id: 3, nome: 'Táticas', peso: 1 },
      { id: 4, nome: 'Disciplina', peso: 1 },
    ],
  },
  patentes: ['Recruta', 'Soldado', 'Cabo', 'Sargento', 'Tenente', 'Capitão', 'Major', 'Coronel'],
  cargos: ['Operador', 'Sniper', 'Médico de Campo', 'Líder de Esquadrão', 'Comandante'],
  contas: [],
  solicitacoes: [],
  ausencias: [],
  avisos: [],
  cargosPermissao: [],
  anuncioSituacoes: [
    { id: 1, label: 'Área Restrita', titulo: 'P.M.C INFORMA:', texto: 'A área do [LOCAL] se encontra restrita pelas próximas horas, por estar sob atividade criminosa. Mantenham-se afastados — risco iminente de bala perdida! ESTE AVISO SERÁ ÚNICO! Att. [ASSINATURA]' },
    { id: 2, label: 'Operação em andamento', titulo: 'P.M.C INFORMA:', texto: 'Uma operação policial está em andamento na região do [LOCAL]. Solicitamos que a população evite a área e coopere com as autoridades. Att. [ASSINATURA]' },
    { id: 3, label: 'Toque de recolher', titulo: 'P.M.C INFORMA:', texto: 'Fica decretado toque de recolher na região do [LOCAL] a partir deste momento. A circulação está restrita até novo aviso. Att. [ASSINATURA]' },
    { id: 4, label: 'Foragido / Procurado', titulo: 'P.M.C INFORMA:', texto: 'Indivíduo foragido e possivelmente armado foi avistado nas proximidades do [LOCAL]. Em caso de avistamento, acione a PMC imediatamente e não se aproxime. Att. [ASSINATURA]' },
    { id: 5, label: 'Ponto de bloqueio', titulo: 'P.M.C INFORMA:', texto: 'Ponto de bloqueio montado no [LOCAL]. Reduza a velocidade, mantenha a calma e tenha os documentos em mãos. Att. [ASSINATURA]' },
    { id: 6, label: 'Comunicado geral', titulo: 'P.M.C INFORMA:', texto: 'Comunicado oficial da PMC à população do [LOCAL]: reforçamos o compromisso com a segurança da região. Denúncias podem ser feitas às autoridades. Att. [ASSINATURA]' },
  ],
  nextMemId: 200,
  nextAcId: 1,
  nextRecId: 1,
  nextContaId: 1,
  nextAusId: 1,
  nextSitId: 7,
  nextAvisoId: 1,
  nextSolId: 1,
  nextCargoPermId: 1,
  logo: '',
  membrosOrder: [],
}

export function readData(): FastData {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as FastData
    // Garante que campos novos existam em dados legados
    return { ...DEFAULT_DATA, ...parsed }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
}

export function writeData(data: FastData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function ensureDefaultAdmin(): Promise<void> {
  const data = readData()
  let changed = false

  // Garante um cargo por nome (cria se não existir).
  const ensureCargo = (nome: string, admin: boolean, permissoes: Record<string, { ver: boolean; editar: boolean }>): CargoPermissao => {
    let c = data.cargosPermissao.find(x => x.nome.toLowerCase() === nome.toLowerCase())
    if (!c) {
      c = { id: data.nextCargoPermId, nome, padrao: false, admin, permissoes }
      data.cargosPermissao.push(c)
      data.nextCargoPermId++
      changed = true
    }
    return c
  }

  // Cargo "Administrador" (super-usuário) — bootstrap do sistema.
  const cargoAdmin = data.cargosPermissao.find(c => c.admin) ?? ensureCargo('Administrador', true, {})

  // ── Migração: contas legadas (tinham `nivel`, sem cargo) → cargo equivalente ──
  // Idempotente: só roda enquanto existirem contas com o campo antigo `nivel`.
  const legacy = data.contas.filter(c => (c as unknown as { nivel?: string }).nivel !== undefined && !c.cargoPermId)
  if (legacy.length > 0) {
    const cargoMod = ensureCargo('Moderador', false, fullPermMap())
    const cargoMembro = ensureCargo('Membro', false, normalizePermMap({
      dashboard: { ver: true, editar: false },
      avisos: { ver: true, editar: false },
      registrar_acao: { ver: true, editar: true },
      historico: { ver: true, editar: false },
      estatisticas: { ver: true, editar: false },
      ranking: { ver: true, editar: false },
      membros: { ver: true, editar: false },
      ausencias: { ver: true, editar: true },
      recrutamento: { ver: true, editar: false },
    }))
    const cargoView = ensureCargo('Somente leitura', false, normalizePermMap({
      estatisticas: { ver: true, editar: false },
      ranking: { ver: true, editar: false },
      membros: { ver: true, editar: false },
      avisos: { ver: true, editar: false },
    }))
    for (const c of legacy) {
      const nv = (c as unknown as { nivel?: string }).nivel
      c.cargoPermId = nv === 'admin' ? cargoAdmin.id
        : nv === 'moderador' ? cargoMod.id
        : nv === 'view_only' ? cargoView.id
        : cargoMembro.id
      delete (c as unknown as { nivel?: string }).nivel
    }
    changed = true
    console.log(`[TÁTICA] Migração nível→cargo: ${legacy.length} conta(s) migrada(s).`)
  }

  // Primeira execução (banco vazio): cria a conta admin padrão.
  if (data.contas.length === 0) {
    const hashed = await bcrypt.hash('admin123', 12)
    data.contas.push({
      id: data.nextContaId,
      username: 'admin',
      password: hashed,
      ativo: true,
      cargoPermId: cargoAdmin.id,
    })
    data.nextContaId++
    changed = true
    console.log('[TÁTICA] Conta admin padrão criada: admin / admin123')
  }

  if (changed) writeData(data)
}
