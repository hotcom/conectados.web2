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
    const { churchId, regionId } = await request.json()

    if (!churchId || !regionId) {
      return NextResponse.json(
        { error: 'Missing churchId or regionId' },
        { status: 400 }
      )
    }

    const db = getFirebaseFirestore()

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
