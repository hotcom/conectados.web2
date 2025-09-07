"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function LoginRequired({ message = "Faça login para continuar." }: { message?: string }) {
  const router = useRouter()
  return (
    <main className="min-h-dvh grid place-items-center">
      <Card className="p-6 w-[min(92vw,560px)] space-y-3">
        <h1 className="text-xl font-semibold">Faça login</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={() => router.push("/login")}>Ir para login</Button>
      </Card>
    </main>
  )
}
