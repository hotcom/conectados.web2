# 🌐 Configuração de Domínios

Este documento explica como configurar os domínios permitidos para autenticação no sistema.

## 🧪 Modo Desenvolvimento

### Configuração
\`\`\`bash
# backend/.env
NODE_ENV=development
ALLOWED_EMAIL_DOMAINS=teste.com,boladeneve.com
PRODUCTION_DOMAIN=boladeneve.com
\`\`\`

### Características
- ✅ Permite múltiplos domínios: `@teste.com`, `@boladeneve.com`
- 🧪 Usuários de teste disponíveis
- 🔧 APIs de debug habilitadas
- 📱 Interface mostra ambiente de desenvolvimento

### Usuários de Teste
\`\`\`bash
# Criar usuários de teste
cd backend
npm run create-test-users

# Usuários criados:
admin@teste.com          # Presidência
pastor@teste.com         # Pastor Regional  
secretaria@teste.com     # Secretaria
pastor.local@teste.com   # Pastor Local
missionario@teste.com    # Missionário de Núcleo

# Senha padrão: Admin123456
\`\`\`

## 🔒 Modo Produção

### Configuração
\`\`\`bash
# backend/.env
NODE_ENV=production
ALLOWED_EMAIL_DOMAINS=boladeneve.com
PRODUCTION_DOMAIN=boladeneve.com
\`\`\`

### Características
- 🔒 Apenas domínio oficial: `@boladeneve.com`
- 🛡️ Segurança máxima
- 📊 APIs de debug desabilitadas
- 🎯 Interface limpa para produção

## 🚀 Como Alternar

### Para Desenvolvimento
\`\`\`bash
# 1. Configurar variáveis
echo "NODE_ENV=development" >> backend/.env
echo "ALLOWED_EMAIL_DOMAINS=teste.com,boladeneve.com" >> backend/.env

# 2. Criar usuários de teste
cd backend && npm run create-test-users

# 3. Reiniciar serviços
npm run dev
\`\`\`

### Para Produção
\`\`\`bash
# 1. Configurar variáveis
echo "NODE_ENV=production" >> backend/.env
echo "ALLOWED_EMAIL_DOMAINS=boladeneve.com" >> backend/.env

# 2. Reiniciar serviços
npm run build && npm start
\`\`\`

## 🔍 Debug

### Verificar Configuração Atual
\`\`\`bash
# API de debug (apenas desenvolvimento)
GET /api/debug/domains

# Resposta:
{
  "success": true,
  "data": {
    "environment": "development",
    "allowedDomains": ["teste.com", "boladeneve.com"],
    "isDevelopment": true,
    "message": "🧪 Modo desenvolvimento - Múltiplos domínios permitidos"
  }
}
\`\`\`

### Logs do Sistema
\`\`\`bash
# Backend logs mostram:
🚀 Criando usuário admin para ambiente: development
📧 Email: admin@teste.com  
🌐 Domínios permitidos: teste.com, boladeneve.com
\`\`\`

## 📋 Checklist de Deploy

### Antes do Deploy
- [ ] Configurar `NODE_ENV=production`
- [ ] Definir `PRODUCTION_DOMAIN=boladeneve.com`
- [ ] Remover `ALLOWED_EMAIL_DOMAINS` ou definir apenas `boladeneve.com`
- [ ] Testar login com email @boladeneve.com
- [ ] Verificar que APIs de debug estão desabilitadas

### Após Deploy
- [ ] Confirmar que apenas @boladeneve.com funciona
- [ ] Testar fluxo completo de convites
- [ ] Verificar logs de produção
- [ ] Monitorar tentativas de login inválidas

## 🎯 Fluxo de Convites

### Desenvolvimento
\`\`\`
admin@teste.com convida → pastor.novo@teste.com
✅ Email enviado
✅ WhatsApp enviado  
✅ Link funciona
\`\`\`

### Produção
\`\`\`
admin@boladeneve.com convida → pastor.novo@boladeneve.com
✅ Email enviado
✅ WhatsApp enviado
✅ Link funciona
❌ Outros domínios rejeitados
\`\`\`

## 🛠️ Scripts Úteis

\`\`\`bash
# Criar admin de desenvolvimento
npm run create-admin

# Criar usuários de teste
npm run create-test-users

# Verificar configuração
curl localhost:3001/api/debug/domains

# Limpar usuários de teste (cuidado!)
# npm run clean-test-users
