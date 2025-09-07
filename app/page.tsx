"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { getFirebase } from "@/lib/firebase-client"
import { collection, getDocs, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, Share2, Users, Building } from "lucide-react"

interface Church {
  id: string
  name: string
  address: string
  kind: string
  location: { lat: number; lng: number }
  createdAt: number
}

export default function Home() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [churches, setChurches] = useState<Church[]>([])
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      // Check if user needs to complete profile first
      if (!profile) return // Wait for profile to load
      
      const userRoles = profile.roles || (profile.role ? [profile.role] : [])
      const hasAdminRole = userRoles.some((role: string) => 
        ["admin", "pastor_regional", "pastor_local", "pastor_conselho", "secretaria"].includes(role)
      )
      
      if (hasAdminRole) {
        router.replace("/admin/dashboard")
      }
    }
  }, [user, profile, router])

  useEffect(() => {
    loadChurches()
    setupRealtimeUpdates()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = churches.filter(church => 
        church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        church.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredChurches(filtered)
    } else {
      setFilteredChurches(churches)
    }
  }, [churches, searchTerm])

  async function loadChurches() {
    try {
      const { db } = getFirebase()
      const snapshot = await getDocs(collection(db, "places"))
      const churchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Church[]
      
      setChurches(churchesData.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error("Erro ao carregar igrejas:", error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeUpdates() {
    try {
      const { db } = getFirebase()
      const unsubscribe = onSnapshot(collection(db, "places"), (snapshot) => {
        const churchesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Church[]
        
        setChurches(churchesData.sort((a, b) => b.createdAt - a.createdAt))
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Erro ao configurar updates em tempo real:", error)
    }
  }

  function getCityFromAddress(address: string): string {
    const parts = address.split(',')
    return parts[parts.length - 2]?.trim() || parts[parts.length - 1]?.trim() || 'Cidade'
  }

  function getUnsplashImageUrl(city: string): string {
    const cleanCity = encodeURIComponent(city.replace(/\s+/g, '+'))
    return `https://source.unsplash.com/800x600/?${cleanCity},city,brasil&sig=${Math.random()}`
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'Conectados.co',
        text: 'Conectando igrejas em todo o Brasil através da tecnologia',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  function handleChurchClick(church: Church) {
    console.log('Igreja clicada:', church.name)
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-black">
        {/* Header Skeleton */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
              <div className="flex items-center gap-4">
                <div className="h-9 w-28 bg-white/10 rounded animate-pulse"></div>
                <div className="h-9 w-20 bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="text-center mb-12">
              <div className="h-12 w-80 bg-white/10 rounded mx-auto mb-4 animate-pulse"></div>
              <div className="space-y-2 max-w-3xl mx-auto">
                <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-white/10 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
            
            <div className="max-w-md mx-auto mb-8">
              <div className="h-12 bg-white/10 rounded-full animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Grid Skeleton */}
        <section className="px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-white/10 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      {/* Header with Search and Share */}
      <header className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Conectados.co</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              {!user ? (
                <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                  <Link href="/login">Entrar</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link href="/admin/dashboard">Dashboard</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Os Trabalhadores da Última Hora
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-4xl mx-auto mb-12 leading-relaxed">
              Estamos conectando vidas para manifestar o reino de Jesus na terra
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto mb-16">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full text-lg focus:bg-white/15 focus:border-white/40 transition-all duration-200 backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-3 text-center">
                <span className="text-white/60 text-sm">
                  {filteredChurches.length} igreja{filteredChurches.length !== 1 ? 's' : ''} encontrada{filteredChurches.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Churches Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredChurches.length === 0 ? (
            <div className="text-center py-24">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                  <Building className="h-10 w-10 text-white/50" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {searchTerm ? 'Nenhuma igreja encontrada' : 'Nenhuma igreja cadastrada ainda'}
                  </h3>
                  <p className="text-white/60 text-lg max-w-md mx-auto">
                    {searchTerm ? 'Tente buscar por outro termo ou verifique a ortografia' : 'As primeiras igrejas aparecerão aqui quando forem cadastradas no sistema.'}
                  </p>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Results count for non-empty search */}
              {searchTerm && (
                <div className="mb-8 text-center">
                  <p className="text-white/60">
                    Mostrando {filteredChurches.length} de {churches.length} igrejas
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredChurches.map((church, index) => {
                  const city = getCityFromAddress(church.address)
                  const imageUrl = getUnsplashImageUrl(city)
                  
                  return (
                    <div 
                      key={church.id} 
                      className="relative overflow-hidden rounded-lg cursor-pointer group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      onClick={() => handleChurchClick(church)}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="aspect-[4/3] relative">
                        <div className="w-full h-full bg-white flex items-center justify-center">
                          <img 
                            src={imageUrl}
                            alt={church.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full bg-white flex items-center justify-center">
                                    <div class="text-center text-gray-600">
                                      <div class="text-4xl mb-2">⛪</div>
                                      <div class="text-sm font-medium">${church.name}</div>
                                    </div>
                                  </div>
                                `
                              }
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Church name */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-lg leading-tight group-hover:text-white/90 transition-colors">
                            {church.name}
                          </h3>
                        </div>
                        
                        {/* Click indicator */}
                        <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                          <span className="text-white text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-white/70 text-lg">
              Manifestando, espalhando e vivendo o Evangelho do Reino com excelência e unidade.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
