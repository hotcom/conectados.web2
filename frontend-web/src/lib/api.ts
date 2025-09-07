const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Auth endpoints
  async verifyDomain(token: string) {
    return this.request("/api/auth/verify-domain", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  }

  // User endpoints
  async getUsers(filters?: { email?: string; role?: string }) {
    const params = new URLSearchParams()
    if (filters?.email) params.append("email", filters.email)
    if (filters?.role) params.append("role", filters.role)

    const query = params.toString()
    return this.request(`/api/users${query ? `?${query}` : ""}`)
  }

  async inviteUser(data: {
    email: string
    role: string
    whatsapp?: string
    sendEmail?: boolean
    sendWhatsApp?: boolean
  }) {
    return this.request("/api/users/invite", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Church endpoints
  async getChurches() {
    return this.request("/api/churches")
  }

  async createChurch(data: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    phone?: string
    email?: string
  }) {
    return this.request("/api/churches", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Admin endpoints
  async bootstrapAdmin() {
    return this.request("/api/admin/bootstrap", {
      method: "POST",
    })
  }

  async createTestUsers() {
    return this.request("/api/admin/create-test-users", {
      method: "POST",
    })
  }

  // Health check
  async healthCheck() {
    return this.request("/api/health")
  }

  // Debug endpoints
  async getDomainInfo() {
    return this.request("/api/debug/domains")
  }
}

export const api = new ApiClient(BACKEND_URL)
