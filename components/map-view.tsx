"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import maplibregl, { type Map } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { BBox, Feature, FeatureCollection, Geometry, Point, Polygon } from "geojson"
import { addDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase-client"
import type { Place } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, X, Layers, Maximize2, SlidersHorizontal } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { loadGoogleMaps } from "@/lib/google-maps"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const CENTER_BR: [number, number] = [-51.9253, -14.235]
const BBOX_BRASIL: BBox = [-74.0, -33.9, -34.0, 5.8]

type Kind = "igreja" | "nucleo" | "celula"

// Cores padronizadas por região
const REGION_COLORS: Record<"N" | "NE" | "SE" | "S" | "CO", string> = {
  N: "#10b981",
  NE: "#f59e0b",
  SE: "#ef4444",
  S: "#8b5cf6",
  CO: "#14b8a6",
}

// Utils
function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

function circlePolygon(center: [number, number], radiusKm: number, steps = 96): Feature<Polygon> {
  const [lon, lat] = center
  const coords: [number, number][] = []
  const R = 6371
  const angDist = radiusKm / R
  const latRad = (lat * Math.PI) / 180
  const lonRad = (lon * Math.PI) / 180
  for (let i = 0; i <= steps; i++) {
    const brg = (i * 360 * Math.PI) / (steps * 180)
    const sinLat = Math.sin(latRad) * Math.cos(angDist) + Math.cos(latRad) * Math.sin(angDist) * Math.cos(brg)
    const dLat = Math.asin(sinLat)
    const dLon =
      lonRad +
      Math.atan2(
        Math.sin(brg) * Math.sin(angDist) * Math.cos(latRad),
        Math.cos(angDist) - Math.sin(latRad) * Math.sin(dLat),
      )
    const latDeg = (dLat * 180) / Math.PI
    const lonDeg = (((dLon * 180) / Math.PI + 540) % 360) - 180
    coords.push([lonDeg, latDeg])
  }
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} }
}

function bboxOfPolygon(poly: Feature<Polygon>): BBox {
  let minX = 180,
    minY = 90,
    maxX = -180,
    maxY = -90
  for (const [x, y] of poly.geometry.coordinates[0]) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return [minX, minY, maxX, maxY]
}

