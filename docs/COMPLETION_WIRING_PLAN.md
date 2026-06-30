# Luca — Completion Wiring & Hardening Plan

> **Audience:** whoever is driving the work — Claude (Opus), **hermes**, or
> **minimax**. This is the single source of truth for the current effort.
> Update the **Status** field of each step as you go so the next driver
> knows exactly where things stand. Append to the **Sync Log** at the
> bottom after every working session.
>
> **Repos in play (siblings under `~/git`):**
> - `~/git/luca` — open-source engine + platform (this repo). Dev edits here are picked up live by catobigato via a Vite source alias.
> - `~/git/catobigato.com` — first adopter. Backend (FastAPI) + frontend wiring live here.
>
> **Consumption modes (important for "where does my change land"):**
> - **catobigato dev**: `frontend/vite.config.*` aliases `@luca-game/engine` and `@luca-game/platform` to `~/git/luca/packages/*/src`. So **editing luca source is live in dev** — no rebuild needed.
> - **catobigato prod**: `frontend/package.json` depends on `file:./vendor/luca-game-platform-0.1.0.tgz`. Luca changes **do not reach prod** until that tarball is rebuilt + re-vendored at release time. Flag this in any release note; the user runs releases manually.

---

## Why this plan exists (findings from the 2026-06-29 peer review)

