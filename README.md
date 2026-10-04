# Gestão Lions — Controle de Mesas e Senhas

Aplicação web para gestão de mesas e venda de senhas do **Forró do Lions** (Lions Clube Arcoverde), com sincronização em tempo real entre operadores, relatórios em PDF e autenticação via Supabase.

## Funcionalidades

- 🗺️ **Mapa interativo de mesas** — layout oficial do salão (palco, pista e 36 mesas) com busca por nome/número e exportação em PNG.
- 🎟️ **Venda de senhas individuais** — registro rápido com máscara de telefone e total calculado automaticamente.
- 📊 **Dashboard em tempo real** — indicadores de ocupação e arrecadação atualizados via Realtime.
- 📄 **Relatórios** — exportação em PDF (individual e consolidado) e cópia formatada para WhatsApp.
- 🔐 **Autenticação** — acesso restrito a operadores cadastrados (Supabase Auth + Row Level Security).

## Stack

| Camada     | Tecnologia                          |
| ---------- | ----------------------------------- |
| Frontend   | React 19 + TypeScript + Vite        |
| Estilo     | Tailwind CSS                        |
| Backend    | Supabase (Postgres, Auth, Realtime) |
| Qualidade  | ESLint, Prettier, Vitest            |

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local com a URL e a chave anon do seu projeto Supabase

# 3. Aplique o schema do banco (uma vez)
#    Cole supabase/migrations/0001_initial_schema.sql no SQL Editor do Supabase,
#    ou use: npx supabase db push

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## Scripts

| Comando             | Descrição                                    |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento com hot reload   |
| `npm run build`     | Verificação de tipos + build de produção     |
| `npm run preview`   | Serve o build de produção localmente         |
| `npm test`          | Testes unitários (Vitest)                    |
| `npm run lint`      | Análise estática (ESLint)                    |
| `npm run format`    | Formatação com Prettier                      |

## Estrutura do projeto

```
src/
├── components/        # Telas e componentes de UI (inclui ui/ reutilizáveis)
├── hooks/             # Hooks customizados (ex.: useRealtime)
├── integrations/      # Cliente Supabase
├── lib/               # Utilitários puros, validação de env e geração de relatórios
├── services/          # Camada de acesso a dados (api)
├── types.ts           # Tipos de domínio compartilhados
└── constants.ts       # Valores e configurações do evento
supabase/migrations/   # Schema SQL versionado (tabelas, triggers, RLS, seed)
tests/                 # Testes unitários
```

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Ajuste o campo `build.command` nas *Settings* para `npm run build` (o padrão do template usa `npm run build && npm run preview`, que não finaliza em CI).

## Segurança

- As credenciais do Supabase vêm **exclusivamente** de variáveis de ambiente e são validadas no boot (`src/lib/env.ts`). Nunca faça commit de `.env*` reais.
- O banco aplica **Row Level Security**: apenas usuários autenticados leem/escrevem.
- Regras de integridade (valor da senha, transições de status de mesa, `updated_at`) são garantidas por **triggers/checks no servidor**, não apenas no cliente.

## Contribuindo

1. Crie um branch a partir de `main`.
2. Rodre `npm run lint && npm test && npm run build` antes de abrir PR.
3. O CI executa formatação, lint, testes e build automaticamente.
