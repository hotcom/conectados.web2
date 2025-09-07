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
    const { secretaryId, churchId } = await request.json()

    if (!secretaryId || !churchId) {
      return NextResponse.json(
        { error: 'Missing secretaryId or churchId' },
        { status: 400 }
      )
    }

    const db = getFirebaseFirestore()

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
