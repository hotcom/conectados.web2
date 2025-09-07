"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { firebaseConfig } from "@/lib/firebase-config"

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebase() {
  if (!app) {
    if (!getApps().length) app = initializeApp(firebaseConfig)
    else app = getApps()[0]!
    auth = getAuth(app)
    db = getFirestore(app)
  }
  return { app: app!, auth: auth!, db: db! }
}
