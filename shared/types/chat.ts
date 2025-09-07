export type MessageType = "text" | "voice" | "video" | "file" | "location" | "system"
export type RoomType = "direct" | "group" | "broadcast" | "hierarchy"
export type UserRole = "member" | "admin" | "superadmin" // Declared UserRole type

export interface ChatRoom {
  id: string
  name: string
  type: RoomType
  participants: string[]
  admins: string[]
  createdBy: string
  churchId?: string
  regionId?: string
  hierarchyLevel?: UserRole
  lastMessage?: Message
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  type: MessageType
  fileUrl?: string
  fileName?: string
  duration?: number
  location?: { lat: number; lng: number }
  replyTo?: string
  createdAt: number
  readBy: { [userId: string]: number }
  edited?: boolean
  editedAt?: number
}
