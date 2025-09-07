"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getUserRoles, hasRole } from "@/lib/role-utils"
import { getRegionName } from "@/lib/region-utils"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import AdminNav from "@/components/admin-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Users, 
  Church, 
  Mail, 
  MapPin, 
  TrendingUp, 
  Clock,
  UserPlus,
  MessageCircle,
  BarChart3
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalChurches: number
  totalInvites: number
  pendingInvites: number
  recentUsers: any[]
  recentChurches: any[]
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalChurches: 0,
    totalInvites: 0,
    pendingInvites: 0,
    recentUsers: [],
    recentChurches: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return
    loadDashboardData()
  }, [user, profile])

  // Early return for loading states - prevents any flash of old content
  if (!user) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Carregando...</h1>
          <p className="text-muted-foreground mt-2">Verificando autenticação.</p>
        </Card>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Carregando...</h1>
          <p className="text-muted-foreground mt-2">Carregando perfil do usuário.</p>
        </Card>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Carregando Dashboard...</h1>
          <p className="text-muted-foreground mt-2">Carregando dados do painel.</p>
        </Card>
      </main>
    )
  }

  async function loadDashboardData() {
    try {
      const { db } = getFirebase()
      
      // Pastor regional, pastor local e secretaria veem dados da sua região
      const userRoles = getUserRoles(profile as any)
      const isRegionalPastor = hasRole(profile as any, "pastor_regional")
      const isLocalPastor = hasRole(profile as any, "pastor_local")
      const isSecretary = hasRole(profile as any, "secretaria")
      const regionId = profile?.regionId
      
      // Debug logs removed for cleaner console output
      
      let usersQuery, churchesQuery, invitesQuery, pendingInvitesQuery, recentUsersQuery, recentChurchesQuery
      
      if ((isRegionalPastor || isLocalPastor || isSecretary) && regionId) {
        usersQuery = query(collection(db, "users"), where("regionId", "==", regionId))
        churchesQuery = query(collection(db, "places"), where("regionId", "==", regionId))
        invitesQuery = query(collection(db, "invites"), where("regionId", "==", regionId))
        pendingInvitesQuery = query(collection(db, "invites"), where("regionId", "==", regionId), where("acceptedAt", "==", null))
        // Simplified queries without orderBy to avoid index requirements
        recentUsersQuery = query(
          collection(db, "users"), 
          where("regionId", "==", regionId),
          limit(5)
        )
        recentChurchesQuery = query(
          collection(db, "places"), 
          where("regionId", "==", regionId),
          limit(5)
        )
      } else {
        // Queries globais para admin e pastor_conselho
        usersQuery = collection(db, "users")
        churchesQuery = collection(db, "places")
        invitesQuery = collection(db, "invites")
        pendingInvitesQuery = query(collection(db, "invites"), where("acceptedAt", "==", null))
        recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5))
        recentChurchesQuery = query(collection(db, "places"), orderBy("createdAt", "desc"), limit(5))
      }
      
      // Carregar estatísticas
      const [usersSnap, churchesSnap, invitesSnap, pendingInvitesSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(churchesQuery),
        getDocs(invitesQuery),
        getDocs(pendingInvitesQuery)
      ])

      // Carregar dados recentes
      const [recentUsersSnap, recentChurchesSnap] = await Promise.all([
        getDocs(recentUsersQuery),
        getDocs(recentChurchesQuery)
      ])

      setStats({
        totalUsers: usersSnap.size,
        totalChurches: churchesSnap.size,
        totalInvites: invitesSnap.size,
        pendingInvites: pendingInvitesSnap.size,
        recentUsers: recentUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        recentChurches: recentChurchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      })
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  // All auth and permission checks are now handled in the loading check above
  const userRoles = getUserRoles(profile as any)
  const hasAdminAccess = hasRole(profile as any, "admin") || 
                        hasRole(profile as any, "pastor_regional") || 
                        hasRole(profile as any, "pastor_local") || 
                        hasRole(profile as any, "pastor_conselho") || 
                        hasRole(profile as any, "secretaria")

  // If user doesn't have access, redirect instead of showing access denied
  if (!hasAdminAccess) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar este painel.</p>
          <Button asChild className="mt-4">
            <Link href="/mapa">Ir para o Mapa</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/dashboard" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">
              {hasRole(profile as any, "pastor_regional") ? "Dashboard Regional" : "Dashboard Administrativo"}
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao Conectados.co - {profile.displayName || user.email} • {profile.role}
              {hasRole(profile as any, "pastor_regional") && profile?.regionId && (
                <span className="ml-2 text-blue-600">• Região: {getRegionName(profile.regionId)}</span>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4">
              <Link href="/admin/convites" className="flex flex-col items-center gap-2">
                <UserPlus className="h-6 w-6" />
                <span>Convidar Usuário</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/admin/igrejas" className="flex flex-col items-center gap-2">
                <Church className="h-6 w-6" />
                <span>Cadastrar Igreja</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/mapa" className="flex flex-col items-center gap-2">
                <MapPin className="h-6 w-6" />
                <span>Ver Mapa</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/chat" className="flex flex-col items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span>Chat</span>
              </Link>
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {profile?.role === "pastor_regional" ? "Usuários da Região" : "Total de Usuários"}
                  </p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {profile?.role === "pastor_regional" ? "Igrejas da Região" : "Total de Igrejas"}
                  </p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.totalChurches}</p>
                </div>
                <Church className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Convites Enviados</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.totalInvites}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Convites Pendentes</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.pendingInvites}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Usuários Recentes</h3>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/usuarios">Ver Todos</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : stats.recentUsers.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                ) : (
                  stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{user.displayName || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Churches */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Igrejas Recentes</h3>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/igrejas">Ver Todas</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : stats.recentChurches.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma igreja encontrada</p>
                ) : (
                  stats.recentChurches.map((church) => (
                    <div key={church.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{church.name}</p>
                        <p className="text-sm text-muted-foreground">{church.address}</p>
                      </div>
                      <Badge variant="outline">{church.kind}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* System Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Firebase Conectado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Autenticação Ativa</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Mapa Funcionando</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
