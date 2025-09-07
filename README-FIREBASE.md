Configuração do Firebase

1) Crie um projeto no Firebase e ative:
- Authentication > Sign-in method > Email/Password (habilite Email link / link mágico).
- Firestore Database (modo de produção).
- Adicione o domínio da sua implantação (ex.: seu-projeto.vercel.app) em Authentication > Settings > Authorized domains.

2) Variáveis de ambiente (Vercel):
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

3) Regras Firestore (simplificadas — ajuste antes de produção):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /invites/{id} {
      allow create: if request.auth != null; // restrinja a admins
      allow read, update: if request.auth != null;
    }
    match /places/{id} {
      allow read: if true;
      allow create, update: if request.auth != null;
    }
    match /rooms/{roomId}/messages/{msgId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}

4) Fluxo de convites:
- Admin cria convite em /admin/convites (email + função).
- O app cria um documento em invites e envia “link mágico” do Firebase.
- O convidado clica no link, autentica e vai para /complete-profile para concluir e, se for pastor, cadastrar a igreja (com geocodificação).
- As igrejas, núcleos e células ficam na coleção places (com campo kind: "igreja" | "nucleo" | "celula").

5) Mapa:
- A página /mapa escuta a coleção places em tempo real e plota pontos com cluster.
- Em produção, mude as regras para "request.auth != null".

6) Chat:
- Sala padrão “avisos-oficiais” em /chat, com mensagens em tempo real na subcoleção rooms/{ROOM}/messages.
- Exige login.

Cotas e alternativas de login:
- Erro auth/quota-exceeded: a cota diária de e-mails foi atingida no modo "Email link".
- Alternativas:
  1) Habilite "Google" (Authentication > Sign-in method) e use "Entrar com Google".
  2) Habilite "Email/Password" e use o fluxo de e-mail e senha (já disponível na tela de login).
  3) Faça upgrade para o plano Blaze para limites mais altos, ou aguarde a renovação diária da cota.
- Lembre-se de adicionar seus domínios em Authentication > Settings > Authorized domains.

Atualização importante sobre o erro de Firestore (Listen transport errored)

Se você ver no console algo como:
@firebase/firestore: ... RPC 'Listen' transport errored

Causa comum: as Regras do Firestore bloquearam a leitura (permission-denied) porque você não está autenticado ou as Regras estão no modo “bloqueado”.

Como corrigir rapidamente para desenvolvimento:
1) Em Firestore Database → Rules, publique as regras do arquivo scripts/firestore.rules (leitura pública da coleção places somente para DEV).
2) Faça login em /login (E‑mail e senha ou Google).
3) Para chat e convites, o login é obrigatório.

Rotas e acesso:
- /mapa: lê places em tempo real. Com as regras de DEV, funciona mesmo sem login; em produção, mude para "request.auth != null".
- /admin/bootstrap: use para promover a sua conta atual a admin.
- /admin/convites: visível apenas para admins.
- /chat: exige login.

Dúvidas? Verifique também:
- Authentication → Settings → Authorized domains (adicione seu domínio).
- Authentication → Sign-in method (habilite Email/Password e, opcionalmente, Google).

Próximos passos:
- Criar painéis para: pastores locais convidarem supervisores; supervisores convidarem líderes; líderes cadastrarem células (reutilize o fluxo de convite e o formulário de endereço da igreja, mudando kind para "celula" e vinculando churchId).
- Restringir convites por papel (security rules + verificação no cliente).
- Adicionar “região” e “churchId” nos perfis e filtros no mapa (fácil).
