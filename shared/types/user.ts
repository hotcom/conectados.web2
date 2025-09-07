export type UserRole =
  | "admin"
  | "pastor_conselho"
  | "pastor_regional"
  | "pastor_local"
  | "secretaria"

export interface User {
  id: string
  email: string
  displayName: string
  fullName?: string // Nome completo
  nickname?: string // Apelido
  phone?: string // Telefone
  birthDate?: string // Data de aniversário
  role?: UserRole // Backward compatibility
  roles?: UserRole[] // New multi-role system
  regionId?: string
  regionName?: string // Nome da região (dinâmico)
  churchId?: string
  isSecretaryOf?: string // ID da igreja se for secretaria
  canManageChurch?: string[] // IDs das igrejas que pode gerenciar
  publicKey?: string
  permissions: string[]
  createdAt: number
  updatedAt: number
  status: "active" | "inactive" | "pending"
}

export interface UserInvite {
  id: string
  email: string
  role: UserRole
  regionId?: string
  regionName?: string // Nome da região (dinâmico)
  churchId?: string
  invitedBy: string
  token: string
  expiresAt: number
  acceptedAt?: number
  createdAt: number
  whatsappSent: boolean
}

export interface UserDoc extends User {
  // Firestore document interface
}
