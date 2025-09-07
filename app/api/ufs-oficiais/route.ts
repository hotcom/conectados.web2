import { NextResponse } from "next/server"
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson"
import { UF_META, UF_META_BY_CODE } from "@/data/ufs-meta"
import { ufsFC } from "@/data/ufs"
import { UF_TO_REGIAO } from "@/utils/geo"

// Fontes oficiais IBGE (podem falhar por CORS no preview)
const IBGE_URLS = [
  "https://servicodados.ibge.gov.br/api/v3/malhas/estados?formato=application/vnd.geo+json",
  "https://servicodados.ibge.gov.br/api/v2/malhas/estados?formato=application/vnd.geo+json",
  "https://servicodados.ibge.gov.br/api/v1/malhas/estados?formato=application/vnd.geo+json",
]

// Fallback com CORS liberado (GitHub Raw) — estados reais (não retângulos)
const FALLBACK_UF_GEOJSON =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson"

export const dynamic = "force-dynamic"

export async function GET() {
  // 1) Tenta IBGE
  for (const url of IBGE_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue
      const fc = (await res.json()) as FeatureCollection<Geometry, any>
      if (!Array.isArray(fc.features) || fc.features.length === 0) continue

      const enriched: FeatureCollection<Geometry, any> = {
        type: "FeatureCollection",
        features: fc.features.map((f: any) => {
          const code: number =
            Number(f?.properties?.id ?? f?.id ?? f?.properties?.codarea ?? f?.properties?.codigo) || 0
          const meta = UF_META_BY_CODE[code]
          const ufSigla = meta?.sigla ?? f?.properties?.sigla ?? null
          return {
            ...f,
            properties: {
              ...f.properties,
              codigo: code || meta?.codigo || null,
              uf: ufSigla,
              nome: meta?.nome ?? f?.properties?.nome ?? null,
              regiao_codigo: meta?.regiao_codigo ?? null,
              regiao_nome: meta?.regiao_nome ?? null,
              regiao_sigla: meta?.regiao_sigla ?? (ufSigla ? (UF_TO_REGIAO as any)[ufSigla] : null) ?? null,
              area_km2: meta?.area_km2 ?? null,
              fonte: "IBGE",
            },
          }
        }),
      }
      return NextResponse.json(enriched, { headers: { "Cache-Control": "no-store" } })
    } catch {
      // tenta próxima
    }
  }

  // 2) Fallback: dataset público com geometria correta (tem id=UF, name=nome)
  try {
    const res = await fetch(FALLBACK_UF_GEOJSON, { cache: "no-store" })
    if (res.ok) {
      const fc = (await res.json()) as FeatureCollection<Geometry, any>
      const mapped: FeatureCollection<Geometry, any> = {
        type: "FeatureCollection",
        features: fc.features.map((f: any) => {
          // ClickThatHood: properties.id é a sigla UF; properties.name é o nome
          const uf: string = String(f?.properties?.id || f?.properties?.uf || "").toUpperCase()
          const meta = (UF_META as any)[uf]
          return {
            ...(f as Feature<Geometry, any>),
            properties: {
              ...f.properties,
              codigo: meta?.codigo ?? null,
              uf,
              nome: meta?.nome ?? f?.properties?.name ?? uf,
              regiao_codigo: meta?.regiao_codigo ?? null,
              regiao_nome: meta?.regiao_nome ?? null,
              regiao_sigla: meta?.regiao_sigla ?? (UF_TO_REGIAO as any)[uf] ?? null,
              area_km2: meta?.area_km2 ?? null,
              fonte: "github-click_that_hood",
            },
          }
        }),
      }
      return NextResponse.json(mapped, {
        headers: { "Cache-Control": "no-store", "X-Fallback": "ufs-github" },
      })
    }
  } catch {
    // segue para fallback local
  }

  // 3) Fallback local (retângulos aproximados) — último recurso
  const fallbackLocal: FeatureCollection<Polygon | MultiPolygon, any> = {
    type: "FeatureCollection",
    features: ufsFC.features.map((f) => {
      const uf = String(f.properties?.uf || "").toUpperCase()
      const meta = (UF_META as any)[uf]
      const regSigla = meta?.regiao_sigla ?? (UF_TO_REGIAO as any)[uf] ?? null
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          codigo: meta?.codigo ?? null,
          uf,
          nome: meta?.nome ?? uf,
          regiao_codigo: meta?.regiao_codigo ?? null,
          regiao_nome: meta?.regiao_nome ?? null,
          regiao_sigla: regSigla,
          area_km2: meta?.area_km2 ?? null,
          fonte: "fallback-local-retangulos",
        },
      }
    }),
  }
  return NextResponse.json(fallbackLocal, {
    headers: { "Cache-Control": "no-store", "X-Fallback": "ufs-local" },
  })
}
