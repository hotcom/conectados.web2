"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getUserRoles, hasRole } from "@/lib/role-utils"
import { getRegionName } from "@/lib/region-utils"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import AdminNav from "@/components/admin-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Search, Church, Plus, MapPin, Edit, Trash2, Users, Crown, UserPlus, X } from "lucide-react"

interface Church {
  id: string
  name: string
  address: string
  kind: string
  location: { lat: number; lng: number }
  regionId?: string
  churchId?: string
  ownerUid: string
  createdAt: number
}

export default function IgrejasPage() {
  const { user, profile } = useAuth()
  const [churches, setChurches] = useState<Church[]>([])
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([])
  const [pastors, setPastors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [kindFilter, setKindFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)
  const [isPastorDialogOpen, setIsPastorDialogOpen] = useState(false)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [availablePastors, setAvailablePastors] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    kind: "igreja"
  })
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, formatted: string} | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    loadChurches()
    loadPastors()
  }, [user, profile])

  useEffect(() => {
    filterChurches()
  }, [churches, searchTerm, kindFilter])

  async function loadChurches() {
    try {
      const { db } = getFirebase()
      let churchesQuery
      
      const userRoles = getUserRoles(profile as any)
      const isRegionalPastor = hasRole(profile as any, "pastor_regional")
      const regionId = profile?.regionId
      
      // Filtros baseados no papel do usuário
      if (isRegionalPastor && regionId) {
        // Pastor regional vê todas as igrejas da sua região
        churchesQuery = query(
          collection(db, "places"),
          where("regionId", "==", regionId)
        )
      } else if ((hasRole(profile as any, "pastor_local") || hasRole(profile as any, "secretaria")) && regionId) {
        // Pastor local e secretaria veem toda a região mas só gerenciam sua igreja
        churchesQuery = query(
          collection(db, "places"),
          where("regionId", "==", regionId)
        )
      } else if (isRegionalPastor && !regionId) {
        // Se pastor regional não tem regionId, vê todas as igrejas (fallback)
        churchesQuery = collection(db, "places")
      } else {
        // Admin, pastor_conselho e secretaria veem todas
        churchesQuery = collection(db, "places")
      }
      
      const snapshot = await getDocs(churchesQuery)
      const churchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Church[]
      
      setChurches(churchesData.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error("Erro ao carregar igrejas:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPastors() {
    try {
      const { db } = getFirebase()
      const pastorsQuery = query(
        collection(db, "users"),
        where("role", "in", ["pastor_conselho", "pastor_regional", "pastor_local", "secretaria"])
      )
      const snapshot = await getDocs(pastorsQuery)
      const pastorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPastors(pastorsData)
      
      // Pastores disponíveis para vincular (sem igreja ou com múltiplas igrejas permitidas)
      setAvailablePastors(pastorsData)
    } catch (error) {
      console.error("Erro ao carregar pastores:", error)
    }
  }

  function getChurchPastors(churchId: string) {
    return pastors.filter(pastor => pastor.churchId === churchId)
  }

  function getRoleLabel(role: string) {
    const labels = {
      pastor_conselho: "Conselho",
      pastor_regional: "Regional", 
      pastor_local: "Local",
      secretaria: "Secretaria"
    }
    return labels[role as keyof typeof labels] || role
  }

  function filterChurches() {
    let filtered = churches

    if (searchTerm) {
      filtered = filtered.filter(church => 
        church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        church.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (kindFilter !== "all") {
      filtered = filtered.filter(church => church.kind === kindFilter)
    }

    setFilteredChurches(filtered)
  }

  async function geocode(address: string) {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}&country=br`)
    if (!res.ok) throw new Error("Falha no geocoder")
    const list = await res.json()
    if (!list.length) throw new Error("Endereço não encontrado")
    return { lat: Number(list[0].lat), lng: Number(list[0].lon), formatted: list[0].display_name as string }
  }

  async function saveChurch() {
    if (!user || !formData.name) return
    
    setSaving(true)
    try {
      const { db } = getFirebase()
      
      // Use selectedLocation if available, otherwise geocode the address
      let location, address
      if (selectedLocation) {
        location = { lat: selectedLocation.lat, lng: selectedLocation.lng }
        address = selectedLocation.formatted
      } else if (formData.address) {
        const geocoded = await geocode(formData.address)
        location = { lat: geocoded.lat, lng: geocoded.lng }
        address = geocoded.formatted
      } else {
        throw new Error("Endereço é obrigatório")
      }
      
      const churchData = {
        name: formData.name,
        address,
        kind: "igreja", // Força o kind como igreja
        type: formData.kind, // Salva o tipo original no campo type
        location,
        regionId: profile?.regionId || null,
        churchId: null,
        ownerUid: user.uid,
        createdAt: editingChurch ? editingChurch.createdAt : Date.now()
      }

      if (editingChurch) {
        await updateDoc(doc(db, "places", editingChurch.id), churchData)
      } else {
        await addDoc(collection(db, "places"), churchData)
      }

      await loadChurches()
      setIsDialogOpen(false)
      setEditingChurch(null)
      setFormData({ name: "", address: "", kind: "igreja" })
      setSelectedLocation(null)
    } catch (error: any) {
      alert(error?.message || "Erro ao salvar igreja")
    } finally {
      setSaving(false)
    }
  }

  async function deleteChurch(churchId: string) {
    if (!confirm("Tem certeza que deseja excluir esta igreja?")) return
    
    try {
      const { db } = getFirebase()
      await deleteDoc(doc(db, "places", churchId))
      await loadChurches()
    } catch (error) {
      console.error("Erro ao excluir igreja:", error)
      alert("Erro ao excluir igreja")
    }
  }

  function openEditDialog(church: Church) {
    setEditingChurch(church)
    setFormData({
      name: church.name,
      address: church.address,
      kind: church.kind
    })
    setSelectedLocation({
      lat: church.location.lat,
      lng: church.location.lng,
      formatted: church.address
    })
    setIsDialogOpen(true)
  }

  function openNewDialog() {
    setEditingChurch(null)
    setFormData({ name: "", address: "", kind: "igreja" })
    setSelectedLocation(null)
    setIsDialogOpen(true)
  }

  function openPastorDialog(church: Church) {
    setSelectedChurch(church)
    setIsPastorDialogOpen(true)
  }

  async function addPastorToChurch(pastorId: string) {
    if (!selectedChurch) return
    
    try {
      const { db } = getFirebase()
      
      // Atualizar o pastor para incluir esta igreja
      await updateDoc(doc(db, "users", pastorId), {
        churchId: selectedChurch.id,
        updatedAt: Date.now()
      })
      
      // Recarregar dados
      await loadPastors()
      
      // Notificar outras páginas sobre a mudança
      window.dispatchEvent(new CustomEvent('pastorChurchUpdated', { 
        detail: { pastorId, churchId: selectedChurch.id } 
      }))
      
      setIsPastorDialogOpen(false)
      setSelectedChurch(null)
    } catch (error) {
      console.error("Erro ao vincular pastor:", error)
      alert("Erro ao vincular pastor à igreja")
    }
  }

  async function removePastorFromChurch(pastorId: string) {
    if (!confirm("Tem certeza que deseja desvincular este pastor?")) return
    
    try {
      const { db } = getFirebase()
      
      // Remover a vinculação do pastor
      await updateDoc(doc(db, "users", pastorId), {
        churchId: null,
        updatedAt: Date.now()
      })
      
      // Recarregar dados
      await loadPastors()
    } catch (error) {
      console.error("Erro ao desvincular pastor:", error)
      alert("Erro ao desvincular pastor da igreja")
    }
  }

  function getAvailablePastorsForChurch(churchId: string) {
    return availablePastors.filter(pastor => 
      !pastor.churchId || pastor.churchId !== churchId
    )
  }

  const userRoles = getUserRoles(profile as any)
  const hasAdminAccess = hasRole(profile as any, "admin") || 
                        hasRole(profile as any, "pastor_regional") || 
                        hasRole(profile as any, "pastor_local") || 
                        hasRole(profile as any, "pastor_conselho") || 
                        hasRole(profile as any, "secretaria")

  if (!user || !profile || !hasAdminAccess) {
    return (
      <>
        <AdminNav currentPage="/admin/igrejas" />
        <main className="lg:ml-80 pt-14 min-h-screen grid place-items-center">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">Acesso Restrito</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para gerenciar igrejas.</p>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/igrejas" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {hasRole(profile as any, "pastor_regional") ? "Igrejas da Região" : "Gestão de Igrejas"}
              </h1>
              <p className="text-muted-foreground">
                {hasRole(profile as any, "pastor_regional") 
                  ? `Igrejas da sua região ${profile?.regionId ? getRegionName(profile.regionId) : ""} (${churches.length} total)`
                  : `Gerencie igrejas do sistema (${churches.length} total)`
                }
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Igreja
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingChurch ? "Editar Igreja" : "Nova Igreja"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Igreja</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Igreja Central"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <AddressAutocomplete
                      value={formData.address}
                      onChange={(value) => setFormData({...formData, address: value})}
                      onSelect={(location) => {
                        setSelectedLocation({
                          lat: location.lat,
                          lng: location.lng,
                          formatted: location.label
                        })
                        setFormData({...formData, address: location.label})
                      }}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.kind} onValueChange={(value) => setFormData({...formData, kind: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="igreja">Igreja</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="nucleo">Núcleo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={saveChurch} 
                    disabled={saving || !formData.name || (!selectedLocation && !formData.address)}
                    className="w-full"
                  >
                    {saving ? "Salvando..." : editingChurch ? "Atualizar" : "Criar Igreja"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Pastor Assignment Dialog */}
            <Dialog open={isPastorDialogOpen} onOpenChange={setIsPastorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Pastor à Igreja</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione um pastor para vincular à igreja <strong>{selectedChurch?.name}</strong>
                  </p>
                  
                  {selectedChurch && (() => {
                    const availablePastorsForChurch = getAvailablePastorsForChurch(selectedChurch.id)
                    return availablePastorsForChurch.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {availablePastorsForChurch.map((pastor: any) => (
                          <div key={pastor.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <div className="font-medium">{pastor.displayName}</div>
                              <div className="text-sm text-muted-foreground">{pastor.email}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {getRoleLabel(pastor.role)}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addPastorToChurch(pastor.id)}
                            >
                              Vincular
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Todos os pastores já estão vinculados a esta igreja ou não há pastores disponíveis.
                      </p>
                    )
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="igreja">Igreja</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="nucleo">Núcleo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Churches List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Carregando igrejas...</p>
              </Card>
            ) : filteredChurches.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">
                  {searchTerm || kindFilter !== "all" 
                    ? "Nenhuma igreja encontrada com os filtros aplicados" 
                    : "Nenhuma igreja cadastrada"
                  }
                </p>
              </Card>
            ) : (
              filteredChurches.map((church) => (
                <Card key={church.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Church className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{church.name}</h3>
                        <Badge variant="secondary">{church.kind}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {church.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coordenadas: {church.location.lat.toFixed(6)}, {church.location.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrada em: {new Date(church.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      
                      {/* Pastor Information */}
                      {(() => {
                        const churchPastors = getChurchPastors(church.id)
                        return (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Pastores ({churchPastors.length})</span>
                            </div>
                            {churchPastors.length > 0 ? (
                              <div className="space-y-1">
                                {churchPastors.map((pastor: any) => (
                                  <div key={pastor.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                                    <div className="flex items-center gap-2">
                                      <Crown className="h-3 w-3 text-amber-500" />
                                      <span>{pastor.displayName}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {getRoleLabel(pastor.role)}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePastorFromChurch(pastor.id)}
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Nenhum pastor vinculado</span>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPastorDialog(church)}
                        title="Gerenciar Pastores"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(church)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {(profile.role === "admin" || church.ownerUid === user.uid) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteChurch(church.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
