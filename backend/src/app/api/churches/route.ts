import type { NextRequest } from "next/server"
import { db, collections } from "../../../lib/firebase"
import { requireAuth } from "../../../lib/auth"
import type { ApiResponse, PaginatedResponse } from "../../../../../shared/types/api"
import type { Church, ChurchType } from "../../../../../shared/types/church"

// GET /api/churches - Listar igrejas
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const type = searchParams.get("type") as ChurchType
    const regionId = searchParams.get("regionId")
    const search = searchParams.get("search")

    let query = db.collection(collections.churches)

    // Filtros
    if (type) {
      query = query.where("type", "==", type)
    }

    if (regionId) {
      query = query.where("regionId", "==", regionId)
    }

    // Busca por nome
    if (search) {
      query = query.where("name", ">=", search).where("name", "<=", search + "\uf8ff")
    }

    // Ordenação
    query = query.orderBy("createdAt", "desc")

    // Paginação
    const offset = (page - 1) * limit
    const snapshot = await query.offset(offset).limit(limit).get()

    const churches: Church[] = []
    snapshot.forEach((doc) => {
      churches.push({ id: doc.id, ...doc.data() } as Church)
    })

    // Total count
    const totalSnapshot = await db.collection(collections.churches).get()
    const total = totalSnapshot.size

    return Response.json({
      success: true,
      data: churches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: Date.now(),
    } as PaginatedResponse<Church>)
  } catch (error: any) {
    console.error("Get churches error:", error)
    return Response.json({ success: false, error: "Erro ao buscar igrejas", timestamp: Date.now() } as ApiResponse, {
      status: 500,
    })
  }
})

// POST /api/churches - Criar igreja
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const churchData = await request.json()

    const newChurch: Omit<Church, "id"> = {
      name: churchData.name,
      type: churchData.type,
      address: churchData.address,
      location: {
        lat: Number.parseFloat(churchData.location.lat),
        lng: Number.parseFloat(churchData.location.lng),
      },
      regionId: churchData.regionId,
      parentChurchId: churchData.parentChurchId,
      pastorId: churchData.pastorId || user.id,
      secretaryId: churchData.secretaryId,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Validações
    if (!newChurch.name || !newChurch.address) {
      return Response.json(
        { success: false, error: "Nome e endereço são obrigatórios", timestamp: Date.now() } as ApiResponse,
        { status: 400 },
      )
    }

    if (!newChurch.location.lat || !newChurch.location.lng) {
      return Response.json(
        { success: false, error: "Localização (lat/lng) é obrigatória", timestamp: Date.now() } as ApiResponse,
        { status: 400 },
      )
    }

    const docRef = await db.collection(collections.churches).add(newChurch)

    return Response.json({
      success: true,
      data: { id: docRef.id, ...newChurch },
      message: "Igreja criada com sucesso",
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    console.error("Create church error:", error)
    return Response.json({ success: false, error: "Erro ao criar igreja", timestamp: Date.now() } as ApiResponse, {
      status: 500,
    })
  }
})
