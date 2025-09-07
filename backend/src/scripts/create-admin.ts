import { db, auth } from "../lib/firebase"
import type { User } from "../../../shared/types/user"

// Função para obter domínios permitidos
function getAllowedDomains(): string[] {
  const isDevelopment = process.env.NODE_ENV === "development"

  if (isDevelopment) {
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS || "teste.com,boladeneve.com"
    return allowedDomains.split(",").map((domain) => domain.trim())
  } else {
    return [process.env.PRODUCTION_DOMAIN || "boladeneve.com"]
  }
}

async function createAdminUser() {
  try {
    const allowedDomains = getAllowedDomains()
    const isDevelopment = process.env.NODE_ENV === "development"

    // Em desenvolvimento, usa @teste.com, em produção usa @boladeneve.com
    const adminEmail = isDevelopment ? "admin@teste.com" : "admin@boladeneve.com"
    const adminPassword = "Admin123456"

    console.log(`🚀 Criando usuário admin para ambiente: ${process.env.NODE_ENV}`)
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🌐 Domínios permitidos: ${allowedDomains.join(", ")}`)

    // Criar usuário no Firebase Auth
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
      displayName: "Administrador Sistema",
    })

    console.log(`✅ Usuário criado no Firebase Auth: ${userRecord.uid}`)

    // Criar documento no Firestore
    const userData: User = {
      uid: userRecord.uid,
      email: adminEmail,
      name: "Administrador Sistema",
      role: "presidencia",
      phone: "+55 11 99999-9999",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: {
        canManageUsers: true,
        canManageChurches: true,
        canViewReports: true,
        canManageSystem: true,
      },
    }

    await db.collection("users").doc(userRecord.uid).set(userData)

    console.log(`✅ Documento criado no Firestore`)
    console.log(`🎯 Login: ${adminEmail} / ${adminPassword}`)
    console.log(`🔧 Ambiente: ${isDevelopment ? "Desenvolvimento" : "Produção"}`)

    return { success: true, uid: userRecord.uid, email: adminEmail }
  } catch (error: any) {
    console.error("❌ Erro ao criar admin:", error)
    return { success: false, error: error.message }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createAdminUser()
    .then((result) => {
      if (result.success) {
        console.log("🎉 Admin criado com sucesso!")
        process.exit(0)
      } else {
        console.error("💥 Falha ao criar admin:", result.error)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error("💥 Erro inesperado:", error)
      process.exit(1)
    })
}

export { createAdminUser }
