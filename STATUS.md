# Luca — Live Status

This document tracks what's done, what's in progress, and what's next.
Updated continuously as work progresses.

## Current phase: **Phase 1 → Phase 2 transition**

| Phase | What | Status | Notes |
|---|---|---|---|
| **0** | Scaffold repo (package.json, tsconfig.base, README, LICENSE, docs) | ✅ Done | commit 18cb362 |
| **1** | Extract `@luca-game/engine` from catobigato's `frontend/src/games/engine/` | ✅ Done | Tagged `engine-v0.1.0` (commit 967f346), all 71 game tests pass, catobigato consumes via `file:` dependency (v1.0.0.119) |
| **2** | Extract `@luca-game/platform` (gallery, 28 games, CompletionClient interface) | 🟡 Next | See below |
| **3** | Hosted platform service on Cloudflare Workers | ⏸ Deferred | Only when there's demand + resources |
| **4** | Backend integration in catobigato (`/api/luca/v1/*`, per-game validators, db tables) | 🟢 After Phase 2 | Runs in same FastAPI container, same Postgres |
| **5** | Polish + publish to npm + GitHub Actions workflow | 🟢 After Phase 2 | |

## Phase 2 — platform extraction

### Goals
- Move `frontend/src/games/luca/*` → `packages/platform/src/`
- Move per-game modules under `packages/platform/src/games/`
- Add `CompletionClient` interface, `LocalCompletionClient`, type definitions
- Add `HttpCompletionClient` example (for consumers that want HTTP)
- Update catobigato to consume `@luca-game/platform` via `file:` dependency
- All 71 game tests still pass
- Tag `platform-v0.1.0`

### Open decisions for Phase 2

- [ ] **Registry format** — flat array vs grouped (playable + coming-soon)
- [ ] **Game metadata** — extend engine's `GameMeta` with platform fields (icon, description, controls, status, difficulty, category)
- [ ] **Per-game module shape** — `index.ts` exporting `{ definition, Component, meta }` (already in docs)
- [ ] **CSS scope** — should the per-game CSS files be imported by the components, or should we ship a separate `luca.css` that consumers include once?
- [ ] **i18n strategy** — luca ships `en` only and accepts a translation override via prop?

### Validation criteria for "Phase 2 done"

- [ ] `@luca-game/platform` builds clean
- [ ] catobigato frontend builds clean (no behavior change)
- [ ] All 71 game tests still pass
- [ ] `git tag platform-v0.1.0` exists in the luca repo
- [ ] `frontend/src/games/luca/` deleted from catobigato (no leftovers)

## Phase 4 — catobigato backend integration

### Goals
- `backend/app/api/luca/` package with routers, schemas, validators
- `POST /api/luca/v1/complete` and `POST /api/luca/v1/resolve`
- `luca_scores` and `luca_completions` tables in catobigato's Postgres
- Per-game validators ported from the npm packages (Python)
- Catobigato middleware injects `X-Luca-Actor-Id` (no JWT for now)
- Frontend `HttpCompletionClient` wired via `<CompletionProvider>`
- E2E test suite

### Open decisions for Phase 4

- [ ] **Schema source of truth** — npm first, Python ports; OR Python first, npm ports? **Recommendation: npm is canonical.** Conformance tests verify both stay in sync.
- [ ] **Validator hosting** — should Python validators live in `backend/app/api/luca/validators/` (catobigato-owned) or in a shared `db/validators/` (luca-owned)? **Recommendation: luca-owned**, under `packages/platform/src/validators/python/` with a sync mechanism.
- [ ] **Auth** — none (per user), but should we rate-limit? **Recommendation: defer until needed.**
- [ ] **DB migration strategy** — `alembic/versions_luca/` (luca-owned, catobigato CI runs it). Schema source kept in sync with `packages/platform/db/schema.sql` in the luca repo.

## What this repo contains (current state)

```
luca/
├── package.json (workspaces: packages/*)
├── tsconfig.base.json
├── README.md
├── LICENSE (MIT)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GAME_DEFINITION.md
│   └── COMPLETION_API.md
├── packages/
│   ├── engine/                  ✅ @luca-game/engine v0.1.0
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── scripts/copy-assets.mjs
│   │   └── src/
│   │       ├── contracts.ts
│   │       ├── GameState.ts
│   │       ├── GameStorage.ts
│   │       ├── useGameController.ts
│   │       ├── GameEngine.tsx
│   │       ├── GameEngine.css
│   │       └── index.ts
│   └── platform/                🟡 Phase 2 — stub only
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts (placeholder)
└── STATUS.md (this file)
```

## Boundaries (for the record)

### luca owns

- Game state machines (idle/playing/won/lost lifecycle)
- Per-game logic (2048, sudoku, lights, and future games)
- Per-game React rendering
- The "luca games collection" registry
- Gallery UI (cards, filters, layout)
- PlayPage (mounts the right game for a slug)
- The completion / resolve API **contract** (TypeScript types + interface)
- The per-game validators (npm-side; Python ports in catobigato)
- Pluggable score storage

### luca does NOT own

- User accounts, auth, sessions
- Social features (comments, sharing, follows)
- Product analytics
- Theming, branding, navigation
- The actual HTTP server (catobigato runs one in Phase 4)

### Catobigato owns (for the luca integration)

- The HTTP server that implements the luca contract
- The `actor_id` indirection (translates session → opaque ID)
- The `luca_scores` table migration (operationally; luca owns the schema)
- Wiring the frontend `HttpCompletionClient`

## How to verify the current state

```bash
# luca repo
cd ~/git/luca
npm install
npm run build           # both packages
git log --oneline -10   # should show the phase 0 scaffold + phase 1 extraction

# catobigato
cd ~/git/catobigato.com/frontend
npm run build           # should build with @luca-game/engine as external
npm run test            # 28 + 18 + 25 game tests should all pass
```

## Last updated

2026-06-28 — Phase 1 complete (engine-v0.1.0 tagged, catobigato
shipped v1.0.0.119 consuming it). Phase 2 starting next.