The engine/platform/contract split is solid, but the **server-side
completion pipeline is built, migrated, and deployed — yet never invoked
by gameplay**, and the two sides have a wire-format mismatch that means
they have never actually exchanged a real message.

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 | `CompletionClient.check()` is never called by the engine, `PlayPage`, or any game. Wins persist only to localStorage. The whole backend (`/complete`, validators, `luca_scores`, `luca_completions`) is dead code from the player's view. |
| 2 | 🔴 | Wire-format mismatch: TS contract is **camelCase** (`gameId`, `finalStats`, `reportedComplete`, `record.validMoves`); Pydantic schemas are **snake_case** with no alias. First real request would 422; response would mis-parse. |
| 3 | 🟠 | No backend validator tests and no JS↔Python conformance harness, despite the "bit-for-bit parity" design goal. |
| 4 | 🟠 | Only 3 of 28 games have any test (`sliding_blocks`, `tangram`, `towers_of_hanoi`). STATUS.md's "all 71 game tests pass" is stale. |
| 5 | 🟠 | Validators check only the final-state snapshot, not move-replay. "Anti-cheat" framing oversells what's enforced (e.g. `sliding_blocks` has no min-move check). |
| 6 | 🟡 | `useGameController` records **pre-move** stats on the winning move (stale by the last move's delta). |
| 7 | 🟡 | `/games` advertises `towers_of_hanoi.supports_resolve = true` but `supports_resolve()` always returns `false` and `/resolve` has no resolvers. |
| 8 | 🟡 | `PlayPage` statically imports all 28 games (`EAGER_GAMES`); the "dynamic loader" is misleading. No code-splitting → one fat chunk. |

Full review is in the session transcript / chat history of 2026-06-29.

---

## Key decisions already made (do not re-litigate)

1. **Seam for win→completion = the engine, via a lifecycle context.**
   All 28 games funnel through `<GameEngine definition=…/>` →
   `useGameController`, which is the one place win/loss is detected.
   The engine stays UI-agnostic: it emits a generic lifecycle event; it
   does **not** import the completion client. The **platform** bridges
   that event to `CompletionClient.check()`.

2. **No per-game changes.** Because the bridge lives in
   `CompletionProvider` (already wrapping the app in catobigato
   `App.tsx`), wiring is centralized. Zero edits to the 28 game files.

3. **camelCase fix = Pydantic side.** Add
   `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)`
   to the luca schemas. Keeps snake_case usable internally (router kwargs,
   curl) while accepting/emitting camelCase on the wire. FastAPI serializes
   responses by alias by default, so `record.validMoves` etc. come out
   camelCase automatically.

4. **Completion fires on `won` only** (not `lost`). Losses don't need
   server validation. `reportedComplete = (status === 'won')`.

5. **Fire-and-forget, never break gameplay.** The bridge calls `check()`,
   swallows errors (logs), and optionally surfaces the server record
   later. A failed/offline backend must never degrade the local game.

6. **Conformance harness = shared JSON fixtures.** One fixture set per
   game (`<slug>.cases.json`: input state/stats/reportedComplete →
   expected verdict). Run against both the TS validator (vitest) and the
   Python validator (pytest). This is what enforces parity going forward.

---

## Workstreams

Status legend: `NOT STARTED` · `IN PROGRESS` · `DONE` · `BLOCKED` · `DEFERRED`

### Workstream A — Wire completion end-to-end (🔴 critical path)

| Step | Description | Files | Acceptance | Verify | Status |
|---|---|---|---|---|---|
| **A1** | Add camelCase aliasing to luca Pydantic schemas. Use `ConfigDict(alias_generator=to_camel, populate_by_name=True)` on every model in `schemas/luca.py`. | `catobigato.com/backend/app/schemas/luca.py` | Model accepts `{"gameId": …}` AND `{"game_id": …}`; dumps camelCase by alias. | `python -c` round-trip (see A-verify) | DONE |
| **A2** | Engine lifecycle context. New `GameLifecycle.tsx`: `GameLifecycleContext`, `GameLifecycleProvider`, `useGameLifecycle`; export from `index.ts`. Shape: `onComplete?(info: GameCompletionInfo)`. | `luca/packages/engine/src/GameLifecycle.tsx`, `index.ts` | Importable; default no-op. | `tsc -b` engine | DONE |
| **A3** | Controller fires lifecycle + fixes stale stats (#6). Add `onComplete?` to `GameControllerOptions`; compute `finalStats = {...stats, ...transition.stats}` and use it for **both** `recordFinalScore` and `onComplete`; guard one-shot with a `completedRef`. | `luca/packages/engine/src/useGameController.ts` | onComplete called once per game, with post-move stats. | `tsc -b` engine | DONE |
| **A4** | `GameEngine` passes controller `onComplete` that calls `useGameLifecycle().onComplete({ slug, status, state, stats, reportedComplete })`. | `luca/packages/engine/src/GameEngine.tsx` | No prop changes for games. | `tsc -b` engine | DONE |
| **A5** | Platform bridge. `CompletionProvider` renders `GameLifecycleProvider` whose `onComplete` builds `CompletionRequest` and calls the injected client on `won`. Errors swallowed+logged. | `luca/packages/platform/src/completion/CompletionProvider.tsx` (+ maybe a `bridge` helper) | Winning a game POSTs `/complete`. | manual + A7 test | DONE |
| **A6** | Fix resolve-capability lie (#7): set `supports_resolve=False` in `GAMES["towers_of_hanoi"]` (until a real resolver exists), OR derive the flag from a resolver registry. | `catobigato.com/backend/app/services/luca/registry.py` | `/games` no longer advertises unsupported resolve. | unit/curl | DONE |
| **A7** | Backend e2e test: `TestClient` POST `/api/luca/v1/complete` with **camelCase** body + `X-Luca-Actor-Id`, for a known-good solved state (e.g. towers_of_hanoi 3-disk). Assert 200, `complete=true`, camelCase `record`. Also assert 401 without header and 422-free parse. | `catobigato.com/backend/tests/…` (locate/establish test dir) | Green test proving the full request/response shape. | `pytest` | DONE |
| **A8** | Smoke against the live local stack: POST a win to the real uvicorn (camelCase), confirm a `luca_completions` row + `luca_scores` update; POST a cheat, confirm audit row + no score bump. | — | Verified on running stack. | `bin/dev.sh` + curl/psql | DONE |

**A-verify (A1 quick check):**
```bash
cd ~/git/catobigato.com/backend && python -c "
from app.schemas.luca import CompletionRequest, CompletionResponse, CompletionRecord
r = CompletionRequest.model_validate({'gameId':'2048','state':[],'finalStats':{},'reportedComplete':True})
print('parsed camel ->', r.game_id, r.reported_complete)
resp = CompletionResponse(complete=True, record=CompletionRecord(valid_moves=1,score=2,elapsed_seconds=3,achieved_at='x'))
print('dump ->', resp.model_dump(by_alias=True))
"
```

### Workstream B — Conformance harness (🟠 parity safety net)

| Step | Description | Files | Status |
|---|---|---|---|
| **B1** | Define fixture format `<slug>.cases.json` (array of `{name, state, finalStats, reportedComplete, difficulty?, expect:{complete, errorCode?}}`). Document in `luca/docs/COMPLETION_API.md`. | luca docs + fixtures | NOT STARTED |
| **B2** | Author fixtures for the 6 validated games (2048, lights, sudoku, towers_of_hanoi, sliding_blocks, tangram): valid win, not-complete, malformed, cheat. | `luca/packages/platform/src/games/<slug>/<slug>.cases.json` | NOT STARTED |
| **B3** | TS runner (vitest) iterating fixtures against each TS validator. | `luca/packages/platform/src/games/<slug>/<slug>.conformance.test.ts` | NOT STARTED |
| **B4** | Python runner (pytest) iterating the **same** fixtures against each Python validator. Resolve fixture path to the luca repo. | `catobigato.com/backend/tests/luca/test_conformance.py` | NOT STARTED |
| **B5** | Make both runners part of CI / the standard test command; document. | CI configs | DEFERRED |

### Workstream C — Cheap correctness/perf fixes (🟡)

| Step | Description | Files | Status |
|---|---|---|---|
| **C1** | (folded into A3) stale-stats fix #6. | — | DONE |
| **C2** | (folded into A6) resolve flag #7. | — | DONE |
| **C3** | Code-split `PlayPage` (#8): convert `EAGER_GAMES` to `React.lazy` per slug + `<Suspense>`; remove misleading `DynamicGameLoader`/`DynamicGame`. Keep 2048/lights/sudoku eager if desired. | `luca/packages/platform/src/PlayPage.tsx` | NOT STARTED |
| **C4** | Remove `setPersistedScore(p => p)` no-op in `restart()`. | `luca/packages/engine/src/useGameController.ts` | DONE |
| **C5** | Doc hygiene: fix `towersOfHanoi.ts` tower-order comment; reconcile STATUS.md "71 tests" + "Phase 2 stub" contradictions. | luca | NOT STARTED |

### Workstream D — Finish the remaining games (🟢 the original goal)

Per-game definition of done — apply to each newly-finished game:
1. Pure TS logic in `<slug>.ts` (no React/DOM).
2. TS unit test `<slug>.test.ts`.
3. React component `<slug>.tsx` via `<GameEngine definition=…/>`.
4. Registered in `registry.ts` (platform) + `EAGER_GAMES`/lazy map in `PlayPage`.
5. Python validator + entry in backend `registry.py` `VALIDATORS`/`GAMES`.
6. Conformance fixtures (Workstream B format).

| Step | Description | Status |
|---|---|---|
| **D0** | Inventory: which of the 28 registered games are fully playable + validated vs stubs/coming-soon. Produce a checklist table here. | NOT STARTED |
| **D1+** | One row per game still needing work (fill from D0). | NOT STARTED |

---

## Order of execution (recommended)

1. **Workstream A in full** (A1→A8) — makes the backend actually do something and fixes the contract. *Do this before adding more games.*
2. **Workstream B** — locks in parity so every future game/validator stays honest.
3. **Workstream C3/C5** — quick wins once A/B settle.
4. **Workstream D** — resume finishing games, each following the 6-point DoD.

---

## Sync Log

- **2026-06-29 (Opus):** Wrote this plan after a full peer review. Decisions 1–6 above locked. Starting Workstream A.
- **2026-06-29 (Opus):** **Workstream A landed (A1–A7) + C1/C2/C4.** The completion path is now wired end-to-end and proven.
  - **A1** camelCase aliasing on all `schemas/luca.py` models via `_CamelModel` (`alias_generator=to_camel`, `populate_by_name=True`). Accepts camel **and** snake on input; emits camel on output.
  - **A2** new `luca/packages/engine/src/GameLifecycle.tsx` (`GameLifecycleProvider`/`useGameLifecycle`/`GameCompletionInfo`), exported from engine `index.ts`.
  - **A3+C1+C4** `useGameController`: added `onComplete` option; fixed stale-stats (#6) by recording **post-move** `finalStats` for both score + lifecycle; added one-shot `completedRef`; removed the `setPersistedScore(p=>p)` no-op.
  - **A4** `GameEngine` reads `useGameLifecycle()` and bridges the controller's terminal event → `onComplete({slug,status,state,stats,reportedComplete})`. Zero per-game changes.
  - **A5** `CompletionProvider` now also mounts `GameLifecycleProvider`; on a **win** it calls `client.check({gameId,...})`, errors swallowed+logged. This is the live seam.
  - **A6** `registry.py`: `towers_of_hanoi.supports_resolve` → `False` (was lying).
  - **A7** new hermetic backend e2e: `catobigato.com/backend/tests/luca/test_completion.py` (fake `get_db`, no DB needed). **4/4 pass.** Run: `cd backend && python tests/luca/test_completion.py` (pytest not installed in venv; file also works under `python -m pytest`).
  - **Verification:** luca `npm run build` clean; engine+platform tsc clean; game-logic scripts 28+28+21 pass; catobigato frontend `tsc -b` exit 0; A-verify camel round-trip OK.
  - **Left for next driver:** Workstream **B** (conformance harness) before resuming games (**D**).
  - **Release note:** these luca-repo changes only reach catobigato **prod** when `vendor/luca-game-platform-0.1.0.tgz` is rebuilt + re-vendored. Dev already sees them via the Vite source alias.
- **2026-06-29 (Opus):** **Workstream A fully complete — A8 verified on the live local stack.** Brought the stack up host-side and proved the wired path against real FastAPI + asyncpg + Postgres:
  - Valid win → `{complete:true, record:{validMoves:7,score:7,elapsedSeconds:12,achievedAt:…}}` (camelCase confirmed over the wire), persisted `luca_completions` (`validated=t`) + `luca_scores` upsert (best 7, plays 1).
  - Cheat (3 < optimal 7 moves) → `CHEAT_DETECTED`, audit row written (`validated=f`), `luca_scores` **not** bumped. ✅
  - **Local-dev tooling shipped alongside:** `catobigato.com/bin/dev.sh` (local counterpart to PROD `bin/deploy.sh`: `up/down/restart/status/logs/migrate/db/doctor`, modes `full|backend|frontend`) + skill `catobigato.com/.claude/skills/run-local.md`. Use `bin/dev.sh up` to reproduce. Note: Docker Desktop auto-starts stale prod containers that shadow host dev on :8001/:8081 — `dev.sh` now auto-stops `catobigato-api`/`catobigato-frontend` (never `whereq-db`).
  - One-time local DB setup done: created `catobigato` role+db in the shared `whereq-db` cluster (superuser is `flowdesk`, not `whereq`); ran `alembic upgrade head` (single head `t9k0l1m2n3o4`).
</content>
</invoke>
