import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseFirestore, isFirebaseConfigured } from '@/lib/firebase-admin-safe'

export async function POST(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    )
  }

  try {
    const { userId, regionId } = await request.json()

    if (!userId || !regionId) {
      return NextResponse.json(
        { error: 'Missing userId or regionId' },
        { status: 400 }
      )
    }

    const db = getFirebaseFirestore()

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
