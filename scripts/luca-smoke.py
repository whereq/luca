#!/usr/bin/env python3
"""Smoke test for the luca completion API at /api/luca/v1/*.

Verifies that the deployed catobigato.com release has the luca backend
integrated correctly. Runs against https://www.catobigato.com.

Stdlib-only (no requests, no httpx). Runs in ~3 seconds.

Exits 0 if all checks pass, 1 otherwise.
"""
import json
import sys
import urllib.error
import urllib.request
from typing import Any

BASE = "https://www.catobigato.com"
LUCA_PREFIX = "/api/luca/v1"
USER_AGENT = "luca-smoke/1.0 (+catobigato)"


class C:
    """ANSI color codes, no-ops if --no-color."""
    ENABLED = True
    @classmethod
    def wrap(cls, code, s):
        if not cls.ENABLED:
            return s
        return f"\033[{code}m{s}\033[0m"
    @classmethod
    def red(cls, s): return cls.wrap("31", s)
    @classmethod
    def green(cls, s): return cls.wrap("32", s)
    @classmethod
    def yellow(cls, s): return cls.wrap("33", s)
    @classmethod
    def dim(cls, s): return cls.wrap("2", s)


def http(method: str, path: str, body=None, headers=None) -> tuple[int, dict, str]:
    """Run an HTTP request. Returns (status, headers, body_text)."""
    url = BASE + path
    req_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    data = None
    if body is not None:
        req_headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, dict(r.headers), r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), e.read().decode("utf-8", errors="replace")


def check(name: str, ok: bool, detail: str = ""):
    mark = C.green("PASS") if ok else C.red("FAIL")
    print(f"  {mark}  {name}" + (f" — {detail}" if detail else ""))
    return ok


results = []


def step(title: str):
    print(f"\n{C.yellow(title)}")


# ────────────────────────────────────────────────────────────────────────
# Step 1: Frontend serves
# ────────────────────────────────────────────────────────────────────────
step("Step 1 — frontend serves the games gallery")

status, hdrs, body = http("GET", "/games/luca")
ok = check(
    "GET /games/luca returns 200 (or SPA shell)",
    status == 200,
    f"HTTP {status}, {len(body)} bytes",
)
results.append(("frontend-serves", ok))


# ────────────────────────────────────────────────────────────────────────
# Step 2: API responds at /api/luca/v1/games (public — no auth required)
# ────────────────────────────────────────────────────────────────────────
step("Step 2 — luca games list endpoint responds")

status, hdrs, body = http("GET", f"{LUCA_PREFIX}/games")
games_ok = False
games = []
if status == 200:
    try:
        data = json.loads(body)
        games = data.get("games", [])
        games_ok = True
        check("GET /api/luca/v1/games returns 200", True)
        check(
            "response has 'games' field",
            isinstance(games, list) and len(games) >= 3,
            f"{len(games)} games: {[g.get('slug') for g in games]}",
        )
        slugs = {g.get("slug") for g in games}
        for expected in ["2048", "lights", "sudoku"]:
            check(f"  {expected} in registry", expected in slugs)
    except (json.JSONDecodeError, KeyError) as e:
        check("GET /api/luca/v1/games returns valid JSON", False, str(e))
else:
    check("GET /api/luca/v1/games returns 200", False, f"HTTP {status}")
results.append(("games-list", games_ok))


# ────────────────────────────────────────────────────────────────────────
# Step 3: Auth-gated endpoints return 401 without X-Luca-Actor-Id
# ────────────────────────────────────────────────────────────────────────
step("Step 3 — auth gating works (401 without X-Luca-Actor-Id)")

valid_body = {
    "game_id": "2048",
    "state": [[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2048, 2], [0, 0, 0, 0]],
    "final_stats": {"score": 100, "moves": 5, "elapsed": 30},
    "reported_complete": True,
}

# POST /complete without auth header
status, _, body = http("POST", f"{LUCA_PREFIX}/complete", body=valid_body)
check(
    "POST /api/luca/v1/complete without auth",
    status == 401,
    f"HTTP {status}: {body[:100]}",
)
results.append(("complete-noauth-401", status == 401))

# POST /resolve without auth header
status, _, body = http("POST", f"{LUCA_PREFIX}/resolve", body={"game_id": "sudoku", "state": [[0]*9]*9})
check(
    "POST /api/luca/v1/resolve without auth",
    status == 401,
    f"HTTP {status}: {body[:100]}",
)
results.append(("resolve-noauth-401", status == 401))

# GET /scores/2048 without auth header
status, _, body = http("GET", f"{LUCA_PREFIX}/scores/2048")
check(
    "GET /api/luca/v1/scores/2048 without auth",
    status == 401,
    f"HTTP {status}: {body[:100]}",
)
results.append(("scores-noauth-401", status == 401))


# ────────────────────────────────────────────────────────────────────────
# Step 4: Unknown game returns 404
# ────────────────────────────────────────────────────────────────────────
step("Step 4 — unknown game returns 404")

status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={**valid_body, "game_id": "this-game-does-not-exist"},
    headers={"X-Luca-Actor-Id": "smoke-test"},
)
check(
    "POST /complete with unknown game_id",
    status == 404,
    f"HTTP {status}: {body[:100]}",
)
results.append(("unknown-game-404", status == 404))


# ────────────────────────────────────────────────────────────────────────
# Step 5: Valid completion with X-Luca-Actor-Id persists
# ────────────────────────────────────────────────────────────────────────
step("Step 5 — valid completion persists with X-Luca-Actor-Id")

