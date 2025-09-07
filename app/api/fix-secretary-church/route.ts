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
    const { secretaryId, churchId } = await request.json()

    if (!secretaryId || !churchId) {
      return NextResponse.json(
        { error: 'Missing secretaryId or churchId' },
        { status: 400 }
      )
    }

    const db = getFirestore()

    // Update secretary with churchId
    await db.collection('users').doc(secretaryId).update({
      churchId: churchId,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      message: 'Secretary churchId updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating secretary churchId:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update secretary' },
      { status: 500 }
    )
  }
}
