# Phase 6 — New games plan

This document tracks the rollout of new games into the luca platform.
Started 2026-06-28 after Phase 5 was deferred (npm publish pending
maintainer action).

## Goal

Reduce the "coming soon" list from 25 → 0 over multiple sessions.
Each game added here follows the same pattern (see [GAME_DEFINITION.md](./GAME_DEFINITION.md))
and ships:
- Pure-logic module (no React, no DOM)
- `GameDefinition` implementation
- React render component
- CSS
- Per-game unit tests
- Backend Python validator (server-side completion check)

## Order of implementation

Picked for variety and difficulty ramp-up:

| # | Game | Slug | Difficulty | Why this one | Status |
|---|---|---|---|---|---|
| 1 | Towers of Hanoi | `towers_of_hanoi` | easy | Classic, well-known, low visual complexity | ⏳ TODO |
| 2 | Sliding Blocks | `sliding_blocks` | easy | Good for showing the engine's state serialization | ⏳ TODO |
| 3 | Tangram | `tangram` | easy | Spatial — exercises the render function differently | ⏳ TODO |
| 4 | Nim | `nim` | medium | Math/logic — has a known solver (mex algorithm) | ⏳ TODO |
| 5 | Mastermind | `mastermind` | medium | Code-breaking — exercises input handling | ⏳ TODO |
| 6 | Skyscrapers | `skyscrapers` | medium | Logic grid — good puzzle-type example | ⏳ TODO |
| 7 | Mazes | `mazes` | easy | Procedural generation showcase | ⏳ TODO |
| 8 | Sokoban | `sokoban` | hard | Search-based — good for showing solver integration | ⏳ TODO |
| 9 | Floodfill | `floodfill` | easy | Visual satisfaction, fast game | ⏳ TODO |
| 10 | Dots | `dots` | medium | Strategy — exercises click-input + animations | ⏳ TODO |
| 11-15 | ... | ... | ... | The rest | ⏳ TODO |
| 16-25 | ... | ... | ... | Last batch | ⏳ TODO |

## Per-game checklist

For each new game, this is what we ship:

```
packages/platform/src/games/<slug>/
├── <slug>.ts                # pure logic (the game engine — no React)
├── <slug>Definition.ts      # implements GameDefinition
├── <slug>.test.ts           # unit tests (28+ test cases per game)
├── <slug>.css               # styles, scoped via class names
├── <SlugName>.tsx           # React component (the render fn)
└── index.ts                 # barrel: { definition, Component }

backend/app/services/luca/
├── <slug>_validator.py      # Python port of the JS validator
└── registry.py              # add to VALIDATORS dict

backend/app/schemas/luca.py
└── (no change — generic CompletionRequest/Response)

luca-smoke.py
└── (add a per-game smoke check)
```

## How to add a new game (recap)

See [GAME_DEFINITION.md](./GAME_DEFINITION.md) for the full walkthrough.
Quick recap:

1. Create `packages/platform/src/games/<slug>/<slug>.ts` — pure functions
2. Write `GameDefinition` impl in `<slug>Definition.ts` — wraps pure logic
3. Build the React component in `<SlugName>.tsx` — uses `GameEngine` from engine
4. Register in `registry.ts` — change `status: 'coming_soon'` → `'playable'`
5. Write tests in `<slug>.test.ts` — 20+ unit tests on the pure logic
6. Mirror the validator in Python (`backend/app/services/luca/<slug>_validator.py`)
7. Add to `VALIDATORS` dict in `registry.py`
8. Run all three test suites:
   - `node --experimental-strip-types <slug>.test.ts` (frontend logic)
   - `python /tmp/test_luca_validators.py` (backend validator)
   - `python scripts/luca-smoke.py` (e2e against prod)
9. Update `STATUS.md` (this file) — flip the row to "✅ DONE"
10. Commit + tag the luca repo at the next version (0.1.1, 0.1.2, ...)
11. Catobigato consumes the new version when ready

## Local testing shortcuts

```bash
# Frontend logic tests for a specific game
cd ~/git/luca/packages/platform
node --experimental-strip-types src/games/<slug>/<slug>.test.ts

# Backend validator tests
cd ~/git/catobigato.com/backend
./venv/bin/python /tmp/test_luca_validators.py

# E2E prod smoke (verifies server-side validator matches frontend)
python3 scripts/luca-smoke.py
```

## Notes

- The engine is stable (no contract changes needed for any of these games)
- The platform is stable (gallery + PlayPage just auto-render any new game)
- The backend is stable (POST /api/luca/v1/complete works for any game with a registered validator)
- The smoke test grows by one check per game (added at the bottom)

## Open questions

- **Per-game difficulty tuning** — the registry's `difficulty` field is currently a guess. We should let each game compute its own actual difficulty (e.g. "8×8 sudoku hard" vs "4×4 sudoku easy").
- **Animations** — some games (Dots, Tangram) really want animated transitions. The engine currently re-renders synchronously; we might need to add a "transition" hook to the GameDefinition contract.
- **Replay** — some games (Nim, Mastermind) have interesting move histories. Should we add a replay feature to the engine?
- **Multiplayer** — some games (Dots, Nim) have interesting 2-player modes. Defer to a future phase.

These don't block new-game implementation; they affect which games feel
polished and which feel MVP.