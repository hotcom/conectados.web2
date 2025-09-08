# Correção dos Erros de Firebase

## Problemas Identificados

1. **Erro de permissão Firestore**: `Missing or insufficient permissions`
2. **Erro de credenciais**: `auth/invalid-credential`
3. **Regras muito restritivas** causando falha no acesso

## Soluções Aplicadas

### 1. Regras Firestore Simplificadas

Criado `scripts/firestore-rules-simple.rules` com regras mais permissivas:
- Acesso público para leitura de igrejas (homepage)
- Usuários logados podem acessar suas próprias informações
- Admin específico tem acesso total
- Regras simplificadas evitam erros de referência circular

### 2. Como Aplicar as Novas Regras

**Opção 1: Via Firebase Console**
1. Acesse https://console.firebase.google.com
2. Selecione o projeto `bdn-unidades`
3. Vá em **Firestore Database** > **Rules**
4. Copie o conteúdo de `scripts/firestore-rules-simple.rules`
5. Cole e clique em **Publish**

**Opção 2: Via CLI (se configurado)**
```bash
firebase login
firebase use bdn-unidades
firebase deploy --only firestore:rules
```

### 3. Verificar Credenciais de Login

Confirme se o usuário `admin@teste.com` existe no Firebase Authentication:
1. Acesse Firebase Console > Authentication > Users
2. Se não existir, crie o usuário
3. Defina uma senha conhecida

### 4. Testar Localmente

Após aplicar as regras:
1. Reinicie o servidor local: `npm run dev`
2. Teste o login com credenciais válidas
3. Verifique se as igrejas carregam na homepage

## Regras Aplicadas

- **Leitura pública**: Igrejas podem ser listas sem login
- **Usuários logados**: Acesso completo aos próprios dados
- **Admin específico**: UID `mRzTEJdYZhZWItSC4uzMylVkiGw1` tem acesso total
- **Convites e Chat**: Acesso para usuários autenticados

## Próximos Passos

1. Aplicar as regras no Firebase Console
2. Testar o login local
3. Verificar se erros de permissão foram resolvidos
4. Retornar às regras complexas após confirmar funcionamento básico
