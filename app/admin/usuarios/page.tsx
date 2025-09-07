"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import AdminNav from "@/components/admin-nav"
import { getUserRoles, formatRolesDisplay, getRoleColor, getRoleDisplayName, hasAnyRole, hasRole } from "@/lib/role-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Search, UserPlus, Edit, Trash2, Mail } from "lucide-react"

interface User {
  id: string
  email: string
  displayName?: string
  roles?: string[]
  role?: string
  regionId?: string
  churchId?: string
  createdAt: number
}

export default function UsuariosPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    loadUsers()
  }, [user, profile])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  async function loadUsers() {
    try {
      const { db } = getFirebase()
      let usersQuery
      
      // Filtros baseados no papel do usuário
      if ((hasRole(profile as any, "pastor_regional") || hasRole(profile as any, "pastor_local")) && profile?.regionId) {
        // Pastor regional e local veem apenas usuários da sua região
        usersQuery = query(
          collection(db, "users"),
          where("regionId", "==", profile.regionId)
        )
      } else {
        // Admin, pastor_conselho e secretaria veem todos
        usersQuery = collection(db, "users")
      }
      
      const snapshot = await getDocs(usersQuery)
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      
      setUsers(usersData.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterUsers() {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  async function updateUserRoles(userId: string, newRoles: string[]) {
    setSaving(true)
    try {
      const response = await fetch('/api/update-user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId, roles: newRoles })
      })

      if (!response.ok) {
        throw new Error('Failed to update user roles')
      }

      await loadUsers()
      setEditingUser(null)
      setSelectedRoles([])
    } catch (error) {
      console.error("Erro ao atualizar roles do usuário:", error)
      alert("Erro ao atualizar roles do usuário")
    } finally {
      setSaving(false)
    }
  }

  function openEditRoles(user: User) {
    setEditingUser(user)
    setSelectedRoles(getUserRoles(user as any))
  }

  async function deleteUser(userId: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return
    
    try {
      // Use the API endpoint to delete both Authentication and Firestore records
      const response = await fetch(`/api/delete-user?uid=${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir usuário')
      }
      
      await loadUsers()
      alert("Usuário excluído com sucesso!")
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error)
      alert(error.message || "Erro ao excluir usuário")
    }
  }

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "pastor_regional" && profile.role !== "pastor_local")) {
    return (
      <>
        <AdminNav currentPage="/admin/usuarios" />
        <main className="lg:ml-80 pt-14 min-h-screen grid place-items-center">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">Acesso Restrito</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para gerenciar usuários.</p>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/usuarios" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
              <p className="text-muted-foreground">
                Gerencie usuários do sistema ({users.length} total)
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/convites">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pastor_conselho">Pastor do Conselho</SelectItem>
                  <SelectItem value="pastor_regional">Pastor Regional</SelectItem>
                  <SelectItem value="pastor_local">Pastor Local</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">Carregando usuários...</p>
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">
                  {searchTerm || roleFilter !== "all" 
                    ? "Nenhum usuário encontrado com os filtros aplicados" 
                    : "Nenhum usuário cadastrado"
                  }
                </p>
              </Card>
            ) : (
              filteredUsers.map((userData) => (
                <Card key={userData.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {userData.displayName || "Nome não informado"}
                        </h3>
                        <div className="flex gap-1 flex-wrap">
                          {getUserRoles(userData as any).map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <Mail className="inline h-3 w-3 mr-1" />
                        {userData.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em: {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    {profile.role === "admin" && (
                      <div className="flex items-center gap-2">
                        <Dialog open={editingUser?.id === userData.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingUser(null)
                            setSelectedRoles([])
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditRoles(userData)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar Roles
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Roles - {userData.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <Label>Funções (selecione uma ou mais)</Label>
                                <div className="grid grid-cols-1 gap-3">
                                  {(!user || !profile || !hasAnyRole(profile as any, ["admin", "pastor_conselho", "pastor_local"])) ? ["admin", "pastor_conselho", "pastor_regional", "pastor_local"].map((roleOption) => (
                                    <div key={roleOption} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={roleOption}
                                        checked={selectedRoles.includes(roleOption)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRoles([...selectedRoles, roleOption])
                                          } else {
                                            setSelectedRoles(selectedRoles.filter(r => r !== roleOption))
                                          }
                                        }}
                                      />
                                      <Label htmlFor={roleOption} className="text-sm font-normal cursor-pointer">
                                        {getRoleDisplayName(roleOption as any)}
                                      </Label>
                                    </div>
                                  )) : ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"].map((roleOption) => (
                                    <div key={roleOption} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={roleOption}
                                        checked={selectedRoles.includes(roleOption)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRoles([...selectedRoles, roleOption])
                                          } else {
                                            setSelectedRoles(selectedRoles.filter(r => r !== roleOption))
                                          }
                                        }}
                                      />
                                      <Label htmlFor={roleOption} className="text-sm font-normal cursor-pointer">
                                        {getRoleDisplayName(roleOption as any)}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                                {selectedRoles.length > 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    Selecionado: {selectedRoles.map(role => getRoleDisplayName(role as any)).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingUser(null)
                                    setSelectedRoles([])
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  disabled={selectedRoles.length === 0 || saving}
                                  onClick={() => editingUser && updateUserRoles(editingUser.id, selectedRoles)}
                                >
                                  {saving ? "Salvando..." : "Salvar"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteUser(userData.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
