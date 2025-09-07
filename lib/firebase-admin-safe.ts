import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Safe Firebase Admin initialization
let isInitialized = false

export function initializeFirebaseAdmin() {
  if (isInitialized || getApps().length > 0) {
    return true
  }

  // Check if all required environment variables are present
  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_CLIENT_EMAIL || 
      !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase Admin SDK environment variables not configured')
    return false
  }

  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
    isInitialized = true
    return true
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)
    return false
  }
}

export function getFirebaseAuth() {
  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin SDK not properly configured')
  }
  return getAuth()
}

export function getFirebaseFirestore() {
  if (!initializeFirebaseAdmin()) {
    throw new Error('Firebase Admin SDK not properly configured')
  }
  return getFirestore()
}

export function isFirebaseConfigured() {
  return !!(process.env.FIREBASE_PROJECT_ID && 
           process.env.FIREBASE_CLIENT_EMAIL && 
           process.env.FIREBASE_PRIVATE_KEY)
}
