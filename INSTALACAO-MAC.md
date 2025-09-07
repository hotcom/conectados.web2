# 🍎 Instalação no Mac - Atlas Conectados

## 📋 Pré-requisitos

### 1. 🟢 Node.js (versão 18+)
\`\`\`bash
# Verificar se já tem instalado
node --version
npm --version

# Se não tiver, instalar via Homebrew
brew install node

# Ou baixar direto do site
# https://nodejs.org/
\`\`\`

### 2. 🔥 Firebase CLI
\`\`\`bash
npm install -g firebase-tools
firebase login
\`\`\`

### 3. 🗄️ Supabase CLI (opcional)
\`\`\`bash
npm install -g supabase
\`\`\`

## 🚀 Instalação Passo a Passo

### Passo 1: 📁 Criar Estrutura do Projeto
\`\`\`bash
# Criar pasta principal
mkdir atlas-conectados
cd atlas-conectados

# Criar estrutura backend
mkdir -p backend/src/{lib,app/api,scripts}
mkdir -p backend/src/app/api/{auth,users,churches,admin,debug,health}

# Criar estrutura frontend
mkdir -p frontend-web/src/{app,components,contexts,lib}
mkdir -p frontend-web/src/app/{login,dashboard,users,churches,bootstrap,debug}
mkdir -p frontend-web/src/components/ui

# Criar pastas para dados
mkdir -p data
mkdir -p scripts/sql
mkdir -p shared/types
\`\`\`

### Passo 2: 📦 Configurar Backend
\`\`\`bash
cd backend

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "atlas-conectados-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "create-admin": "tsx src/scripts/create-admin.ts",
    "create-test-users": "tsx src/scripts/create-test-users.ts"
  },
  "dependencies": {
    "next": "14.2.25",
    "react": "^19",
    "react-dom": "^19",
    "firebase-admin": "13.5.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "3.25.67",
    "axios": "1.11.0",
    "crypto-js": "^4.1.1",
    "nodemailer": "7.0.6",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.14",
    "@types/cors": "^2.8.17",
    "typescript": "^5",
    "tsx": "^4.7.0",
    "eslint": "^8.51.0",
    "eslint-config-next": "14.2.25"
  }
}
EOF

# Instalar dependências
npm install
\`\`\`

### Passo 3: 🖥️ Configurar Frontend
\`\`\`bash
cd ../frontend-web

# Usar o package.json que você já tem
npm install
\`\`\`

### Passo 4: 🔧 Configurar Variáveis de Ambiente

#### Backend (.env)
\`\`\`bash
cd ../backend
cat > .env << 'EOF'
# Ambiente
NODE_ENV=development

# Domínios permitidos
ALLOWED_EMAIL_DOMAINS=teste.com,boladeneve.com
PRODUCTION_DOMAIN=boladeneve.com

# Firebase Admin
FIREBASE_PROJECT_ID=seu-projeto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-chave-privada\n-----END PRIVATE KEY-----"

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app

# Z-API WhatsApp
ZAPI_INSTANCE_ID=sua-instancia-zapi
ZAPI_TOKEN=seu-token-zapi

# Google Maps
GOOGLE_MAPS_API_KEY=sua-chave-google-maps

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
EOF
\`\`\`

#### Frontend (.env.local)
\`\`\`bash
cd ../frontend-web
cat > .env.local << 'EOF'
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-chave-google-maps

# Ambiente
NEXT_PUBLIC_NODE_ENV=development
EOF
\`\`\`

### Passo 5: 🔥 Configurar Firebase

#### 1. Criar projeto no Firebase Console
\`\`\`bash
# Acessar: https://console.firebase.google.com/
# Criar novo projeto: "atlas-conectados"
# Ativar Authentication > Email/Password
# Ativar Firestore Database
\`\`\`

#### 2. Configurar Firebase Admin
\`\`\`bash
cd backend
# Baixar chave privada do Firebase Console
# Service Accounts > Generate new private key
# Salvar como: firebase-admin-key.json
\`\`\`

#### 3. Configurar Firebase Client
\`\`\`bash
cd ../frontend-web
# Copiar configuração do Firebase Console
# Project Settings > Your apps > Web app
\`\`\`

### Passo 6: 🗄️ Configurar Supabase (Opcional)

\`\`\`bash
# Criar projeto no Supabase
# Copiar URL e anon key
# Adicionar ao .env:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
\`\`\`

## 🏃‍♂️ Executar o Projeto

### Terminal 1: Backend
\`\`\`bash
cd backend
npm run dev
# Rodará em: http://localhost:3001
\`\`\`

### Terminal 2: Frontend
\`\`\`bash
cd frontend-web
npm run dev
# Rodará em: http://localhost:3000
\`\`\`

## 🧪 Testar o Sistema

### 1. 🏗️ Bootstrap Inicial
\`\`\`bash
# Acessar: http://localhost:3000/bootstrap
# Criar usuário admin
\`\`\`

### 2. 🔐 Fazer Login
\`\`\`bash
# Acessar: http://localhost:3000/login
# Email: admin@teste.com
# Senha: Admin123456
\`\`\`

### 3. ✅ Verificar Funcionalidades
- Dashboard: http://localhost:3000/dashboard
- Usuários: http://localhost:3000/users
- Igrejas: http://localhost:3000/churches
- Debug: http://localhost:3000/debug

## 🔧 Scripts Úteis

\`\`\`bash
# Backend
npm run create-admin          # Criar admin
npm run create-test-users     # Criar usuários teste
npm run dev                   # Desenvolvimento
npm run build                 # Build produção

# Frontend
npm run dev                   # Desenvolvimento
npm run build                 # Build produção
npm run lint                  # Verificar código
\`\`\`

## 🐛 Troubleshooting

### Erro: "Module not found"
\`\`\`bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Erro: "Firebase not initialized"
\`\`\`bash
# Verificar se .env está configurado
# Verificar se firebase-admin-key.json existe
\`\`\`

### Erro: "Port already in use"
\`\`\`bash
# Matar processos nas portas
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
\`\`\`

### Erro: "Permission denied"
\`\`\`bash
# Dar permissão aos scripts
chmod +x setup.sh
chmod +x scripts/*.sh
\`\`\`

## 📱 Próximos Passos

1. ✅ **Testar todas as funcionalidades**
2. 🔧 **Configurar domínio personalizado**
3. 🚀 **Deploy na Vercel/Railway**
4. 📱 **Implementar chat system**
5. 🎥 **Adicionar videochamadas**

## 🆘 Suporte

Se tiver problemas:
1. Verificar logs no terminal
2. Verificar variáveis de ambiente
3. Verificar se Firebase está configurado
4. Verificar se portas estão livres

Tudo pronto para rodar! 🎉
\`\`\`

Agora vou criar um script de verificação do sistema:
