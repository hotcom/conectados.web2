"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../lib/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { formatChurchType, formatDate } from "../../lib/utils"
import { Church, Search, Plus, ArrowLeft, MapPin, Edit, Trash2 } from "lucide-react"
import type { Church as ChurchType } from "../../../../shared/types/church"

export default function ChurchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [churches, setChurches] = useState<ChurchType[]>([])
  const [filteredChurches, setFilteredChurches] = useState<ChurchType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingChurches, setLoadingChurches] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadChurches()
    }
  }, [user, loading, router])

  const loadChurches = async () => {
    try {
      setLoadingChurches(true)
      const response = await api.getChurches()

      if (response.data.success) {
        setChurches(response.data.data)
        setFilteredChurches(response.data.data)
      } else {
        setError("Erro ao carregar igrejas")
      }
    } catch (error: any) {
      setError("Erro ao carregar igrejas")
      console.error("Load churches error:", error)
    } finally {
      setLoadingChurches(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = churches.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatChurchType(c.type).toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredChurches(filtered)
    } else {
      setFilteredChurches(churches)
    }
  }, [searchTerm, churches])

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
      active: { label: "Ativa", color: "bg-green-100 text-green-800" },
      inactive: { label: "Inativa", color: "bg-red-100 text-red-800" },
      temporary: { label: "Temporária", color: "bg-yellow-100 text-yellow-800" },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active

    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
  }

  const getTypeColor = (type: string) => {
    const typeColors = {
      regional: "bg-blue-100 text-blue-800",
      local: "bg-green-100 text-green-800",
      nucleo: "bg-purple-100 text-purple-800",
    }

    return typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"
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
                  <Church className="h-5 w-5 mr-2" />
                  Gestão de Igrejas
                </h1>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/map")}>
                <MapPin className="h-4 w-4 mr-2" />
                Ver no Mapa
              </Button>

              {user.permissions.includes("create_church") && (
                <Button onClick={() => router.push("/churches/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Igreja
                </Button>
              )}
            </div>
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
                placeholder="Buscar por nome, endereço ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Churches List */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-red-600 text-center">{error}</div>
            </CardContent>
          </Card>
        )}

        {loadingChurches ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando igrejas...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredChurches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Church className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "Nenhuma igreja encontrada" : "Nenhuma igreja cadastrada"}
                  </p>
                  {user.permissions.includes("create_church") && (
                    <Button className="mt-4" onClick={() => router.push("/churches/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeira Igreja
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredChurches.map((church) => (
                <Card key={church.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Church className="h-6 w-6 text-blue-600" />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{church.name}</h3>
                          <p className="text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {church.address}
                          </p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(church.type)}`}>
                              {formatChurchType(church.type)}
                            </span>
                            {getStatusBadge(church.status)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500">
                          <p>Criada em</p>
                          <p>{formatDate(church.createdAt)}</p>
                          <p className="text-xs">
                            Lat: {church.location.lat.toFixed(4)}, Lng: {church.location.lng.toFixed(4)}
                          </p>
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
              <p className="text-2xl font-bold text-blue-600">{churches.length}</p>
              <p className="text-sm text-gray-600">Total de Igrejas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {churches.filter((c) => c.type === "regional").length}
              </p>
              <p className="text-sm text-gray-600">Igrejas Regionais</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{churches.filter((c) => c.type === "local").length}</p>
              <p className="text-sm text-gray-600">Igrejas Locais</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{churches.filter((c) => c.type === "nucleo").length}</p>
              <p className="text-sm text-gray-600">Núcleos</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
