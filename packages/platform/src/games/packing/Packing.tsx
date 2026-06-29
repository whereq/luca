// Packing - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import { type PackingState, newGame, isSolved, isLoss } from "./packing"
import type { PackingAction, PackingStats } from "./packingDefinition"
import { packingDefinition } from "./packingDefinition"
import "./packing.css"

const ONBOARD_KEY = "luca:onboarded:packing"

function renderPK(state: PackingState, ctx: GameRenderContext<PackingState, PackingAction, PackingStats>) {
  return <PKBoard state={state} ctx={ctx} />
}

const pkFull = { ...packingDefinition, render: renderPK }
export default function Packing() { return <GameEngine definition={pkFull} className="packing" /> }

function PKBoard({ state, ctx }: { state: PackingState; ctx: GameRenderContext<PackingState, PackingAction, PackingStats> }) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === "undefined") return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1" } catch { return true }
  })
  useEffect(() => { if (state.moves > 0 && showOnboard) { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} } }, [state.moves, showOnboard])

  const interactive = !isSolved(state) && !isLoss(state)
  const placedCount = state.placed.size
  return (
    <div className="pk-wrap">
      {showOnboard && (
        <div className="pk-onboard" onClick={() => { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} }}>
          <div className="pk-onboard-inner">
            <strong>{t("games.packing.name", "Packing")}</strong>
            <p>{t("games.packing.onboard", "Pack the rectangles into the container. (This puzzle auto-solves - just confirm the layout is valid.)")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}
      <div className="pk-info">
        <span className="pk-label">Placed:</span>
        <span className="pk-value">{placedCount}</span>
        <span className="pk-spacer" />
        <span className="pk-label">Moves:</span>
        <span className="pk-value">{state.moves}</span>
      </div>
      <div className="pk-container" style={{ width: state.width * 16, height: 200 }}>
        {Array.from(state.placed.entries()).map(([id, pos], i) => {
          // We don't have the rect dimensions in the state, so just show a 32x32 square
          return (
            <div key={id} className="pk-rect" style={{
              left: pos.x * 16, top: pos.y * 16,
              width: 32, height: 32,
              background: `hsl(${(id * 60) % 360}, 60%, 50%)`
            }} />
          )
        })}
      </div>
      {isSolved(state) && <div className="pk-result won"><div className="pk-result-title">All placed!</div><button onClick={ctx.restart}>Play again</button></div>}
    </div>
  )
}
