"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import AdminNav from "@/components/admin-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MapPin } from "lucide-react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase-client"
import { Region } from "@/shared/types/region"
import { hasRole } from "@/lib/role-utils"
import { UserDoc } from "@/shared/types/user"

export default function RegioesPage() {
  const { user, profile } = useAuth()
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    if (user && profile) {
      loadRegions()
    }
  }, [user, profile])

  const loadRegions = async () => {
    try {
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "regions"))
      const regionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Region[]
      
      setRegions(regionsData.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error("Erro ao carregar regiões:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    try {
      const { db } = getFirebase()
      
      if (editingRegion) {
        // Atualizar região existente
        await updateDoc(doc(db, "regions", editingRegion.id), {
          name: formData.name.trim(),
          description: formData.description.trim(),
          updatedAt: Date.now()
        })
      } else {
        // Criar nova região
        await addDoc(collection(db, "regions"), {
          name: formData.name.trim(),
          description: formData.description.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user.uid,
          isActive: true
        })
      }

      setFormData({ name: "", description: "" })
      setEditingRegion(null)
      setIsModalOpen(false)
      loadRegions()
    } catch (error) {
      console.error("Erro ao salvar região:", error)
    }
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setFormData({
      name: region.name,
      description: region.description || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (regionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta região?")) return

    try {
      const { db } = getFirebase()
      await deleteDoc(doc(db, "regions", regionId))
      loadRegions()
    } catch (error) {
      console.error("Erro ao excluir região:", error)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setEditingRegion(null)
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

  if (!profile || (profile.role !== "admin" && profile.role !== "pastor_conselho" && profile.role !== "secretaria")) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para gerenciar regiões.</p>
        </Card>
      </main>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/regioes" />
      
      <main className="lg:ml-80 pt-14 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Regiões</h1>
              <p className="text-muted-foreground">Gerencie as regiões para organização dos pastores regionais</p>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Região
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRegion ? "Editar Região" : "Nova Região"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Região</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Região Norte, Baixada Santista..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da região..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingRegion ? "Atualizar" : "Criar"} Região
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regions.length === 0 ? (
            <Card className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma região cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando regiões para organizar os pastores regionais
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Região
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map(region => (
                <Card key={region.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{region.name}</CardTitle>
                        {region.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {region.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={region.isActive ? "default" : "secondary"}>
                        {region.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(region)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(region.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
