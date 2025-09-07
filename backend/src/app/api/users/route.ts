import type { NextRequest } from "next/server"
import { db, collections } from "../../../lib/firebase"
import { requireAuth, requireRole } from "../../../lib/auth"
import type { ApiResponse, PaginatedResponse } from "../../../../../shared/types/api"
import type { User, UserRole } from "../../../../../shared/types/user"
import { getUserPermissions } from "../../../lib/permissions"

// GET /api/users - Listar usuários
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const role = searchParams.get("role") as UserRole
    const regionId = searchParams.get("regionId")
    const search = searchParams.get("search")

    let query = db.collection(collections.users)

    // Filtros - suporta role único e múltiplos roles
    if (role) {
      // Busca tanto no campo 'role' quanto no array 'roles'
      query = query.where("role", "==", role)
      // TODO: Implementar busca em array 'roles' quando Firestore suportar
    }

    if (regionId) {
      query = query.where("regionId", "==", regionId)
    }

    // Busca por nome/email
    if (search) {
      query = query.where("displayName", ">=", search).where("displayName", "<=", search + "\uf8ff")
    }

    // Paginação
    const offset = (page - 1) * limit
    const snapshot = await query.offset(offset).limit(limit).get()

    const users: User[] = []
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User)
    })

    // Total count (simplificado)
    const totalSnapshot = await db.collection(collections.users).get()
    const total = totalSnapshot.size

    return Response.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: Date.now(),
    } as PaginatedResponse<User>)
  } catch (error: any) {
    console.error("Get users error:", error)
    return Response.json({ success: false, error: "Erro ao buscar usuários", timestamp: Date.now() } as ApiResponse, {
      status: 500,
    })
  }
})

// POST /api/users - Criar usuário
export const POST = requireRole(["admin", "pastor_conselho", "pastor_regional", "pastor_local"])(
  async (request: NextRequest, { user: currentUser }) => {
    try {
      const userData = await request.json()

      const newUser: Omit<User, "id"> = {
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role, // Backward compatibility
        roles: userData.roles || [userData.role], // New multi-role system
        regionId: userData.regionId,
        churchId: userData.churchId,
        isSecretaryOf: userData.isSecretaryOf,
        canManageChurch: userData.canManageChurch,
        permissions: getUserPermissions(userData.role || userData.roles?.[0]),
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Validações
      if (!newUser.email?.endsWith("@boladeneve.com")) {
        return Response.json(
          { success: false, error: "Email deve ser do domínio @boladeneve.com", timestamp: Date.now() } as ApiResponse,
          { status: 400 },
        )
      }

      const docRef = await db.collection(collections.users).add(newUser)

      return Response.json({
        success: true,
        data: { id: docRef.id, ...newUser },
        message: "Usuário criado com sucesso",
        timestamp: Date.now(),
      } as ApiResponse)
    } catch (error: any) {
      console.error("Create user error:", error)
      return Response.json({ success: false, error: "Erro ao criar usuário", timestamp: Date.now() } as ApiResponse, {
        status: 500,
      })
    }
  },
)
