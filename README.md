# Bluesky Like and Repost Bot

Este bot automatiza a tarefa de curtir posts com hashtags específicas e repostar menções ao seu usuário na plataforma Bluesky.

## Requisitos

- Node.js 14+
- TypeScript
- Conta na Bluesky

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/bluesky-like-repost-bot.git
   cd bluesky-like-repost-bot
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o TypeScript:
   ```bash
   npx tsc
   ```

## Configuração

1. Renomeie `.env.example` para `.env` e adicione suas credenciais da Bluesky:
   ```
   IDENTIFIER=seu_identificador
   PASSWORD=sua_senha
   ```

2. No arquivo `likeAndRepostBot.ts`, edite a variável `hashtags` para incluir as hashtags que você deseja monitorar:
   ```typescript
   const hashtags = ['#bolhadev', '#outraHashtag'];
   ```

## Execução

Execute o bot com o seguinte comando:
```bash
npx ts-node likeAndRepostBot.ts
```

## Funcionalidades

- Curtir posts que contêm hashtags específicas.
- Repostar menções ao seu usuário.
- Operar em intervalos definidos (padrão: 25 minutos).

## Licença

Licenciado sob a MIT License.
