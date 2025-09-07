import { initializeApp } from 'firebase/app'
import { getFirestore, doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { firebaseConfig } from '../lib/firebase-config'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function updateAdminRole() {
  try {
    console.log('🔍 Procurando usuário admin@teste.com...')
    
    // Find the user by email in the users collection
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', 'admin@teste.com'))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('❌ Usuário admin@teste.com não encontrado')
      return
    }
    
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    console.log('📋 Usuário encontrado:')
    console.log('  ID:', userDoc.id)
    console.log('  Email:', userData.email)
    console.log('  Role atual:', userData.role)
    console.log('  Nome:', userData.displayName || 'Não informado')
    
    if (userData.role === 'admin') {
      console.log('✅ Usuário já tem role "admin"')
      return
    }
    
    // Update the user role to admin
    console.log('🔄 Atualizando role para "admin"...')
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'admin'
    })
    
    console.log('✅ Role atualizada com sucesso!')
    console.log('🎉 admin@teste.com agora é administrador')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error)
  }
}

updateAdminRole()
