"use client"

import { useEffect, useRef, useState } from "react"
import { getFirebase } from "@/lib/firebase-client"
import { 
  addDoc, 
  collection, 
  limit, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp, 
  getDocs,
  where,
  doc,
  setDoc
} from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AdminNav from "@/components/admin-nav"
import { Search, Send, MessageCircle, Users } from "lucide-react"

type Message = {
  id?: string
  uid: string
  text: string
  createdAt: any
  displayName: string
  roomId: string
}

type User = {
  id: string
  uid: string
  email: string
  displayName: string
  role: string
  createdAt: number
}

type Conversation = {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  lastMessageBy?: string
}

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChat, setSelectedChat] = useState<string>("avisos-oficiais")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!user) return
    loadUsers()
    loadConversations()
  }, [user])

  useEffect(() => {
    if (!user || !selectedChat) return
    
    const { db } = getFirebase()
    const q = query(
      collection(db, "rooms", selectedChat, "messages"), 
      orderBy("createdAt", "asc"), 
      limit(200)
    )
    const unsubscribe = onSnapshot(q, (snap) => {
      const arr: Message[] = []
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }))
      setMessages(arr)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })
    return () => unsubscribe()
  }, [user, selectedChat])

  async function loadUsers() {
    try {
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "users"))
      const usersList: User[] = []
      snapshot.forEach((doc) => {
        const userData = doc.data()
        if (userData.uid !== user?.uid) { // Exclude current user
          usersList.push({
            id: doc.id,
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            createdAt: userData.createdAt
          })
        }
      })
      setUsers(usersList)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  async function loadConversations() {
    try {
      const { db } = getFirebase()
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user?.uid)
      )
      const snapshot = await getDocs(q)
      const convList: Conversation[] = []
      snapshot.forEach((doc) => {
        convList.push({
          id: doc.id,
          ...doc.data() as any
        })
      })
      setConversations(convList)
    } catch (error) {
      console.error("Error loading conversations:", error)
    }
  }

  async function startConversation(targetUser: User) {
    try {
      const { db } = getFirebase()
      const participants = [user!.uid, targetUser.uid].sort()
      const conversationId = participants.join("_")
      
      // Create or update conversation document
      await setDoc(doc(db, "conversations", conversationId), {
        participants,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      }, { merge: true })
      
      setSelectedChat(conversationId)
      setSelectedUser(targetUser)
      loadConversations()
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  async function send() {
    if (!text.trim() || !user || !selectedChat) return
    
    try {
      const { db } = getFirebase()
      await addDoc(collection(db, "rooms", selectedChat, "messages"), {
        uid: user.uid,
        text: text.trim(),
        createdAt: serverTimestamp(),
        displayName: profile?.displayName || user.email,
        roomId: selectedChat,
      })

      // Update conversation last message if it's a private chat
      if (selectedChat !== "avisos-oficiais" && selectedChat.includes("_")) {
        await setDoc(doc(db, "conversations", selectedChat), {
          lastMessage: text.trim(),
          lastMessageAt: serverTimestamp(),
          lastMessageBy: user.uid
        }, { merge: true })
      }

      setText("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getChatTitle = () => {
    if (selectedChat === "avisos-oficiais") return "Avisos Oficiais"
    if (selectedUser) return selectedUser.displayName || selectedUser.email
    return "Chat"
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!user) {
    const LoginRequired = require("@/components/login-required").default
    return <LoginRequired message="Entre para acessar o chat." />
  }

  return (
    <>
      <AdminNav currentPage="/chat" />
      <main className="lg:ml-80 pt-14 min-h-screen flex">
        {/* Sidebar - User List */}
        <div className="w-80 border-r bg-background flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-3">Conversas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Official Announcements */}
          <div className="p-2">
            <Card 
              className={`p-3 cursor-pointer transition-colors ${
                selectedChat === "avisos-oficiais" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              onClick={() => {
                setSelectedChat("avisos-oficiais")
                setSelectedUser(null)
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Avisos Oficiais</div>
                  <div className="text-xs opacity-70">Canal público</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUsers.map((chatUser) => (
              <Card 
                key={chatUser.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedUser?.id === chatUser.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => startConversation(chatUser)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getUserInitials(chatUser.displayName || chatUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {chatUser.displayName || chatUser.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {chatUser.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              {selectedUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                    {getUserInitials(selectedUser.displayName || selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <h1 className="font-semibold">{getChatTitle()}</h1>
                {selectedUser && (
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, i) => (
              <div key={message.id || i} className={`flex ${message.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.uid === user.uid 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {message.uid !== user.uid && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.displayName || "Usuário"}
                    </div>
                  )}
                  <div className="text-sm">{message.text}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder={`Mensagem para ${getChatTitle()}...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="flex-1"
              />
              <Button onClick={send} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
