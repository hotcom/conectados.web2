import type { NextRequest } from "next/server"
import type { ApiResponse } from "../../../../../../shared/types/api"

// POST /api/churches/geocode - Geocodificar endereço
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return Response.json({ success: false, error: "Endereço é obrigatório", timestamp: Date.now() } as ApiResponse, {
        status: 400,
      })
    }

    // Usar Nominatim (OpenStreetMap) para geocodificação
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", address)
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("limit", "5")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("countrycodes", "br")

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BoladeNeve-System/1.0",
      },
    })

    if (!response.ok) {
      throw new Error("Erro na geocodificação")
    }

    const results = await response.json()

    if (!results || results.length === 0) {
      return Response.json({ success: false, error: "Endereço não encontrado", timestamp: Date.now() } as ApiResponse, {
        status: 404,
      })
    }

    const geocoded = results.map((result: any) => ({
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
      displayName: result.display_name,
      address: {
        road: result.address?.road,
        neighbourhood: result.address?.neighbourhood,
        city: result.address?.city || result.address?.town,
        state: result.address?.state,
        postcode: result.address?.postcode,
        country: result.address?.country,
      },
    }))

    return Response.json({
      success: true,
      data: geocoded,
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    console.error("Geocoding error:", error)
    return Response.json(
      { success: false, error: "Erro ao geocodificar endereço", timestamp: Date.now() } as ApiResponse,
      { status: 500 },
    )
  }
}
