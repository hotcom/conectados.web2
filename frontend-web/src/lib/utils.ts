import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    presidencia: "Presidência",
    conselho: "Conselho",
    pastor_regional: "Pastor Regional",
    secretaria: "Secretaria",
    pastor_local: "Pastor Local",
    missionario_nucleo: "Missionário de Núcleo",
  }
  return roleMap[role] || role
}

export function formatChurchType(type: string) {
  const typeMap: Record<string, string> = {
    regional: "Igreja Regional",
    local: "Igreja Local",
    nucleo: "Núcleo",
  }
  return typeMap[type] || type
}
