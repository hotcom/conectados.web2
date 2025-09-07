"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps"

type Suggestion = {
  placeId: string
  description: string
  mainText?: string
  secondaryText?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Digite um endereço",
  disabled = false,
  className = "",
  country = "br",
  debounceMs = 250,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (sel: { label: string; lat: number; lng: number }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  country?: string
  debounceMs?: number
}) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])

  const googleRef = useRef<any>(null)
  const acServiceRef = useRef<any>(null)
  const plServiceRef = useRef<any>(null)
  const dummyDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const g = await loadGoogleMaps()
        if (!mounted) return
        googleRef.current = g
        acServiceRef.current = new g.maps.places.AutocompleteService()
        if (!dummyDivRef.current) dummyDivRef.current = document.createElement("div")
        plServiceRef.current = new g.maps.places.PlacesService(dummyDivRef.current)
        setReady(true)
      } catch (e) {
        console.warn("Google Maps não carregado:", e)
        setReady(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const q = value.trim()
    if (!ready || disabled) return
    if (q.length < 3) {
      setItems([])
      setOpen(false)
      return
    }
    let aborted = false
    const t = setTimeout(() => {
      setLoading(true)
      acServiceRef.current?.getPlacePredictions(
        {
          input: q,
          componentRestrictions: { country },
          types: ["address"],
        },
        (preds: any[] | null, status: string) => {
          if (aborted) return
          setLoading(false)
          const g = googleRef.current
          const ok = g ? g.maps.places.PlacesServiceStatus.OK : "OK"
          if (status !== ok || !preds) {
            setItems([])
            setOpen(false)
            return
          }
          const mapped: Suggestion[] = preds.map((p: any) => ({
            placeId: p.place_id!,
            description: p.description!,
            mainText: p.structured_formatting?.main_text,
            secondaryText: p.structured_formatting?.secondary_text,
          }))
          setItems(mapped)
          setOpen(true)
        },
      )
    }, debounceMs)
    return () => {
      aborted = true
      clearTimeout(t)
    }
  }, [value, ready, disabled, country, debounceMs])

  function pickDetails(placeId: string, description: string) {
    const g = googleRef.current
    if (!plServiceRef.current || !g) return
    plServiceRef.current.getDetails(
      {
        placeId,
        fields: ["geometry", "formatted_address"],
      },
      (place: any, status: string) => {
        const ok = g ? g.maps.places.PlacesServiceStatus.OK : "OK"
        if (status !== ok || !place) return
        const loc = place.geometry?.location
        if (!loc) return
        onSelect({ label: description, lat: loc.lat(), lng: loc.lng() })
        setOpen(false)
      },
    )
  }

  return (
    <div className="relative">
      <Input
        value={value}
        disabled={disabled || !ready}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ready ? placeholder : "Carregando Google Places..."}
        onFocus={() => value.trim().length >= 3 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        className={className}
      />
      {open && (loading || items.length > 0) && (
        <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded border bg-white shadow z-20">
          {loading && <div className="p-2 text-sm text-muted-foreground">Buscando endereços...</div>}
          {!loading &&
            items.map((s) => (
              <button
                key={s.placeId}
                type="button"
                className="flex w-full items-start gap-2 p-2 text-left hover:bg-muted"
                onClick={() => pickDetails(s.placeId, s.description)}
              >
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">{s.mainText || s.description}</div>
                  {s.secondaryText && <div className="text-xs text-muted-foreground">{s.secondaryText}</div>}
                  {!s.secondaryText && s.mainText && s.description !== s.mainText && (
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  )}
                </div>
              </button>
            ))}
          {!loading && items.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhuma sugestão</div>}
        </div>
      )}
    </div>
  )
}
