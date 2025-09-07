import type { NextRequest } from "next/server"
import { db, collections } from "../../../../lib/firebase"
import { requireRole } from "../../../../lib/auth"
import { zapiClient } from "../../../../lib/zapi"
import { sendEmail, generateInviteEmailTemplate } from "../../../../lib/email"
import type { ApiResponse } from "../../../../../../shared/types/api"
import type { UserInvite, UserRole } from "../../../../../../shared/types/user"
import crypto from "crypto"

// POST /api/users/invite - Enviar convite
export const POST = requireRole(["presidencia", "conselho", "pastor_regional", "secretaria"])(
  async (request: NextRequest, { user: currentUser }) => {
    try {
      const {
        email,
        role,
        regionId,
        churchId,
        phone,
        sendWhatsApp = true,
        sendEmail: sendEmailFlag = true,
      } = await request.json()

      // Validações
      if (!email?.endsWith("@boladeneve.com")) {
        return Response.json(
          { success: false, error: "Email deve ser do domínio @boladeneve.com", timestamp: Date.now() } as ApiResponse,
          { status: 400 },
        )
      }

      // Verificar se usuário já existe
      const existingUser = await db.collection(collections.users).where("email", "==", email).get()
      if (!existingUser.empty) {
        return Response.json({ success: false, error: "Usuário já cadastrado", timestamp: Date.now() } as ApiResponse, {
          status: 400,
        })
      }

      // Gerar token único
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias

      const invite: Omit<UserInvite, "id"> = {
        email,
        role: role as UserRole,
        regionId,
        churchId,
        invitedBy: currentUser.id,
        token,
        expiresAt,
        createdAt: Date.now(),
        whatsappSent: false,
      }

      // Salvar convite
      const docRef = await db.collection(collections.invites).add(invite)
      const inviteLink = `${process.env.FRONTEND_URL}/invites/accept/${token}`

      // Enviar WhatsApp
      if (sendWhatsApp && phone) {
        try {
          const whatsappResult = await zapiClient.sendInviteMessage(phone, inviteLink, currentUser.displayName)

          if (whatsappResult.success) {
            await docRef.update({ whatsappSent: true })
          }
        } catch (error) {
          console.error("WhatsApp send error:", error)
        }
      }

      // Enviar Email
      if (sendEmailFlag) {
        try {
          await sendEmail({
            to: email,
            subject: "Convite - Igreja Bola de Neve",
            html: generateInviteEmailTemplate(currentUser.displayName, inviteLink, role),
          })
        } catch (error) {
          console.error("Email send error:", error)
        }
      }

      return Response.json({
        success: true,
        data: {
          id: docRef.id,
          ...invite,
          inviteLink,
        },
        message: "Convite enviado com sucesso",
        timestamp: Date.now(),
      } as ApiResponse)
    } catch (error: any) {
      console.error("Send invite error:", error)
      return Response.json({ success: false, error: "Erro ao enviar convite", timestamp: Date.now() } as ApiResponse, {
        status: 500,
      })
    }
  },
)
