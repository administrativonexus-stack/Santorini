# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (also runs TypeScript check)
npm run lint         # ESLint
npx shadcn@latest add <component>   # Add a Shadcn/UI component
```

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | TailwindCSS v4, Shadcn/UI v4, Framer Motion |
| Component lib | `@base-ui/react` (not Radix — **no `asChild` prop**) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe (Phase 3, not yet implemented) |
| Deploy | Vercel |

## Key Architecture Rules

### Route structure
Routes use **URL-prefixed folders**, not route groups, to avoid path conflicts:
- `app/(public)/` → `/`, `/login`, `/register` (no auth)
- `app/client/` → `/client/*` (client auth guard in `app/client/layout.tsx`)
- `app/barber/` → `/barber/*` (barber auth guard)
- `app/admin/` → `/admin/*` (owner/admin auth guard)

### Middleware → Proxy
Next.js 16 renames middleware: `proxy.ts` in root (not `middleware.ts`). Export must be named `proxy`, not `middleware`.

### Buttons with Links
`Button` from Shadcn v4 uses `@base-ui/react` — **`asChild` prop does not exist**. Use `buttonVariants` + Link instead:
```tsx
import { buttonVariants } from "@/components/ui/button";
<Link href="/path" className={cn(buttonVariants({ variant: "outline" }))}>Label</Link>
```

### Supabase Clients
- **Browser**: `lib/supabase/client.ts` → `createClient()` (call inside handlers/effects, not at module level to avoid prerender errors)
- **Server**: `lib/supabase/server.ts` → `await createClient()` — usar apenas para `auth.getSession()`. **Não usar para queries de banco** pois o JWT não propaga para o PostgREST nesta versão do @supabase/ssr.
- **Admin**: `lib/supabase/admin.ts` → `createAdminClient()` — service role key, bypassa RLS. Usar em Server Components para todas as queries de banco após validar sessão.

### Padrão obrigatório em Server Components (layouts e pages)
```ts
// ✅ CORRETO
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect("/login");
const admin = createAdminClient();
const { data } = await admin.from("tabela").select("*").eq("id", session.user.id);

// ❌ ERRADO — getUser() falha em SSR nesta configuração
const { data: { user } } = await supabase.auth.getUser();
```

### Database Types
`types/database.ts` is manually written. Each table **must include `Relationships: [...]`** (even `[]`) for the Supabase v2 TypeScript generics to resolve correctly. Without it, `insert()` and `update()` type as `never`.

### Auth & RBAC
Roles: `client | barber | owner | admin`. Role stored in `profiles.role`. `proxy.ts` enforces route access. Each authenticated layout (`client/layout.tsx`, etc.) also checks role server-side as a second guard.

### Design System
Always dark — no light mode. The app sets `class="dark"` on `<html>`. CSS variables are defined in `globals.css` for the BARBERFLIX palette:
- `--primary` → dourado/bege `#C9A96E`
- `--background` → preto premium `#0A0A0A`
- `--foreground` → branco suave `#F5F0E8`
- `--font-heading` → Playfair Display (apply with `font-heading` utility)
- `--font-sans` → Inter

## Database Migrations

SQL migrations live in `supabase/migrations/` (numbered 001–007). Apply them in order in the Supabase SQL editor or via `supabase db push` after linking the project:

```bash
supabase link --project-ref <ref>
supabase db push
```

### Business Rules enforced at DB level
- `appointments`: unique partial index `one_active_appointment_per_client` — only 1 active appointment (`pending | confirmed | in_progress`) per client at a time. Code 23505 = constraint violation.
- All tables have RLS enabled. Role-based policies use subqueries against `profiles.role`.

## Environment Variables

Fill in `.env.local` from Supabase Dashboard → Project Settings → API:
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only
```

## Phase 3+ (Not Yet Implemented)
- Stripe integration (`app/api/webhooks/stripe/route.ts` placeholder)
- WhatsApp via Evolution API
- AI features (OpenAI)
- VIP subscription checkout flow (subscription page shows WhatsApp contact as placeholder)
