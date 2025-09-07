import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase-admin-safe'

export async function DELETE(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    
    if (!uid) {
      return NextResponse.json({ error: "UID é obrigatório" }, { status: 400 })
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseFirestore()

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
