export type Nivel = 'admin' | 'moderador' | 'membro'
export type StatusMembro = 'Ativo' | 'Inativo' | 'Ausência'
export type ResultadoAcao = 'Vitória' | 'Derrota' | 'Participação'
export type ResultadoRecruita = 'Aprovado' | 'Reprovado'

export interface Membro {
  id: number
  badge: string
  passaporte: string
  policial: string
  patenteNPD: string
  patenteInterna: string
  status: StatusMembro
  entrada: string
  promocao: string
  adv1: boolean
  adv2: boolean
  adv3: boolean
  ordem?: number
}

export interface ParticipanteAcao {
  memberId: number
  patenteUnidade: string
}

export interface Acao {
  id: number
  data: string
  qru: string
  resultado: ResultadoAcao
  participants: ParticipanteAcao[]
}

export interface Conta {
  id: number
  username: string
  password: string
  nivel: Nivel
  ativo: boolean
}

export interface CategoriaRecrutamento {
  id: number
  nome: string
  peso: number
}

export interface RecCfg {
  notaMinima: number
  categorias: CategoriaRecrutamento[]
}

export interface Recruta {
  id: number
  nome: string
  data: string
  scores: Record<string, number>
  total: number
  resultado: ResultadoRecruita
  observacoes?: string
}

export interface SwatData {
  membros: Membro[]
  acoes: Acao[]
  qrus: string[]
  recrutas: Recruta[]
  recCfg: RecCfg
  patentes: string[]
  cargos: string[]
  contas: Conta[]
  nextMemId: number
  nextAcId: number
  nextRecId: number
  nextContaId: number
  logo: string
  membrosOrder: number[]
}

export interface AuthPayload {
  contaId: number
  username: string
  nivel: Nivel
}
