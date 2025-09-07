import type { UserRole } from "../../../shared/types/user"

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  presidencia: 6,
  conselho: 5,
  pastor_regional: 4,
  secretaria: 3,
  pastor_local: 2,
  missionario_nucleo: 1,
}

export const PERMISSIONS = {
  // Usuários
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  VIEW_ALL_USERS: "view_all_users",

  // Igrejas
  CREATE_CHURCH: "create_church",
  UPDATE_CHURCH: "update_church",
  DELETE_CHURCH: "delete_church",
  VIEW_ALL_CHURCHES: "view_all_churches",

  // Chat
  CREATE_BROADCAST: "create_broadcast",
  MODERATE_CHAT: "moderate_chat",

  // Convites
  INVITE_USERS: "invite_users",

  // Financeiro (futuro)
  VIEW_TRANSACTIONS: "view_transactions",
  APPROVE_TRANSACTIONS: "approve_transactions",
} as const

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  presidencia: Object.values(PERMISSIONS),

  conselho: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.CREATE_CHURCH,
    PERMISSIONS.UPDATE_CHURCH,
    PERMISSIONS.VIEW_ALL_CHURCHES,
    PERMISSIONS.CREATE_BROADCAST,
    PERMISSIONS.MODERATE_CHAT,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  pastor_regional: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.CREATE_CHURCH,
    PERMISSIONS.UPDATE_CHURCH,
    PERMISSIONS.CREATE_BROADCAST,
    PERMISSIONS.INVITE_USERS,
  ],

  secretaria: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.CREATE_CHURCH,
    PERMISSIONS.UPDATE_CHURCH,
    PERMISSIONS.INVITE_USERS,
  ],

  pastor_local: [PERMISSIONS.CREATE_CHURCH, PERMISSIONS.UPDATE_CHURCH],

  missionario_nucleo: [PERMISSIONS.CREATE_CHURCH],
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole]
}

export function getUserPermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || []
}
