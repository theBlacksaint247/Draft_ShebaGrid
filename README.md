# Shebagrid (সেবাগ্রিড)

Urban local government complaint and pothole triage for Dhaka North/South City Corporations (DNCC/DSCC) and Chittagong City Corporation (CCC).

> CSE 327 Software Engineering project, Fall 2026. Work in progress.

## The problem

City corporations receive a flood of citizen complaints (potholes, open manholes, waterlogging, broken streetlights) through scattered channels. Reports pile up, repairs are delayed, and drainage maintenance gets marked "done" without anyone checking.

## What Shebagrid does

Citizens report a problem with a photo, a location and a short description in Bangla or English. Shebagrid then:

1. Finds the right ward from the GPS location.
2. Checks how serious the problem is using AI (photo and text).
3. Sends it to the ward engineer with a deadline, and escalates it to a senior engineer if the deadline is missed.
4. Lets a complaint be closed only with a photo of the finished work.
5. Shows officials a map of where problems are happening, including recurring hotspots ranked by risk.

## Unique features

| # | Feature | Summary |
|---|---------|---------|
| 1 | Spatial Hotspot Detection & Location Risk Index | PostGIS DBSCAN clustering on a Leaflet map, with a risk score for each hotspot |
| 2 | SLA Escalation Engine | Deterministic workflow that escalates overdue tickets to senior engineers |
| 3 | Street Hazard Image Classifier (AI) | Classifies hazard type from the citizen's photo and flags likely duplicates |
| 4 | Bangla Complaint Urgency Ranker (AI) | Scores urgency from Bangla or English complaint text |

Supports **SDG 11** (Sustainable Cities and Communities) and **SDG 16** (Peace, Justice and Strong Institutions).

## Status

- [x] Project scaffold, CI, contribution workflow
- [ ] Supabase, Google sign-in and roles
- [ ] Complaint form and ward mapping
- [ ] Ticket workflow and engineer dashboard
- [ ] SLA escalation
- [ ] Hotspot detection and Location Risk Index
- [ ] AI features (image classifier, urgency ranker)
- [ ] Testing, polish, deployment, demo

## Tech stack

Planned, and may change as the project develops.

- **App:** Next.js (App Router), TypeScript, Tailwind CSS
- **Maps:** Leaflet with OpenStreetMap, Turf.js
- **Backend and data:** Supabase (PostgreSQL with PostGIS, Auth with Google sign-in, Storage, scheduled jobs)
- **AI:** TensorFlow.js with a Teachable Machine model, Gemini API
- **Quality:** Vitest, Playwright, ESLint, GitHub Actions
- **Hosting:** Vercel

## Getting started

You need Node.js 22 or newer.

```bash
git clone <repo-url>
cd shebagrid
npm install
cp .env.example .env.local   # then fill in your own keys
npm run dev
```

Open <http://localhost:3000>.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit tests |
| `npm run build` | Production build |

Never commit `.env.local` or real keys. See [CONTRIBUTING.md](CONTRIBUTING.md) for how we work as a team.

## Project layout

```
src/app/            Next.js routes and pages
src/lib/            Plain logic (SLA rules, risk index, ward matching) with unit tests
docs/               Architecture notes and fortnightly project updates
.github/            CI workflow, issue and pull request templates
```

More folders (`supabase/`, `ml/`, `tests/`) arrive with the parts that need them.

## Data

Demo data is synthetic. No real citizen data is used.

## Team

- Md. Meraj Mahir Haque
- Asif Kamal
- Md. Hamimul Haque Rahat
