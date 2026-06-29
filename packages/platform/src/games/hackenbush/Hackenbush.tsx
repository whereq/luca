// Hackenbush - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import {
  type HackenbushState,
  newGame, isLegal, isSolved, isLoss, isGameOver, applyMove,
} from "./hackenbush"
import type { HackenbushAction, HackenbushStats } from "./hackenbushDefinition"
import { hackenbushDefinition } from "./hackenbushDefinition"
import "./hackenbush.css"

const ONBOARD_KEY = "luca:onboarded:hackenbush"

function renderHB(
  state: HackenbushState,
  ctx: GameRenderContext<HackenbushState, HackenbushAction, HackenbushStats>,
) {
  return <HBBoard state={state} ctx={ctx} />
}

const hbFull = { ...hackenbushDefinition, render: renderHB }

export default function Hackenbush() {
  return <GameEngine definition={hbFull} className="hackenbush" />
}

function HBBoard({
  state, ctx,
}: {
  state: HackenbushState
  ctx: GameRenderContext<HackenbushState, HackenbushAction, HackenbushStats>
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

  const isOver = isGameOver(state)
  const interactive = !isOver

  const handleEdge = (idx: number) => {
    if (!interactive) return
    if (!isLegal(state, idx)) return
    ctx.dispatch({ type: "CUT", payload: { edge: idx } })
  }

  // Hard-coded positions for the 3 nodes (the actual node positions aren't stored
  // in the state, so we just place them visually for the initial game)
  const NODE_POS: Array<[number, number]> = [
    [60, 200],
    [60, 100],
    [200, 150],
  ]

  return (
    <div className="hb-wrap">
      {showOnboard && (
        <div className="hb-onboard" onClick={() => {
          setShowOnboard(false)
          try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
        }}>
          <div className="hb-onboard-inner">
            <strong>{t("games.hackenbush.name", "Hackenbush")}</strong>
            <p>{t("games.hackenbush.onboard", "Click an edge to cut it. All edges no longer connected to the ground fall. The player who can't move loses.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}

      <div className="hb-info">
        <span className="hb-label">Turn:</span>
        <span className="hb-value" style={{ color: state.turn === "red" ? "#ef4444" : "#3b82f6" }}>{state.turn}</span>
        <span className="hb-spacer" />
        <span className="hb-label">Moves:</span>
        <span className="hb-value">{state.moves}</span>
      </div>

      <svg width="320" height="280" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
        {/* Ground line */}
        <line x1="20" y1="220" x2="280" y2="220" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        {/* Draw edges */}
        {state.edges.map((e, i) => {
          const from = NODE_POS[e.from]
          const to = NODE_POS[e.to]
          if (!from || !to) return null
          return (
            <g key={i} onClick={() => handleEdge(i)} style={{ cursor: !isOver ? "pointer" : "default" }}>
              <line
                x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                stroke={e.color === "red" ? "#ef4444" : "#3b82f6"}
                strokeWidth="4"
              />
            </g>
          )
        })}
        {/* Draw nodes */}
        {NODE_POS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="white" />
        ))}
      </svg>

      {isOver && (
        <div className={"hb-result " + (isSolved(state) ? "won" : "lost")}>
          <div className="hb-result-title">{isSolved(state) ? "You win!" : "You lose"}</div>
          <button onClick={ctx.restart}>Play again</button>
        </div>
      )}
    </div>
  )
}
