CityCare AI

CityCare AI is a private personal civic-tech hackathon project that helps people turn local civic problems into structured, reviewable complaints.

A citizen can open the public web app, describe a problem in natural language, add a location and evidence, use AI to understand the issue, review an AI-generated complaint, submit it, and track its database-backed status — without creating a CityCare account and without signing into Google, GitHub, or any other third-party service.

Important: CityCare AI is an independent civic technology project. It is not affiliated with, operated by, or endorsed by any government department or authority. Sample service-directory entries are configurable demo data.

1. Product Goal

CityCare AI addresses a common civic-reporting problem:

A person knows something is wrong in their area, but may not know what category it belongs to, which type of service should handle it, what evidence to provide, or how to write a clear complaint.

CityCare AI turns:

Citizen's natural-language problem
            ↓
       AI understanding
            ↓
    Service/category routing
            ↓
       Evidence check
            ↓
    Complaint generation
            ↓
     Citizen review/edit
            ↓
       Complaint created
            ↓
        Status tracking

2. Important Architecture Decisions

This version intentionally does not use the earlier PostgreSQL + Prisma + Ollama architecture.

The final hackathon architecture is:

Area

Technology

Frontend

Vue 3 + TypeScript + Vite

UI

Tailwind CSS

State

Pinia

Routing

Vue Router

Maps

Leaflet + OpenStreetMap

Server

Cloudflare Pages Functions / Workers

Database

Cloudflare D1 (SQLite)

Browser AI

WebLLM + WebGPU

AI model

Qwen2.5-0.5B-Instruct MLC model

File handling

Browser-compressed evidence stored within free MVP limits

Repository

Private GitHub repository

Hosting

Cloudflare Pages

Cloudflare Pages supports connecting private or public GitHub repositories and automatically deploying connected branches. Pages Functions provide server-side functionality, and D1 can be attached to Pages Functions through bindings. citeturn698306search1turn698306search7turn698306search9

WebLLM runs language-model inference directly inside the browser using WebGPU rather than requiring a model server or AI API. citeturn698306search6

3. Zero-Cost / No-Account Rules

CityCare AI is designed so the application does not depend on paid services.

Never add

OpenAI API

Gemini API

Claude API

Groq API

OpenRouter

Hugging Face hosted inference

Google Maps API

Mapbox

Firebase

Supabase

Auth0

Clerk

paid databases

paid object storage

paid AI APIs

credit-card-required services

trial services that may later charge

User accounts

Citizens do not create accounts.

There is no:

Google login

GitHub login

email/password signup

OAuth

OTP flow

third-party identity provider

The browser creates an anonymous random citizen token. The backend stores only a SHA-256 hash of that token.

The token is an application identifier, not a government identity and not a legal identity.

Repository privacy

The GitHub repository is intended to remain private. GitHub documents private repository visibility as restricting repository access to the owner and people explicitly given access. citeturn698306search13

CityCare AI itself is a private personal project even though it uses open-source software.

4. Website Visibility vs Data Visibility

The deployed website can be publicly accessible from a pages.dev URL so hackathon reviewers can open it.

That does not mean complaints are public.

The intended access model is:

PUBLIC WEBSITE
      │
      ├── Anyone can open the landing page
      ├── Anyone can report a civic issue
      ├── Anyone can use the public Civic Assistant
      │
      └── Citizen data is scoped to that browser's anonymous token

ADMIN AREA
      │
      └── Protected by server-side CITYCARE_ADMIN_PIN

A citizen should only receive their own complaint records through the citizen API.

A citizen must never be able to browse all complaints.

The admin can view all complaints.

5. AI Architecture

CityCare AI demonstrates both Generative AI and Agentic AI.

Local/browser AI

The model runs inside the user's browser using WebLLM and WebGPU. WebLLM is designed for in-browser LLM inference without server-side model hosting. citeturn698306search6

No AI API key is required.

Agent modules

src/ai/
├── agents/
├── engine/
├── orchestrator/
├── prompts/
└── schemas/

