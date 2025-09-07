"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import LoginRequired from "@/components/login-required"

export default function BootstrapAdminPage() {
  const { user, profile } = useAuth()
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  const [displayName, setDisplayName] = useState(profile?.displayName || "")
  const [promoting, setPromoting] = useState(false)

  useEffect(() => {
    async function check() {
      const { db } = getFirebase()
      const q = query(collection(db, "users"), where("role", "==", "admin"), limit(1))
      const snap = await getDocs(q)
      setHasAdmin(!snap.empty)
    }
    check()
  }, [])

  async function promote() {
    if (!user) return alert("Faça login primeiro")
    setPromoting(true)
    try {
      const { db } = getFirebase()
      const ref = doc(db, "users", user.uid)
      // cria/atualiza perfil com role admin
      await setDoc(
        ref,
        {
          uid: user.uid,
          email: user.email || "",
          displayName: displayName || user.email || "Admin",
          role: "admin",
          createdAt: Date.now(),
        },
        { merge: true },
      )
      alert("Usuário promovido a admin. Você já pode enviar convites.")
      setHasAdmin(true)
    } catch (e: any) {
      alert(e?.message || "Falha ao promover")
    } finally {
      setPromoting(false)
    }
  }

  if (!user) {
    return <LoginRequired message="Faça login para promover sua conta a administrador." />
  }

  return (
    <main className="min-h-dvh grid place-items-center">
      <Card className="p-6 w-[min(92vw,560px)] space-y-4">
        <h1 className="text-xl font-semibold">Bootstrap de Admin</h1>
        {hasAdmin === null ? (
          <p>Verificando admins existentes...</p>
        ) : hasAdmin && profile?.role !== "admin" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Já existe um admin configurado. Peça a ele para enviar um convite para você.
            </p>
          </div>
        ) : profile?.role === "admin" ? (
          <div className="space-y-2">
            <p className="text-sm">Você já é admin.</p>
            <p className="text-sm">
              Vá para <span className="font-medium">Admin → Convites</span> para convidar usuários.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Não encontramos nenhum admin cadastrado. Você pode promover a sua conta atual a admin.
            </p>
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
            </div>
            <Button onClick={promote} disabled={promoting}>
              {promoting ? "Promovendo..." : "Tornar-me Admin"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Após a promoção, acesse Admin → Convites para convidar pastores e líderes.
            </p>
          </>
        )}
      </Card>
    </main>
  )
}