// Normalização de strings para inferir siglas de região
function normalizeNome(n?: string | null) {
  return (n || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}
function inferRegSiglaFromProps(p: any): "N" | "NE" | "SE" | "S" | "CO" | null {
  const s = String(p?.sigla || "").toUpperCase()
  if (["N", "NE", "SE", "S", "CO"].includes(s)) return s as any
  const n = normalizeNome(p?.NM_REGIA || p?.nome || p?.name || "")
  if (!n) return null
  if (n.includes("norte")) return "N"
  if (n.includes("nordeste")) return "NE"
  if (n.includes("sudeste")) return "SE"
  if (n === "sul" || n.includes("sul")) return "S"
  if (n.includes("centro-oeste") || n.includes("centro oeste")) return "CO"
  return null
}

// Garante que cada feature tenha properties.sigla preenchida
function ensureRegioesSigla(fc: FeatureCollection<Geometry, any>): FeatureCollection<Geometry, any> {
  return {
    type: "FeatureCollection",
    features: (fc.features || []).map((f: any) => {
      const sigla = inferRegSiglaFromProps(f?.properties) || null
      return {
        ...f,
        properties: {
          ...f.properties,
          sigla, // usado na expressão de cor
        },
      }
    }),
  }
}

export default function MapView() {
  const mapRef = useRef<Map | null>(null)
  const divRef = useRef<HTMLDivElement | null>(null)
  const { user } = useAuth()

  const [baseFC, setBaseFC] = useState<FeatureCollection<Point, any>>({ type: "FeatureCollection", features: [] })
  const [pastors, setPastors] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [fsError, setFsError] = useState<string | null>(null)

  const [kindFilter, setKindFilter] = useState<"todos" | Kind>("todos")
  const [searchTerm, setSearchTerm] = useState("")

  const [addr, setAddr] = useState("")
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null)
  const [radiusKm] = useState(10)
  const [nearby, setNearby] = useState<Feature<Point, any>[]>([])

  const [newPlace, setNewPlace] = useState<{ name: string; kind: Kind; address: string }>({
    name: "",
    kind: "igreja",
    address: "",
  })
  const [adding, setAdding] = useState(false)
  const addLatLngRef = useRef<{ lat: number; lng: number } | null>(null)

  // IBGE toggles e contadores
  const [showUFs, setShowUFs] = useState(false)
  const [showRegioes, setShowRegioes] = useState(false)
  const ufsLoadedRef = useRef(false)
  const regioesLoadedRef = useRef(false)
  const [ufsCount, setUfsCount] = useState(0)
  const [regioesCount, setRegioesCount] = useState(0)

  // Painel lateral (Sheet) controlado para não fechar ao digitar
  const [panelOpen, setPanelOpen] = useState(false)

  const hasLayer = useCallback((id: string) => !!mapRef.current?.getLayer(id), [])
  const filteredFC = useMemo(() => {
    let feats = baseFC.features
    
    // Apply search term filter first
    if (searchTerm.trim()) {
      feats = feats.filter((f) => {
        const name = String(f.properties?.name || "").toLowerCase()
        const address = String(f.properties?.address || "").toLowerCase()
        const search = searchTerm.toLowerCase()
        
        // Search by church name or address
        let matches = name.includes(search) || address.includes(search)
        
        // Search by pastor name if church has pastors
        if (!matches && f.properties?.id) {
          const churchPastors = pastors.filter(p => p.churchId === f.properties.id)
          matches = churchPastors.some(pastor => 
            String(pastor.displayName || "").toLowerCase().includes(search) ||
            String(pastor.email || "").toLowerCase().includes(search)
          )
        }
        
        return matches
      })
    }
    
    if (radiusCenter) {
      feats = feats.filter((f) => {
        const k = String(f.properties?.kind || "").toLowerCase()
        if (k !== "igreja") return false
        const [lng, lat] = f.geometry.coordinates
        return haversineKm(radiusCenter, [lng, lat]) <= radiusKm
      })
    } else if (kindFilter !== "todos") {
      feats = feats.filter((f) => (f.properties?.kind || "").toLowerCase() === kindFilter)
    }
    return { type: "FeatureCollection", features: feats } as FeatureCollection<Point, any>
  }, [baseFC, kindFilter, radiusCenter, radiusKm, searchTerm, pastors])

  // Init map
  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: divRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: CENTER_BR,
      zoom: 3.5,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right")

    map.on("load", () => {
      map.addSource("places", {
        type: "geojson",
        data: filteredFC,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      })
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
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
        source: "places",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#064e3b" },
      })
      map.addLayer({
        id: "place",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "kind"],
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

      // Search layers
      map.addSource("search-center", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addLayer({
        id: "search-center-point",
        type: "circle",
        source: "search-center",
        paint: {
          "circle-color": "#1d4ed8",
          "circle-radius": 6,
          "circle-stroke-color": "#0b3aa5",
          "circle-stroke-width": 1.5,
        },
      })
      map.addSource("search-radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addLayer({
        id: "search-radius-fill",
        type: "fill",
        source: "search-radius",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 },
      })
      map.addLayer({
        id: "search-radius-line",
        type: "line",
        source: "search-radius",
        paint: { "line-color": "#1d4ed8", "line-width": 1.2 },
      })

      // IBGE sources
      map.addSource("ufs-ibge", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addSource("regioes-ibge", { type: "geojson", data: { type: "FeatureCollection", features: [] } })

      // UFs (abaixo dos pontos)
      map.addLayer(
        {
          id: "ufs-ibge-fill",
          type: "fill",
          source: "ufs-ibge",
          layout: { visibility: "none" },
          paint: {
            "fill-color": [
              "match",
              ["get", "regiao_sigla"],
              "N",
              REGION_COLORS.N,
              "NE",
              REGION_COLORS.NE,
              "SE",
              REGION_COLORS.SE,
              "S",
              REGION_COLORS.S,
              "CO",
              REGION_COLORS.CO,
              "#9ca3af",
            ],
            "fill-opacity": 0.25,
          },
        },
        "clusters",
      )
      map.addLayer(
        {
          id: "ufs-ibge-line",
          type: "line",
          source: "ufs-ibge",
          layout: { visibility: "none" },
          paint: { "line-color": "#374151", "line-width": 1.2 },
        },
        "clusters",
      )

      // Regiões (pinta por properties.sigla; garantimos sigla no client)
      map.addLayer(
        {
          id: "regioes-ibge-fill",
          type: "fill",
          source: "regioes-ibge",
          layout: { visibility: "none" },
          paint: {
            "fill-color": [
              "match",
              ["get", "sigla"],
              "N",
              REGION_COLORS.N,
              "NE",
              REGION_COLORS.NE,
              "SE",
              REGION_COLORS.SE,
              "S",
              REGION_COLORS.S,
              "CO",
              REGION_COLORS.CO,
              "#9ca3af",
            ],
            "fill-opacity": 0.3,
          },
        },
        "clusters",
      )
      map.addLayer(
        {
          id: "regioes-ibge-line",
          type: "line",
          source: "regioes-ibge",
          layout: { visibility: "none" },
          paint: { "line-color": "#0f172a", "line-width": 1.6 },
        },
        "clusters",
      )

      // Pré-carregar (com normalização de sigla)
      ;(async () => {
        try {
          const [ufsRes, regRes] = await Promise.allSettled([
            fetch("/api/ufs-oficiais").catch(() => ({ ok: false })),
            fetch("/api/regioes-ibge").catch(() => ({ ok: false }))
          ])
          if (ufsRes.status === "fulfilled" && (ufsRes.value as any).ok) {
            const fc = await (ufsRes.value as any).json()
            ;(map.getSource("ufs-ibge") as any)?.setData(fc)
            ufsLoadedRef.current = true
            setUfsCount(Array.isArray(fc.features) ? fc.features.length : 0)
          }
          if (regRes.status === "fulfilled" && (regRes.value as any).ok) {
            const raw = (await (regRes.value as any).json()) as FeatureCollection<Geometry, any>
            const fc = ensureRegioesSigla(raw)
            ;(map.getSource("regioes-ibge") as any)?.setData(fc)
            regioesLoadedRef.current = true
            setRegioesCount(Array.isArray(fc.features) ? fc.features.length : 0)
          }
        } catch (e) {
          console.warn("Falha ao pré-carregar IBGE:", e)
        }
      })()
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update points on filter
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    ;(map.getSource("places") as any)?.setData(filteredFC)
    setCount(filteredFC.features.length)
  }, [filteredFC])

  // Load pastors data
  useEffect(() => {
    async function loadPastors() {
      try {
        const { db } = getFirebase()
        const pastorsQuery = query(
          collection(db, "users"),
          where("role", "in", ["pastor_conselho", "pastor_regional", "pastor_local", "secretaria"])
        )
        const snapshot = await getDocs(pastorsQuery)
        const pastorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setPastors(pastorsData)
      } catch (error) {
        console.error("Erro ao carregar pastores:", error)
      }
    }
    loadPastors()
  }, [])

  // Firestore listener
  useEffect(() => {
    const { db } = getFirebase()
    const q = query(collection(db, "places"))
    const un = onSnapshot(
      q,
      (snap) => {
        const fc: FeatureCollection<Point, any> = { type: "FeatureCollection", features: [] }
        snap.forEach((docSnap) => {
          const p = docSnap.data() as Place
          const lat = Number((p as any)?.location?.lat)
          const lng = Number((p as any)?.location?.lng)
          if (!isFinite(lat) || !isFinite(lng)) return
          fc.features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: { ...p, id: docSnap.id },
          })
        })
        setBaseFC(fc)
        setFsError(null)
      },
      (err) => {
        console.error("[Firestore] places listen error:", err?.code, err?.message)
        setFsError(err?.code || "unknown")
        setBaseFC({ type: "FeatureCollection", features: [] })
      },
    )
    return () => un()
  }, [])

  function updateRadiusLayers(center: [number, number]) {
    const map = mapRef.current
    if (!map) return
    const centerFC: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: { type: "Point", coordinates: center }, properties: {} }],
    }
    ;(map.getSource("search-center") as any)?.setData(centerFC)
    const circle = circlePolygon(center, radiusKm)
    ;(map.getSource("search-radius") as any)?.setData({ type: "FeatureCollection", features: [circle] })
    const bb = bboxOfPolygon(circle)
    map.fitBounds(bb as any, { padding: 40 })
  }

  function computeNearby(center: [number, number]) {
    const list = baseFC.features.filter((f) => {
      const k = String(f.properties?.kind || "").toLowerCase()
      if (k !== "igreja") return false
      const [flon, flat] = f.geometry.coordinates
      return haversineKm(center, [flon, flat]) <= radiusKm
    })
    setNearby(list)
  }

  async function runRadiusSearch() {
    try {
      const g = await loadGoogleMaps()
      const geocoder = new g.maps.Geocoder()
      geocoder.geocode({ address: addr }, (results: any[], status: string) => {
        if (status !== "OK" || !results?.length) return alert("Endereço não encontrado")
        const loc = results[0].geometry.location
        const center: [number, number] = [loc.lng(), loc.lat()]
        setRadiusCenter(center)
        updateRadiusLayers(center)
        computeNearby(center)
      })
    } catch (e: any) {
      alert(e?.message || "Falha ao geocodificar endereço")
    }
  }

  function onAddressSelected(sel: { label: string; lat: number; lng: number }) {
    setAddr(sel.label)
    const center: [number, number] = [sel.lng, sel.lat]
    setRadiusCenter(center)
    updateRadiusLayers(center)
    computeNearby(center)
  }

  function clearRadiusSearch() {
    setAddr("")
    setRadiusCenter(null)
    setNearby([])
    const map = mapRef.current
    if (!map) return
    const empty = { type: "FeatureCollection", features: [] }
    ;(map.getSource("search-center") as any)?.setData(empty)
    ;(map.getSource("search-radius") as any)?.setData(empty)
    map.easeTo({ center: CENTER_BR, zoom: 3.5 })
  }

  function flyToFeature(f: Feature<Point, any>) {
    const c = f.geometry.coordinates as [number, number]
    mapRef.current?.easeTo({ center: c, zoom: 14 })
    const p = f.properties || {}
    
    // Get pastors for this church
    const churchPastors = pastors.filter(pastor => pastor.churchId === p.id)
    let pastorInfo = ""
    if (churchPastors.length > 0) {
      pastorInfo = `<br/><strong>Pastores:</strong><br/>${churchPastors.map(pastor => 
        `• ${pastor.displayName || pastor.email}`
      ).join('<br/>')}`
    }
    
    const html = `<div class="text-sm"><strong>${p.name || "Sem nome"}</strong><br/>${(p.kind || "").toUpperCase()}<br/>${p.address || ""}${pastorInfo}</div>`
    new maplibregl.Popup().setLngLat(c).setHTML(html).addTo(mapRef.current!)
  }

  async function addPlace() {
    if (!user) return alert("Faça login para cadastrar um local.")
    if (!newPlace.name || !newPlace.address) return alert("Informe nome e endereço.")
    setAdding(true)
    try {
      let lat: number | null = addLatLngRef.current?.lat ?? null
      let lng: number | null = addLatLngRef.current?.lng ?? null
      if (lat == null || lng == null) {
        const g = await loadGoogleMaps()
        const geocoder = new g.maps.Geocoder()
        const res = await new Promise<any[] | null>((resolve) => {
          geocoder.geocode({ address: newPlace.address }, (results: any[], status: string) =>
            resolve(status === "OK" ? results || null : null),
          )
        })
        if (!res || !res.length) throw new Error("Endereço não encontrado")
        lat = res[0]!.geometry.location.lat()
        lng = res[0]!.geometry.location.lng()
      }
      const { db } = getFirebase()
      const payload: Omit<Place, "id"> = {
        kind: newPlace.kind,
        name: newPlace.name,
        address: newPlace.address,
        location: { lat: lat!, lng: lng! },
        regionId: null,
        churchId: null,
        ownerUid: user.uid,
        createdAt: Date.now(),
      }
      await addDoc(collection(db, "places"), payload as any)
      setNewPlace({ name: "", kind: "igreja", address: "" })
      addLatLngRef.current = null
      mapRef.current?.easeTo({ center: [lng!, lat!], zoom: 14 })
    } catch (e: any) {
      alert(e?.message || "Erro ao adicionar local")
    } finally {
      setAdding(false)
    }
  }

  async function toggleUFs(v: boolean) {
    setShowUFs(v)
    const map = mapRef.current
    if (!map) return
    if (v && !ufsLoadedRef.current) {
      try {
        const r = await fetch("/api/ufs-oficiais")
        if (r.ok) {
          const fc = await r.json()
          ;(map.getSource("ufs-ibge") as any)?.setData(fc)
          ufsLoadedRef.current = true
          setUfsCount(Array.isArray(fc.features) ? fc.features.length : 0)
        }
      } catch (e) {
        console.warn("Erro ao carregar UFs IBGE:", e)
      }
    }
    const show = v ? "visible" : "none"
    if (hasLayer("ufs-ibge-fill")) map.setLayoutProperty("ufs-ibge-fill", "visibility", show)
    if (hasLayer("ufs-ibge-line")) map.setLayoutProperty("ufs-ibge-line", "visibility", show)
  }

  async function toggleRegioes(v: boolean) {
    setShowRegioes(v)
    const map = mapRef.current
    if (!map) return
    if (v && !regioesLoadedRef.current) {
      try {
        const r = await fetch("/api/regioes-ibge")
        if (r.ok) {
          const raw = (await r.json()) as FeatureCollection<Geometry, any>
          const fc = ensureRegioesSigla(raw) // garante sigla
          ;(map.getSource("regioes-ibge") as any)?.setData(fc)
          regioesLoadedRef.current = true
          setRegioesCount(Array.isArray(fc.features) ? fc.features.length : 0)
        }
      } catch (e) {
        console.warn("Erro ao carregar Regiões IBGE:", e)
      }
    }
    const show = v ? "visible" : "none"
    if (hasLayer("regioes-ibge-fill")) map.setLayoutProperty("regioes-ibge-fill", "visibility", show)
    if (hasLayer("regioes-ibge-line")) map.setLayoutProperty("regioes-ibge-line", "visibility", show)
  }

  function fitBrasil() {
    mapRef.current?.fitBounds(BBOX_BRASIL as any, { padding: 28, duration: 600 })
  }

  // Barra compacta no topo direito + Painel em Sheet (controlado)
  function ControlsBar() {
    return (
      <div className="absolute right-3 top-3 z-20">
        <Card className="p-2 flex items-center gap-2">
          <Button size="sm" variant={showUFs ? "default" : "outline"} onClick={() => toggleUFs(!showUFs)}>
            UFs
          </Button>
          <Button size="sm" variant={showRegioes ? "default" : "outline"} onClick={() => toggleRegioes(!showRegioes)}>
            Regiões
          </Button>
          <Button size="sm" variant="outline" onClick={fitBrasil}>
            <Maximize2 className="mr-2 size-4" />
            Brasil
          </Button>

          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="secondary" title="Abrir painel">
                <SlidersHorizontal className="mr-2 size-4" />
                Painel
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(96vw,420px)] p-4 overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
              <SheetHeader>
                <SheetTitle>Ferramentas do Mapa</SheetTitle>
              </SheetHeader>

              {/* Busca geral */}
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Buscar por nome da igreja, endereço ou nome do pastor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: Igreja Central, Pr. Santos, Rua das Flores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground">
                    {filteredFC.features.length} resultado{filteredFC.features.length === 1 ? "" : "s"} encontrado{filteredFC.features.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              {/* Lista de resultados da busca */}
              {searchTerm && filteredFC.features.length > 0 && (
                <div className="mt-4 border rounded p-2">
                  <div className="text-sm font-medium mb-2">Resultados da busca</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredFC.features.slice(0, 10).map((f) => (
                      <button
                        key={f.properties?.id}
                        className="block w-full text-left p-2 hover:bg-muted rounded border"
                        onClick={() => flyToFeature(f)}
                      >
                        <div className="text-sm font-medium">{String(f.properties?.name || "Sem nome")}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {String(f.properties?.address || "")}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-blue-600">
                            {(f.properties?.kind || "").toUpperCase()}
                          </div>
                          {(() => {
                            const churchPastors = pastors.filter(p => p.churchId === f.properties?.id)
                            return churchPastors.length > 0 ? (
                              <div className="text-xs text-green-600">
                                Pastor: {churchPastors[0].displayName || churchPastors[0].email}
                                {churchPastors.length > 1 && ` +${churchPastors.length - 1}`}
                              </div>
                            ) : null
                          })()}
                        </div>
                      </button>
                    ))}
                    {filteredFC.features.length > 10 && (
                      <p className="text-xs text-muted-foreground p-2">
                        E mais {filteredFC.features.length - 10} resultado{filteredFC.features.length - 10 === 1 ? "" : "s"}...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Busca por raio */}
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Buscar igrejas num raio de 10 km</label>
                <div className="grid grid-cols-1 gap-2">
                  <AddressAutocomplete
                    value={addr}
                    onChange={setAddr}
                    onSelect={onAddressSelected}
                    placeholder="Ex.: R. Clélia, 1517 - Lapa, São Paulo - SP, 05042-000"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={runRadiusSearch} disabled={addr.trim().length < 3}>
                      <Search className="mr-2 size-4" /> Buscar
                    </Button>
                    <Button variant="outline" onClick={clearRadiusSearch} disabled={!radiusCenter}>
                      <X className="mr-2 size-4" /> Limpar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Apenas Igrejas dentro de 10 km do endereço.</p>
              </div>

              {/* Camadas IBGE detalhadas */}
              <div className="mt-4 border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="size-4" />
                  <div className="text-sm font-medium">Camadas IBGE</div>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={fitBrasil}>
                    <Maximize2 className="mr-2 size-4" /> Ajustar Brasil
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">UFs (IBGE)</Label>
                    <Switch checked={showUFs} onCheckedChange={toggleUFs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Regiões (IBGE)</Label>
                    <Switch checked={showRegioes} onCheckedChange={toggleRegioes} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  UFs: {ufsCount} • Regiões: {regioesCount}
                </p>
              </div>

              {/* Filtro por tipo */}
              <div className="mt-4">
                <label className="text-xs text-muted-foreground">Tipo (sem raio)</label>
                <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as any)} disabled={!!radiusCenter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="igreja">Igreja</SelectItem>
                    <SelectItem value="nucleo">Núcleo</SelectItem>
                    <SelectItem value="celula">Célula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista do raio */}
              {radiusCenter && (
                <div className="mt-4 border rounded p-2">
                  <div className="text-sm font-medium mb-1">
                    {nearby.length} igreja{nearby.length === 1 ? "" : "s"} em até {radiusKm} km
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {nearby.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Nenhuma igreja no raio informado.</div>
                    ) : (
                      nearby.map((f) => (
                        <button
                          key={f.properties?.id}
                          className="block w-full text-left p-2 hover:bg-muted rounded"
                          onClick={() => flyToFeature(f)}
                        >
                          <div className="text-sm font-medium">{String(f.properties?.name || "Sem nome")}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {String(f.properties?.address || "")}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Adicionar local */}
              <div className="mt-4 border-t pt-3">
                <div className="text-sm font-medium mb-2">Adicionar local ao mapa</div>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Nome do local (ex.: Igreja Central)"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Select value={newPlace.kind} onValueChange={(v) => setNewPlace((p) => ({ ...p, kind: v as Kind }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="igreja">Igreja</SelectItem>
                      <SelectItem value="nucleo">Núcleo</SelectItem>
                      <SelectItem value="celula">Célula</SelectItem>
                    </SelectContent>
                  </Select>
                  <AddressAutocomplete
                    value={newPlace.address}
                    onChange={(v) => {
                      setNewPlace((p) => ({ ...p, address: v }))
                      addLatLngRef.current = null
                    }}
                    onSelect={({ label, lat, lng }) => {
                      setNewPlace((p) => ({ ...p, address: label }))
                      addLatLngRef.current = { lat, lng }
                    }}
                    placeholder="Endereço (Google Autocomplete)"
                  />
                  <Button onClick={addPlace} disabled={adding}>
                    <Plus className="mr-2 size-4" /> {adding ? "Adicionando..." : "Adicionar"}
                  </Button>
                  {!user && <p className="text-[11px] text-muted-foreground -mt-1">Necessário login.</p>}
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">{count} pontos exibidos</div>
              {count === 0 && !fsError && (
                <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
                  Nenhum ponto encontrado. Use o formulário acima para cadastrar o primeiro local.
                </div>
              )}
            </SheetContent>
          </Sheet>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100dvh-56px)] w-screen">
      <ControlsBar />

      {/* Legenda de Regiões */}
      <div className="absolute right-3 bottom-16 z-20">
        <Card className="px-3 py-2 text-xs space-y-1">
          <div className="font-medium mb-1">Regiões</div>
          <LegendItem color={REGION_COLORS.N} label="Norte (N)" />
          <LegendItem color={REGION_COLORS.NE} label="Nordeste (NE)" />
          <LegendItem color={REGION_COLORS.SE} label="Sudeste (SE)" />
          <LegendItem color={REGION_COLORS.S} label="Sul (S)" />
          <LegendItem color={REGION_COLORS.CO} label="Centro-Oeste (CO)" />
        </Card>
      </div>

      {fsError && (
        <div className="absolute left-3 top-[150px] z-20 max-w-lg">
          <Card className="p-3 text-sm">
            <div className="font-medium mb-1">Não foi possível carregar os pontos do mapa</div>
            <p className="text-muted-foreground">
              {fsError === "permission-denied"
                ? "Permissão negada pelas regras do Firestore. Faça login ou ajuste as Regras para permitir leitura da coleção places."
                : "Erro ao conectar ao Firestore. Verifique suas Regras e conexão."}
            </p>
            <div className="mt-2 flex gap-2">
              <a href="/login" className="underline">
                Fazer login
              </a>
              <a href="/admin/debug" className="underline">
                Abrir Debug
              </a>
            </div>
          </Card>
        </div>
      )}

      <div ref={divRef} className="h-full w-full" />
      <div className="absolute left-3 bottom-3 z-10">
        <Card className="px-2 py-1.5 text-xs">{count} locais exibidos</Card>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