Agents:

Issue Understanding Agent

Authority Routing Agent

Evidence Agent

Complaint Generation Agent

Status Agent

Civic Assistant Agent

Main workflow

Citizen description
       ↓
Issue Understanding Agent
       ↓
Validated structured issue
       ↓
Authority Routing Agent
       ↓
Database service-directory match
       ↓
Evidence Agent
       ↓
Missing-information check
       ↓
Complaint Generation Agent
       ↓
Citizen review/edit
       ↓
Database complaint creation

The AI does not get authority to invent official departments or complaint statuses.

6. AI Reliability Rules

AI output is not trusted automatically.

All structured AI responses are validated before application logic uses them.

AI must never fabricate:

government departments

official contacts

complaint IDs

complaint statuses

locations

dates

evidence findings

government responses

For evidence, the MVP does not pretend that the Qwen text model can see uploaded images. An upload can be recorded as available evidence, but the AI must not claim that the photo proves a specific fact unless a real vision-capable model is explicitly implemented and successfully used.

Every generated complaint must be shown as:

AI-generated — please review before submitting.

Citizens can edit generated content before confirmation.

7. AI Fallback

The complaint system must remain usable even if browser AI cannot run.

Possible reasons include:

browser has no WebGPU support

model download fails

insufficient device resources

model initialization fails

browser blocks required resources

Fallback mode allows the citizen to:

manually choose category

manually choose issue type

manually choose severity

enter a summary

write/edit the complaint manually

submit normally

AI failure must never make the application unusable.

8. Citizen Experience

No login

On first visit, generate an anonymous Citizen ID/token and store it locally in the browser.

The citizen can view the ID and copy it for their own reference.

The raw token must not appear in the URL.

Main flow

Open CityCare AI.

Click Report an Issue.

Describe the problem.

Add a location.

Add a landmark if useful.

Upload evidence if available.

Run AI analysis.

Review category, issue type, severity, summary, impact, service routing, and evidence status.

Generate the formal complaint.

Edit the complaint.

Confirm submission.

Receive a unique complaint number.

Track the complaint timeline.

Example:

My gali ki street light 4 din se band hai.

Possible AI result:

{
  "category": "Streetlight",
  "issueType": "Streetlight Failure",
  "severity": "Medium",
  "summary": "A streetlight is not functioning.",
  "impact": "Reduced visibility at night.",
  "missingInformation": []
}

9. Complaint Status

Allowed statuses:

SUBMITTED

IN_REVIEW

ASSIGNED

IN_PROGRESS

RESOLVED

CLOSED

Every status change creates a status-history record.

The database is the source of truth for status.

The Status Agent can explain the retrieved database state but cannot invent it.

10. Complaint Numbers

Complaint numbers use the format:

CC-2026-000001
CC-2026-000002
CC-2026-000003

The server must generate unique complaint numbers.

The browser must never be responsible for final complaint-number uniqueness.

11. Database

Cloudflare D1 stores application data.

Core tables:

authorities

id

name

category

description

contact_info

area

active

created_at

updated_at

complaints

id

complaint_number

citizen_token_hash

authority_id

title

subject

description

category

issue_type

severity

location

address

landmark

latitude

longitude

ai_summary

ai_generated_complaint

citizen_edited_complaint

status

created_at

updated_at

evidence

id

complaint_id

file_name

file_type

file_data

description

created_at

complaint_status_history

id

complaint_id

status

note

created_at

ai_logs

id

complaint_id

agent_name

input

output

created_at

Raw AI logs are administrative data and must not be exposed to citizens.

12. Authority Directory

The application uses a database/configuration directory instead of asking the AI to invent real government organizations.

Sample categories:

Municipal Services

Waste Management

Water & Sanitation

Roads / Public Works

Drainage / Sanitation

These are sample/configurable service categories only.

Do not add fake phone numbers, fake emails, or fake government URLs.

13. Maps

Use:

Leaflet

OpenStreetMap

