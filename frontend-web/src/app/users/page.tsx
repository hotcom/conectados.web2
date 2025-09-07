"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../lib/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { formatRole, formatDate } from "../../lib/utils"
import { Users, Search, UserPlus, ArrowLeft, Edit, Trash2 } from "lucide-react"
import type { User } from "../../../../shared/types/user"

export default function UsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && !user.permissions.includes("view_all_users")) {
      router.push("/dashboard")
      return
    }

    if (user) {
      loadUsers()
    }
  }, [user, loading, router])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.getUsers()

      if (response.data.success) {
        setUsers(response.data.data)
        setFilteredUsers(response.data.data)
      } else {
        setError("Erro ao carregar usuários")
      }
    } catch (error: any) {
      setError("Erro ao carregar usuários")
      console.error("Load users error:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatRole(u.role).toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Ativo", color: "bg-green-100 text-green-800" },
      inactive: { label: "Inativo", color: "bg-red-100 text-red-800" },
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gestão de Usuários
                </h1>
              </div>
            </div>

            <Button onClick={() => router.push("/users/invite")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600 text-center">{error}</div>
            </CardContent>
          </Card>
        )}

        {loadingUsers ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando usuários...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((u) => (
                <Card key={u.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {u.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{u.displayName}</h3>
                          <p className="text-gray-600">{u.email}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-sm text-gray-500">{formatRole(u.role)}</span>
                            {getStatusBadge(u.status)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>Criado em</p>
                          <p>{formatDate(u.createdAt)}</p>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "active").length}</p>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{users.filter((u) => u.status === "pending").length}</p>
              <p className="text-sm text-gray-600">Convites Pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {users.filter((u) => u.role === "pastor_regional").length}
              </p>
              <p className="text-sm text-gray-600">Pastores Regionais</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
