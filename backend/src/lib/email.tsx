import nodemailer from "nodemailer"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: from || `"Sistema Bola de Neve" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("Email error:", error)
    return { success: false, error: error.message }
  }
}

export function generateInviteEmailTemplate(inviterName: string, inviteLink: string, role: string) {
  const roleNames: Record<string, string> = {
    presidencia: "Presidência",
    conselho: "Conselho",
    pastor_regional: "Pastor Regional",
    secretaria: "Secretaria",
    pastor_local: "Pastor Local",
    missionario_nucleo: "Missionário de Núcleo",
  }

  const roleName = roleNames[role] || role

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Convite - Igreja Bola de Neve</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d;">🙏 Igreja Bola de Neve</h1>
      </div>
      
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2d3748; margin-top: 0;">Você foi convidado!</h2>
        <p style="color: #4a5568; font-size: 16px;">
          <strong>${inviterName}</strong> convidou você para fazer parte do sistema como <strong>${roleName}</strong>.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Aceitar Convite
        </a>
      </div>
      
      <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #742a2a;">
          <strong>Importante:</strong> Use seu email @boladeneve.com para fazer login.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 14px;">
        <p>Este convite expira em 7 dias.</p>
        <p>Deus abençoe! 🙌</p>
      </div>
    </body>
    </html>
  `
}
