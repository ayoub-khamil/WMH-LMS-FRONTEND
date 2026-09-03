# WatermelonHub LMS — BPO Training Platform

**Repo:** `wmh-lms-frontend`

Frontend demo / prototype for **WatermelonHub LMS**, a role-based BPO training platform. Two experiences live in a single SPA:

- **Agent (learner):** tabbed dashboard (In Progress / Not Started / Completed / All), single-item course player (video / text SOP / audio / quiz), resume-from-last-position, strict 100%-to-pass quizzes with cooldown, completion modal + PDF certificate download.
- **Manager (admin):** course catalog, curriculum tree editor (sections → items → quiz questions), publish/unpublish, bulk agent enrollment with progress stats, user directory (agents + managers).

> There is no real backend. All persistence is simulated in `src/services/api.js` on top of `localStorage` with ~120ms artificial latency, seeded from `src/services/mockData.js`.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Demo Users](#demo-users)
- [Core Features](#core-features)
  - [Auth & Session](#auth--session)
  - [Agent Learning Experience](#agent-learning-experience)
  - [Manager Console](#manager-console)
  - [Cross-cutting UX](#cross-cutting-ux)
- [Architecture & Design Choices](#architecture--design-choices)
  - [Component Hierarchy](#component-hierarchy)
  - [State Management Strategy](#state-management-strategy)
  - [Routing](#routing)
  - [Notable Patterns](#notable-patterns)
- [Setup & Run](#setup--run)

---

## Tech Stack

| Layer         | Technology / Version |
|---------------|-----------------------|
| UI            | React 18.3.1, React DOM 18.3.1 |
| Routing       | react-router-dom 7.18.3 with `HashRouter` (`src/main.jsx:9`) |
| Build / Dev   | Vite 5.4.8 (`vite.config.js:6`, dev port `5173`) |
| Styling       | Tailwind CSS 3.4.13, PostCSS 8.4.47, Autoprefixer 10.4.20, `darkMode: 'class'` |
| PDF           | jsPDF 2.5.1 (client-side certificate generation) |
| State         | React Context (`AuthContext`, `ThemeContext`) + local `useState` + URL search params (`useListQuery.js`) |
| Mock DB       | `localStorage` keys `wmh_lms_*` + `sessionStorage` quiz locks |
| Assets        | `assets/newTransparentLogo.png`, `assets/darkModeLogo.png` |

## Demo Users

Seeded in `src/services/mockData.js:1`:

| Role    | Email                              | Password     |
|---------|-------------------------------------|--------------|
| Manager | `ayoub.khamil@watermelon-hub.com`   | `ayoub1234`  |
| Agent   | `khalid.khamil@watermelon-hub.com`  | `khalid1234` |

---

## Core Features

### Auth & Session

- Email + password login with validation, error banner, show/hide password (`components/auth/LoginScreen.jsx`).
- Session persisted in `localStorage` (`wmh_lms_jwt_token`, `wmh_lms_current_user`).
- Disabled accounts blocked at login.
- Role-based landing: managers → `/manager/courses`, agents → `/learn` (`appRoutes.js:27`).
- Sign-out from dashboard header and course-viewer overlay.
- Prototype helpers: `switchRole()`, `switchUser()` in `AuthContext.jsx:36,53`.

### Agent Learning Experience

**Dashboard** (`components/agent/AgentDashboard.jsx`)
- URL-synced tabs (`?tab=in_progress|not_started|completed|all`, defaults to `in_progress`), live counts.
- Full-width course cards with status badge, progress bar %, Start / Resume / Review CTA.
- Certificate download button on completed courses.
- Empty states, loading states.

**Course Viewer** (`components/agent/CourseViewer.jsx`)
- Single-item focus layout, breadcrumb (section › item), fixed title block per type.
- Auto-resume: calls `resumeCourse()` → first incomplete item, else first item.
- Complete & Continue / Complete & Finalize Course flow, progress refresh via Outlet context.
- Item renderers: `YouTubePlayer.jsx` (video/audio via YouTube URL), `TextItemViewer.jsx` (raw HTML SOP), `QuizPlayer.jsx`.
- `CourseCompleteModal.jsx` on 100% completion.

**Quiz Engine** (`components/agent/QuizPlayer.jsx` + `services/quizCooldownStore.js`)
- Types: `multiple_choice`, `true_false` (single-select), `multiple_answer` (multi-select, exact-match grading).
- Strict 100% required to pass; failure highlights `incorrect_question_ids`.
- 5-min UI retake lock (`QUIZ_COOLDOWN_MS = 5*60*1000`) + content-review gate (must open a non-quiz item before retry), countdown MM:SS, persisted in `sessionStorage` (`wmh_quiz_ui_lock_{agentId}_{itemId}`).

**Certificate** (`services/certificate.js`)
- Landscape A4 jsPDF certificate: branding, agent name, course title, issue date, `WMH-{courseId}-{suffix}` ID, `Score: 100%`, signature block. Native blob download.

### Manager Console

**Courses Catalog** (`components/manager/CoursesList.jsx`)
- Search by title/description, status filter (all/published/draft), pagination (limit 8, URL `?q=&status=&page=`).
- Create (title + description → opens editor), delete with cascade warning, Assignments and Edit Tree shortcuts, section/item counts.

**Curriculum Tree Editor** (`components/manager/CourseEditor.jsx` + `ItemEditor.jsx` + `QuizQuestionEditor.jsx`)
- Course: rename, publish/unpublish toggle.
- Sections: add / rename / delete (cascade) / reorder up-down (persisted order).
- Items: add (video | text | quiz | audio + YouTube URL where relevant), edit, delete, reorder. Deep-linkable edit route `/manager/courses/:courseId/items/:itemId`.
- Quiz questions: add / edit / delete with options + `is_correct` flags.

**Assignments** (`components/manager/AssignmentsManager.jsx`)
- Two-step: course picker → cohort detail.
- Stats header: Enrolled / Completed / In Progress with %.
- Table: agent name, email, status badge, progress bar %, unassign.
- Enroll Agents modal: search unassigned active agents, select/deselect all, bulk assign.

**User Management** (`components/manager/UserManagement.jsx`)
- Search (`?q=`), role filter, status filter, pagination (limit 10, URL-synced via `useListQuery`).
- Create with auto-email suggestion (`firstname.lastname@watermelon-hub.com`), role select.
- Edit (name/email/role/password), view current password, toggle active/disabled via badge click, delete (cascades assignments).
- Per-agent assignment inspector modal (course title, completed/total, status + %).

### Cross-cutting UX

- Dark/light theme (`ThemeContext.jsx`): `localStorage: wmh_theme`, `prefers-color-scheme` fallback, class toggle on `<html>`.
- Layout: `Sidebar.jsx` (manager nav + agent course tree when in viewer), `TopNav.jsx` (manager breadcrumbs/titles), shared `common/` primitives (Button, Badge, Modal, Select, EmptyState, Icons).
- No-shadows design system (`index.css:6`), custom scrollbars, Watermelon green/red palette (`tailwind.config.js:40`), `spacious-card` / `flat-card` utilities.

---

## Architecture & Design Choices

### Component Hierarchy

```
main.jsx (HashRouter)
└── App.jsx
    ├── ThemeProvider → AuthProvider → AppContent
    │   ├── !user → LoginScreen
    │   └── user → Routes → AppLayout (Outlet context: {progressRefreshKey, onProgressUpdated})
    │       ├── Sidebar (manager_* + agent_course_viewer only)
    │       ├── TopNav (manager_* only)
    │       └── Outlet pages:
    │           ├── AgentDashboardPage → AgentDashboard → Course cards
    │           ├── AgentCoursePage → CourseViewer → YouTubePlayer / TextItemViewer / QuizPlayer / CourseCompleteModal
    │           ├── ManagerCoursesPage → CoursesList
    │           ├── ManagerEditorPage → CourseEditor → ItemEditor → QuizQuestionEditor
    │           ├── ManagerAssignmentsPage → AssignmentsManager
    │           └── ManagerUsersPage → UserManagement
    └── common/: Button, Badge, Modal, Select, EmptyState, Icons
```

### State Management Strategy

- No Redux/Zustand. `AuthContext` holds `user`, `token`, `role`/`isManager`/`isAgent`, `login`/`logout`/`switchRole`/`switchUser`; syncs to `localStorage` on change.
- `ThemeContext` holds `theme`/`toggleTheme`.
- Server state is fetched imperatively (`api.*` promises in `useEffect`) into local `useState`; no caching library. Progress invalidation via `progressRefreshKey` integer bumped by `onProgressUpdated` and passed as `refreshTrigger` to `Sidebar` + `AgentDashboard`.
- List state (search/status/role/page) is URL-driven via `useListQuery.js` (`useSearchParams` + `patch()` omitting defaults), giving shareable/bookmarkable filters and pagination. Dashboard tabs similarly use `?tab=`.
- Quiz cooldown is UI-only `sessionStorage` (not server-enforced) — explicitly documented in `quizCooldownStore.js:1`.

### Routing

Defined in `appRoutes.js` + `App.jsx:247`:

| Path | View key (`viewFromPath`) | Guard |
|------|----------------------------|-------|
| `/` | redirect | `HomeRedirect` → role home |
| `/learn?tab=` | `agent_dashboard` | authenticated |
| `/learn/:courseId` | `agent_course_viewer` | authenticated |
| `/learn/:courseId/items/:itemId` | `agent_course_viewer` | authenticated |
| `/manager/courses` | `manager_courses` | `ManagerOnly` |
| `/manager/courses/:courseId` | `manager_course_editor` | `ManagerOnly` |
| `/manager/courses/:courseId/items/:itemId` | `manager_course_editor` | `ManagerOnly` |
| `/manager/courses/:courseId/assignments` | `manager_assignments` | `ManagerOnly` |
| `/manager/assignments` | `manager_assignments` | `ManagerOnly` |
| `/manager/users` | `manager_users` | `ManagerOnly` |
| `*` | redirect home | — |

`isAllowedPath()` prevents agents from hitting `/manager/*`. `paths.*()` helpers centralize URL construction. `HashRouter` was chosen for static-file demo deployability (no server rewrites).

### Notable Patterns

- **Mock-as-contract:** `services/api.js` mirrors a REST API (`auth`/`users`/`courses`/`assignments`/`learn` namespaces) so a real backend can replace it method-for-method. All writes go through `getStorage`/`setStorage` + `initializeDatabase()` reseed.
- **Cascades in mock:** delete course → removes assignments; delete user → removes their assignments.
- **Derived progress:** never stored; computed as `completed_item_ids.length / total_items` everywhere (dashboard, assignments, user modal).
- **Flat-course navigation:** `CourseViewer` flattens `sections[].items[]` into `allItems` for prev/next/resume logic.
- **Modal-driven CRUD:** all creates/edits/deletes use controlled `Modal` forms with confirm-delete variants.

---

## Setup & Run

**Prerequisites:** Node 18+ / npm 9+

```bash
# 1. Install
npm install

# 2. Dev server (http://localhost:5173)
npm run dev

# 3. Production build → dist/
npm run build

# 4. Preview production build
npm run preview
```

**Config:** `vite.config.js` (React plugin, `host:true`), `tailwind.config.js`, `postcss.config.js`.

**Notes:**
- No env vars required.
- Reset demo data by clearing `localStorage` keys `wmh_lms_*` and reloading (reseeds from `mockData.js`).
- Login with the [seed users](#demo-users) above. Publish course `103` (draft) to make it visible to agents; assign it under **Manager → Assignments**.
