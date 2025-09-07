"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { formatRole } from "../../lib/utils"
import { Users, Church, MessageCircle, Map, UserPlus, Video, Settings, LogOut } from "lucide-react"

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChurches: 0,
    totalMessages: 0,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
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

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const menuItems = [
    {
      title: "Usuários",
      description: "Gerenciar usuários e permissões",
      icon: Users,
      href: "/users",
      color: "bg-blue-500",
      permissions: ["view_all_users"],
    },
    {
      title: "Igrejas",
      description: "Cadastrar e gerenciar igrejas",
      icon: Church,
      href: "/churches",
      color: "bg-green-500",
      permissions: ["view_all_churches"],
    },
    {
      title: "Chat",
      description: "Comunicação hierárquica",
      icon: MessageCircle,
      href: "/chat",
      color: "bg-purple-500",
      permissions: [],
    },
    {
      title: "Mapa",
      description: "Visualizar unidades no mapa",
      icon: Map,
      href: "/map",
      color: "bg-orange-500",
      permissions: [],
    },
    {
      title: "Convites",
      description: "Convidar novos usuários",
      icon: UserPlus,
      href: "/invites",
      color: "bg-pink-500",
      permissions: ["invite_users"],
    },
    {
      title: "Videochamadas",
      description: "Reuniões e cultos online",
      icon: Video,
      href: "/video",
      color: "bg-red-500",
      permissions: [],
    },
  ]

  const hasPermission = (permissions: string[]) => {
    if (permissions.length === 0) return true
    return permissions.some((permission) => user.permissions.includes(permission))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">🙏 Igreja Bola de Neve</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">{formatRole(user.role)}</p>
              </div>

              <Button variant="ghost" size="sm" onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo, {user.displayName}!</h2>
          <p className="text-gray-600">Acesso como {formatRole(user.role)} • Sistema integrado de gestão</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Church className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Igrejas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChurches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mensagens</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const canAccess = hasPermission(item.permissions)

            return (
              <Card
                key={item.href}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  canAccess ? "hover:scale-105" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canAccess && router.push(item.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  {!canAccess && <p className="text-xs text-red-500 mt-2">Sem permissão de acesso</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {hasPermission(["invite_users"]) && (
                  <Button onClick={() => router.push("/invites/new")}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar Usuário
                  </Button>
                )}

                {hasPermission(["create_church"]) && (
                  <Button variant="outline" onClick={() => router.push("/churches/new")}>
                    <Church className="h-4 w-4 mr-2" />
                    Nova Igreja
                  </Button>
                )}

                <Button variant="outline" onClick={() => router.push("/chat")}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Abrir Chat
                </Button>

                <Button variant="outline" onClick={() => router.push("/map")}>
                  <Map className="h-4 w-4 mr-2" />
                  Ver Mapa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
