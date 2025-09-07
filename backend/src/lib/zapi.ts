import axios from "axios"

const ZAPI_BASE_URL = "https://api.z-api.io"
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || "8DDFB2C8E388B412271526EE"
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE || "3DD83FFD304B90F75464DE26AC33667E"

interface WhatsAppMessage {
  phone: string
  message: string
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

export class ZApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = `${ZAPI_BASE_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`
  }

  async sendMessage({ phone, message }: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const cleanPhone = phone.replace(/\D/g, "") // Remove non-digits

      const response = await axios.post(`${this.baseURL}/send-text`, {
        phone: cleanPhone,
        message,
      })

      return {
        success: true,
        messageId: response.data?.messageId,
      }
    } catch (error: any) {
      console.error("Z-API Error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || "Erro ao enviar WhatsApp",
      }
    }
  }

  async sendInviteMessage(
    phone: string,
    inviteLink: string,
    inviterName: string,
    role: string,
  ): Promise<WhatsAppResponse> {
    const roleNames: Record<string, string> = {
      presidencia: "Presidência",
      conselho: "Conselho",
      pastor_regional: "Pastor Regional",
      secretaria: "Secretaria",
      pastor_local: "Pastor Local",
      missionario_nucleo: "Missionário de Núcleo",
    }

    const roleName = roleNames[role] || role

    const message = `🙏 *Igreja Bola de Neve*

Olá! Você foi convidado(a) por *${inviterName}* para fazer parte do nosso sistema como *${roleName}*.

📱 *Acesse o link para completar seu cadastro:*
${inviteLink}

🔐 *Importante:* 
• Use seu email @boladeneve.com para fazer login
• O sistema possui chat integrado, mapa de igrejas e muito mais!

⏰ Este convite expira em 7 dias.

🎯 *Suas funcionalidades incluem:*
• Gestão de usuários e igrejas
• Chat hierárquico WhatsApp-like  
• Mapa interativo de unidades
• Sistema de videochamadas
• E muito mais!

Deus abençoe! 🙌

---
_Sistema Integrado Igreja Bola de Neve_`

    return this.sendMessage({ phone, message })
  }

  async sendSystemMessage(phone: string, message: string): Promise<WhatsAppResponse> {
    const formattedMessage = `🙏 *Igreja Bola de Neve*

${message}

Deus abençoe! 🙌

---
_Sistema Integrado Igreja Bola de Neve_`

    return this.sendMessage({ phone, formattedMessage })
  }
}

export const zapiClient = new ZApiClient()
