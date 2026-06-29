// Dots - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import {
  type DotsState, type DotLine,
  newGame, isSolved, isLoss, applyMove,
} from "./dots"
import type { DotsAction, DotsStats } from "./dotsDefinition"
import { dotsDefinition } from "./dotsDefinition"
import "./dots.css"

const ONBOARD_KEY = "luca:onboarded:dots"

function renderDots(
  state: DotsState,
  ctx: GameRenderContext<DotsState, DotsAction, DotsStats>,
) {
  return <DotsBoard state={state} ctx={ctx} />
}

const dotsFull = { ...dotsDefinition, render: renderDots }

export default function Dots() {
  return <GameEngine definition={dotsFull} className="dots" />
}

function DotsBoard({
  state, ctx,
}: {
  state: DotsState
  ctx: GameRenderContext<DotsState, DotsAction, DotsStats>
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
  const n = state.size
  const cellSize = 30
  const totalSize = (n - 1) * cellSize

  const handleLine = (line: DotLine) => {
    if (!interactive) return
    ctx.dispatch({ type: "LINE", payload: line })
  }

  return (
    <div className="dots-wrap">
      {showOnboard && (
        <div className="dots-onboard" onClick={() => {
          setShowOnboard(false)
          try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
        }}>
          <div className="dots-onboard-inner">
            <strong>{t("games.dots.name", "Dots")}</strong>
            <p>{t("games.dots.onboard", "Click between two adjacent dots to draw a line. Complete a box to score a point and get another turn.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}

      <div className="dots-info">
        <span className="dots-label">Moves:</span>
        <span className="dots-value">{state.moves}</span>
        <span className="dots-spacer" />
        <span className="dots-label">Boxes scored:</span>
        <span className="dots-value">{state.boxes.flat().filter(b => b >= 0).length}</span>
      </div>

      <div
        className="dots-grid"
        style={{ width: totalSize + 12, height: totalSize + 12, padding: 6 }}
      >
        <svg width={totalSize} height={totalSize}>
          {/* Horizontal lines */}
          {Array.from({ length: n }, (_, r) =>
            Array.from({ length: n - 1 }, (_, c) => {
              const drawn = state.hLines[r]?.[c]
              return (
                <line
                  key={"h" + r + "," + c}
                  x1={c * cellSize} y1={r * cellSize}
                  x2={(c + 1) * cellSize} y2={r * cellSize}
                  stroke={drawn ? "#4f9eff" : "rgba(255,255,255,0.15)"}
                  strokeWidth={drawn ? 3 : 8}
                  onClick={() => handleLine({ type: "h", r, c })}
                  style={{ cursor: interactive && !drawn ? "pointer" : "default" }}
                />
              )
            })
          )}
          {/* Vertical lines */}
          {Array.from({ length: n - 1 }, (_, r) =>
            Array.from({ length: n }, (_, c) => {
              const drawn = state.vLines[r]?.[c]
              return (
                <line
                  key={"v" + r + "," + c}
                  x1={c * cellSize} y1={r * cellSize}
                  x2={c * cellSize} y2={(r + 1) * cellSize}
                  stroke={drawn ? "#4f9eff" : "rgba(255,255,255,0.15)"}
                  strokeWidth={drawn ? 3 : 8}
                  onClick={() => handleLine({ type: "v", r, c })}
                  style={{ cursor: interactive && !drawn ? "pointer" : "default" }}
                />
              )
            })
          )}
          {/* Dots */}
          {Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) => (
              <circle
                key={"d" + r + "," + c}
                cx={c * cellSize} cy={r * cellSize} r="4"
                fill="rgba(255,255,255,0.85)"
              />
            ))
          )}
          {/* Box completions */}
          {state.boxes.map((row, r) =>
            row.map((owner, c) => owner >= 0 ? (
              <text
                key={"box" + r + "," + c}
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + 5}
                textAnchor="middle" fontSize="16"
                fill={owner === 0 ? "#4f9eff" : "#22c55e"}
                fontWeight="700"
              >
                {owner === 0 ? "\u{1F535}" : "\u{1F7E2}"}
              </text>
            ) : null)
          )}
        </svg>
      </div>

      {isSolved(state) && (
        <div className="dots-result won">
          <div className="dots-result-title">All boxes scored!</div>
          <button onClick={ctx.restart}>Play again</button>
        </div>
      )}
    </div>
  )
}
