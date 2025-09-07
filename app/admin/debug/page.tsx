"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Row = {
  id: string
  name?: string
  kind?: string
  address?: string
  location?: { lat: number; lng: number }
}

export default function DebugPlacesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { db } = getFirebase()
      const snap = await getDocs(collection(db, "places"))
      const list: Row[] = []
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
      setRows(list)
    } catch (e: any) {
      setError(e?.message || "Erro ao ler a coleção places")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Debug • places</h1>
        <Button onClick={load} disabled={loading}>
          {loading ? "Atualizando..." : "Recarregar"}
        </Button>
      </div>
      {error && <Card className="p-3 text-sm text-red-600">{error}</Card>}
      <Card className="p-3">
        <div className="text-sm text-muted-foreground mb-2">
          Total: {rows.length}. Cada registro deve ter: kind, name, address e location.lat/lng.
        </div>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded border p-2 text-sm">
              <div className="font-medium">
                {r.name || "(sem nome)"} — {r.kind || "?"}
              </div>
              <div>{r.address || "(sem endereço)"}</div>
              <div className="text-xs text-muted-foreground">
                id: {r.id} • {r.location ? `${r.location.lat}, ${r.location.lng}` : "sem location"}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground">Nenhum documento em places.</div>}
        </div>
      </Card>
      <div className="text-xs text-muted-foreground">
        Dica: se seus documentos não tiverem location.lat/lng (número), eles não aparecerão no mapa.
      </div>
    </main>
  )
}
