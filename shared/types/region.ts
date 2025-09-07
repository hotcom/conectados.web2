export interface Region {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  createdBy: string // UID do usuário que criou
  isActive: boolean
}

export interface RegionDoc extends Region {
  // Firestore document interface
}
