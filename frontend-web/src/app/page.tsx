"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Shield, Bug } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">🙏 Igreja Bola de Neve</CardTitle>
          <p className="text-gray-600 mt-2">Sistema Integrado de Gestão</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Plataforma completa para gestão de igrejas, comunicação e finanças.</p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/login")}>
              Fazer Login
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => router.push("/bootstrap")}>
                <Shield className="h-4 w-4 mr-2" />
                Bootstrap
              </Button>

              <Button variant="outline" onClick={() => router.push("/debug")}>
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">Acesso restrito a emails autorizados</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Funcionalidades:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Gestão de usuários e igrejas</li>
              <li>• Chat hierárquico WhatsApp-like</li>
              <li>• Mapa interativo de unidades</li>
              <li>• Sistema de convites automático</li>
              <li>• Videochamadas integradas</li>
              <li>• Sistema de autenticação seguro</li>
            </ul>
          </div>

          {/* Quick Test Credentials */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">🔑 Credenciais de Teste:</h3>
            <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
              <p>📧 admin@teste.com</p>
              <p>🔑 Admin123456</p>
              <p className="text-blue-600">Use o Bootstrap para criar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
