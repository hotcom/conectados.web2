"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { signOut } from "firebase/auth"

export default function TopNav() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const router = useRouter()

  const isActive = (href: string) =>
    pathname === href ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href={user ? "/mapa" : "/"} className="font-semibold">
          Conectados.co
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link className={isActive("/mapa")} href="/mapa">
                Mapa
              </Link>
              <Link className={isActive("/chat")} href="/chat">
                Chat
              </Link>
              {profile?.role === "admin" ? (
                <Link className={isActive("/admin/convites")} href="/admin/convites">
                  Admin
                </Link>
              ) : (
                <Link className={isActive("/admin/bootstrap")} href="/admin/bootstrap">
                  Bootstrap admin
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!user && (
            <Button size="sm" onClick={() => router.push("/login")}>
              Entrar
            </Button>
          )}
          {user && (
            <>
              <span className="hidden sm:block text-sm text-muted-foreground">
                {profile?.displayName || user.email}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const { auth } = getFirebase()
                  await signOut(auth)
                  router.push("/login")
                }}
              >
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
