import type { NextRequest } from "next/server"
import { db } from "../../../lib/firebase"
import type { ApiResponse } from "../../../../../shared/types/api"

export async function GET(request: NextRequest) {
  try {
    // Teste básico de conexão com Firestore
    const testDoc = await db.collection("_health").doc("test").get()

    const healthData = {
      status: "healthy",
      timestamp: Date.now(),
      services: {
        firestore: "connected",
        auth: "configured",
        zapi: process.env.ZAPI_TOKEN ? "configured" : "not_configured",
        smtp: process.env.SMTP_HOST ? "configured" : "not_configured",
      },
      environment: process.env.NODE_ENV || "development",
    }

    return Response.json({
      success: true,
      data: healthData,
      timestamp: Date.now(),
    } as ApiResponse)
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: "Health check failed",
        details: error.message,
        timestamp: Date.now(),
      } as ApiResponse,
      { status: 500 },
    )
  }
}
