import type { UserRole as Role, User as UserDoc } from '../shared/types/user'

/**
 * Utility functions for handling multiple roles per user
 */

// Get user roles (with backward compatibility)
export function getUserRoles(user: UserDoc): Role[] {
  if (!user) return []
  
  if (user.roles && user.roles.length > 0) {
    return user.roles
  }
  // Backward compatibility: convert single role to array
  if (user.role) {
    return [user.role]
  }
  return []
}

// Check if user has any of the specified roles
export function hasAnyRole(user: UserDoc, allowedRoles: Role[]): boolean {
  if (!user) return false
  const userRoles = getUserRoles(user)
  return userRoles.some(role => allowedRoles.includes(role))
}

// Check if user has specific role
export function hasRole(user: UserDoc, targetRole: Role): boolean {
  if (!user) return false
  const userRoles = getUserRoles(user)
  return userRoles.includes(targetRole)
}

// Get highest priority role for display purposes
export function getPrimaryRole(user: UserDoc): Role | null {
  const userRoles = getUserRoles(user)
  if (userRoles.length === 0) return null
  
  // Priority order (highest to lowest)
  const rolePriority: Role[] = [
    "admin",
    "pastor_conselho", 
    "pastor_regional",
    "pastor_local",
    "secretaria"
  ]
  
  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role
    }
  }
  
  return userRoles[0] // fallback to first role
}

// Get role display name
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    admin: "Administrador",
    pastor_conselho: "Pastor do Conselho",
    pastor_regional: "Pastor Regional", 
    pastor_local: "Pastor Local",
    secretaria: "Secretaria"
  }
  return roleNames[role] || role
}

// Get role color for UI
export function getRoleColor(role: Role): string {
  const roleColors: Record<Role, string> = {
    admin: "bg-red-500",
    pastor_conselho: "bg-purple-500",
    pastor_regional: "bg-blue-500",
    pastor_local: "bg-green-500", 
    secretaria: "bg-orange-500"
  }
  return roleColors[role] || "bg-gray-500"
}

// Check what roles a user can invite based on their roles
export function getInvitableRoles(user: UserDoc): Role[] {
  const userRoles = getUserRoles(user)
  const invitableRoles: Role[] = []
  
  if (hasRole(user, "admin")) {
    invitableRoles.push("admin", "pastor_conselho", "pastor_regional", "pastor_local", "secretaria")
  }
  
  if (hasRole(user, "pastor_conselho")) {
    invitableRoles.push("pastor_conselho", "pastor_regional", "pastor_local", "secretaria")
  }
  
  if (hasRole(user, "pastor_regional")) {
    invitableRoles.push("pastor_local", "secretaria")
  }
  
  if (hasRole(user, "pastor_local")) {
    invitableRoles.push("secretaria")
  }
  
  // Secretaria tem os mesmos poderes do pastor_conselho para gerenciar regiões
  if (hasRole(user, "secretaria")) {
    invitableRoles.push("pastor_conselho", "pastor_regional", "pastor_local", "secretaria")
  }
  
  // Remove duplicates
  return [...new Set(invitableRoles)]
}

// Check if user can manage a specific church
export function canManageChurch(user: UserDoc, churchId: string): boolean {
  const userRoles = getUserRoles(user)
  
  // Admin and pastor_conselho can manage everything
  if (hasRole(user, "admin") || hasRole(user, "pastor_conselho")) {
    return true
  }
  
  // Check if user is secretary of this church
  if (user.isSecretaryOf === churchId) {
    return true
  }
  
  // Check if user is pastor of this church
  if (user.churchId === churchId) {
    return true
  }
  
  // Check if church is in user's manageable list
  if (user.canManageChurch?.includes(churchId)) {
    return true
  }
  
  return false
}

// Check if user is secretary of a church
export function isSecretaryOf(user: UserDoc, churchId?: string): boolean {
  if (!churchId) return !!user.isSecretaryOf
  return user.isSecretaryOf === churchId
}

// Combine multiple roles into a user-friendly string
export function formatRolesDisplay(roles: Role[]): string {
  if (roles.length === 0) return "Sem função"
  if (roles.length === 1) return getRoleDisplayName(roles[0])
  
  const displayNames = roles.map(getRoleDisplayName)
  if (roles.length === 2) {
    return displayNames.join(" e ")
  }
  
  return displayNames.slice(0, -1).join(", ") + " e " + displayNames[displayNames.length - 1]
}
