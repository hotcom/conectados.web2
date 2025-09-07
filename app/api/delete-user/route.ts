import { NextRequest, NextResponse } from "next/server"
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    
    if (!uid) {
      return NextResponse.json({ error: "UID é obrigatório" }, { status: 400 })
    }

    const auth = getAuth()
    const db = getFirestore()

    // Delete from Firebase Authentication
    try {
      await auth.deleteUser(uid)
      console.log(`User ${uid} deleted from Authentication`)
    } catch (authError: any) {
      console.error("Error deleting from Authentication:", authError)
      // Continue with Firestore deletion even if auth deletion fails
      // (user might already be deleted from auth)
    }

    // Delete from Firestore
    try {
      await db.collection("users").doc(uid).delete()
      console.log(`User ${uid} deleted from Firestore`)
    } catch (firestoreError: any) {
      console.error("Error deleting from Firestore:", firestoreError)
      return NextResponse.json({ error: "Erro ao excluir usuário do banco de dados" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Usuário excluído com sucesso" })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
