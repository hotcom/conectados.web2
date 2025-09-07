"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs } from "firebase/firestore"
import type { Role } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import LoginRequired from "@/components/login-required"
import AdminNav from "@/components/admin-nav"
import { getInvitableRoles, getRoleDisplayName, hasRole } from "@/lib/role-utils"

const ROLES: Role[] = ["pastor_conselho", "pastor_regional", "pastor_local", "secretaria"]

export default function ConvitesPage() {
  const { user, profile } = useAuth()
  const [email, setEmail] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])
  const [selectedRegion, setSelectedRegion] = useState("")
  const [sending, setSending] = useState(false)
  const [regions, setRegions] = useState<any[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  
  const invitableRoles = profile ? getInvitableRoles(profile as any) : []

  useEffect(() => {
    if (user && profile) {
      loadRegions()
    }
  }, [user, profile])

  const loadRegions = async () => {
    try {
      setLoadingRegions(true)
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "regions"))
      const regionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setRegions(regionsData.filter((region: any) => region.isActive !== false).sort((a: any, b: any) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error("Erro ao carregar regiões:", error)
    } finally {
      setLoadingRegions(false)
    }
  }

  if (!user) return <main className="min-h-dvh grid place-items-center">Faça login</main>
  if (!profile) {
    return <LoginRequired message="Carregando seu perfil. Se necessário, faça login novamente." />
  }
  if (profile.role !== "admin" && profile.role !== "pastor_conselho" && profile.role !== "pastor_regional" && profile.role !== "pastor_local" && profile.role !== "secretaria") {
    return (
      <>
        <AdminNav currentPage="/admin/convites" />
        <main className="lg:ml-80 pt-14 min-h-screen grid place-items-center">
          <Card className="p-6 w-[min(92vw,680px)] space-y-3">
            <h1 className="text-xl font-semibold">Acesso restrito</h1>
            <p className="text-sm text-muted-foreground">Apenas administradores, pastores do conselho e pastores regionais podem enviar convites.</p>
            <a className="underline" href="/admin/bootstrap">
              Promover minha conta a admin
            </a>
          </Card>
        </main>
      </>
    )
  }

  async function invite() {
    if (!email || selectedRoles.length === 0) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }

    setSending(true)
    try {
      // Herança automática de região para convites hierárquicos
      let inheritedRegionId = selectedRegion
      
      // Se quem convida é pastor_regional, o convidado herda a região
      if (hasRole(profile as any, "pastor_regional") && profile?.regionId) {
        inheritedRegionId = profile.regionId
      }
      
      // Se quem convida é pastor_local, o convidado herda a região
      if (hasRole(profile as any, "pastor_local") && profile?.regionId) {
        inheritedRegionId = profile.regionId
      }

      console.log('Sending invite with data:', {
        email,
        roles: selectedRoles,
        role: selectedRoles[0],
        createdBy: user!.uid,
        regionId: inheritedRegionId || selectedRegion
      })

      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: '123456',
          roles: selectedRoles,
          role: selectedRoles[0], // backward compatibility
          createdBy: user!.uid,
          regionId: inheritedRegionId || selectedRegion
        })
      })

      const result = await response.json()
      
      if (result.success) {
        const regionText = selectedRegion ? `\nRegião: ${regions.find(r => r.id === selectedRegion)?.name}` : ''
        alert(`Usuário criado com sucesso!\nEmail: ${email}\nRoles: ${selectedRoles.map(getRoleDisplayName).join(', ')}${regionText}\nSenha temporária: 123456\n\nO usuário pode fazer login e completar o perfil.`)
        setEmail("")
        setSelectedRoles([])
        setSelectedRegion("")
      } else {
        alert(result.error || "Erro ao criar usuário")
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      alert("Erro ao criar usuário")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <AdminNav currentPage="/admin/convites" />
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6">
          <Card className="p-6 w-full max-w-2xl mx-auto space-y-4">
            <h1 className="text-xl font-semibold">Convidar por e-mail</h1>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email do convidado</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="convidado@exemplo.com" />
              </div>
              
              <div className="space-y-3">
                <Label>Funções (selecione uma ou mais)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {invitableRoles.map((roleOption) => (
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
                        {getRoleDisplayName(roleOption)}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selecionado: {selectedRoles.map(getRoleDisplayName).join(', ')}
                  </div>
                )}
              </div>

              {selectedRoles.includes("pastor_regional") && (
                <div className="space-y-2">
                  <Label>Região (obrigatório para Pastor Regional)</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingRegions ? (
                        <SelectItem value="loading" disabled>
                          Carregando regiões...
                        </SelectItem>
                      ) : regions.length === 0 ? (
                        <SelectItem value="no-regions" disabled>
                          Nenhuma região cadastrada
                        </SelectItem>
                      ) : (
                        regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button disabled={!email || selectedRoles.length === 0 || sending || (selectedRoles.includes("pastor_regional") && !selectedRegion)} onClick={invite}>
              {sending ? "Criando usuário..." : "Criar usuário"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Será criado um usuário Firebase com senha temporária "123456". O usuário poderá fazer login e completar o perfil no dashboard.
            </p>
          </Card>
        </div>
      </main>
    </>
  )
}