TEST_ACTOR = "smoke-test-actor-" + str(__import__("time").time())
TEST_GAME = "2048"
valid_2048_board = [[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2048, 2], [0, 0, 0, 0]]

status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": TEST_GAME,
        "state": valid_2048_board,
        "final_stats": {"score": 250, "moves": 5, "elapsed": 30},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR},
)
ok = check(
    "POST /complete returns 200 (valid 2048 with 2048 tile)",
    status == 200,
    f"HTTP {status}: {body[:200]}",
)
response_data: dict[str, Any] = {}
if ok:
    try:
        response_data = json.loads(body)
        check(
            "  complete=true",
            response_data.get("complete") is True,
        )
        record = response_data.get("record") or {}
        check(
            "  record.score matches",
            record.get("score") == 250,
            f"got {record.get('score')}",
        )
    except json.JSONDecodeError as e:
        check("response is valid JSON", False, str(e))
        ok = False
results.append(("valid-completion-persists", ok))

# Now GET /scores/2048 with the same actor — should reflect the just-recorded score
status, _, body = http(
    "GET",
    f"{LUCA_PREFIX}/scores/{TEST_GAME}",
    headers={"X-Luca-Actor-Id": TEST_ACTOR},
)
scores_ok = False
if status == 200:
    try:
        scores = json.loads(body)
        scores_ok = (
            scores.get("best_score") == 250
            and scores.get("plays") == 1
        )
        check(
            "GET /scores/2048 reflects new score",
            scores_ok,
            f"best_score={scores.get('best_score')} plays={scores.get('plays')}",
        )
    except json.JSONDecodeError as e:
        check("scores response is JSON", False, str(e))
else:
    check("GET /scores/2048 returns 200", False, f"HTTP {status}: {body[:200]}")
results.append(("score-roundtrip", scores_ok))


# ────────────────────────────────────────────────────────────────────────
# Step 6: Lights Out complete + cheat detection
# ────────────────────────────────────────────────────────────────────────
step("Step 6 — Lights Out complete (all-off) + cheat detection")

# Valid complete: all cells off
status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": "lights",
        "state": [[False] * 5] * 5,
        "final_stats": {"score": 12, "moves": 6, "elapsed": 60},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR + "-lights"},
)
ok = check(
    "POST /complete lights all-off = complete",
    status == 200 and '"complete":true' in body,
    f"HTTP {status}: {body[:120]}",
)
results.append(("lights-alloff-complete", ok))

# Cheat: reported complete but cells still on
status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": "lights",
        "state": [[True] + [False] * 4] + [[False] * 5] * 4,
        "final_stats": {"score": 12, "moves": 6, "elapsed": 60},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR + "-lights-cheat"},
)
ok = check(
    "POST /complete lights with cells-on (cheat) detected",
    status == 200 and '"complete":false' in body and "CHEAT_DETECTED" in body,
    f"HTTP {status}: {body[:150]}",
)
results.append(("lights-cheat-detected", ok))


# ────────────────────────────────────────────────────────────────────────
# Step 7: Sudoku complete + duplicate detection
# ────────────────────────────────────────────────────────────────────────
step("Step 7 — Sudoku complete + duplicate detection")

# Valid sudoku
valid_sudoku = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
]
status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": "sudoku",
        "state": valid_sudoku,
        "final_stats": {"score": 100, "moves": 50, "elapsed": 300},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR + "-sudoku"},
)
ok = check(
    "POST /complete sudoku (valid) = complete",
    status == 200 and '"complete":true' in body,
    f"HTTP {status}: {body[:120]}",
)
results.append(("sudoku-valid-complete", ok))

# Sudoku with duplicate row (full but invalid)
bad_sudoku = [row[:] for row in valid_sudoku]
bad_sudoku[0][1] = 1  # duplicate 1 in row 0
status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": "sudoku",
        "state": bad_sudoku,
        "final_stats": {"score": 100, "moves": 50, "elapsed": 300},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR + "-sudoku-bad"},
)
ok = check(
    "POST /complete sudoku (duplicate) = invalid",
    status == 200 and '"complete":false' in body and "duplicate" in body.lower(),
    f"HTTP {status}: {body[:200]}",
)
results.append(("sudoku-duplicate-detected", ok))


# ────────────────────────────────────────────────────────────────────────
# Step 8: 2048 cheat detection (empty board + reported complete)
# ────────────────────────────────────────────────────────────────────────
step("Step 8 — 2048 cheat detection (no 2048 tile + reported complete)")

status, _, body = http(
    "POST",
    f"{LUCA_PREFIX}/complete",
    body={
        "game_id": "2048",
        "state": [[0] * 4] * 4,  # empty
        "final_stats": {"score": 999, "moves": 5, "elapsed": 30},
        "reported_complete": True,
    },
    headers={"X-Luca-Actor-Id": TEST_ACTOR + "-2048-cheat"},
)
ok = check(
    "POST /complete 2048 empty+complete = cheat",
    status == 200 and '"complete":false' in body and "CHEAT_DETECTED" in body,
    f"HTTP {status}: {body[:200]}",
)
results.append(("2048-cheat-detected", ok))


# ────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────
print(f"\n{C.dim('─' * 60)}")
total = len(results)
passed = sum(1 for _, ok in results if ok)
print(f"RESULT: {passed}/{total} checks passed")
if passed < total:
    print(f"\n{C.red('Failed checks:')}")
    for name, ok in results:
        if not ok:
            print(f"  {name}")
    sys.exit(1)
else:
    print(f"\n{C.green('All luca smoke checks passed')}")
    sys.exit(0)