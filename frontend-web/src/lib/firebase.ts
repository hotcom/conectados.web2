import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAu5cbVBklyqNpEk-i0C-yegI1pQoUMzEg",
  authDomain: "bdn-unidades.firebaseapp.com",
  projectId: "bdn-unidades",
  storageBucket: "bdn-unidades.firebasestorage.app",
  messagingSenderId: "253780139798",
  appId: "1:253780139798:web:b8fe433f92d3a626267a37",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
