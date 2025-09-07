import type { NextRequest } from "next/server"
import { auth } from "../../../../lib/firebase"
import type { ApiResponse } from "../../../../../../shared/types/api"

// Função para obter domínios permitidos baseado no ambiente
function getAllowedDomains(): string[] {
  const isDevelopment = process.env.NODE_ENV === "development"

  if (isDevelopment) {
    // Em desenvolvimento, permite domínios configurados
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS || "teste.com,boladeneve.com"
    return allowedDomains.split(",").map((domain) => domain.trim())
  } else {
    // Em produção, apenas o domínio oficial
    return [process.env.PRODUCTION_DOMAIN || "boladeneve.com"]
  }
}

// Função para validar se o email tem domínio permitido
function isEmailDomainAllowed(email: string): boolean {
  const allowedDomains = getAllowedDomains()
  return allowedDomains.some((domain) => email.endsWith(`@${domain}`))
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return Response.json({ success: false, error: "Token não fornecido", timestamp: Date.now() } as ApiResponse, {
        status: 400,
      })
    }

    // Verificar token Firebase
    const decodedToken = await auth.verifyIdToken(idToken)

    // Verificar se o email tem domínio permitido
    if (!decodedToken.email || !isEmailDomainAllowed(decodedToken.email)) {
      const allowedDomains = getAllowedDomains()
      const environment = process.env.NODE_ENV === "development" ? "desenvolvimento" : "produção"

      return Response.json(
        {
          success: false,
          error: `Email deve ser de um dos domínios permitidos (${environment}): ${allowedDomains.join(", ")}`,
          timestamp: Date.now(),
        } as ApiResponse,
        { status: 403 },
      )
    }

    return Response.json({
      success: true,
      data: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        allowedDomains: getAllowedDomains(),
        environment: process.env.NODE_ENV,
      },
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    console.error("Domain verification error:", error)

    return Response.json(
      {
        success: false,
        error: "Token inválido ou expirado",
        timestamp: Date.now(),
      } as ApiResponse,
      { status: 401 },
    )
  }
}
