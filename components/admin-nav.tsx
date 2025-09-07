"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  BarChart3, 
  Users, 
  Church, 
  UserPlus, 
  MapIcon, 
  MessageCircle, 
  Settings, 
  Wrench, 
  Bug, 
  Menu, 
  X, 
  LogOut,
  FileText,
  MapPin,
  User,
  ChevronDown,
  Home,
  Map,
  Mail,
  Shield
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { getFirebase } from "@/lib/firebase-client"
import { doc, updateDoc } from "firebase/firestore"

interface AdminNavProps {
  currentPage?: string
}

export default function AdminNav({ currentPage }: AdminNavProps) {
  const { user, profile, logout } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState({
    displayName: "",
    nickname: "",
    phone: "",
    birthDate: ""
  })

  // Save profile function
  const saveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { db } = getFirebase()
      const userRef = doc(db, "users", user.uid)
      
      await updateDoc(userRef, {
        displayName: editingProfile.displayName,
        nickname: editingProfile.nickname,
        phone: editingProfile.phone,
        birthDate: editingProfile.birthDate
      })
      
      setIsProfileModalOpen(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      alert("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (!user || !profile) return null

  const isAdmin = profile.role === "admin"
  const isPastor = profile.role === "pastor_regional" || profile.role === "pastor_local"

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      description: "Visão geral do sistema",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Mapa",
      href: "/mapa",
      icon: Map,
      description: "Mapa interativo das igrejas",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Chat",
      href: "/chat",
      icon: MessageCircle,
      description: "Sistema de comunicação",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Usuários",
      href: "/admin/usuarios",
      icon: Users,
      description: "Gestão de usuários",
      roles: ["admin"]
    },
    {
      title: "Igrejas",
      href: "/admin/igrejas",
      icon: Church,
      description: "Cadastro de igrejas",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Pastores",
      href: "/admin/pastores",
      icon: UserPlus,
      description: "Gestão de pastores",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Convites",
      href: "/admin/convites",
      icon: Mail,
      description: "Enviar convites por email",
      roles: ["admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]
    },
    {
      title: "Regiões",
      href: "/admin/regioes",
      icon: MapPin,
      description: "Gerenciar regiões",
      roles: ["admin", "pastor_conselho", "secretaria"]
    },
    {
      title: "Relatórios",
      href: "/admin/relatorios",
      icon: BarChart3,
      description: "Estatísticas e relatórios",
      roles: ["admin", "pastor_conselho", "pastor_regional", "secretaria"]
    },
    {
      title: "Configurações",
      href: "/admin/configuracoes",
      icon: Settings,
      description: "Configurações do sistema",
      roles: ["admin"]
    },
    {
      title: "Bootstrap",
      href: "/admin/bootstrap",
      icon: Shield,
      description: "Configuração inicial",
      roles: ["admin"]
    },
    {
      title: "Debug",
      href: "/admin/debug",
      icon: Bug,
      description: "Ferramentas de debug",
      roles: ["admin"]
    }
  ]

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(profile.role || "")
  )

  const handleLogout = async () => {
    try {
      await logout()
      // Force redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      // Even if logout fails, redirect to home
      window.location.href = "/"
    }
  }

  const openProfileModal = () => {
    setEditingProfile({
      displayName: profile?.displayName || "",
      nickname: profile?.nickname || "",
      phone: profile?.phone || "",
      birthDate: profile?.birthDate || ""
    })
    setIsProfileModalOpen(true)
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Link href="/admin/dashboard" className="font-semibold text-lg">
              Conectados.co
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Olá,</span>
              <span className="font-medium">{profile.nickname || profile.displayName || user.email}</span>
              <Badge variant="secondary" className="text-xs">
                {profile.role}
              </Badge>
            </div>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-50">
                    <div className="p-1">
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          openProfileModal()
                          setIsUserMenuOpen(false)
                        }}
                      >
                        <User className="h-4 w-4" />
                        Perfil
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          handleLogout()
                          setIsUserMenuOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed left-0 top-14 bottom-0 w-80 bg-background border-r overflow-y-auto">
            <div className="p-4">
              <MobileMenuContent 
                items={filteredItems} 
                currentPage={currentPage}
                onItemClick={() => setIsMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-14 lg:bottom-0 lg:w-80 lg:border-r lg:bg-background lg:block lg:overflow-y-auto">
        <div className="p-4">
          <DesktopMenuContent items={filteredItems} currentPage={currentPage} />
        </div>
      </aside>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido</Label>
              <Input
                id="nickname"
                value={editingProfile.nickname}
                onChange={(e) => setEditingProfile((prev: any) => ({ ...prev, nickname: e.target.value }))}
                placeholder="Como gosta de ser chamado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome completo</Label>
              <Input
                id="displayName"
                value={editingProfile.displayName}
                onChange={(e) => setEditingProfile((prev: any) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editingProfile.phone}
                onChange={(e) => setEditingProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                value={editingProfile.birthDate}
                onChange={(e) => setEditingProfile((prev: any) => ({ ...prev, birthDate: e.target.value }))}
                type="date"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={saveProfile} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsProfileModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MobileMenuContent({ items, currentPage, onItemClick }: {
  items: any[]
  currentPage?: string
  onItemClick: () => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onItemClick}
          className={`block p-3 rounded-lg border transition-colors ${
            currentPage === item.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function DesktopMenuContent({ items, currentPage }: {
  items: any[]
  currentPage?: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-3">Painel Administrativo</h2>
        <div className="grid gap-3">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className={`p-4 transition-colors cursor-pointer ${
                currentPage === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}>
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
