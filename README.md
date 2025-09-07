# 🌐 Conectados.co

Sistema completo de gestão para Igreja Bola de Neve com autenticação Firebase, convites automáticos, mapa interativo e chat hierárquico.

## 🚀 Quick Start

### 1. 📥 Download do Projeto
\`\`\`bash
# Baixar do v0 ou clonar repositório
# Extrair para pasta conectados-co/
\`\`\`

### 2. 🔧 Instalação Rápida
\`\`\`bash
# Executar script de verificação
chmod +x check-system.sh
./check-system.sh

# Instalar dependências
cd backend && npm install
cd ../frontend-web && npm install
\`\`\`

### 3. ⚙️ Configuração
\`\`\`bash
# Copiar arquivos de exemplo
cp backend/.env.example backend/.env
cp frontend-web/.env.example frontend-web/.env.local

# Editar com suas credenciais
nano backend/.env
nano frontend-web/.env.local
\`\`\`

### 4. 🏃‍♂️ Executar
\`\`\`bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend-web && npm run dev
\`\`\`

### 5. 🧪 Testar
\`\`\`bash
# Acessar: http://localhost:3000
# Bootstrap: http://localhost:3000/bootstrap
# Login: admin@teste.com / Admin123456
\`\`\`

## 📚 Documentação Completa

- 📖 [Instalação Detalhada](INSTALACAO-MAC.md)
- 🔥 [Configuração Firebase](README-FIREBASE.md)
- 🗄️ [Integração Supabase](README-PLUG-SUPABASE.md)
- 🌐 [Configuração Domínios](DOMAIN-CONFIG.md)

## 🏗️ Arquitetura

\`\`\`
conectados-co/
├── backend/           # API Node.js + Firebase
├── frontend-web/      # Interface Next.js + React
├── shared/           # Types compartilhados
├── data/            # Dados geográficos
└── scripts/         # Scripts utilitários
\`\`\`

## ✨ Funcionalidades

- 🔐 **Autenticação Firebase** - Login seguro
- 👥 **Gestão de Usuários** - CRUD + hierarquia
- ⛪ **Gestão de Igrejas** - Cadastro + mapa
- 📧 **Sistema de Email** - Convites automáticos
- 📱 **WhatsApp Z-API** - Notificações
- 🗺️ **Mapas Interativos** - Google Maps
- 🛡️ **Controle de Acesso** - Por função
- 📊 **Dashboard Analytics** - Métricas

## 🎯 Próximos Passos

- [ ] 💬 Sistema de Chat
- [ ] 📹 Videochamadas Jitsi
- [ ] 📱 App Mobile
- [ ] 🔔 Push Notifications

## 🆘 Suporte

Problemas? Verifique:
1. Node.js 18+ instalado
2. Variáveis de ambiente configuradas
3. Firebase projeto criado
4. Portas 3000/3001 livres

---

**Desenvolvido com ❤️ - Conectados.co**
