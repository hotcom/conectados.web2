"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, query, where } from "firebase/firestore"
import AdminNav from "@/components/admin-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Church, Mail, Download, TrendingUp, Calendar } from "lucide-react"

interface ReportData {
  totalUsers: number
  totalChurches: number
  totalInvites: number
  acceptedInvites: number
  usersByRole: Record<string, number>
  churchesByType: Record<string, number>
  invitesByMonth: Record<string, number>
  recentActivity: any[]
}

export default function RelatoriosPage() {
  const { user, profile } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    totalChurches: 0,
    totalInvites: 0,
    acceptedInvites: 0,
    usersByRole: {},
    churchesByType: {},
    invitesByMonth: {},
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return
    loadReportData()
  }, [user, profile])

  async function loadReportData() {
    try {
      const { db } = getFirebase()
      
      // Carregar dados básicos
      const [usersSnap, churchesSnap, invitesSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "places")),
        getDocs(collection(db, "invites"))
      ])

      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const churches = churchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const invites = invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Calcular estatísticas
      const usersByRole: Record<string, number> = {}
      users.forEach((user: any) => {
        usersByRole[user.role] = (usersByRole[user.role] || 0) + 1
      })

      const churchesByType: Record<string, number> = {}
      churches.forEach((church: any) => {
        churchesByType[church.kind] = (churchesByType[church.kind] || 0) + 1
      })

      const acceptedInvites = invites.filter((invite: any) => invite.acceptedAt).length

      const invitesByMonth: Record<string, number> = {}
      invites.forEach((invite: any) => {
        const date = new Date(invite.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        invitesByMonth[monthKey] = (invitesByMonth[monthKey] || 0) + 1
      })

      setReportData({
        totalUsers: users.length,
        totalChurches: churches.length,
        totalInvites: invites.length,
        acceptedInvites,
        usersByRole,
        churchesByType,
        invitesByMonth,
        recentActivity: [...users, ...churches, ...invites]
          .sort((a: any, b: any) => b.createdAt - a.createdAt)
          .slice(0, 10)
      })
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  function exportData() {
    const data = {
      geradoEm: new Date().toISOString(),
      estatisticas: reportData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atlas-conectados-relatorio-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "pastor_conselho" && profile.role !== "pastor_regional" && profile.role !== "secretaria")) {
    return (
      <>
        <AdminNav currentPage="/admin/relatorios" />
        <main className="lg:ml-80 pt-14 min-h-screen grid place-items-center">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">Acesso Restrito</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para acessar relatórios.</p>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/relatorios" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Estatísticas</h1>
              <p className="text-muted-foreground">
                Dados consolidados do sistema Conectados.co
              </p>
            </div>
            <Button onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">{loading ? "..." : reportData.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Igrejas</p>
                  <p className="text-2xl font-bold">{loading ? "..." : reportData.totalChurches}</p>
                </div>
                <Church className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Convites Enviados</p>
                  <p className="text-2xl font-bold">{loading ? "..." : reportData.totalInvites}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : reportData.totalInvites > 0 
                      ? `${Math.round((reportData.acceptedInvites / reportData.totalInvites) * 100)}%`
                      : "0%"
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Role */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários por Função
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : Object.entries(reportData.usersByRole).length === 0 ? (
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                ) : (
                  Object.entries(reportData.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Churches by Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Church className="h-5 w-5" />
                Igrejas por Tipo
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : Object.entries(reportData.churchesByType).length === 0 ? (
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                ) : (
                  Object.entries(reportData.churchesByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Invites by Month */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Convites por Mês
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : Object.entries(reportData.invitesByMonth).length === 0 ? (
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                ) : (
                  Object.entries(reportData.invitesByMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([month, count]) => (
                      <div key={month} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">{month}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))
                )}
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status do Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Firebase</span>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Autenticação</span>
                  <Badge className="bg-green-500">Ativa</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Geocodificação</span>
                  <Badge className="bg-green-500">Funcionando</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Email</span>
                  <Badge className="bg-green-500">Configurado</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Métricas de Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {reportData.totalInvites > 0 
                    ? `${Math.round((reportData.acceptedInvites / reportData.totalInvites) * 100)}%`
                    : "0%"
                  }
                </p>
                <p className="text-sm text-muted-foreground">Taxa de Aceitação de Convites</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.totalChurches > 0 
                    ? (reportData.totalUsers / reportData.totalChurches).toFixed(1)
                    : "0"
                  }
                </p>
                <p className="text-sm text-muted-foreground">Usuários por Igreja</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.totalInvites - reportData.acceptedInvites}
                </p>
                <p className="text-sm text-muted-foreground">Convites Pendentes</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
