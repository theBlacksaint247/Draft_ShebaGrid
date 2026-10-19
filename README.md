# Shebagrid (সেবাগ্রিড)

Urban local government complaint and pothole triage for Dhaka North City Corporation (DNCC) and Dhaka South City Corporation (DSCC).

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
- [x] Front-end prototype (home, report form, complaint tracker, officer dashboard, hotspot map)
- [x] Prototype sign-in with four roles, page access by role, light and dark themes
- [ ] Supabase, Google sign-in and roles
- [ ] Complaint form saving to the database, real ward boundaries
- [ ] Ticket workflow saving to the database
- [ ] SLA escalation job
- [ ] Hotspot detection in PostGIS (the logic already runs in TypeScript in the browser)
- [ ] AI features (image classifier, urgency ranker)
- [ ] Testing, polish, deployment, demo

## Tech stack

Planned, and may change as the project develops.

- **App:** Next.js (App Router), TypeScript, Tailwind CSS, fonts self-hosted with Fontsource (Barlow, Hind Siliguri for Bangla)
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

## Trying the prototype

The pages that belong to a role are closed until you sign in. Open `/login` and pick a demo account:

| Account | Role | What it can open |
|---------|------|------------------|
| Farhana Islam | Resident | Report a problem, My complaints (her own) |
| Engr. N. Akter | Ward engineer | Dashboard, hotspot map. Assigns tickets to herself, starts work, marks them fixed |
| Engr. S. Rahman | Senior engineer | The same, and takes over tickets that missed their deadline |
| Md. Kamal Hossain | Official | The same, and verifies finished repairs |

The app starts empty. Sign in as the resident and file a few reports (three within 50 metres of each other make a hotspot), then switch to an engineer to work the tickets.

The **Demo** button in the corner opens the presenter controls: switch account, skip ahead by hours or days so deadlines pass and tickets escalate, and clear all complaints.

Complaints are saved in this browser, so you can switch to an engineer and find them in the queue. The theme follows your system setting, and the moon/sun button in the header overrides it.

## Project layout

```
src/app/            Next.js routes and pages
src/components/     Shared UI (status marks, timeline, maps, forms, dashboard)
src/components/shell/  Header, role gate and toasts
src/lib/            Plain logic (SLA rules, escalation, roles, hotspot clustering, risk index, queue order) with unit tests
src/lib/store/      The prototype's browser-side stand-in for a back end (session, complaints, clock, theme)
src/lib/places.ts   The list of areas, the Dhaka service area, and the schools, hospitals and main roads used by the risk index
docs/               Architecture notes and fortnightly project updates
.github/            CI workflow, issue and pull request templates
```

More folders (`supabase/`, `ml/`, `tests/`) arrive with the parts that need them.

## What is real in the prototype

- It starts **empty**. There is no sample data, and nothing is sent to a server.
- Only Dhaka North and Dhaka South are served. A pin outside the Dhaka service area (a box around both corporations) is turned away.
- The list of areas, with their centres and ward numbers, is **approximate**. It stands in for ward matching until we load the corporations' real ward map.
- The schools, hospitals and main roads that the risk index looks for are a short list of real places (coordinates from their Wikipedia entries). The final system loads them all from OpenStreetMap.
- Hotspot clustering (50 m radius, at least 3 reports), the Location Risk Index, the SLA rules, the escalation rule and the queue order are real, tested TypeScript. PostGIS and a scheduled job will take over clustering and escalation when the database arrives.
- Complaints (with their photos, shrunk to fit) and skipped time are kept **in this browser** (local storage), which stands in for the database.
- Sign-in is a **demo session**, and the role check runs in the browser. It shows how each role will behave, but it is not security. The real system signs people in with Google and checks the role on the server, in the database (Row Level Security).
- The photo check on the report form is a placeholder button that does nothing yet. The real model comes with the AI features.

## Team

- Md. Meraj Mahir Haque
- Asif Kamal
- Md. Hamimul Haque Rahat
