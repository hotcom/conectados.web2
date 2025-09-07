"use client"

import { useState } from "react"
import { getFirebase } from "@/lib/firebase-client"
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<"password" | "magic">("password") // padrão: email/senha
  const router = useRouter()
  const params = useSearchParams()
  const inviteId = params.get("inviteId") || ""

  const actionUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = new URL(`${origin}/auth/action`)
    if (inviteId) url.searchParams.set("inviteId", inviteId)
    return url.toString()
  }

  async function handleSendMagic() {
    setSending(true)
    try {
      const { auth } = getFirebase()
      await setPersistence(auth, browserLocalPersistence)
      window.localStorage.setItem("pendingEmail", email)
      await sendSignInLinkToEmail(auth, email, { url: actionUrl(), handleCodeInApp: true })
      alert("Enviamos um link de acesso para o seu e-mail.")
    } catch (e: any) {
      const code = String(e?.code || "")
      if (code.includes("auth/unauthorized-continue-uri")) {
        const host = typeof window !== "undefined" ? window.location.host : "(desconhecido)"
        alert(
          `Domínio não allowlistado no Firebase. Adicione ${host} em Authentication > Settings > Authorized domains.`,
        )
      } else if (code.includes("auth/quota-exceeded")) {
        alert("Cota diária de e-mails excedida. Use 'E-mail e senha' ou 'Entrar com Google'.")
        setMode("password")
      } else if (code.includes("auth/configuration-not-found")) {
        alert("Ative 'Email link (passwordless)' no Firebase ou use e-mail e senha.")
        setMode("password")
      } else {
        alert(e?.message || "Falha ao enviar link")
      }
    } finally {
      setSending(false)
    }
  }

  async function tryCompleteIfAlready() {
    const { auth } = getFirebase()
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = window.localStorage.getItem("pendingEmail")
      const mail = stored || window.prompt("Confirme seu e-mail")
      if (!mail) return
      await signInWithEmailLink(auth, mail, window.location.href)
      window.localStorage.removeItem("pendingEmail")
      router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
    }
  }

  async function loginWithGoogle() {
    try {
      const { auth } = getFirebase()
      await setPersistence(auth, browserLocalPersistence)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
    } catch (e: any) {
      alert(e?.message || "Falha no Google Sign-In")
    }
  }

  async function signupWithPassword() {
    try {
      const { auth } = getFirebase()
      await setPersistence(auth, browserLocalPersistence)
      await createUserWithEmailAndPassword(auth, email, password)
      router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
    } catch (e: any) {
      if (String(e?.code).includes("auth/email-already-in-use")) {
        await loginWithPassword()
        return
      }
      if (String(e?.code).includes("auth/operation-not-allowed")) {
        alert("Habilite 'Email/Password' em Authentication > Sign-in method no Firebase.")
        return
      }
      alert(e?.message || "Falha ao criar conta")
    }
  }

  async function loginWithPassword() {
    try {
      const { auth } = getFirebase()
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      
      // Verificar se usuário já tem perfil completo
      const { db } = getFirebase()
      const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        // Verificar se precisa completar perfil ou cadastrar igreja
        const needsProfileCompletion = !userData.displayName || 
          (userData.roles && userData.roles.includes('pastor_local') && !userData.churchId) ||
          (userData.roles && userData.roles.includes('pastor_regional') && !userData.churchId)
        
        if (needsProfileCompletion) {
          // Usuário precisa completar perfil ou cadastrar igreja
          router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
        } else {
          // Usuário já tem perfil completo, ir direto para dashboard
          router.replace("/admin/dashboard")
        }
      } else {
        // Usuário precisa completar perfil
        router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
      }
    } catch (e: any) {
      console.error("Erro de login:", e)
      const errorCode = String(e?.code || "")
      
      if (errorCode.includes("auth/user-not-found")) {
        alert("Usuário não encontrado. Verifique o e-mail ou entre em contato com o administrador.")
        return
      }
      
      if (errorCode.includes("auth/wrong-password") || errorCode.includes("auth/invalid-credential")) {
        alert("Senha incorreta. Verifique suas credenciais.")
        return
      }
      
      if (errorCode.includes("auth/invalid-email")) {
        alert("Formato de e-mail inválido.")
        return
      }
      
      if (errorCode.includes("auth/user-disabled")) {
        alert("Esta conta foi desabilitada. Entre em contato com o administrador.")
        return
      }
      
      if (errorCode.includes("auth/too-many-requests")) {
        alert("Muitas tentativas de login. Tente novamente mais tarde.")
        return
      }
      
      // Erro genérico com mais detalhes
      alert(`Erro ao fazer login: ${e?.message || "Credenciais inválidas"}`)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 p-4">
      <Card className="p-8 w-[min(92vw,520px)] space-y-6 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Conectados.co</h1>
          <p className="text-muted-foreground">Faça login para acessar o sistema</p>
        </div>

        {/* Métodos de Autenticação */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={mode === "password" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setMode("password")}
              className="w-full"
            >
              📧 E-mail e senha
            </Button>
            <Button 
              variant={mode === "magic" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setMode("magic")}
              className="w-full"
            >
              🔗 Link mágico
            </Button>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={loginWithGoogle}
            className="w-full"
          >
            🔍 Entrar com Google
          </Button>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email"
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          {mode === "password" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  disabled={!email || !password} 
                  onClick={loginWithPassword}
                  className="w-full"
                >
                  🚪 Entrar com senha
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Não tem conta? Entre em contato com um administrador para receber um convite.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Button 
                  disabled={!email || sending} 
                  onClick={handleSendMagic}
                  className="w-full"
                >
                  {sending ? "📤 Enviando..." : "📧 Enviar link de acesso"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={tryCompleteIfAlready}
                  className="w-full"
                >
                  ✅ Já cliquei no link
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">💡 Como funciona o link mágico:</p>
                <p>1. Digite seu email e clique em "Enviar link"</p>
                <p>2. Verifique sua caixa de entrada</p>
                <p>3. Clique no link recebido para entrar</p>
              </div>
            </>
          )}
        </div>

        {/* Informações do Sistema */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Sistema por convite:</span> Apenas usuários convidados podem acessar
          </p>
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Domínios permitidos:</span> @boladeneve.com, @teste.com
          </p>
        </div>
      </Card>
    </main>
  )
}
