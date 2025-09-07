"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { api } from "../../lib/api"

interface DomainInfo {
  environment: string
  allowedDomains: string[]
  isDevelopment: boolean
  message: string
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null)

  const { signIn } = useAuth()
  const router = useRouter()

  // Buscar informações de domínio ao carregar
  useEffect(() => {
    const fetchDomainInfo = async () => {
      try {
        const response = await api.getDomainInfo()
        if (response.success) {
          setDomainInfo(response.data)
        }
      } catch (error) {
        console.error("Error fetching domain info:", error)
        // Fallback para desenvolvimento
        setDomainInfo({
          environment: "development",
          allowedDomains: ["teste.com", "boladeneve.com"],
          isDevelopment: true,
          message: "Modo desenvolvimento ativo",
        })
      }
    }

    fetchDomainInfo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderEmail = () => {
    if (!domainInfo) return "seu.email@dominio.com"

    if (domainInfo.isDevelopment) {
      return "admin@teste.com"
    } else {
      return "seu.nome@boladeneve.com"
    }
  }

  const getDomainText = () => {
    if (!domainInfo) return "Carregando..."

    if (domainInfo.isDevelopment) {
      return `Domínios permitidos: ${domainInfo.allowedDomains.join(", ")}`
    } else {
      return `Use seu email @${domainInfo.allowedDomains[0]}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">🙏 Fazer Login</CardTitle>
          <p className="text-gray-600">{getDomainText()}</p>
          {domainInfo?.isDevelopment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-2">
              <p className="text-xs text-yellow-700">🧪 {domainInfo.message}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getPlaceholderEmail()}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {domainInfo?.isDevelopment
                ? "🧪 Ambiente de teste ativo"
                : "Não tem acesso? Entre em contato com seu pastor regional."}
            </p>
          </div>

          {domainInfo?.isDevelopment && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-700 font-medium">Contas de teste disponíveis:</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• admin@teste.com (Presidência)</li>
                <li>• pastor@teste.com (Pastor Regional)</li>
                <li>• secretaria@teste.com (Secretaria)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">Senha padrão: Admin123456</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
