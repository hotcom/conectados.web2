import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { Role } from '@/lib/types'

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

export async function POST(request: NextRequest) {
  try {
    const { uid, roles } = await request.json()

    if (!uid || !roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'Missing uid or invalid roles array' },
        { status: 400 }
      )
    }

    const db = getFirestore()

    // Update user document with new roles
    await db.collection('users').doc(uid).update({
      roles: roles,
      role: roles[0], // Backward compatibility - use first role as primary
    })

    return NextResponse.json({
      success: true,
      uid,
      roles,
    })

  } catch (error: any) {
    console.error('Error updating user roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user roles' },
      { status: 500 }
    )
  }
}
