import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
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

export async function POST(request: NextRequest) {
  try {
    const { userId, regionId } = await request.json()

    if (!userId || !regionId) {
      return NextResponse.json(
        { error: 'Missing userId or regionId' },
        { status: 400 }
      )
    }

    const db = getFirestore()

    // Update user with regionId
    await db.collection('users').doc(userId).update({
      regionId: regionId,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      message: 'User regionId updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating user regionId:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}
