"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getRegionName } from "@/lib/region-utils"
import { hasRole } from "@/lib/role-utils"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import AdminNav from "@/components/admin-nav"
import { Search, Church, Plus, MapPin, Edit, Trash2, Users, Crown, UserPlus, X, Calendar, Mail } from "lucide-react"
import Link from "next/link"

interface Pastor {
  id: string
  uid?: string
  displayName: string
  fullName?: string
  nickname?: string
  email: string
  phone?: string
  birthDate?: string
  role: string
  roles?: string[]
  regionId?: string
  regionName?: string
  churchId?: string
  createdAt: number
}

export default function PastoresPage() {
  const { user, profile } = useAuth()
  const [pastores, setPastores] = useState<Pastor[]>([])
  const [filteredPastores, setFilteredPastores] = useState<Pastor[]>([])
  const [churches, setChurches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [regions, setRegions] = useState<any[]>([])
  const [filterRole, setFilterRole] = useState<string>("all")
  const [editingPastor, setEditingPastor] = useState<Pastor | null>(null)
  const [selectedChurchId, setSelectedChurchId] = useState<string>("no-church")
  const [selectedRegionId, setSelectedRegionId] = useState<string>("no-region")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nickname: "",
    fullName: "",
    email: "",
    phone: "",
    birthDate: ""
  })

  useEffect(() => {
    if (!user || !profile) return
    loadPastores()
    loadChurches()
    loadRegions()
    
    // Escutar mudanças de vinculação de pastores
    const handlePastorChurchUpdate = () => {
      loadPastores()
      loadChurches()
    }
    
    window.addEventListener('pastorChurchUpdated', handlePastorChurchUpdate)
    
    return () => {
      window.removeEventListener('pastorChurchUpdated', handlePastorChurchUpdate)
    }
  }, [user, profile])

  useEffect(() => {
    const filteredPastores = pastores.filter(pastor => {
      const matchesSearch = pastor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pastor.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === "all" || 
                         (Array.isArray(pastor.roles) ? pastor.roles.includes(filterRole) : pastor.role === filterRole)
      
      // Pastor regional vê todos os pastores da sua região
      if (profile?.role === "pastor_regional" && profile?.regionId) {
        const matchesRegion = pastor.regionId === profile.regionId
        return matchesSearch && matchesRole && matchesRegion
      }
      
      const matchesRegion = regionFilter === "all" || 
                           pastor.regionId === regionFilter ||
                           pastor.regionName?.toLowerCase().includes(regionFilter.toLowerCase())
      
      return matchesSearch && matchesRole && matchesRegion
    })
    
    console.log("Final filtered pastors:", filteredPastores.length, filteredPastores)
    setFilteredPastores(filteredPastores)
  }, [pastores, searchTerm, filterRole, regionFilter])

  async function loadPastores() {
    try {
      const { db } = getFirebase()
      let pastoresQuery
      
      // Filtros baseados no papel do usuário
      if (hasRole(profile as any, "pastor_regional") && profile?.regionId) {
        // Pastor regional vê todos os pastores da sua região
        pastoresQuery = query(
          collection(db, "users"),
          where("regionId", "==", profile.regionId)
        )
      } else if ((hasRole(profile as any, "pastor_local") || hasRole(profile as any, "secretaria")) && profile?.regionId) {
        // Pastor local e secretaria veem toda a região mas só gerenciam sua igreja
        pastoresQuery = query(
          collection(db, "users"),
          where("regionId", "==", profile.regionId)
        )
      } else {
        // Admin, pastor_conselho e secretaria veem todos
        pastoresQuery = query(
          collection(db, "users"),
          where("role", "in", ["pastor_conselho", "pastor_regional", "pastor_local", "secretaria"])
        )
      }
      
      const snapshot = await getDocs(pastoresQuery)
      let pastoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      })) as Pastor[]
      
      // Se é pastor regional, filtra apenas os da sua região
      if (profile?.role === "pastor_regional" && profile?.regionId) {
        pastoresData = pastoresData.filter(pastor => {
          console.log(`Checking pastor ${pastor.displayName}: regionId=${pastor.regionId}, expected=${profile.regionId}`)
          return pastor.regionId === profile.regionId
        })
      }
      
      // Pastor regional deve ver todos os pastores da região, incluindo ele mesmo
      
      console.log("Final filtered pastors:", pastoresData.length, pastoresData)
      setPastores(pastoresData)
    } catch (error) {
      console.error("Erro ao carregar pastores:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadChurches() {
    try {
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "places"))
      const churchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Filtrar apenas igrejas (incluindo diferentes tipos)
      const filteredChurches = churchesData.filter((place: any) => 
        place.kind === "igreja" || 
        place.kind === "regional" || 
        place.kind === "local" || 
        place.kind === "nucleo" ||
        !place.kind || 
        place.type === "regional" || 
        place.type === "local" || 
        place.type === "nucleo"
      )
      
      console.log("Total places loaded:", churchesData.length)
      console.log("All places data:", JSON.stringify(churchesData, null, 2))
      console.log("Filtered churches:", filteredChurches.length, filteredChurches)
      console.log("Churches state before set:", churches.length)
      
      setChurches(filteredChurches)
      
      console.log("Churches state after set should be:", filteredChurches.length)
    } catch (error) {
      console.error("Erro ao carregar igrejas:", error)
    }
  }

  async function loadRegions() {
    try {
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "regions"))
      const regionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRegions(regionsData.sort((a: any, b: any) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error("Erro ao carregar regiões:", error)
    }
  }

  async function assignPastorToChurch(pastorId: string, churchId: string) {
    setSaving(true)
    try {
      const { db } = getFirebase()
      const finalChurchId = churchId === "no-church" ? null : churchId
      await updateDoc(doc(db, "users", pastorId), { churchId: finalChurchId })
      await loadPastores()
      setEditingPastor(null)
      setSelectedChurchId("no-church")
    } catch (error) {
      console.error("Erro ao vincular pastor à igreja:", error)
      alert("Erro ao vincular pastor à igreja")
    } finally {
      setSaving(false)
    }
  }

  async function updatePastorData(pastorId: string, churchId: string, regionId: string) {
    setSaving(true)
    try {
      const { db } = getFirebase()
      const finalChurchId = churchId === "no-church" ? null : churchId
      const finalRegionId = regionId === "no-region" ? null : regionId
      
      // Encontrar nome da região se regionId foi fornecido
      let regionName = null
      if (finalRegionId) {
        const selectedRegion = regions.find(r => r.id === finalRegionId)
        regionName = selectedRegion?.name || null
      }
      
      await updateDoc(doc(db, "users", pastorId), { 
        churchId: finalChurchId,
        regionId: finalRegionId,
        regionName: regionName,
        nickname: editFormData.nickname.trim(),
        fullName: editFormData.fullName.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        birthDate: editFormData.birthDate,
        displayName: editFormData.nickname.trim() || editFormData.fullName.trim() || editingPastor?.displayName,
        updatedAt: Date.now()
      })
      
      await loadPastores()
      setEditingPastor(null)
      setSelectedChurchId("no-church")
      setSelectedRegionId("no-region")
      setEditModalOpen(false)
      setEditFormData({
        nickname: "",
        fullName: "",
        email: "",
        phone: "",
        birthDate: ""
      })
    } catch (error) {
      console.error("Erro ao atualizar dados do pastor:", error)
    } finally {
      setSaving(false)
    }
  }

  async function saveEditPastor() {
    if (!editingPastor) return
    
    try {
      setSaving(true)
      const { db } = getFirebase()
      
      const updateData: any = {
        nickname: editFormData.nickname.trim(),
        fullName: editFormData.fullName.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        birthDate: editFormData.birthDate,
        regionId: selectedRegionId === "no-region" ? null : selectedRegionId,
        regionName: selectedRegionId === "no-region" ? null : regions.find(r => r.id === selectedRegionId)?.name,
        churchId: selectedChurchId === "no-church" ? null : selectedChurchId,
        updatedAt: Date.now()
      }
      
      // Update displayName based on nickname or fullName
      if (editFormData.nickname.trim()) {
        updateData.displayName = editFormData.nickname.trim()
      } else if (editFormData.fullName.trim()) {
        updateData.displayName = editFormData.fullName.trim()
      }
      
      console.log("Updating pastor with data:", updateData)
      await updateDoc(doc(db, "users", editingPastor.id), updateData)
      
      setEditModalOpen(false)
      setEditingPastor(null)
      await loadPastores()
    } catch (error) {
      console.error("Erro ao salvar pastor:", error)
      alert("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }

  function getChurchName(churchId?: string) {
    if (!churchId) return "Sem igreja"
    const church = churches.find(c => c.id === churchId)
    return church?.name || "Igreja não encontrada"
  }

  function getChurchPastor(churchId: string) {
    const pastor = pastores.find(p => p.churchId === churchId)
    return pastor ? pastor.displayName : null
  }

  function getRegionName(regionId?: string) {
    if (!regionId) return null
    const region = regions.find(r => r.id === regionId)
    return region?.name || "Região não encontrada"
  }

  function openAssignChurch(pastor: Pastor) {
    setEditingPastor(pastor)
    setSelectedChurchId(pastor.churchId || "no-church")
  }

  function openEditPastor(pastor: Pastor) {
    setEditingPastor(pastor)
    setSelectedChurchId(pastor.churchId || "no-church")
    setSelectedRegionId(pastor.regionId || "no-region")
    setEditFormData({
      nickname: pastor.nickname || "",
      fullName: pastor.fullName || "",
      email: pastor.email || "",
      phone: pastor.phone || "",
      birthDate: pastor.birthDate || ""
    })
    setEditModalOpen(true)
  }

  async function deletePastor(pastorId: string) {
    if (!confirm("Tem certeza que deseja remover este pastor?")) return
    
    try {
      const { db } = getFirebase()
      await deleteDoc(doc(db, "users", pastorId))
      await loadPastores()
    } catch (error) {
      console.error("Erro ao remover pastor:", error)
      alert("Erro ao remover pastor")
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "pastor_conselho": return <Crown className="h-4 w-4" />
      case "pastor_regional": return <MapPin className="h-4 w-4" />
      case "pastor_local": return <Church className="h-4 w-4" />
      case "secretaria": return <Calendar className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "pastor_conselho": return "Conselho"
      case "pastor_regional": return "Regional"
      case "pastor_local": return "Local"
      case "secretaria": return "Secretaria"
      default: return role
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case "pastor_conselho": return "bg-purple-500"
      case "pastor_regional": return "bg-blue-500"
      case "pastor_local": return "bg-green-500"
      case "secretaria": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  if (!user) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">Faça login para acessar esta página.</p>
        </Card>
      </main>
    )
  }

  if (!profile || (profile.role !== "admin" && profile.role !== "pastor_conselho" && profile.role !== "pastor_regional" && profile.role !== "pastor_local" && profile.role !== "secretaria")) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">Apenas administradores podem gerenciar pastores.</p>
        </Card>
      </main>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/pastores" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.role === "pastor_regional" ? "Pastores da Região" : "Gestão de Pastores"}
              </h1>
              <p className="text-muted-foreground">
                {profile?.role === "pastor_regional" 
                  ? `Pastores da sua região ${profile?.regionId ? getRegionName(profile.regionId) : ""} (${filteredPastores.length} total)`
                  : "Gerencie a hierarquia pastoral: Conselho, Regional, Local e Secretaria"
                }
              </p>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pastores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="pastor_conselho">Pastor do Conselho</SelectItem>
                  <SelectItem value="pastor_regional">Pastor Regional</SelectItem>
                  <SelectItem value="pastor_local">Pastor Local</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invite Actions */}
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/convites">
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar
                </Link>
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pastores</p>
                  <p className="text-2xl font-bold">{pastores.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conselho</p>
                  <p className="text-2xl font-bold">
                    {pastores.filter(p => p.role === "pastor_conselho").length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Regional</p>
                  <p className="text-2xl font-bold">
                    {pastores.filter(p => p.role === "pastor_regional").length}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local</p>
                  <p className="text-2xl font-bold">
                    {pastores.filter(p => p.role === "pastor_local").length}
                  </p>
                </div>
                <Church className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Secretaria</p>
                  <p className="text-2xl font-bold">
                    {pastores.filter(p => p.role === "secretaria").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Modal de Edição Completa */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Editar Dados - {editingPastor?.displayName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Apelido</label>
                    <Input
                      value={editFormData.nickname}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="Como é conhecido"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome Completo</label>
                    <Input
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Telefone</label>
                    <Input
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data de Aniversário</label>
                    <Input
                      type="date"
                      value={editFormData.birthDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Região</label>
                  <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-region">Sem região</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Igreja</label>
                  <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar igreja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-church">Sem igreja</SelectItem>
                      {churches.map(church => {
                        const currentPastor = getChurchPastor(church.id)
                        const isCurrentPastor = currentPastor === editingPastor?.displayName
                        return (
                          <SelectItem key={church.id} value={church.id}>
                            <div>
                              <div>{church.name}</div>
                              {currentPastor && !isCurrentPastor && (
                                <div className="text-xs text-muted-foreground">
                                  ⚠️ Já possui pastor: {currentPastor}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={saving}
                    onClick={() => editingPastor && updatePastorData(editingPastor.id, selectedChurchId, selectedRegionId)}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Pastores List */}
          <Card className="p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                          <div className="h-8 w-20 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPastores.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">
                    {searchTerm || filterRole !== "all" ? "Nenhum pastor encontrado" : "Nenhum pastor cadastrado"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterRole !== "all" 
                      ? "Tente ajustar os filtros de busca" 
                      : "Comece enviando convites para pastores"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPastores.map((pastor) => (
                    <div key={pastor.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getRoleColor(pastor.role)}`}>
                          {getRoleIcon(pastor.role)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{pastor.displayName}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(pastor.role)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pastor.email}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Cadastrado em {new Date(pastor.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Church className="h-3 w-3" />
                              {getChurchName(pastor.churchId)}
                            </div>
                            {getRegionName(pastor.regionId) && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {getRegionName(pastor.regionId)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPastor(pastor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePastor(pastor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
