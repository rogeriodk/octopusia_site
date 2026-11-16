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
