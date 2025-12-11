# Vend Backend

Backend da plataforma Vend - Sistema de atendimento WhatsApp

## Tecnologias

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- WebSockets (Socket.IO)
- Argon2 (hash de senhas)
- JWT (autenticação)

## Instalação

```bash
# Instalar dependências
npm install

# Subir banco de dados e Redis
docker-compose up -d

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Rodar aplicação em desenvolvimento
npm run start:dev
```

## Configuração

Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente.

## Estrutura

```
src/
├── auth/              # Autenticação JWT
├── users/             # Usuários
├── segments/          # Segmentos
├── tabulations/       # Tabulações
├── contacts/          # Contatos
├── campaigns/         # Campanhas
├── blocklist/         # Lista de bloqueio
├── lines/             # Linhas WhatsApp
├── evolution/         # Configuração Evolution API
├── conversations/     # Conversas
├── websocket/         # Gateway WebSocket
├── webhooks/          # Webhooks Evolution
└── common/            # Guards, Decorators, etc
```

## Endpoints Principais

### Auth
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Usuário atual

### Users
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Conversations
- `GET /conversations/active` - Conversas ativas
- `GET /conversations/contact/:phone` - Conversas por telefone
- `POST /conversations/tabulate/:phone` - Tabular conversa

### Campaigns
- `POST /campaigns` - Criar campanha
- `POST /campaigns/:id/upload` - Upload CSV
- `GET /campaigns/stats/:name` - Estatísticas

### Lines
- `POST /lines` - Criar linha
- `GET /lines/:id/qrcode` - Obter QR Code
- `POST /lines/:id/ban` - Marcar como banida

## WebSockets

Eventos:
- `send-message` - Enviar mensagem
- `new-message` - Nova mensagem recebida
- `active-conversations` - Conversas ativas
- `conversation-tabulated` - Conversa tabulada

## Webhooks

- `POST /webhooks/evolution` - Webhook Evolution API

## Licença

Proprietário
