"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { type Map } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Layers, MapIcon, RefreshCw, Import, Plus } from "lucide-react"
import type { Feature, FeatureCollection, Geometry, Point, Polygon } from "geojson"
import { UF_LIST, normalizeUF } from "@/utils/geo"

type UnidadeProperties = {
  id: string
  nome: string
  uf: string
  regiao: "N" | "NE" | "CO" | "SE" | "S"
  tipo: "igreja" | "nucleo" | "celula"
  pastor?: string
  endereco?: string
}

type LayersVisibility = {
  regioes: boolean
  ufs: boolean
  heatmap: boolean
  hexbin: boolean
}

const defaultLayers: LayersVisibility = {
  regioes: true,
  ufs: false,
  heatmap: false,
  hexbin: false,
}

const BRAZIL_CENTER: [number, number] = [-51.9253, -14.235]

export default function AtlasMap() {
  const mapRef = useRef<Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{ uf: string | "todas"; regiao: string | "todas"; tipo: string | "todos" }>({
    uf: "todas",
    regiao: "todas",
    tipo: "todos",
  })
  const [options, setOptions] = useState<{ ufs: string[]; regioes: string[]; tipos: string[] }>({
    ufs: [],
    regioes: [],
    tipos: ["igreja", "nucleo", "celula"],
  })
  const [layers, setLayers] = useState<LayersVisibility>(defaultLayers)
  const [unidades, setUnidades] = useState<FeatureCollection<Point, UnidadeProperties> | null>(null)
  const [regioes, setRegioes] = useState<FeatureCollection<Geometry> | null>(null)
  const [ufs, setUfs] = useState<FeatureCollection<Polygon> | null>(null)

  // My Maps import
  const [myMapsInput, setMyMapsInput] = useState<string>("")

  // Adicionar por endereço
  const [form, setForm] = useState<{ nome: string; uf: string; tipo: UnidadeProperties["tipo"]; endereco: string }>({
    nome: "",
    uf: "SP",
    tipo: "igreja",
    endereco: "",
  })
  const [adding, setAdding] = useState(false)

  // Fetch datasets
  const fetchData = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filters.uf !== "todas") qs.set("uf", filters.uf)
      if (filters.regiao !== "todas") qs.set("regiao", filters.regiao)
      if (filters.tipo !== "todos") qs.set("tipo", filters.tipo)
      const [uRes, rRes, ufsRes] = await Promise.all([
        fetch(`/api/unidades?${qs.toString()}`),
        fetch(`/api/regioes?layer=regioes`),
        fetch(`/api/regioes?layer=ufs`),
      ])
      const uData = (await uRes.json()) as FeatureCollection<Point, UnidadeProperties>
      const rData = (await rRes.json()) as FeatureCollection<Geometry>
      const ufsData = (await ufsRes.json()) as FeatureCollection<Polygon>
      setUnidades(uData)
      setRegioes(rData)
      setUfs(ufsData)

      const allRes = await fetch(`/api/unidades`)
      const allData = (await allRes.json()) as FeatureCollection<Point, UnidadeProperties>
      const ufsOpts = Array.from(new Set(allData.features.map((f) => f.properties.uf))).sort()
      const regiaoOpts = Array.from(new Set(allData.features.map((f) => f.properties.regiao))).sort()
      setOptions((prev) => ({ ...prev, ufs: ufsOpts, regioes: regiaoOpts }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.uf, filters.regiao, filters.tipo])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: BRAZIL_CENTER,
      zoom: 3.5,
      attributionControl: true,
    })
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right")
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 160, unit: "metric" }), "bottom-left")

    map.on("load", () => {
      map.addSource("unidades", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      })
      map.addSource("regioes", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addSource("ufs", { type: "geojson", data: { type: "FeatureCollection", features: [] } })

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "unidades",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#a7f3d0", 10, "#6ee7b7", 30, "#34d399", 100, "#10b981"],
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 32, 100, 40],
          "circle-stroke-color": "#065f46",
          "circle-stroke-width": 1.5,
        },
      })

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "unidades",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
        },
        paint: { "text-color": "#064e3b" },
      })

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "unidades",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "tipo"],
            "igreja",
            "#f59e0b",
            "nucleo",
            "#8b5cf6",
            "celula",
            "#ef4444",
            "#2563eb",
          ],
          "circle-radius": 6,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#111827",
        },
      })

      // Regiões
      map.addLayer({
        id: "regioes-fill",
        type: "fill",
        source: "regioes",
        layout: { visibility: "visible" },
        paint: { "fill-color": "#93c5fd", "fill-opacity": 0.18 },
      })
      map.addLayer({
        id: "regioes-line",
        type: "line",
        source: "regioes",
        paint: { "line-color": "#1d4ed8", "line-width": 1.2 },
      })

      // UFs
      map.addLayer({
        id: "ufs-fill",
        type: "fill",
        source: "ufs",
        layout: { visibility: "none" },
        paint: { "fill-color": "#fcd34d", "fill-opacity": 0.14 },
      })
      map.addLayer({
        id: "ufs-line",
        type: "line",
        source: "ufs",
        layout: { visibility: "none" },
        paint: { "line-color": "#b45309", "line-width": 1 },
      })

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })
        const clusterId = features[0]?.properties?.cluster_id
        // @ts-expect-error cluster expansion
        ;(map.getSource("unidades") as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return
          if (!features[0]) return
          const [lng, lat] = (features[0].geometry as any).coordinates
          map.easeTo({ center: [lng, lat], zoom })
        })
      })

      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0] as Feature<Point, UnidadeProperties> | undefined
        if (!feature) return
        const coordinates = feature.geometry.coordinates.slice() as [number, number]
        const { nome, uf, regiao, tipo, pastor, endereco } = feature.properties
        const html = `<div class="text-sm"><strong>${nome}</strong><br/>${tipo.toUpperCase()} • ${uf} • ${regiao}<br/>${pastor ? `Pastor: ${pastor}<br/>` : ""}${endereco ? `Endereço: ${endereco}` : ""}</div>`
        new maplibregl.Popup().setLngLat(coordinates).setHTML(html).addTo(map)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update sources when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const sUnidades = map.getSource("unidades") as any
    if (sUnidades && unidades) sUnidades.setData(unidades)
    const sRegioes = map.getSource("regioes") as any
    if (sRegioes && regiaoesOrEmpty(regioes)) sRegioes.setData(regioes)
    const sUfs = map.getSource("ufs") as any
    if (sUfs && ufs) sUfs.setData(ufs)
  }, [unidades, regioes, ufs])

  // Helpers
  function regiaoesOrEmpty(fc: FeatureCollection<Geometry> | null) {
    return fc || { type: "FeatureCollection", features: [] }
  }

  const resetView = () => mapRef.current?.easeTo({ center: BRAZIL_CENTER, zoom: 3.5 })

  // Importador My Maps (opcional – igual ao anterior)
  const parseMid = (input: string): string | null => {
    if (!input) return null
    try {
      if (!input.includes("://")) return input.trim()
      const u = new URL(input)
      const mid = u.searchParams.get("mid")
      if (mid) return mid
      const parts = u.pathname.split("/")
      const guess = parts.find((p) => p.length > 12 && !["edit", "d"].includes(p))
      return guess || null
    } catch {
      return null
    }
  }
  const importMyMaps = async () => {
    const mid = parseMid(myMapsInput)
    if (!mid) return alert("Cole a URL do My Maps ou apenas o MID.")
    const res = await fetch(`/api/import/mymaps?mid=${encodeURIComponent(mid)}`)
    if (!res.ok) return alert("Falha ao importar. O mapa pode não estar público.")
    const fc = (await res.json()) as FeatureCollection<Geometry>
    setRegioes(fc)
  }

  // Adicionar por endereço
  async function addByAddress() {
    if (!form.nome || !form.endereco) {
      alert("Informe nome e endereço.")
      return
    }
    setAdding(true)
    try {
      // 1) Geocodificar
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(form.endereco)}&country=br`)
      if (!geoRes.ok) throw new Error("Falha no geocoder")
      const list = (await geoRes.json()) as Array<any>
      if (!list.length) throw new Error("Endereço não encontrado")

      const { lat, lon, display_name } = list[0]
      const ufNorm = normalizeUF(form.uf)

      // 2) Persistir no Supabase (POST servidor)
      const payload = {
        nome: form.nome,
        uf: ufNorm,
        tipo: form.tipo,
        endereco: display_name as string,
        lat: Number(lat),
        lng: Number(lon),
      }
      const saveRes = await fetch("/api/unidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!saveRes.ok) {
        const msg = await saveRes.text()
        throw new Error(msg || "Falha ao salvar no banco")
      }
      const { feature } = await saveRes.json()

      // 3) Atualizar fonte e voar até o local
      setUnidades((prev) => {
        const base =
          prev ?? ({ type: "FeatureCollection", features: [] } as FeatureCollection<Point, UnidadeProperties>)
        return { ...base, features: [...base.features, feature] }
      })

      const src = mapRef.current?.getSource("unidades") as any
      if (src) {
        const current: FeatureCollection<Point, UnidadeProperties> = (unidades ?? {
          type: "FeatureCollection",
          features: [],
        }) as any
        src.setData({ ...current, features: [...(current.features || []), feature] })
      }

      mapRef.current?.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: 14 })
      setForm((f) => ({ ...f, nome: "", endereco: "" }))
    } catch (e: any) {
      alert(e?.message || "Erro ao adicionar")
    } finally {
      setAdding(false)
    }
  }

  // Barra superior
  const ui = useMemo(
    () => (
      <div className="absolute left-3 top-3 z-10 max-w-[min(96vw,1100px)]">
        <Card className="p-3 w-full space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="flex flex-col gap-1">
              <Label htmlFor="regiao">Região</Label>
              <Select value={filters.regiao} onValueChange={(v) => setFilters((s) => ({ ...s, regiao: v as any }))}>
                <SelectTrigger id="regiao" className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {options.regioes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="uf">UF</Label>
              <Select value={filters.uf} onValueChange={(v) => setFilters((s) => ({ ...s, uf: v as any }))}>
                <SelectTrigger id="uf" className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {options.ufs.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filters.tipo} onValueChange={(v) => setFilters((s) => ({ ...s, tipo: v as any }))}>
                <SelectTrigger id="tipo" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {options.tipos.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Importador My Maps opcional */}
          <div className="flex flex-col md:flex-row md:items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="mymaps">Importar Regiões do My Maps (URL ou MID)</Label>
              <div className="flex gap-2">
                <Input
                  id="mymaps"
                  placeholder="https://www.google.com/maps/d/... ou MID"
                  value={myMapsInput}
                  onChange={(e) => setMyMapsInput(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={importMyMaps}>
                  <Import className="mr-2 size-4" />
                  Importar
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    <Layers className="mr-2 size-4" />
                    Camadas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px]">
                  <LayerToggle
                    label="Regiões"
                    checked={true}
                    onCheckedChange={(v) => {
                      const map = mapRef.current
                      if (!map) return
                      map.setLayoutProperty("regioes-fill", "visibility", v ? "visible" : "none")
                      map.setLayoutProperty("regioes-line", "visibility", v ? "visible" : "none")
                    }}
                  />
                  <LayerToggle
                    label="UFs"
                    checked={false}
                    onCheckedChange={(v) => {
                      const map = mapRef.current
                      if (!map) return
                      map.setLayoutProperty("ufs-fill", "visibility", v ? "visible" : "none")
                      map.setLayoutProperty("ufs-line", "visibility", v ? "visible" : "none")
                    }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={resetView} title="Recentrar">
                <RefreshCw className="mr-2 size-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Adicionar unidade por endereço */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex.: Igreja Central"
                />
              </div>
              <div>
                <Label>UF</Label>
                <Select value={form.uf} onValueChange={(v) => setForm({ ...form, uf: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="igreja">igreja</SelectItem>
                    <SelectItem value="nucleo">nucleo</SelectItem>
                    <SelectItem value="celula">celula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addByAddress} disabled={adding}>
                  <Plus className="mr-2 size-4" />
                  {adding ? "Adicionando..." : "Adicionar no mapa"}
                </Button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A Região é inferida automaticamente pela UF. Depois podemos salvar no banco (Supabase) se quiser.
            </p>
          </div>
        </Card>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, options, myMapsInput, form, adding],
  )

  return (
    <div className="relative h-dvh w-dvw">
      {ui}
      <div ref={containerRef} className="h-full w-full" aria-label="Mapa Conectados.co" role="region" />
      <div className="absolute bottom-3 left-3 z-10">
        <Card className="px-2 py-1.5 text-xs flex items-center gap-2">
          <MapIcon className="size-4" />
          {loading ? "Carregando..." : `${unidades?.features.length ?? 0} unidades`}
        </Card>
      </div>
    </div>
  )
}

function LayerToggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="px-2 py-1.5 flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}
