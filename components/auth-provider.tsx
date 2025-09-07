"use client"

import type React from "react"
import type { User } from "firebase/auth"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { getFirebase } from "@/lib/firebase-client"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { UserDoc } from "@/lib/types"
import { getUserRoles } from "@/lib/role-utils"

type Ctx = {
  user: User | null | undefined
  profile: UserDoc | null | undefined
  logout: () => Promise<void>
}

const AuthCtx = createContext<Ctx>({ 
  user: undefined, 
  profile: undefined, 
  logout: async () => {} 
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [profile, setProfile] = useState<UserDoc | null | undefined>(undefined)

  const logout = async () => {
    const { auth } = getFirebase()
    await signOut(auth)
  }

  useEffect(() => {
    const { auth, db } = getFirebase()
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setProfile(null)
        return
      }
      
      setUser(u)
      
      const ref = doc(db, "users", u.uid)
      const snap = await getDoc(ref)

      if (!snap.exists()) {
        // Provisionamento automático do perfil
        const newProfile: UserDoc = {
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || u.email || "Usuário",
          roles: ["pastor_local"], // papel padrão; pode ser ajustado no bootstrap/admin
          role: "pastor_local", // backward compatibility
          regionId: null,
          churchId: null,
          createdAt: Date.now(),
        }
        await setDoc(ref, newProfile, { merge: true })
        setProfile(newProfile)
      } else {
        setProfile(snap.data() as any)
      }
    })
    return () => unsub()
  }, [])

  const value = useMemo(() => ({ user, profile, logout }), [user, profile])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
