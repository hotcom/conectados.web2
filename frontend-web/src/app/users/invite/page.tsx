"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../contexts/AuthContext"
import { api } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { ArrowLeft, Send, Mail, MessageCircle, Shield, Phone, CheckCircle, AlertCircle } from "lucide-react"
import type { UserRole } from "../../../../../shared/types/user"

export default function InviteUserPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    role: "pastor_local" as UserRole,
    phone: "",
    sendWhatsApp: true,
    sendEmail: true,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const roles: { value: UserRole; label: string; description: string; color: string }[] = [
    {
      value: "presidencia",
      label: "Presidência",
      description: "Acesso total ao sistema",
      color: "text-red-600",
    },
    {
      value: "conselho",
      label: "Conselho",
      description: "Gestão geral e aprovações",
      color: "text-purple-600",
    },
    {
      value: "pastor_regional",
      label: "Pastor Regional",
      description: "Gestão de região e igrejas locais",
      color: "text-blue-600",
    },
    {
      value: "secretaria",
      label: "Secretaria",
      description: "Suporte administrativo",
      color: "text-green-600",
    },
    {
      value: "pastor_local",
      label: "Pastor Local",
      description: "Gestão de igreja local",
      color: "text-orange-600",
    },
    {
      value: "missionario_nucleo",
      label: "Missionário de Núcleo",
      description: "Gestão de núcleo/célula",
      color: "text-teal-600",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await api.inviteUser(formData)

      if (response.data.success) {
        setSuccess(`✅ Convite enviado com sucesso para ${formData.email}!`)

        // Reset form
        setFormData({
          email: "",
          role: "pastor_local",
          phone: "",
          sendWhatsApp: true,
          sendEmail: true,
        })
      } else {
        setError(response.data.error || "Erro ao enviar convite")
      }
    } catch (error: any) {
      setError(error.response?.data?.error || "Erro ao enviar convite")
    } finally {
      setLoading(false)
    }
  }

  if (!user?.permissions.includes("invite_users")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Você não tem permissão para convidar usuários.</p>
            <Button onClick={() => router.push("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">Convidar Usuário</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Convite
                </CardTitle>
                <p className="text-gray-600">
                  Convide um novo usuário para o sistema. O convite será enviado por email e/ou WhatsApp.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="pastor.joao@boladeneve.com"
                      required
                      disabled={loading}
                      className="text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">⚠️ Deve ser um email @boladeneve.com</p>
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      <Shield className="inline h-4 w-4 mr-1" />
                      Função *
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      required
                      disabled={loading}
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))}
                    </select>

                    {/* Role Description */}
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      {roles.map(
                        (role) =>
                          formData.role === role.value && (
                            <div key={role.value} className={`text-sm ${role.color}`}>
                              <strong>{role.label}:</strong> {role.description}
                            </div>
                          ),
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="inline h-4 w-4 mr-1" />
                      WhatsApp (opcional)
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                      className="text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">📱 Para envio do convite via WhatsApp</p>
                  </div>

                  {/* Send Options */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Métodos de Envio:</p>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-md">
                        <input
                          type="checkbox"
                          id="sendEmail"
                          checked={formData.sendEmail}
                          onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <label htmlFor="sendEmail" className="flex items-center text-sm text-gray-700 flex-1">
                          <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          <div>
                            <div className="font-medium">Enviar por Email</div>
                            <div className="text-xs text-gray-500">Link de convite será enviado por email</div>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border rounded-md">
                        <input
                          type="checkbox"
                          id="sendWhatsApp"
                          checked={formData.sendWhatsApp}
                          onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={loading || !formData.phone}
                        />
                        <label htmlFor="sendWhatsApp" className="flex items-center text-sm text-gray-700 flex-1">
                          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                          <div>
                            <div className="font-medium">Enviar por WhatsApp</div>
                            <div className="text-xs text-gray-500">
                              {!formData.phone ? "Informe o telefone para habilitar" : "Mensagem automática via Z-API"}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={loading || (!formData.sendEmail && !formData.sendWhatsApp)}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Convite
                        </>
                      )}
                    </Button>

                    <Button type="button" variant="outline" onClick={() => router.push("/users")}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Quick Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Guia Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    1
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Email @boladeneve.com</div>
                    <div className="text-gray-500">Obrigatório para acesso</div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    2
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Escolha a Função</div>
                    <div className="text-gray-500">Define permissões no sistema</div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    3
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">WhatsApp (opcional)</div>
                    <div className="text-gray-500">Para notificação imediata</div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    4
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Enviar Convite</div>
                    <div className="text-gray-500">Email + WhatsApp automático</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🛡️ Hierarquia de Funções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map((role, index) => (
                    <div key={role.value} className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-red-500"
                            : index === 1
                              ? "bg-purple-500"
                              : index === 2
                                ? "bg-blue-500"
                                : index === 3
                                  ? "bg-green-500"
                                  : index === 4
                                    ? "bg-orange-500"
                                    : "bg-teal-500"
                        }`}
                      ></div>
                      <div className="text-sm">
                        <div className="font-medium">{role.label}</div>
                        <div className="text-gray-500 text-xs">{role.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ℹ️ Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Convite expira em 7 dias</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Email automático com link</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>WhatsApp via Z-API</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Pode reenviar se necessário</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Exemplo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>Email:</strong> pastor.joao@boladeneve.com
                  </p>
                  <p>
                    <strong>Função:</strong> Pastor Local
                  </p>
                  <p>
                    <strong>WhatsApp:</strong> (11) 99999-9999
                  </p>
                  <p className="text-green-600 text-xs mt-2">✅ Receberá email + WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