The map should support:

viewing the area

clicking to select a point

latitude

longitude

manually entered address

manually entered landmark

Do not add Google Maps or Mapbox.

The UI should include proper OpenStreetMap attribution.

Do not add a paid geocoding API merely to auto-fill an address. Manual address entry is acceptable for the free MVP.

14. Evidence

Supported evidence for the free MVP should prioritize small images.

Allowed examples:

JPG

JPEG

PNG

WebP

Validate MIME type and size.

Compress/resize images in the browser where practical.

Reject unsupported or dangerous file types.

Do not use:

S3

Cloudinary

Firebase Storage

paid object storage

The implementation should stay within the practical free-MVP storage constraints of the selected platform.

15. Admin

The admin does not use Google/GitHub/OAuth login.

Admin access is protected by a server-side secret:

CITYCARE_ADMIN_PIN

The PIN must:

never be hardcoded

never be exposed through VITE_*

never be stored in the database

never be returned to the browser

The frontend sends the PIN to the protected admin endpoint through the agreed authentication header.

Admin capabilities:

dashboard statistics

complaint search

complaint filters

complaint detail view

evidence review

AI analysis review

authority assignment

status changes

internal notes

status history

authority-directory management

Internal admin notes must not be visible to citizens.

16. Admin Dashboard Statistics

Display:

Total Complaints

Submitted

In Review

Assigned

In Progress

Resolved

Closed

Filtering:

status

category

severity

text search

date range where practical

17. Recommended Frontend Routes

Public:

/
/report
/assistant

Citizen:

/dashboard
/complaints
/complaints/:id
/report/review
/report/confirmation
/profile

Admin:

/admin
/admin/complaints
/admin/complaints/:id
/admin/authorities

There is intentionally no /login for citizens.

18. API Surface

Public/citizen

GET  /api/health
POST /api/complaints
GET  /api/complaints
GET  /api/complaints/:id
POST /api/complaints/:id/evidence
GET  /api/complaints/:id/evidence
GET  /api/authorities

Admin

GET   /api/admin/stats
GET   /api/admin/complaints
GET   /api/admin/complaints/:id
PATCH /api/admin/complaints/:id/status
PATCH /api/admin/complaints/:id/authority
POST  /api/admin/complaints/:id/notes
GET   /api/admin/authorities
POST  /api/admin/authorities
PATCH /api/admin/authorities/:id

AI inference should remain browser-local; the backend stores reviewed/submitted results but does not act as an AI proxy.

19. Suggested Repository Structure

CityCare-AI/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── router/
│   ├── stores/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── ai/
│   │   ├── agents/
│   │   ├── engine/
│   │   ├── orchestrator/
│   │   ├── prompts/
│   │   └── schemas/
│   └── App.vue
│
├── functions/
│   └── api/
│
├── migrations/
├── scripts/
├── public/
├── tests/
├── docs/
│
├── .github/
│   └── workflows/
│
├── package.json
├── vite.config.ts
├── wrangler.toml
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md

Cloudflare Pages Functions use a root-level functions/ directory in the standard file-based setup. citeturn698306search10

20. Environment / Secrets

The repository must contain an example configuration file but no real secrets.

Example:

VITE_APP_NAME=CityCare AI

The following must be configured server-side in Cloudflare rather than exposed in frontend source:

CITYCARE_ADMIN_PIN
D1 database binding: DB

Never commit real secrets.

21. Local Development

The exact local commands depend on the final repository implementation, but the intended workflow is:

npm install
npm run dev

For Cloudflare-compatible local development, use the repository's Wrangler configuration and the local D1 workflow documented by the implementation.

Because AI is browser-local, there is no Ollama installation step.

22. Production Deployment

Recommended deployment:

GitHub private repository → Cloudflare Pages Git integration → Cloudflare Pages Functions + D1

Cloudflare Pages currently supports connecting a private GitHub repository, selecting a production branch, and automatically deploying pushes to the connected branch. citeturn698306search0turn698306search1

