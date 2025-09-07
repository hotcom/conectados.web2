"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Bug, User, Church, Shield, Zap } from "lucide-react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function DebugPage() {
  const router = useRouter()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  const testEndpoint = async (name: string, url: string, method = "GET", data?: any) => {
    setLoading(name)
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${url}`,
        data,
      })

      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: true,
          status: response.status,
          data: response.data,
        },
      }))
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: false,
          status: error.response?.status || 0,
          error: error.response?.data || error.message,
        },
      }))
    } finally {
      setLoading(null)
    }
  }

  const tests = [
    {
      name: "Backend Health",
      icon: Zap,
      color: "bg-green-500",
      action: () => testEndpoint("health", "/api/health"),
    },
    {
      name: "Check Admin",
      icon: Shield,
      color: "bg-blue-500",
      action: () => testEndpoint("admin", "/api/admin/bootstrap"),
    },
    {
      name: "Create Admin",
      icon: User,
      color: "bg-purple-500",
      action: () =>
        testEndpoint("createAdmin", "/api/admin/bootstrap", "POST", {
          email: "admin@boladeneve.com",
          password: "Admin123456",
          displayName: "Admin Debug",
        }),
    },
    {
      name: "List Users",
      icon: User,
      color: "bg-orange-500",
      action: () => testEndpoint("users", "/api/users"),
    },
    {
      name: "List Churches",
      icon: Church,
      color: "bg-red-500",
      action: () => testEndpoint("churches", "/api/churches"),
    },
  ]

  const quickActions = [
    {
      name: "Bootstrap Admin",
      description: "Configurar primeiro administrador",
      action: () => router.push("/bootstrap"),
      color: "bg-blue-600",
    },
    {
      name: "Login",
      description: "Fazer login no sistema",
      action: () => router.push("/login"),
      color: "bg-green-600",
    },
    {
      name: "Dashboard",
      description: "Ir para o dashboard",
      action: () => router.push("/dashboard"),
      color: "bg-purple-600",
    },
    {
      name: "Firebase Console",
      description: "Abrir console do Firebase",
      action: () => window.open("https://console.firebase.google.com/project/bdn-unidades", "_blank"),
      color: "bg-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Bug className="h-6 w-6 mr-2" />
              Debug & Testes - Igreja Bola de Neve
            </CardTitle>
            <p className="text-gray-600">Ferramentas para testar e debugar o sistema</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.name}
                  onClick={action.action}
                  className={`w-full justify-start ${action.color} hover:opacity-90`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{action.name}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* API Tests */}
          <Card>
            <CardHeader>
              <CardTitle>🧪 Testes de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tests.map((test) => {
                const Icon = test.icon
                const result = results[test.name.toLowerCase().replace(" ", "")]

                return (
                  <div key={test.name} className="flex items-center space-x-3">
                    <Button
                      onClick={test.action}
                      disabled={loading === test.name.toLowerCase().replace(" ", "")}
                      className={`flex-1 justify-start ${test.color} hover:opacity-90`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {loading === test.name.toLowerCase().replace(" ", "") ? "Testando..." : test.name}
                    </Button>

                    {result && (
                      <div
                        className={`w-4 h-4 rounded-full ${result.success ? "bg-green-500" : "bg-red-500"}`}
                        title={result.success ? "Sucesso" : "Erro"}
                      />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>📊 Resultados dos Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results).map(([name, result]: [string, any]) => (
                  <div key={name} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize">{name.replace(/([A-Z])/g, " $1")}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.success ? `✅ ${result.status}` : `❌ ${result.status}`}
                      </span>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credentials */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🔑 Credenciais de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">👑 Administrador</h3>
                <div className="text-sm space-y-1">
                  <p>📧 Email: admin@boladeneve.com</p>
                  <p>🔑 Senha: Admin123456</p>
                  <p>🛡️ Role: presidencia</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">⛪ Pastor Regional</h3>
                <div className="text-sm space-y-1">
                  <p>📧 Email: pastor@boladeneve.com</p>
                  <p>🔑 Senha: Pastor123456</p>
                  <p>🛡️ Role: pastor_regional</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Importante:</strong> Estas são credenciais de teste. Altere as senhas em produção!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ℹ️ Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🔥 Firebase</h4>
                <p>Project: bdn-unidades</p>
                <p>Auth: Configurado</p>
                <p>Firestore: Ativo</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📱 Z-API WhatsApp</h4>
                <p>Instance: 3DD83FFD...</p>
                <p>Token: 8DDFB2C8...</p>
                <p>Status: Configurado</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🌐 URLs</h4>
                <p>Frontend: {window.location.origin}</p>
                <p>Backend: {API_BASE_URL}</p>
                <p>Ambiente: {process.env.NODE_ENV}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
