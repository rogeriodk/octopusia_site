# Homologação automatizada

Fluxo: `homologacao` → CI → gatilho EasyPanel → `/health` valida o `GIT_SHA` exato → smoke/regressão → relatórios sanitizados em `homologacao-reports`.

## Configuração externa única

GitHub Actions Secret: `EASYPANEL_DEPLOY_URL`.

GitHub Actions Variable: `HOMOLOG_BASE_URL` (URL pública da homologação, sem barra final).

EasyPanel: repository `rogeriodk/octopusia_site`, branch `homologacao`, Build Path `/`, Dockerfile `Dockerfile`, porta `3000`, environment `APP_ENV=homologacao`.

O EasyPanel fornece `GIT_SHA` em deployments de repositório; o Dockerfile preserva o valor para que `/health` confirme a revisão realmente implantada.

## Formulário de contato (leads)

`POST /api/lead` grava cada contato em `LEADS_DIR/leads.jsonl` (padrão `/tmp/octopus-leads`, que se perde a cada deploy).
No EasyPanel, crie um volume montado em `/app/data` e defina `LEADS_DIR=/app/data/leads`.
`LEAD_WEBHOOK_URL` (opcional) recebe cada lead em JSON. Canais públicos (e-mail, WhatsApp, CNPJ) ficam em `src/lib/contact.ts`.

## Conversas da IA do site

Cada pergunta e resposta do chat é gravada sem identificação (e-mails, telefones, CPF e CNPJ são trocados por marcadores) em `CHAT_LOG_DIR/chats-AAAA-MM-DD.jsonl` (padrão `/tmp/octopus-chats`). Arquivos com mais de 90 dias são apagados automaticamente. No EasyPanel, use `CHAT_LOG_DIR=/app/data/chats` no mesmo volume dos leads.

Quando o visitante toca em "Enviar esta conversa para a equipe" e consente, a conversa vai junto com o lead (`source: "chat"`, campo `transcript`).
