"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Shield, User, Mail, Lock, CheckCircle } from "lucide-react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function BootstrapPage() {
  const router = useRouter()
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "admin@boladeneve.com",
    password: "Admin123456",
    displayName: "Administrador Sistema",
  })
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    checkExistingAdmin()
  }, [])

  const checkExistingAdmin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/bootstrap`)
      if (response.data.success) {
        setHasAdmin(response.data.data.hasAdmin)
      }
    } catch (error) {
      console.error("Error checking admin:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/bootstrap`, formData)

      if (response.data.success) {
        setSuccess("Administrador criado com sucesso! Você já pode fazer login.")
        setHasAdmin(true)
      } else {
        setError(response.data.error || "Erro ao criar administrador")
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Erro ao criar administrador")
    } finally {
      setLoading(false)
    }
  }

  if (hasAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Verificando sistema...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">
            {hasAdmin ? "✅ Sistema Configurado" : "🔧 Configuração Inicial"}
          </CardTitle>
          <p className="text-gray-600">
            {hasAdmin
              ? "O sistema já possui um administrador configurado"
              : "Crie o primeiro usuário administrador do sistema"}
          </p>
        </CardHeader>

        <CardContent>
          {hasAdmin ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">Sistema já configurado com administrador</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push("/login")}>
                  Ir para Login
                </Button>

                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/")}>
                  Página Inicial
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Credenciais padrão:</h3>
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
                  <p>📧 Email: admin@boladeneve.com</p>
                  <p>🔑 Senha: Admin123456</p>
                  <p className="text-red-600 mt-2">⚠️ Altere a senha após o primeiro login!</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Nome Completo
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Administrador Sistema"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@boladeneve.com"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Deve ser um email @boladeneve.com</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar Administrador"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Este usuário terá acesso total ao sistema e poderá convidar outros usuários.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