General setup:

Keep CityCare-AI private on GitHub.

Push the complete repository to main.

Create a Cloudflare Pages project.

Connect the private GitHub repository.

Set the production branch to main.

Configure the production build command and output directory from the repository's deployment configuration.

Create a D1 database.

Bind the D1 database to the Pages Function as DB.

Add CITYCARE_ADMIN_PIN as a server-side secret.

Deploy.

Cloudflare Pages Functions are intended for full-stack functionality such as authentication, form handling and middleware, while D1 bindings allow Functions to access a D1 database. citeturn698306search9turn698306search7

Important

Do not claim a live URL until deployment actually succeeds.

Once deployed, the exact URL is supplied by Cloudflare; it commonly follows the https://<project-name>.pages.dev pattern.

23. Browser AI Requirements

WebLLM uses WebGPU for acceleration. citeturn698306search6

A compatible browser/device is therefore required for full local-AI functionality.

Recommended demo conditions:

recent Chrome/Edge/compatible browser

WebGPU available

enough RAM/GPU resources for the selected model

stable internet for first model download

After the model has been downloaded and cached, later use can be faster.

If WebGPU is unavailable, use manual mode rather than breaking reporting.

24. Testing Requirements

Before considering the project ready, run:

npm install
npm run lint
npm run typecheck
npm run test
npm run build

Tests should cover at minimum:

anonymous citizen token handling

complaint creation

complaint ID uniqueness

citizen complaint ownership isolation

authority matching

status transitions

status history

admin protection

Zod AI schema validation

AI fallback behavior

input validation

evidence validation

The build is not considered ready while core tests or the production build are failing.

25. Security Checklist

Before deployment:

No real secrets committed

Admin PIN is server-side only

No citizen passwords exist

Anonymous token stored hashed on server

Complaint ownership enforced server-side

Admin endpoints protected

SQL uses prepared/parameterized queries

Upload validation enabled

File sizes limited

Unsafe file types rejected

Internal notes hidden from citizens

AI logs hidden from citizens

AI output validated

Status comes from database

No fake government contacts

No paid API dependency

26. Demo Script

A strong hackathon demo can follow this exact flow:

1. Open CityCare AI
2. Click Report an Issue
3. Enter:
   "My gali ki street light 4 din se band hai."
4. Select location
5. Add landmark
6. Upload a photo
7. Start Local AI
8. Show Issue Understanding result
9. Show service/category routing
10. Show evidence status
11. Generate formal complaint
12. Edit one sentence
13. Submit
14. Show complaint number
15. Open My Complaints
16. Open Admin
17. Enter admin PIN
18. Open the same complaint
19. Assign a sample service
20. Change status to IN_PROGRESS
21. Add internal note
22. Return to citizen view
23. Show the updated database-backed status timeline

27. Limitations to State Honestly

CityCare AI should not claim to be:

an official government complaint portal

integrated with real government systems unless such integration is actually added

guaranteed to produce official responses

a replacement for emergency services

capable of automatically verifying every uploaded image

The AI helps structure and generate a report. It does not establish legal facts or government responsibility.

28. GitHub / Ownership

The repository is a private personal project.

Do not add:

contributor onboarding

public contribution instructions

open-source governance

collaborator requirements

a public collaboration workflow

Open-source dependencies are permitted and expected, but CityCare AI itself remains private.

29. Final Definition of Done

The project is ready for hackathon submission only when:

the private GitHub repository contains the complete application

the application builds successfully

lint/typecheck/tests pass

the Cloudflare deployment configuration is valid

D1 migrations exist

citizen reporting works without an account

admin works with the server-side PIN

browser-local WebLLM works when WebGPU is available

manual fallback works when AI is unavailable

map location selection works

evidence handling works

complaint IDs are generated server-side

status history works

citizen cannot browse other citizens' complaints

admin can manage complaints

authority directory is configurable

no paid API/service has been introduced

no secrets have been committed

the README accurately describes what the system does

