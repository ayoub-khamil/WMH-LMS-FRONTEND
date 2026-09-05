# WatermelonHub LMS — Web Client

**Repo:** `WMH-LMS-FRONTEND`

React SPA for WatermelonHub LMS, a role-based BPO training platform. Two
experiences in one app:

- **Agent (learner)** — tabbed dashboard, single-item course player
  (video / text SOP / audio / quiz), resume-from-last-position, sequential
  module unlocking, strict 100%-to-pass quizzes with a server-enforced retake
  cooldown, completion modal and PDF certificate.
- **Manager (admin)** — course catalog, curriculum tree editor
  (sections → items → quiz questions), publish/unpublish, bulk enrolment with
  cohort stats, and a user directory.

This is a pure client. Every byte of state that matters lives in the API —
see [`WMH-LMS-BACKEND`](https://github.com/ayoub-khamil/WMH-LMS-BACKEND).
There is no mock data layer and no offline mode; the app will not start
usefully without a reachable backend.

---

## Contents

- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Signing in](#signing-in)
- [Architecture](#architecture)
- [Routing](#routing)
- [Features](#features)
- [Browser storage](#browser-storage)
- [Design system](#design-system)
- [Known limitations](#known-limitations)

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 18.3.1 |
| Routing | react-router-dom 7.18.3, `HashRouter` |
| Build | Vite 5.4.8 (dev server on `:5173`, `host: true`) |
| Styling | Tailwind CSS 3.4.13, PostCSS, Autoprefixer, `darkMode: 'class'` |
| PDF | jsPDF 2.5.1 (client-side certificate) |
| State | React Context + local `useState` + URL search params |
| Data | `fetch` via a single HTTP client, JWT bearer auth |

`HashRouter` is deliberate: it lets the built `dist/` deploy to any static
host without server-side rewrite rules.

---

## Setup

**Prereqs:** Node 18+ / npm 9+, and the API running.

```bash
npm install
```

Create `.env` in the repo root — it is gitignored, so every machine needs its
own:

```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

Without it the client falls back to a relative `/api`, which only works if
something is proxying that path to the API on the same origin. Nothing in
this repo sets up such a proxy, so in local development the `.env` is
effectively required.

```bash
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview   # serve the production build
```

The dev origin is already in the API's default CORS allowlist.

---

## Signing in

There are no client-side accounts — credentials go to the API. With the
backend's demo seed running:

| Role | Email | Password |
|---|---|---|
| Manager (root) | `ayoub.khamil@watermelon-hub.com` | `ayoub1234` |
| Agent | `khalid.khamil@watermelon-hub.com` | `khalid1234` |

Nothing is seeded as *assigned*, so a fresh agent dashboard is empty by
design. Sign in as the manager, open **Assignments**, and enrol the agent
first. Course 103 is a draft and stays invisible to learners until published.

---

## Architecture

### Layers

```
main.jsx          HashRouter + ErrorBoundary at the root
└── App.jsx       ThemeProvider → AuthProvider → AppContent
    ├── no user  → LoginScreen
    └── user     → Routes → AppLayout
                   ├── Sidebar   (manager nav, or agent course tree in the player)
                   ├── TopNav    (manager breadcrumbs and titles)
                   └── Outlet    page components, lazily loaded
```

`AppLayout` passes `{ progressRefreshKey, onProgressUpdated }` down through
outlet context. Any child that changes progress calls `onProgressUpdated()`,
which bumps an integer that the sidebar and dashboard treat as a refresh
trigger — a deliberately small invalidation mechanism in place of a caching
library.

### Service layer

`src/services/` mirrors the REST API one namespace per file:

| File | Responsibility |
|---|---|
| `httpClient.js` | Base URL, bearer header, error normalisation, token storage |
| `auth.api.js` | `login`, `me`, `logout` |
| `users.api.js` | User CRUD, per-user assignments |
| `courses.api.js` | Courses, sections, items, questions, reordering |
| `assignments.api.js` | Bulk enrol / unenrol, cohort read |
| `learn.api.js` | Dashboard, course tree, resume, completion, quiz, locks |
| `api.js` | Barrel — components import only `api.{auth,users,courses,assignments,learn}` |
| `certificate.js` | jsPDF completion certificate |
| `quizCooldownStore.js` | sessionStorage mirror of the server quiz lock |
| `logger.js` | Single exit point for client-side errors |

`httpClient` normalises every failure to an `Error` carrying `status` and
`payload`, and turns a network failure into a readable message with
`status: 0`. On any `401` it dispatches a global `auth:unauthorized` event
that `AuthContext` listens for, so an expired session drops to the login
screen from anywhere without prop drilling.

`logger.js` exists so that wiring a real reporter (Sentry, Rollbar, an
internal endpoint) is a one-line change in `installErrorReporter` rather than
a hunt through scattered `console.error` calls.

### State

No Redux, no Zustand, no query cache.

- **`AuthContext`** — holds `user`, `token`, `authLoading`, and the derived
  `role` / `isManager` / `isAgent`. On boot it validates any persisted token
  by calling `GET /me` rather than trusting a cached user object, and shows a
  "Restoring session…" state while that is in flight. It also clears the
  legacy `wmh_lms_*` keys left by earlier builds.
- **`ThemeContext`** — `theme` and `toggleTheme`, persisted, falling back to
  `prefers-color-scheme`, toggling a class on `<html>`.
- **Server state** — fetched imperatively into local `useState` inside
  `useEffect`. Deliberately uncached.
- **List state** — search, filters and pagination live in the URL via
  `useListQuery.js`, so filtered views are shareable and survive reload. The
  `patch()` helper omits defaults, keeping URLs clean (page 1 and empty
  filters never appear).

### Error handling

An `ErrorBoundary` wraps the whole tree in `main.jsx`. A render-time
exception yields a recoverable panel with "Try again" and "Reload the app"
instead of a blank page, and shows the message only in dev builds.

---

## Routing

Path helpers and guards live in `appRoutes.js`; `paths.*()` centralises URL
construction so no component hand-builds a route string.

| Path | View | Guard |
|---|---|---|
| `/` | redirect to role home | — |
| `/learn?tab=` | Agent dashboard | authenticated |
| `/learn/:courseId` | Course player | authenticated |
| `/learn/:courseId/items/:itemId` | Course player, deep-linked item | authenticated |
| `/manager/courses` | Catalog | `ManagerOnly` |
| `/manager/courses/:courseId` | Curriculum editor | `ManagerOnly` |
| `/manager/courses/:courseId/items/:itemId` | Editor, deep-linked item | `ManagerOnly` |
| `/manager/courses/:courseId/assignments` | Cohort detail | `ManagerOnly` |
| `/manager/users` | User directory | `ManagerOnly` |
| `*` | redirect to role home | — |

`isAllowedPath()` keeps agents out of `/manager/*`. On the transition from
signed-in to signed-out the URL resets to `/`, so a stale protected route
cannot linger behind the login screen — but a *fresh* logged-out visit keeps
its deep link so the user lands where they meant to after signing in.

The manager console and the learner experience are split into separate chunks
with `React.lazy`, so an agent never downloads the authoring screens.

---

## Features

### Auth

Email and password with inline validation, an error banner, and a
show/hide toggle. Disabled accounts are refused by the API and surface that
message. Managers land on `/manager/courses`, agents on `/learn`.

### Agent dashboard

URL-synced tabs (`in_progress` / `not_started` / `completed` / `all`) with
live counts, full-width course cards carrying a status badge and progress
bar, and a Start / Resume / Review action per state. Completed courses expose
a certificate download. Empty and loading states throughout.

### Course player

Single-item focus with a breadcrumb, driven by a flattened view of
`sections[].items[]` for prev/next and resume. Opening a course calls the
API's resume endpoint and jumps to the first incomplete item.

Item renderers: `YouTubePlayer` for video and audio (parses YouTube URLs and
embeds via `youtube-nocookie.com`), `TextItemViewer` for SOPs, `QuizPlayer`
for assessments.

**Text items are plain text**, rendered verbatim with `whitespace-pre-wrap`.
No HTML parsing, no `dangerouslySetInnerHTML` anywhere in the app — what a
manager types is exactly what an agent sees.

**Sequential unlocking:** an item opens only once every item before it is
complete. The sidebar shows locked items with a padlock, and a deep link to a
locked item redirects to the first incomplete one. Completing the final item
opens `CourseCompleteModal`.

### Quiz engine

Three question types: `multiple_choice` and `true_false` (single-select) and
`multiple_answer` (multi-select). Every question must be answered before
submit enables. Grading is done by the API; a failure highlights the
questions that were wrong.

Failing starts a retake cooldown. The server owns both the countdown and the
review gate — the agent must open another item in the course before retrying
— and `quizCooldownStore.js` keeps a `sessionStorage` mirror purely so the
countdown can tick without polling. The mirror takes its duration from the
server rather than assuming a constant, is refreshed from
`GET /learn/quiz/lock` on mount, and can never be more permissive than the
server: a cleared `sessionStorage` just means a `423` on submit instead of a
disabled button.

### Certificate

`certificate.js` draws a landscape A4 jsPDF document — borders, academy
header, agent name, course title, issue date, certificate id, `Score: 100%`
and a signature block — then triggers a blob download. Available from the
completion modal and from any completed dashboard card.

### Manager console

**Catalog** — search by title or description, filter by status, paginate
(8 per page, all URL-synced). Create a course (opens straight into the
editor), delete with a cascade warning, and jump to Assignments or Edit Tree.

**Curriculum editor** — rename a course and toggle publish state. Add,
rename, delete and reorder sections. Add items (video / text / quiz / audio,
with a URL field where relevant), edit, delete and reorder them. Author quiz
questions with options and correct-answer flags; single-answer types are held
to exactly one correct option.

**Assignments** — pick a course, then see the cohort: enrolled / completed /
in-progress counts with percentages, and a per-agent table with status and
progress. The enrol modal searches unassigned active agents and assigns in
bulk.

**Users** — search, role and status filters, pagination (10 per page,
URL-synced). Create with an auto-suggested
`firstname.lastname@watermelon-hub.com` address. Edit name, email, role and
password; toggle active/disabled; delete. Passwords are typed twice and must
match before the form submits, and a stored password can never be read back —
the API does not return one. Root-only actions are disabled with an
explanatory tooltip for non-root managers. A per-agent modal inspects that
user's assignments.

### Cross-cutting

Dark and light themes with a system-preference fallback, a persistent
sidebar that doubles as the course tree inside the player, breadcrumbs in the
manager console, and shared primitives in `components/common/`
(Button, Badge, Modal, Select, EmptyState, Icons, ErrorBoundary).

---

## Browser storage

| Key | Store | Purpose |
|---|---|---|
| `wmh_token` | localStorage | JWT bearer token |
| `wmh_theme` | localStorage | `light` or `dark` |
| `wmh_quiz_ui_lock_{agentId}_{itemId}` | sessionStorage | Cooldown mirror |

The signed-in user object is **not** persisted — it is re-fetched from
`GET /me` on every boot so a disabled or deleted account cannot keep a stale
identity on screen. Legacy `wmh_lms_*` keys from the retired mock layer are
removed automatically on startup.

To reset the client completely, clear these keys and reload. Resetting
*data* means resetting the backend, not the browser.

---

## Design system

Flat by rule. `index.css` bans decorative shadows globally with a carve-out
for `:focus-visible` — Tailwind implements `ring-*` as a box-shadow, so a
blanket ban would delete every keyboard focus indicator in the app. A
guaranteed outline is applied on top of that.

The palette in `tailwind.config.js` is watermelon green and coral red over a
custom zinc ramp, with a warm `#F7F8ED` page background in light mode. Border
radii are small and fixed; the Tailwind shadow scale is overridden to `none`
across the board. Scrollbars are custom-styled, and the course player pane
adds scrollbar arrow buttons.

---

## Known limitations

Current state, honestly.

**`npm ci` cannot run.** `package-lock.json` is gitignored, but CI runs
`npm ci` and `cache: npm` — both require a committed lockfile. The workflow
fails at install until the lockfile is tracked.

**The audit step fails.** CI runs `npm audit --audit-level=high --omit=dev`,
which currently exits non-zero: jsPDF ≤ 4.2.0 carries a critical advisory,
plus a vulnerable transitive `dompurify`. Clearing it needs the semver-major
bump to jsPDF 4.x.

**A test hook ships to production.** `QuizPlayer` renders "autofill correct"
and "reset timer" buttons whenever `?autofill` is present in the URL, with no
environment guard. Autofill works against live data because the API sends
`is_correct` with every quiz option; the reset button is inert outside
Development since the endpoint it calls is dev-only.

**Sequential gating is cosmetic.** The lock icons and the deep-link redirect
are client-side only — the API accepts item completions in any order. Same
for the certificate, which is generated locally with no server verification
that the course was actually finished.

**A rejected token is not cleared from storage.** The `auth:unauthorized`
handler resets React state but not `localStorage`, so a dead JWT lingers
until the next successful login. The app recovers on reload (the `/me` check
fails and drops to login), but the value stays on disk.

**Deploying the build needs a decision.** `.env` is gitignored, so a CI build
compiles the relative `/api` fallback into the bundle — which requires a
reverse proxy on the serving origin that this repo does not configure. Either
commit a build-time value or add the proxy.

**Assets are unoptimised.** Roughly 2.1 MB of PNGs — a 1 MB login background
and two ~550 kB logos — none resized or converted to a modern format. jsPDF
also drags in `html2canvas` (~200 kB) and `dompurify` (~22 kB) for a
certificate that only draws text and lines.

**No test suite.** There is no unit, component or end-to-end coverage; CI
only proves the bundle builds.
