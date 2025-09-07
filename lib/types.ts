export type Role = "admin" | "pastor_conselho" | "pastor_regional" | "pastor_local" | "secretaria"

export interface UserDoc {
  uid: string
  email: string
  displayName?: string
  nickname?: string
  phone?: string
  birthDate?: string
  role: string
  roles?: string[]
  regionId?: string
  churchId?: string
  createdAt: any
  updatedAt: any
}

export type Invite = {
  id: string
  email: string
  role: Role
  regionId?: string | null
  churchId?: string | null
  createdBy: string
  createdAt: number
  acceptedAt?: number | null
  acceptedByUid?: string | null
}

export type PlaceKind = "igreja" | "nucleo" | "celula"

export type Place = {
  id: string
  kind: PlaceKind
  name: string
  address: string
  location: { lat: number; lng: number }
  regionId?: string | null
  churchId?: string | null
  ownerUid?: string | null
  createdAt: number
}
