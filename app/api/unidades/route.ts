import { NextResponse } from "next/server"
import { unidadesFC } from "@/data/unidades"
import type { FeatureCollection, Point } from "geojson"
import { inferRegiaoFromUF, normalizeUF } from "@/utils/geo"
import { createAdminClient } from "@/utils/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ufFilter = searchParams.get("uf")
  const regiaoFilter = searchParams.get("regiao")
  const tipoFilter = searchParams.get("tipo")

  // Clona e normaliza UF/Região de todas as features
  const data: FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features: unidadesFC.features.map((f) => {
      const uf = normalizeUF(f.properties.uf)
      const regiao = inferRegiaoFromUF(uf) ?? (f.properties.regiao as string)
      return {
        ...f,
        properties: {
          ...f.properties,
          uf,
          regiao,
        },
      }
    }),
  }

  // Filtros
  if (ufFilter && ufFilter !== "todas") {
    const uf = normalizeUF(ufFilter)
    data.features = data.features.filter((f) => normalizeUF(f.properties.uf) === uf)
  }
  if (regiaoFilter && regiaoFilter !== "todas") {
    const reg = regiaoFilter.toString().trim().toUpperCase()
    data.features = data.features.filter((f) => String(f.properties.regiao).toUpperCase() === reg)
  }
  if (tipoFilter && tipoFilter !== "todos") {
    const tipo = tipoFilter.toString().trim().toLowerCase()
    data.features = data.features.filter((f) => String(f.properties.tipo).toLowerCase() === tipo)
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nome: string = String(body?.nome || "").trim()
    const uf: string = normalizeUF(body?.uf)
    const tipo: string = String(body?.tipo || "")
      .trim()
      .toLowerCase()
    const pastor: string | null = body?.pastor ? String(body?.pastor) : null
    const endereco: string | null = body?.endereco ? String(body?.endereco) : null
    const lat = Number(body?.lat)
    const lng = Number(body?.lng)

    if (!nome || !uf || !tipo || !isFinite(lat) || !isFinite(lng)) {
      return new Response("Campos obrigatórios: nome, uf, tipo, lat, lng", { status: 400 })
    }

    const regiao = inferRegiaoFromUF(uf)
    if (!regiao) {
      return new Response("UF inválida para inferir Região", { status: 400 })
    }

    const supabase = createAdminClient()

    // Preferimos RPC para montar geography(Point) no servidor
    const p_id = crypto.randomUUID()
    const { data, error } = await supabase.rpc("insert_unidade", {
      p_id,
      p_nome: nome,
      p_uf: uf,
      p_regiao: regiao,
      p_tipo: tipo,
      p_pastor: pastor,
      p_endereco: endereco,
      p_lng: lng,
      p_lat: lat,
    })

    if (error) {
      // Se a função ainda não existe, informe claramente
      return new Response(`Erro ao inserir (execute os scripts SQL 004/005): ${error.message}`, { status: 500 })
    }

    const row = Array.isArray(data) ? data[0] : data
    const feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: row?.id ?? p_id,
        nome,
        uf,
        regiao,
        tipo,
        pastor,
        endereco,
      },
    }

    return NextResponse.json({ ok: true, feature })
  } catch (e: any) {
    return new Response(e?.message || "Erro inesperado", { status: 500 })
  }
}
