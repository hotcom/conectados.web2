import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
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
    const { email, password, role, roles, createdBy, regionId } = await request.json()

    if (!email || !password || (!role && !roles) || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const auth = getAuth()
    const db = getFirestore()

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
