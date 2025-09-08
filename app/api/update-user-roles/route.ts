import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase-admin-safe'
import type { Role } from '@/lib/types'

export async function POST(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    )
  }

  try {
    const { uid, roles } = await request.json()

    if (!uid || !roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'Missing uid or invalid roles array' },
        { status: 400 }
      )
    }

    const db = getFirebaseFirestore()

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
