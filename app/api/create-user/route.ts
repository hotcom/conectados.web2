import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase-admin-safe'
import type { Role } from '@/lib/types'

export async function POST(request: NextRequest) {
  // Check if Firebase is properly configured
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    )
  }

  try {
    const { email, password, role, roles, createdBy, regionId } = await request.json()

    if (!email || !password || (!role && !roles) || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseFirestore()

    // Create user with Firebase Admin SDK
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    })

    // Support both single role (backward compatibility) and multiple roles
    const userRoles = roles || [role]

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: email,
      displayName: '',
      roles: userRoles, // New: array of roles
      role: role || userRoles[0], // Backward compatibility
      regionId: regionId || null,
      churchId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    console.log('Creating user with data:', userData)
    await db.collection('users').doc(userRecord.uid).set(userData)

    // Create invite record
    await db.collection('invites').add({
      email,
      role: role || userRoles[0], // Use first role for backward compatibility
      roles: userRoles, // Store all roles
      createdBy,
      createdAt: Date.now(),
      acceptedAt: Date.now(),
      acceptedByUid: userRecord.uid,
    })

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
