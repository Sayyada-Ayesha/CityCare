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
- admin notes remain internal and are not exposed to citizens

## Setup

1. Install dependencies:
   `npm install`
2. Copy the example env file:
   `cp .env.example .env`
3. Configure your local or deployment environment.
4. Start the app:
   `npm run dev`

## Development

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run test` — run Vitest
- `npm run lint` — run ESLint
- `npm run typecheck` — run Vue TypeScript validation

## D1 setup

1. Create a D1 database in Cloudflare.
2. Update the `database_id` in `wrangler.toml`.
3. Run the migrations. Example:
   `npx wrangler d1 execute citycare-db --local --file ./migrations/0001_initial.sql`
4. For deployment, bind `DB` to your Cloudflare D1 database and set `CITYCARE_ADMIN_PIN` as a secret.

## Cloudflare Pages deployment

This project is prepared for Cloudflare Pages deployment.

- Build command: `npm run build`
- Output directory: `dist`
- Pages Functions route support is provided via `functions/api/[[path]].ts`
- Set the production branch to `main`

Example URL format:
`https://<project-name>.pages.dev`

## Admin secret setup

Configure `CITYCARE_ADMIN_PIN` as a Cloudflare secret. Example placeholder for local development:
`CITYCARE_ADMIN_PIN=replace-with-your-own-secret`

Do not commit a real admin secret to source control.

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

The repository includes smoke tests for:

- AI schema validation
- complaint number generation
- authority routing
- citizen token hashing

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
