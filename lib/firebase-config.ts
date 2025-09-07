export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAu5cbVBklyqNpEk-i0C-yegI1pQoUMzEg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bdn-unidades.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bdn-unidades",
  // Observação: em muitos projetos o bucket é "PROJECT_ID.appspot.com".
  // Se der erro de Storage, confirme o bucket nas configurações do Firebase Storage.
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bdn-unidades.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "253780139798",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:253780139798:web:b8fe433f92d3a626267a37",
}
