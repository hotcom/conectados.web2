import { db, auth } from "../lib/firebase"
import type { User, UserRole } from "../../../shared/types/user"

interface TestUser {
  email: string
  name: string
  role: UserRole
  phone: string
}

const testUsers: TestUser[] = [
  {
    email: "admin@teste.com",
    name: "Administrador Sistema",
    role: "presidencia",
    phone: "+55 11 99999-0001",
  },
  {
    email: "pastor@teste.com",
    name: "Pastor Regional Teste",
    role: "pastor_regional",
    phone: "+55 11 99999-0002",
  },
  {
    email: "secretaria@teste.com",
    name: "Secretária Teste",
    role: "secretaria",
    phone: "+55 11 99999-0003",
  },
  {
    email: "pastor.local@teste.com",
    name: "Pastor Local Teste",
    role: "pastor_local",
    phone: "+55 11 99999-0004",
  },
  {
    email: "missionario@teste.com",
    name: "Missionário Teste",
    role: "missionario_nucleo",
    phone: "+55 11 99999-0005",
  },
]

async function createTestUsers() {
  const isDevelopment = process.env.NODE_ENV === "development"

  if (!isDevelopment) {
    console.log("❌ Este script só pode ser executado em ambiente de desenvolvimento")
    return { success: false, error: "Ambiente não é desenvolvimento" }
  }

  console.log("🧪 Criando usuários de teste...")

  const results = []

  for (const testUser of testUsers) {
    try {
      console.log(`📧 Criando: ${testUser.email}`)

      // Verificar se usuário já existe
      try {
        const existingUser = await auth.getUserByEmail(testUser.email)
        console.log(`⚠️  Usuário ${testUser.email} já existe, pulando...`)
        continue
      } catch (error) {
        // Usuário não existe, pode criar
      }

      // Criar usuário no Firebase Auth
      const userRecord = await auth.createUser({
        email: testUser.email,
        password: "Admin123456",
        emailVerified: true,
        displayName: testUser.name,
      })

      // Criar documento no Firestore
      const userData: User = {
        uid: userRecord.uid,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        phone: testUser.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        permissions: {
          canManageUsers: testUser.role === "presidencia" || testUser.role === "conselho",
          canManageChurches: ["presidencia", "conselho", "pastor_regional"].includes(testUser.role),
          canViewReports: ["presidencia", "conselho", "pastor_regional", "secretaria"].includes(testUser.role),
          canManageSystem: testUser.role === "presidencia",
        },
      }

      await db.collection("users").doc(userRecord.uid).set(userData)

      console.log(`✅ ${testUser.email} criado com sucesso`)
      results.push({ email: testUser.email, success: true })
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${testUser.email}:`, error.message)
      results.push({ email: testUser.email, success: false, error: error.message })
    }
  }

  console.log("\n🎯 Resumo da criação:")
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.email}`)
    } else {
      console.log(`❌ ${result.email}: ${result.error}`)
    }
  })

  console.log("\n🔑 Credenciais de teste:")
  console.log("Senha padrão para todos: Admin123456")

  return { success: true, results }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestUsers()
    .then((result) => {
      if (result.success) {
        console.log("\n🎉 Usuários de teste criados!")
        process.exit(0)
      } else {
        console.error("💥 Falha ao criar usuários:", result.error)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error("💥 Erro inesperado:", error)
      process.exit(1)
    })
}

export { createTestUsers }
