// Sokoban - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import {
  type SokobanState,
  newGame, move, isSolved, isLoss,
} from "./sokoban"
import type { SokobanAction, SokobanStats } from "./sokobanDefinition"
import { sokobanDefinition } from "./sokobanDefinition"
import "./sokoban.css"

const ONBOARD_KEY = "luca:onboarded:sokoban"

function renderSokoban(
  state: SokobanState,
  ctx: GameRenderContext<SokobanState, SokobanAction, SokobanStats>,
) {
  return <SokobanBoard state={state} ctx={ctx} />
}

const sokobanFull = { ...sokobanDefinition, render: renderSokoban }

export default function Sokoban() {
  return <GameEngine definition={sokobanFull} className="sokoban" />
}

function SokobanBoard({
  state, ctx,
}: {
  state: SokobanState
  ctx: GameRenderContext<SokobanState, SokobanAction, SokobanStats>
}) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === "undefined") return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1" }
    catch { return true }
  })

  useEffect(() => {
    if (state.moves > 0 && showOnboard) {
      setShowOnboard(false)
      try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
    }
  }, [state.moves, showOnboard])

  const interactive = !isSolved(state) && !isLoss(state)
  const cellSize = 30

  const handleMove = (dr: number, dc: number) => {
    if (!interactive) return
    ctx.dispatch({ type: "MOVE", payload: { dr, dc } })
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!interactive) return
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); handleMove(-1, 0) }
      else if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); handleMove(0, 1) }
      else if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); handleMove(1, 0) }
      else if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); handleMove(0, -1) }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [interactive])

  return (
    <div className="sk-wrap">
      {showOnboard && (
        <div className="sk-onboard" onClick={() => {
          setShowOnboard(false)
          try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
        }}>
          <div className="sk-onboard-inner">
            <strong>{t("games.sokoban.name", "Sokoban")}</strong>
            <p>{t("games.sokoban.onboard", "Push boxes onto target squares. Use arrow keys or the on-screen buttons.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}

      <div className="sk-info">
        <span className="sk-label">Moves:</span>
        <span className="sk-value">{state.moves}</span>
      </div>

      <svg width={state.width * cellSize} height={state.height * cellSize} style={{ background: "#1a1a1a", borderRadius: 4 }}>
        {state.grid.map((row, r) =>
          row.map((cell, c) => {
            const x = c * cellSize, y = r * cellSize
            const fill = cell === 1 ? "#666" : cell === 3 ? "rgba(34, 197, 94, 0.3)" : "rgba(255,255,255,0.04)"
            return (
              <rect key={r + "," + c} x={x} y={y} width={cellSize} height={cellSize} fill={fill} />
            )
          })
        )}
        {/* Boxes (cells with value 2, or 3 = box on target) */}
        {state.grid.map((row, r) =>
          row.map((cell, c) => {
            if (cell !== 2 && cell !== 3) return null
            return (
              <rect key={"b" + r + "," + c} x={c * cellSize + 4} y={r * cellSize + 4}
                width={cellSize - 8} height={cellSize - 8}
                fill={cell === 3 ? "#22c55e" : "#a855f7"}
                stroke="#fff" strokeWidth="1.5" rx="2" />
            )
          })
        )}
        {/* Targets (cells with value 3, or 2 = box on target) */}
        {state.grid.map((row, r) =>
          row.map((cell, c) => {
            if (cell !== 2 && cell !== 3) return null
            return null  // already drawn above
          })
        )}
        {/* Player */}
        <circle cx={state.player[1] * cellSize + cellSize / 2}
                cy={state.player[0] * cellSize + cellSize / 2}
                r={cellSize / 3} fill="#fbbf24" stroke="#000" strokeWidth="1" />
      </svg>

      <div className="sk-controls">
        <button onClick={() => handleMove(-1, 0)} disabled={!interactive}>{"\u2191"}</button>
        <div>
          <button onClick={() => handleMove(0, -1)} disabled={!interactive}>{"\u2190"}</button>
          <button onClick={() => handleMove(1, 0)} disabled={!interactive}>{"\u2193"}</button>
          <button onClick={() => handleMove(0, 1)} disabled={!interactive}>{"\u2192"}</button>
        </div>
      </div>

      {isSolved(state) && (
        <div className="sk-result won">
          <div className="sk-result-title">Solved!</div>
          <button onClick={ctx.restart}>Play again</button>
        </div>
      )}
      {isLoss(state) && (
        <div className="sk-result lost">
          <div className="sk-result-title">Stuck</div>
          <button onClick={ctx.restart}>Try again</button>
        </div>
      )}
    </div>
  )
}
