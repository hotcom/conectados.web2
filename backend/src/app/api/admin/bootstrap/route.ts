import type { NextRequest } from "next/server"
import { db, auth } from "../../../../lib/firebase"
import type { ApiResponse } from "../../../../../../shared/types/api"
import type { User } from "../../../../../../shared/types/user"
import { getUserPermissions } from "../../../../lib/permissions"

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json()

    // Validações
    if (!email || !password || !displayName) {
      return Response.json(
        { success: false, error: "Email, senha e nome são obrigatórios", timestamp: Date.now() } as ApiResponse,
        { status: 400 },
      )
    }

    if (!email.endsWith("@boladeneve.com")) {
      return Response.json(
        { success: false, error: "Email deve ser do domínio @boladeneve.com", timestamp: Date.now() } as ApiResponse,
        { status: 400 },
      )
    }

    // Verificar se já existe algum admin
    const existingAdmins = await db.collection("users").where("role", "in", ["presidencia", "conselho"]).limit(1).get()

    if (!existingAdmins.empty) {
      return Response.json(
        { success: false, error: "Já existe um administrador no sistema", timestamp: Date.now() } as ApiResponse,
        { status: 400 },
      )
    }

    // Criar usuário no Firebase Auth
    let firebaseUser
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      })
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        firebaseUser = await auth.getUserByEmail(email)
      } else {
        throw error
      }
    }

    // Criar documento no Firestore
    const adminUser: User = {
      id: firebaseUser.uid,
      email,
      displayName,
      role: "presidencia",
      regionId: null,
      churchId: null,
      permissions: getUserPermissions("presidencia"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active",
    }

    await db.collection("users").doc(firebaseUser.uid).set(adminUser)

    return Response.json({
      success: true,
      data: adminUser,
      message: "Usuário administrador criado com sucesso",
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    console.error("Bootstrap admin error:", error)
    return Response.json(
      { success: false, error: "Erro ao criar administrador", timestamp: Date.now() } as ApiResponse,
      { status: 500 },
    )
  }
}

// GET - Verificar se já existe admin
export async function GET() {
  try {
    const existingAdmins = await db.collection("users").where("role", "in", ["presidencia", "conselho"]).limit(1).get()

    return Response.json({
      success: true,
      data: {
        hasAdmin: !existingAdmins.empty,
        count: existingAdmins.size,
      },
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    console.error("Check admin error:", error)
    return Response.json(
      { success: false, error: "Erro ao verificar administradores", timestamp: Date.now() } as ApiResponse,
      { status: 500 },
    )
  }
}
