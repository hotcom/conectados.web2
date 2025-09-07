/**
 * Migration script to convert existing users from single 'role' to 'roles' array
 * Run this once to migrate existing data
 */

import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { getFirebase } from '../lib/firebase-client'

async function migrateUsersToRoles() {
  console.log('Starting user migration to roles array...')
  
  try {
    const { db } = getFirebase()
    const usersCollection = collection(db, 'users')
    const snapshot = await getDocs(usersCollection)
    
    let migratedCount = 0
    let skippedCount = 0
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data()
      
      // Skip if user already has roles array
      if (userData.roles && Array.isArray(userData.roles)) {
        console.log(`Skipping user ${userData.email} - already has roles array`)
        skippedCount++
        continue
      }
      
      // Convert single role to roles array
      if (userData.role) {
        const roles = [userData.role]
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          roles: roles
        })
        
        console.log(`Migrated user ${userData.email}: ${userData.role} -> [${roles.join(', ')}]`)
        migratedCount++
      } else {
        // User has no role, assign default
        const defaultRoles = ['pastor_local']
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          roles: defaultRoles,
          role: 'pastor_local' // backward compatibility
        })
        
        console.log(`Assigned default role to user ${userData.email}: -> [${defaultRoles.join(', ')}]`)
        migratedCount++
      }
    }
    
    console.log(`Migration completed!`)
    console.log(`- Migrated: ${migratedCount} users`)
    console.log(`- Skipped: ${skippedCount} users`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Example of how to create users with multiple roles for testing
async function createTestUsers() {
  console.log('Creating test users with multiple roles...')
  
  const testUsers = [
    {
      email: 'santos@igreja.com',
      displayName: 'Pr. Santos',
      roles: ['pastor_conselho', 'pastor_local'],
      description: 'Presidente do Conselho + Pastor Local'
    },
    {
      email: 'mohamed@igreja.com', 
      displayName: 'Pr. Mohamed',
      roles: ['pastor_conselho', 'pastor_regional'],
      description: 'Conselheiro + Supervisor Regional (sem igreja)'
    },
    {
      email: 'junior@igreja.com',
      displayName: 'Pr. Junior', 
      roles: ['pastor_conselho', 'pastor_regional', 'pastor_local'],
      description: 'Conselheiro + Regional + Igreja Regional'
    }
  ]
  
  try {
    const { db } = getFirebase()
    
    for (const testUser of testUsers) {
      // This would normally be done through the create-user API
      // This is just for demonstration
      console.log(`Test user: ${testUser.displayName}`)
      console.log(`- Roles: [${testUser.roles.join(', ')}]`)
      console.log(`- Description: ${testUser.description}`)
      console.log('---')
    }
    
    console.log('Use the /admin/convites page to actually create these users')
    
  } catch (error) {
    console.error('Test user creation failed:', error)
  }
}

// Export functions for use
export { migrateUsersToRoles, createTestUsers }

// If running directly
if (typeof window === 'undefined') {
  // Node.js environment
  console.log('Migration script loaded. Call migrateUsersToRoles() to migrate existing users.')
}
