import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}

// Initialize Firebase Admin
const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(firebaseConfig),
        projectId: firebaseConfig.projectId,
      })
    : getApps()[0]

export const db = getFirestore(app)
export const auth = getAuth(app)

// Collections
export const collections = {
  users: "users",
  churches: "churches",
  invites: "invites",
  chatRooms: "chat_rooms",
  messages: "messages",
  transactions: "transactions",
} as const
