# Cadence UI

The web interface for the Cadence AI Orchestration Platform, built with [Nuxt 4](https://nuxt.com)
and [Nuxt UI v4](https://ui.nuxt.com).

## Features

- **Multi-tenant**: organization selection with role-based access
- **Role-based navigation**: sys_admin, org_admin, and user views
- **Real-time chat**: SSE streaming with agent event trace
- **Orchestrator management**: create, load/unload, configure, monitor tiers
- **Plugin management**: upload and manage org and system plugins
- **BYOK LLM configs**: org-level API key management
- **Admin panel**: global settings, pool stats, system health (sys_admin only)

## Architecture

All API calls are proxied through the Nuxt server (`server/api/[...path].ts`), which:

- Injects the JWT as a `Bearer` token from an httpOnly cookie (`cadence-token`)
- Handles SSE streaming for the chat endpoint
- Sets/clears the auth cookie on login/logout

The browser never touches the raw JWT — it only holds a non-sensitive org selection cookie (`cadence-org-id`).

## Setup

Install dependencies:

```bash
pnpm install
```

Configure the backend URL (defaults to `http://localhost:8000`):

```bash
# .env
NUXT_BACKEND_URL=http://localhost:8000
```

## Development

```bash
pnpm dev
```

Opens at `http://localhost:3000`. The Nuxt server proxies `/api/**` to the Cadence backend.

## Production

```bash
pnpm build
pnpm preview
```
