export function getAllowedDomains(): string[] {
  const nodeEnv = process.env.NODE_ENV || "development"

  if (nodeEnv === "production") {
    // Em produção, apenas domínio oficial
    const productionDomain = process.env.PRODUCTION_DOMAIN || "boladeneve.com"
    return [productionDomain]
  } else {
    // Em desenvolvimento, permite domínios de teste
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS || "teste.com,boladeneve.com"
    return allowedDomains.split(",").map((domain) => domain.trim())
  }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production"
}

export function isValidEmailDomain(email: string): boolean {
  if (!email || !email.includes("@")) {
    return false
  }

  const domain = email.split("@")[1]
  const allowedDomains = getAllowedDomains()

  return allowedDomains.includes(domain)
}

export function validateUserRole(role: string): boolean {
  const validRoles = ["presidencia", "conselho", "pastor_regional", "secretaria", "pastor_local", "missionario_nucleo"]

  return validRoles.includes(role)
}
