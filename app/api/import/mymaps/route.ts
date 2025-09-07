import { NextResponse } from "next/server"

// KML -> GeoJSON
import { kml as toGeoJSONKml } from "@mapbox/togeojson"
import { DOMParser as XDOMParser } from "@xmldom/xmldom"
import type { FeatureCollection, Geometry } from "geojson"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mid = searchParams.get("mid")
  if (!mid) return NextResponse.json({ error: "Parâmetro 'mid' é obrigatório" }, { status: 400 })

  // URL pública de KML do My Maps
  // Observação: se o mapa não for público, o Google retornará HTML de login em vez do KML.
  const kmlUrl = `https://www.google.com/maps/d/kml?forcekml=1&mid=${encodeURIComponent(mid)}`

  try {
    const res = await fetch(kmlUrl, { redirect: "follow" })
    const contentType = res.headers.get("content-type") || ""
    const text = await res.text()

    // Heurística para detectar login/HTML
    const looksLikeHtml = contentType.includes("text/html") || /<html/i.test(text)
    if (!res.ok || looksLikeHtml) {
      return new NextResponse(
        "Não foi possível ler o KML. O mapa provavelmente não está público (retornou página de login).",
        { status: 403 },
      )
    }

    // Parse KML
    const doc = new XDOMParser().parseFromString(text, "text/xml")
    const fc = toGeoJSONKml(doc) as FeatureCollection<Geometry>

    // Opcional: filtrar só polígonos/multipolígonos para "regiões"
    const filtered: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: fc.features.filter((f) => ["Polygon", "MultiPolygon"].includes(f.geometry?.type || "")),
    }

    // Se nada sobrar, devolva tudo que veio
    const out = filtered.features.length ? filtered : fc
    return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } })
  } catch (err: any) {
    return new NextResponse(err?.message || "Erro ao importar My Maps", { status: 500 })
  }
}
