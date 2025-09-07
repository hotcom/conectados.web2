export type Regiao = "N" | "NE" | "CO" | "SE" | "S"

export const UF_TO_REGIAO: Record<string, Regiao> = {
  // Norte
  AC: "N",
  AM: "N",
  AP: "N",
  PA: "N",
  RO: "N",
  RR: "N",
  TO: "N",
  // Nordeste
  AL: "NE",
  BA: "NE",
  CE: "NE",
  MA: "NE",
  PB: "NE",
  PE: "NE",
  PI: "NE",
  RN: "NE",
  SE: "NE",
  // Centro-Oeste
  DF: "CO",
  GO: "CO",
  MT: "CO",
  MS: "CO",
  // Sudeste
  ES: "SE",
  MG: "SE",
  RJ: "SE",
  SP: "SE",
  // Sul
  PR: "S",
  RS: "S",
  SC: "S",
}

export const UF_LIST = Object.keys(UF_TO_REGIAO)

export function normalizeUF(input?: string | null) {
  if (!input) return ""
  return input.toString().trim().toUpperCase()
}

export function inferRegiaoFromUF(uf: string): Regiao | null {
  const u = normalizeUF(uf)
  return (UF_TO_REGIAO as any)[u] ?? null
}
