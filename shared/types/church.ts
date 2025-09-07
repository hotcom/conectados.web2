export type ChurchType = "regional" | "local" | "nucleo"

export interface Church {
  id: string
  name: string
  type: ChurchType
  address: string
  location: {
    lat: number
    lng: number
  }
  regionId?: string
  parentChurchId?: string
  pastorId: string // Pastor principal (backward compatibility)
  pastorIds?: string[] // Múltiplos pastores
  secretaryId?: string // Secretaria específica desta igreja
  secretaryName?: string // Nome da secretaria
  secretaryEmail?: string // Email da secretaria
  secretaryPhone?: string // Telefone da secretaria
  managedBy?: string[] // [pastorIds, secretaryId] - quem pode gerenciar esta igreja
  status: "active" | "inactive" | "temporary"
  createdAt: number
  updatedAt: number
}

export interface ChurchStats {
  totalMembers: number
  totalNucleos: number
  monthlyGrowth: number
}
