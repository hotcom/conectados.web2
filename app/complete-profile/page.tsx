"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { getFirebase } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from "firebase/firestore"
import type { Invite, Place, Role, UserDoc } from "@/lib/types"
import { getUserRoles, hasRole } from "@/lib/role-utils"

export default function CompleteProfilePage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const inviteId = params.get("inviteId") || ""
  const [invite, setInvite] = useState<Invite | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [nickname, setNickname] = useState("")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [churchName, setChurchName] = useState("")
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; formatted: string } | null>(null)
  
  // New state for conditional questions
  const [isPastorRegional, setIsPastorRegional] = useState(false)
  const [isPastorLocal, setIsPastorLocal] = useState(false)
  const [hasRegionalChurch, setHasRegionalChurch] = useState(false)
  const [hasLocalChurch, setHasLocalChurch] = useState(false)

  useEffect(() => {
    if (!user) return
    async function loadInvite() {
      if (!inviteId) return
      const { db } = getFirebase()
      const snap = await getDoc(doc(db, "invites", inviteId))
      if (snap.exists()) setInvite({ id: snap.id, ...(snap.data() as any) })
    }
    loadInvite()
  }, [user, inviteId])

  async function geocode(q: string) {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&country=br`)
    if (!res.ok) throw new Error("Falha no geocoder")
    const list = await res.json()
    if (!list.length) throw new Error("Endereço não encontrado")
    return { lat: Number(list[0].lat), lng: Number(list[0].lon), formatted: list[0].display_name as string }
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      const { db } = getFirebase()
      
      // Get user roles from profile or invite
      let userRoles: Role[] = []
      if (profile?.roles) {
        userRoles = getUserRoles(profile as any)
      } else if (invite?.role) {
        userRoles = [invite.role]
      } else {
        userRoles = ["admin"]
      }

      // cria/atualiza usuário
      const userDoc: any = {
        uid: user.uid,
        email: user.email || "",
        displayName: displayName || "Administrador",
        nickname: nickname || "",
        fullName: displayName || "",
        phone: phone || "",
        birthDate: birthDate || "",
        roles: userRoles,
        role: userRoles[0], // backward compatibility
        regionId: invite?.regionId || null,
        churchId: null,
        createdAt: Date.now(),
      }
      await setDoc(doc(db, "users", user.uid), userDoc, { merge: true })

      let churchId: string | null = null

      // Check if user needs to register a church based on their responses
      const needsChurch = (hasRole(userDoc as any, "pastor_conselho") && (hasRegionalChurch || hasLocalChurch)) ||
                         (hasRole(userDoc as any, "pastor_regional") && (hasRegionalChurch || hasLocalChurch)) ||
                         (hasRole(userDoc as any, "pastor_local") && hasLocalChurch)

      console.log("Church creation check:", {
        userRoles: userDoc.roles,
        hasRegionalChurch,
        hasLocalChurch,
        needsChurch,
        churchName,
        selectedLocation
      })

      if (needsChurch) {
        if (!churchName || !selectedLocation) throw new Error("Informe nome e endereço da igreja")
        console.log("Creating church with data:", { churchName, selectedLocation })
        
        const payload: Omit<Place, "id"> = {
          kind: "igreja",
          name: churchName,
          address: selectedLocation.formatted,
          location: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          regionId: profile?.regionId || invite?.regionId || null,
          churchId: null,
          ownerUid: user.uid,
          createdAt: Date.now(),
        }
        
        console.log("Church payload:", payload)
        
        const ref = await addDoc(collection(db, "places"), payload as any)
        churchId = ref.id
        
        console.log("Church created with ID:", churchId)
        
        await updateDoc(doc(db, "users", user.uid), { churchId })
        
        console.log("User updated with churchId:", churchId)
      }

      // marca convite como aceito
      if (inviteId) {
        await updateDoc(doc(db, "invites", inviteId), {
          acceptedAt: Date.now(),
          acceptedByUid: user.uid,
        })
      }

      router.replace("/admin/dashboard")
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // Get user roles for conditional rendering
  const userRoles = profile ? getUserRoles(profile as any) : []
  const isConselho = hasRole({ roles: userRoles } as any, "pastor_conselho")
  const isRegional = hasRole({ roles: userRoles } as any, "pastor_regional")
  const isLocal = hasRole({ roles: userRoles } as any, "pastor_local")

  if (!user) return <main className="min-h-dvh grid place-items-center">Faça login</main>

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="p-6 w-full max-w-lg space-y-4">
        <h1 className="text-xl font-semibold">Completar perfil</h1>
        
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Apelido</Label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Como gosta de ser chamado" />
            </div>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome completo" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="(11) 99999-9999"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)} 
                placeholder="dd/mm/aaaa"
                type="date"
              />
            </div>
          </div>
        </div>

        {/* Conditional Questions Based on Roles */}
        {(isRegional || isLocal) && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informações sobre sua função pastoral</h3>
            
            {/* For pastor_regional - ask about regional vs local church */}
            {isRegional && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Como pastor regional, você:</p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasRegionalChurch"
                    checked={hasRegionalChurch}
                    onCheckedChange={(checked) => {
                      setHasRegionalChurch(!!checked)
                      if (checked) setHasLocalChurch(false) // Can't have both
                    }}
                  />
                  <Label htmlFor="hasRegionalChurch" className="text-sm">
                    Está na igreja regional (sede da região)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasLocalChurch"
                    checked={hasLocalChurch}
                    onCheckedChange={(checked) => {
                      setHasLocalChurch(!!checked)
                      if (checked) setHasRegionalChurch(false) // Can't have both
                    }}
                  />
                  <Label htmlFor="hasLocalChurch" className="text-sm">
                    Pastoreia uma igreja local específica
                  </Label>
                </div>
              </div>
            )}

            {/* For pastor_local only (not regional) */}
            {isLocal && !isRegional && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasLocalChurch"
                    checked={hasLocalChurch}
                    onCheckedChange={(checked) => setHasLocalChurch(!!checked)}
                  />
                  <Label htmlFor="hasLocalChurch" className="text-sm">
                    Você pastoreia uma igreja local?
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Church Registration Form */}
        {(hasRegionalChurch || hasLocalChurch) && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-muted-foreground">Dados da Igreja</h3>
            <div className="space-y-2">
              <Label>Nome da igreja</Label>
              <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="Nome da igreja" />
            </div>
            <div className="space-y-2">
              <Label>Endereço da igreja</Label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={(location) => {
                  setSelectedLocation({
                    lat: location.lat,
                    lng: location.lng,
                    formatted: location.label
                  })
                  setAddress(location.label)
                }}
                placeholder="Digite o endereço da igreja"
              />
            </div>
          </div>
        )}

        <Button 
          disabled={!displayName || saving || ((hasRegionalChurch || hasLocalChurch) && (!churchName || !selectedLocation))} 
          onClick={save} 
          className="w-full"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </Card>
    </div>
  )
}
