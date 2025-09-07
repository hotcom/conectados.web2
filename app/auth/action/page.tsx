"use client"

import { useEffect } from "react"
import { getFirebase } from "@/lib/firebase-client"
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthActionPage() {
  const router = useRouter()
  const params = useSearchParams()
  const inviteId = params.get("inviteId") || ""

  useEffect(() => {
    async function run() {
      const { auth } = getFirebase()
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const stored = window.localStorage.getItem("pendingEmail")
        const email = stored || window.prompt("Confirme seu e-mail") || ""
        await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem("pendingEmail")
        router.replace(`/complete-profile${inviteId ? `?inviteId=${inviteId}` : ""}`)
      } else {
        router.replace("/login")
      }
    }
    run()
  }, [router, inviteId])

  return <main className="min-h-dvh grid place-items-center">Processando link...</main>
}
