import { type NextRequest, NextResponse } from "next/server"
import { getAllowedDomains, isDevelopment } from "../../../lib/auth"

export async function GET(request: NextRequest) {
  try {
    const allowedDomains = getAllowedDomains()
    const environment = process.env.NODE_ENV || "development"
    const isDevMode = isDevelopment()

    return NextResponse.json({
      success: true,
      data: {
        environment,
        allowedDomains,
        isDevelopment: isDevMode,
        message: isDevMode
          ? "Modo desenvolvimento - Emails @teste.com aceitos"
          : "Modo produção - Apenas emails oficiais",
      },
    })
  } catch (error) {
    console.error("Error getting domain info:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar informações de domínio",
      },
      { status: 500 },
    )
  }
}
