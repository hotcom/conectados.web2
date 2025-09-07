import type React from "react"
import "@/app/globals.css"
import { AuthProvider } from "@/components/auth-provider"
import TopNav from "@/components/top-nav"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
