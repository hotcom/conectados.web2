"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "../lib/firebase"
import { api } from "../lib/api"
import type { User } from "../../../shared/types/user"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Verificar domínio e buscar dados do usuário
          const token = await firebaseUser.getIdToken()
          const response = await api.verifyDomain(token)

          if (response.data.success) {
            // Buscar dados completos do usuário
            await refreshUserData()
          } else {
            // Email não é de domínio autorizado
            await firebaseSignOut(auth)
            setUser(null)
          }
        } catch (error) {
          console.error("Auth error:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const refreshUserData = async () => {
    if (!firebaseUser) return

    try {
      // Buscar dados do usuário do backend
      const response = await api.getUsers({ email: firebaseUser.email })

      if (response.data.success && response.data.data.length > 0) {
        setUser(response.data.data[0])
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    // Validação básica de domínio no frontend
    const allowedDomains = ["boladeneve.com", "teste.com"]
    const emailDomain = email.split("@")[1]

    if (!allowedDomains.includes(emailDomain)) {
      throw new Error(`Email deve ser de um domínio autorizado: ${allowedDomains.join(", ")}`)
    }

    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setFirebaseUser(null)
  }

  const refreshUser = async () => {
    await refreshUserData()
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
