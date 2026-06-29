// Unknotting - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import { type UnknottingState, type UnknottingMove, newGame, applyMove, isSolved, isLoss } from "./unknotting"
import type { UnknottingAction, UnknottingStats } from "./unknottingDefinition"
import { unknottingDefinition } from "./unknottingDefinition"
import "./unknotting.css"

const ONBOARD_KEY = "luca:onboarded:unknotting"

function renderUK(state: UnknottingState, ctx: GameRenderContext<UnknottingState, UnknottingAction, UnknottingStats>) {
  return <UKBoard state={state} ctx={ctx} />
}

const ukFull = { ...unknottingDefinition, render: renderUK }
export default function Unknotting() { return <GameEngine definition={ukFull} className="unknotting" /> }

function UKBoard({ state, ctx }: { state: UnknottingState; ctx: GameRenderContext<UnknottingState, UnknottingAction, UnknottingStats> }) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === "undefined") return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1" } catch { return true }
  })
  useEffect(() => { if (state.moves > 0 && showOnboard) { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} } }, [state.moves, showOnboard])

  const isOver = isSolved(state) || isLoss(state)
  const handleMove = (m: UnknottingMove) => {
    if (isOver) return
    ctx.dispatch({ type: "MOVE", payload: { move: m } })
  }
  return (
    <div className="uk-wrap">
      {showOnboard && (
        <div className="uk-onboard" onClick={() => { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} }}>
          <div className="uk-onboard-inner">
            <strong>{t("games.unknotting.name", "Unknotting")}</strong>
            <p>{t("games.unknotting.onboard", "Reduce the knot to the unknot using Reidemeister moves. Click a move button.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}
      <div className="uk-info">
        <span className="uk-label">Crossings:</span>
        <span className="uk-value">{state.crossings}</span>
        <span className="uk-spacer" />
        <span className="uk-label">Moves:</span>
        <span className="uk-value">{state.moves}</span>
      </div>
      <div className="uk-display">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* A simple visual representation of the knot */}
          {Array.from({ length: state.crossings }).map((_, i) => {
            const angle = (i / Math.max(1, state.crossings)) * 2 * Math.PI
            const x = 60 + 30 * Math.cos(angle)
            const y = 60 + 30 * Math.sin(angle)
            return <circle key={i} cx={x} cy={y} r="6" fill="white" />
          })}
          <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </svg>
      </div>
      <div className="uk-controls">
        <button onClick={() => handleMove("twist")} disabled={isOver} className="uk-btn">Twist</button>
        <button onClick={() => handleMove("poke")} disabled={isOver} className="uk-btn">Poke</button>
        <button onClick={() => handleMove("slide")} disabled={isOver} className="uk-btn">Slide</button>
        <button onClick={() => handleMove("unknot")} disabled={isOver} className="uk-btn uk-btn-primary">Unknot!</button>
      </div>
      {isSolved(state) && <div className="uk-result won"><div className="uk-result-title">Unknotted!</div><button onClick={ctx.restart}>Play again</button></div>}
      {isLoss(state) && <div className="uk-result lost"><div className="uk-result-title">Failed</div><button onClick={ctx.restart}>Try again</button></div>}
    </div>
  )
}
