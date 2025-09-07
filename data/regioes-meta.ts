// Metadados de Regiões do Brasil (IBGE)
export type RegiaoSigla = "N" | "NE" | "SE" | "S" | "CO"

export type RegiaoMeta = {
  codigo: 1 | 2 | 3 | 4 | 5
  nome: string
  sigla: RegiaoSigla
  area_km2: number
}

export const REGIOES_META: Record<RegiaoSigla, RegiaoMeta> = {
  N: { codigo: 1, nome: "Norte", sigla: "N", area_km2: 3849554.979 },
  NE: { codigo: 2, nome: "Nordeste", sigla: "NE", area_km2: 1552175.419 },
  SE: { codigo: 3, nome: "Sudeste", sigla: "SE", area_km2: 924558.342 },
  S: { codigo: 4, nome: "Sul", sigla: "S", area_km2: 576736.821 },
  CO: { codigo: 5, nome: "Centro-oeste", sigla: "CO", area_km2: 1606354.015 },
}

export const REGIOES_META_BY_CODE: Record<number, RegiaoMeta> = Object.values(REGIOES_META).reduce(
  (acc, r) => {
    acc[r.codigo] = r
    return acc
  },
  {} as Record<number, RegiaoMeta>,
)
