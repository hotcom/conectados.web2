"use client"

import { useAuth } from "@/components/auth-provider"
import AdminNav from "@/components/admin-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Settings, Database, Mail, Map, Shield, Globe } from "lucide-react"

export default function ConfiguracoesPage() {
  const { user, profile } = useAuth()

  if (!user || !profile || profile.role !== "admin") {
    return (
      <>
        <AdminNav currentPage="/admin/configuracoes" />
        <main className="lg:ml-80 pt-14 min-h-screen grid place-items-center">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">Acesso Restrito</h1>
            <p className="text-muted-foreground mt-2">Apenas administradores podem acessar as configurações.</p>
          </Card>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminNav currentPage="/admin/configuracoes" />
      
      <main className="lg:ml-80 pt-14 min-h-screen bg-muted/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações globais do Conectados.co
            </p>
          </div>

          {/* Firebase Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configuração Firebase</h3>
              <Badge className="bg-green-500">Conectado</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project ID</Label>
                  <Input value="bola-de-neve-atlas" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Input value="Production" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Domínios Autorizados</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">localhost</Badge>
                  <Badge variant="secondary">atlas-conectados.netlify.app</Badge>
                  <Badge variant="secondary">boladeneve.com</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Authentication Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configurações de Autenticação</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email/Password</Label>
                  <p className="text-sm text-muted-foreground">Permitir login com email e senha</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Google Sign-In</Label>
                  <p className="text-sm text-muted-foreground">Permitir login com Google</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Link (Passwordless)</Label>
                  <p className="text-sm text-muted-foreground">Login via link mágico por email</p>
                </div>
                <Switch checked disabled />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Domínios Permitidos</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">@boladeneve.com</Badge>
                  <Badge variant="outline">@teste.com</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Email Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configuração de Email</h3>
              <Badge className="bg-green-500">Configurado</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provedor SMTP</Label>
                  <Input value="Gmail SMTP" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email Remetente</Label>
                  <Input value="noreply@boladeneve.com" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Template de Convite</Label>
                <p className="text-sm text-muted-foreground">
                  Template React responsivo para convites por email
                </p>
              </div>
            </div>
          </Card>

          {/* WhatsApp Integration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Integração WhatsApp</h3>
              <Badge className="bg-green-500">Z-API Ativo</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Input value="Z-API" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value="Conectado" disabled />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Envio Automático de Convites</Label>
                  <p className="text-sm text-muted-foreground">Enviar convites via WhatsApp automaticamente</p>
                </div>
                <Switch checked disabled />
              </div>
            </div>
          </Card>

          {/* Maps Configuration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Map className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configuração de Mapas</h3>
              <Badge className="bg-green-500">Google Maps</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provedor de Mapas</Label>
                  <Input value="Google Maps API" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Geocodificação</Label>
                  <Input value="Nominatim (OpenStreetMap)" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Região Padrão</Label>
                <Input value="Brasil (country=br)" disabled />
              </div>
            </div>
          </Card>

          {/* System Maintenance */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Manutenção do Sistema</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline">
                  <Link href="/admin/bootstrap">
                    <Shield className="h-4 w-4 mr-2" />
                    Bootstrap Inicial
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/debug">
                    <Database className="h-4 w-4 mr-2" />
                    Ferramentas Debug
                  </Link>
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Versão do Sistema</Label>
                <p className="text-sm text-muted-foreground">Conectados.co v1.0.0</p>
              </div>
              <div className="space-y-2">
                <Label>Última Atualização</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Configurações de Segurança</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Verificação de Domínio</Label>
                  <p className="text-sm text-muted-foreground">Verificar domínio de email nos convites</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Logs de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">Registrar ações administrativas</p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Controle de Permissões</Label>
                  <p className="text-sm text-muted-foreground">Hierarquia de funções ativa</p>
                </div>
                <Switch checked disabled />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
