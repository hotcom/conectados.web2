import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    const country = searchParams.get("country") || "br"
    const limit = searchParams.get("limit") || "5"
    if (!q) return NextResponse.json({ error: "q é obrigatório" }, { status: 400 })

    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", q)
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("limit", limit)
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("countrycodes", country)
    // melhorar autocomplete
    url.searchParams.set("autocomplete", "1")
    url.searchParams.set("dedupe", "1")

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "atlas-conectados-firebase", Referer: "atlas-conectados" },
    })
    if (!res.ok) return new NextResponse("Falha geocoder", { status: 502 })
    return NextResponse.json(await res.json(), { headers: { "Cache-Control": "no-store" } })
  } catch (e: any) {
    return new NextResponse(e?.message || "Erro geocoder", { status: 500 })
  }
}
