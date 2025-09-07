// Node script: converte um CSV (id,nome,uf,regiao,tipo,lat,lng,pastor?) em linhas f(...) para colar em data/unidades.ts
// Como usar:
// 1) Coloque a URL do seu CSV em CSV_URL (pode ser um Google Sheets publicado como CSV).
// 2) Rode o script e copie o output para dentro de data/unidades.ts.
// Observação: este script usa fetch nativo e papaparse.

import Papa from "papaparse"

const CSV_URL = "https://example.com/unidades.csv" // troque para a sua URL

type Row = {
  id: string
  nome: string
  uf: string
  regiao: "N" | "NE" | "CO" | "SE" | "S"
  tipo: "igreja" | "nucleo" | "celula"
  lat: string | number
  lng: string | number
  pastor?: string
}

async function main() {
  console.log("Baixando CSV de:", CSV_URL)
  const res = await fetch(CSV_URL)
  const csvText = await res.text()

  const parsed = Papa.parse<Row>(csvText, { header: true, skipEmptyLines: true })
  if (parsed.errors?.length) {
    console.error("Erros no CSV:", parsed.errors)
  }

  const rows = parsed.data.filter(Boolean)
  console.log("// Cole as linhas abaixo dentro de data/unidades.ts (na lista features)")
  for (const r of rows) {
    const id = (r.id || "").trim()
    const nome = (r.nome || "").replace(/"/g, '\\"')
    const uf = (r.uf || "").trim().toUpperCase()
    const regiao = (r.regiao || "").trim().toUpperCase()
    const tipo = (r.tipo || "").trim().toLowerCase()
    const lat = Number(r.lat)
    const lng = Number(r.lng)
    const pastor = (r.pastor || "").replace(/"/g, '\\"')

    const pastorArg = pastor ? `, "${pastor}"` : ""
    console.log(`f("${id}", "${nome}", "${uf}", "${regiao}", "${tipo}", ${lat}, ${lng}${pastorArg}),`)
  }
}

main().catch((e) => {
  console.error("Erro:", e)
})
