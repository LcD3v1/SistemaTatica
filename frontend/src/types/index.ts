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

export interface AuthUser {
  contaId: number
  username: string
  nivel: Nivel
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export interface AcoesResponse {
  acoes: Acao[]
  total: number
  page: number
  limit: number
}
