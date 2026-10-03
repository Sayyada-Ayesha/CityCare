# CityCare AI

CityCare AI is an independent civic technology project designed to help citizens report local issues, classify them into the right service category, and track complaint status without a user account or paid API dependency.

## Overview

The project turns a simple public issue description into a structured complaint that can be reviewed, edited, and submitted. The system supports anonymous citizen reporting, local AI analysis in the browser, and a lightweight admin review flow.

## Problem

Many citizens need a quick and understandable way to report local civic issues such as streetlights, water outages, garbage, road damage, and drainage problems. These issues often require service routing and status tracking, but most reporting tools are fragmented, require accounts, or depend on paid services.

## Solution

CityCare AI provides a privacy-conscious, browser-local workflow:

- anonymous citizen identity stored locally in the browser
- local AI inference using WebLLM and WebGPU when available
- manual fallback if AI is unavailable
- structured complaint drafting and review
- service category suggestions from a configurable directory
- complaint status tracking and admin review

## Features

- Anonymous citizen reporting without registration
- Browser-local AI analysis through WebLLM
- Manual submission fallback
- Complaint status lifecycle: SUBMITTED, IN_REVIEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
- Admin PIN validation on the server side only
- Configurable authority directory
- Evidence upload with browser-side image validation and compression
- Map location picking through Leaflet and OpenStreetMap tiles
- Dashboard for citizen and admin use

## AI functionality

The frontend includes modular AI agents under the `src/ai` tree. The agents are:

- Issue Understanding Agent
- Authority Routing Agent
- Evidence Agent
- Complaint Generation Agent
- Status Agent
- Civic Assistant Agent

The complaint workflow orchestrator sequences those agents and validates outputs with Zod JSON schemas.

## Architecture

- Frontend: Vue 3, TypeScript, Vite, Tailwind-like utility styling
- State: Pinia
- Routing: Vue Router
- Mapping: Leaflet + OpenStreetMap
- AI: WebLLM with WebGPU support
- Backend: Cloudflare Workers and D1
- Database: Cloudflare D1 + SQLite-compatible SQL schema

## Anonymous citizen system

The app does not require a login or external OAuth. On first visit, it creates a random anonymous citizen token and stores it locally in the browser. The app hashes that token before storing it in complaint records; the raw token is never persisted.

## Admin system

Admin access uses a single server-side secret, `CITYCARE_ADMIN_PIN`, validated in the Cloudflare Functions layer. The secret is never exposed in frontend code or the Vite build. Browser session state is kept only in memory or session storage.

## AI privacy architecture

- AI runs in the browser, not behind a paid cloud API
- no external API keys are required for inference
- model downloads happen in the browser on first use
- no raw citizen token is stored in the database
- the admin PIN is sent only to the same-origin Worker over HTTPS and is not persisted in local storage
- citizen-specific API responses are excluded from service-worker caches

## Setup

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

No `.env` file is required for the frontend. Never put `CITYCARE_ADMIN_PIN` in a `VITE_*` variable, `.env`, source code, or a committed file. For local Workers development, put a local PIN in the ignored `.dev.vars` file; for production, configure it as a Cloudflare secret.

## Development

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run test` — run Vitest
- `npm run lint` — run ESLint
- `npm run typecheck` — run Vue TypeScript validation

## Cloudflare Workers deployment

The application uses Cloudflare Workers with Static Assets and D1. It uses no paid APIs, AI keys, OAuth providers, or remote inference service. WebLLM downloads its model and runs inference in the visitor's browser using WebGPU. Map tiles use OpenStreetMap's public tile service and are subject to its usage policy; it provides no CityCare SLA.

### Cloudflare setup

1. In the Cloudflare dashboard, connect this repository using the Workers Git deployment flow. Set the production branch to `main`, the build command to `npm run build`, and the deploy command to `npx wrangler deploy`.
2. The existing D1 database `citycare-db` is configured in `wrangler.toml` with database ID `d70062fe-708b-4b52-a111-9f1e3dfe841c` and binding `DB`.
3. Ensure the remote D1 migrations have been applied before using the API. The SQL files are in `migrations/`.
4. In the Worker settings, configure `CITYCARE_ADMIN_PIN` as an encrypted secret. Generate a strong value, for example with `openssl rand -hex 24`. Do not configure it as a plain-text variable or build-time environment value. Admin operations are disabled unless this server-side secret is configured.
5. Deploy from the dashboard or run the deploy script after authentication:

   ```sh
   npm run deploy
   ```

The Worker entry point in `src/worker.ts` routes `/api/*` requests to the existing handler in `functions/api/[[path]].ts` and sends all other requests to the Static Assets binding. Wrangler serves `dist` and falls back to `index.html` for Vue Router history routes. The Worker-first asset rules ensure API requests are handled by the Worker. `public/_headers` configures static asset security and cache headers, and the service worker never caches `/api/` responses.

### Local Workers development

Create an ignored `.dev.vars` file and configure a local-only value for `CITYCARE_ADMIN_PIN`, then run `npm run build && npx wrangler dev`. Use `npx wrangler d1 migrations apply citycare-db --local` only if the local database needs migrations. `npm run dev` serves the frontend only; it does not emulate Workers or D1.

### Deployment settings

- Runtime: Cloudflare Workers with Static Assets
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Static asset directory: `dist`
- Worker entry point: `src/worker.ts`
- D1 binding: `DB`
- Worker secret: `CITYCARE_ADMIN_PIN` (encrypted Cloudflare secret)
- AI API keys/secrets: none

## WebGPU requirements

The browser must support WebGPU to run local AI inference. If the browser cannot initialise WebGPU, the app automatically falls back to manual complaint entry and shows a clear user message.

## Model loading behavior

The first AI use triggers a browser-side model download. The app reports progress states such as:

- checking browser GPU support
- preparing AI engine
- downloading model
- loading model
- AI ready

The model is cached by the browser after the first successful use.

## Testing

Run the checks with `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

Tests cover API token/admin checks, AI JSON/schema handling, complaint numbering, category routing, and citizen-token hashing.

## Troubleshooting

- If lint fails, check the repository-level ESLint config.
- If the build is failing, verify the TypeScript and Vue config are present.
- If the AI is unavailable, use the manual complaint flow.
- If the browser blocks geolocation, use manual map selection.

## Limitations

This project is a hackathon-friendly prototype. It intentionally avoids paid APIs and external account systems. The browser-local AI model is dependent on local WebGPU support and browser download time.

## Hackathon demo instructions

1. Open the app.
2. Click `Report an Issue`.
3. Submit a description such as: `My gali ki street light 4 din se band hai.`
4. Select a location and upload an image.
5. Run local AI analysis.
6. Review the generated complaint.
7. Submit the complaint.
8. View it in the citizen dashboard.
9. Enter the admin PIN in the Admin screen and review the complaint status.

CityCare AI is an independent civic technology project and is not affiliated with any government department.
