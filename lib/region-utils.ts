// Mapeamento de regionId para nome da região
// Este é um mapeamento temporário até termos uma coleção de regiões no Firestore
export const REGION_NAMES: Record<string, string> = {
  "q63YyS2e4qqXVwy1f7Iy": "São Paulo XI",
  "r74ZzT3f5rrYWxz2g8Jz": "Nordeste", 
  "s85AaU4g6ssZXyA3h9Ka": "Sudeste",
  "t96BbV5h7ttAYzB4i0Lb": "Sul",
  "u07CcW6i8uuBZaC5j1Mc": "Centro-Oeste"
}

// Função para obter o nome da região pelo ID
export function getRegionName(regionId: string): string {
  return REGION_NAMES[regionId] || regionId
}

// Função para obter todas as regiões disponíveis
export function getAllRegions(): Array<{id: string, name: string}> {
  return Object.entries(REGION_NAMES).map(([id, name]) => ({
    id,
    name
  }))
}
