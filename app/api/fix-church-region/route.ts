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
    const { churchId, regionId } = await request.json()

    if (!churchId || !regionId) {
      return NextResponse.json(
        { error: 'Missing churchId or regionId' },
        { status: 400 }
      )
    }

    const db = getFirestore()

    // Update church with regionId
    await db.collection('places').doc(churchId).update({
      regionId: regionId,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      message: 'Church regionId updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating church regionId:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update church' },
      { status: 500 }
    )
  }
}
