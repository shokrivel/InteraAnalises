# InteraAnalises

Plataforma de análise laboratorial inteligente desenvolvida pela InteraSaúde.

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **IA:** Google Gemini 2.0 Flash
- **Mapas:** Google Maps API

## Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Rodar localmente
npm run dev
```

## Estrutura

```
src/
├── pages/
│   ├── Index.tsx          # Landing page
│   ├── auth/Login.tsx     # Autenticação
│   ├── app/               # Área do paciente
│   └── admin/             # Painel administrativo
├── components/
│   ├── layout/            # Guards de rota (AdminRoute, ProtectedRoute)
│   └── ui/                # Componentes shadcn
├── hooks/useAuth.ts       # Hook de autenticação com rate limiting
└── integrations/supabase/ # Cliente Supabase
```

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | Chave da API Google Maps |

## Secrets nas Edge Functions (Supabase)

| Secret | Descrição |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API Key |
| `GOOGLE_MAPS_KEY` | Google Maps API Key |
| `RESEND_API_KEY` | Chave do Resend (e-mails) |

## Deploy

Conectado ao projeto Vercel `project-mqdki`. Configure as variáveis de ambiente no painel da Vercel antes do primeiro deploy.
