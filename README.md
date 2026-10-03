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
- Backend: Cloudflare Pages Functions and Workers-style serverless routes
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
- the admin PIN is sent only to same-origin Pages Functions over HTTPS and is not persisted in local storage
- citizen-specific API responses are excluded from service-worker caches

## Setup

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

No `.env` file is required for the frontend. Never put `CITYCARE_ADMIN_PIN` in a `VITE_*` variable, `.env`, source code, or a committed file. For local Pages Functions development, put a local PIN in the ignored `.dev.vars` file; for production, configure it as a Cloudflare secret.

## Development

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run test` — run Vitest
- `npm run lint` — run ESLint
- `npm run typecheck` — run Vue TypeScript validation

## Cloudflare Pages deployment

The application targets Cloudflare's Free plan: Pages static hosting, Pages Functions, and D1. It uses no paid APIs, AI keys, OAuth providers, or remote inference service. WebLLM downloads its model and runs inference in the visitor's browser using WebGPU. Map tiles use OpenStreetMap's public tile service and are subject to its usage policy; it provides no CityCare SLA.

### One-time Cloudflare setup

1. Confirm the GitHub repository visibility is **Private**. Connecting a private repository to Pages does not require making it public.
2. In Cloudflare, create a D1 database named `citycare-db` on the Free plan and copy its database ID.
3. Replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` in `wrangler.toml` with that ID. This ID is configuration, not a secret.
4. From the repository root, apply the migrations to the remote database:

   ```sh
   npx wrangler d1 migrations apply citycare-db --remote
   ```

5. Create a Cloudflare Pages project connected to the private GitHub repository. Set production branch `main`, build command `npm run build`, and output directory `dist`.
6. In Pages project settings, add a D1 binding for the **Production** environment with variable name `DB` and select `citycare-db`. Configure Preview only if needed, preferably with a separate database.
7. In Pages settings, add `CITYCARE_ADMIN_PIN` as an encrypted **Secret** for Production. Generate a strong value, for example with `openssl rand -hex 24`. Do not configure it as a plain-text variable or build-time environment value. Admin operations are disabled unless this server-side secret is configured.
8. Deploy `main`. After deployment, verify `/api/health` and test admin access.

Pages Functions are discovered in `functions/api/[[path]].ts`. `wrangler.toml` declares the Pages output directory and D1 binding. `public/_headers` configures security and cache headers, `public/_redirects` supports Vue Router history routes, and the service worker never caches `/api/` responses.

### Local Pages Functions

Create an ignored `.dev.vars` file and configure a local-only value for `CITYCARE_ADMIN_PIN`, then run `npx wrangler pages dev dist`. Apply local migrations with `npx wrangler d1 migrations apply citycare-db --local`. `npm run dev` serves the frontend only; it does not emulate Pages Functions or D1.

### Deployment settings

- Plan: Cloudflare Free
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Functions: repository `functions/` directory
- D1 binding: `DB`
- Production secret: `CITYCARE_ADMIN_PIN` (encrypted Cloudflare secret)
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
