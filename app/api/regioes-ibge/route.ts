import { NextResponse } from "next/server"
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson"
import { REGIOES_META } from "@/data/regioes-meta"
import { regioesFC } from "@/data/regioes"

// Fontes oficiais IBGE (podem falhar por CORS no preview)
const IBGE_URLS = [
  "https://servicodados.ibge.gov.br/api/v3/malhas/regioes?formato=application/vnd.geo+json",
  "https://servicodados.ibge.gov.br/api/v2/malhas/regioes?formato=application/vnd.geo+json",
  "https://servicodados.ibge.gov.br/api/v1/malhas/regioes?formato=application/vnd.geo+json",
]

export const dynamic = "force-dynamic"

function normalizeNome(n?: string | null) {
  return (n || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}
function siglaFromNome(nome?: string | null): "N" | "NE" | "SE" | "S" | "CO" | null {
  const s = normalizeNome(nome)
  if (!s) return null
  if (s.includes("norte")) return "N"
  if (s.includes("nordeste")) return "NE"
  if (s.includes("sudeste")) return "SE"
  if (s.includes("sul")) return "S"
  if (s.includes("centro-oeste") || s.includes("centro oeste")) return "CO"
  return null
}

export async function GET() {
  // 1) Tenta IBGE diretamente (se funcionar, melhor)
  for (const url of IBGE_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue
      const fc = (await res.json()) as FeatureCollection<Geometry, any>
      if (!Array.isArray(fc.features) || fc.features.length === 0) continue

      // Enriquecer: garantir sigla/codigo/area para cores e metadados
      const mapped: FeatureCollection<Geometry, any> = {
        type: "FeatureCollection",
        features: fc.features.map((f: any) => {
          const nomeRaw = f?.properties?.nome ?? f?.properties?.NM_REGIA ?? f?.properties?.name ?? null
          const sigla = (f?.properties?.sigla as any) ?? siglaFromNome(nomeRaw) ?? null
          const meta = sigla ? (REGIOES_META as any)[sigla] : null
          return {
            ...f,
            properties: {
              ...f.properties,
              nome: meta?.nome ?? nomeRaw ?? null,
              sigla: sigla ?? null,
              codigo: meta?.codigo ?? null,
              area_km2: meta?.area_km2 ?? null,
              fonte: "IBGE",
            },
          }
        }),
      }
      return NextResponse.json(mapped, { headers: { "Cache-Control": "no-store" } })
    } catch {
      // tenta próxima
    }
  }

  // 2) Fallback: derivar Regiões a partir das UFs (MultiPolygon por agrupamento)
  try {
    const res = await fetch("/api/ufs-oficiais", { cache: "no-store" })
    if (res && res.ok) {
      const ufsFC = (await res.json()) as FeatureCollection<Geometry, any>
      const groups: Record<string, Array<Polygon | MultiPolygon>> = {}
      for (const f of ufsFC.features) {
        const sig = String((f as any)?.properties?.regiao_sigla || "").toUpperCase()
        if (!sig) continue
        if (!groups[sig]) groups[sig] = []
        if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
          groups[sig].push(f.geometry as any)
        }
      }

      const features: Feature<MultiPolygon, any>[] = Object.entries(groups).map(([sigla, geoms]) => {
        const multi: number[][][][] = []
        for (const g of geoms) {
          if (g.type === "Polygon") multi.push(g.coordinates as any)
          else if (g.type === "MultiPolygon") for (const poly of g.coordinates) multi.push(poly as any)
        }
        const meta = (REGIOES_META as any)[sigla]
        return {
          type: "Feature",
          geometry: { type: "MultiPolygon", coordinates: multi },
          properties: {
            codigo: meta?.codigo ?? null,
            nome: meta?.nome ?? sigla,
            sigla,
            area_km2: meta?.area_km2 ?? null,
            fonte: "ufs-agregadas",
          },
        }
      })

      const out: FeatureCollection<MultiPolygon, any> = { type: "FeatureCollection", features }
      return NextResponse.json(out, {
        headers: { "Cache-Control": "no-store", "X-Fallback": "regioes-from-ufs" },
      })
    }
  } catch {
    // segue para fallback local
  }

  // 3) Fallback local (retângulos simplificados — último recurso)
  const fallbackLocal: FeatureCollection<Polygon, any> = {
    type: "FeatureCollection",
    features: regioesFC.features.map((f) => {
      // no regioesFC, properties.nome guarda "N","NE","CO","SE","S"
      const sigla = String(f.properties?.nome || "").toUpperCase()
      const meta = (REGIOES_META as any)[sigla]
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          codigo: meta?.codigo ?? null,
          nome: meta?.nome ?? sigla,
          sigla: meta?.sigla ?? sigla,
          area_km2: meta?.area_km2 ?? null,
          fonte: "fallback-local-retangulos",
        },
      }
    }),
  }
  return NextResponse.json(fallbackLocal, {
    headers: { "Cache-Control": "no-store", "X-Fallback": "regioes-local" },
  })
}
