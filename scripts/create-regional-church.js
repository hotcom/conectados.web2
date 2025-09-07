const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Configuração do Firebase (usando as mesmas variáveis do projeto)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function createRegionalChurch() {
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Dados da igreja regional
    const churchData = {
      name: 'Igreja Regional São Paulo XI',
      address: 'Rua das Flores, 123, São Paulo, SP, Brasil',
      kind: 'regional',
      location: { 
        lat: -23.5505, 
        lng: -46.6333 
      },
      regionId: 'q63YyS2e4qqXVwy1f7Iy',
      ownerUid: '', // Será preenchido depois que soubermos o UID do Hugo
      createdAt: Date.now()
    };
    
    // Criar igreja no Firestore
    const docRef = await addDoc(collection(db, 'places'), churchData);
    console.log('✅ Igreja regional criada com sucesso!');
    console.log('ID da igreja:', docRef.id);
    console.log('Nome:', churchData.name);
    console.log('Região:', churchData.regionId);
    
  } catch (error) {
    console.error('❌ Erro ao criar igreja regional:', error);
  }
}

// Executar script
createRegionalChurch();
