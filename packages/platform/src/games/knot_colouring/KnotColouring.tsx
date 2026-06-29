// KnotColouring - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import {
  type KnotColoringState,
  newGame, setColor, isSolved, isLoss,
} from "./knotColouring"
import type { KnotAction, KnotStats } from "./knotColouringDefinition"
import { knotColouringDefinition } from "./knotColouringDefinition"
import "./knot_colouring.css"

const ONBOARD_KEY = "luca:onboarded:knot_colouring"
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"]

function renderKC(state: KnotColoringState, ctx: GameRenderContext<KnotColoringState, KnotAction, KnotStats>) {
  return <KCBoard state={state} ctx={ctx} />
}

const kcFull = { ...knotColouringDefinition, render: renderKC }
export default function KnotColouring() { return <GameEngine definition={kcFull} className="knot-colouring" /> }

function KCBoard({ state, ctx }: { state: KnotColoringState; ctx: GameRenderContext<KnotColoringState, KnotAction, KnotStats> }) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === "undefined") return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1" } catch { return true }
  })
  const [selected, setSelected] = useState<number | null>(null)
  useEffect(() => { if (state.moves > 0 && showOnboard) { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} } }, [state.moves, showOnboard])

  const interactive = !isSolved(state) && !isLoss(state)
  const handleColor = (c: number) => {
    if (selected === null || !interactive) return
    ctx.dispatch({ type: "COLOR", payload: { node: selected, color: c } })
  }
  const handleNode = (n: number) => {
    if (!interactive) return
    setSelected(n)
  }
  return (
    <div className="kc-wrap">
      {showOnboard && (
        <div className="kc-onboard" onClick={() => { setShowOnboard(false); try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {} }}>
          <div className="kc-onboard-inner">
            <strong>{t("games.knot_colouring.name", "Knot Colouring")}</strong>
            <p>{t("games.knot_colouring.onboard", "Color each node so adjacent nodes differ. Click a node then a color.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}
      <div className="kc-info">
        <span className="kc-label">Moves:</span>
        <span className="kc-value">{state.moves}</span>
      </div>
      <svg width="320" height="240" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
        {state.edges.map((e, i) => {
          const n1 = state.coloring[e.from] !== undefined ? e.from : null
          return null  // Placeholder - edges not used for layout
        })}
        {/* Draw edges */}
        {state.edges.map((e, i) => {
          // Need to position nodes - use a simple circular layout
          const angle1 = (e.from / state.crossings) * 2 * Math.PI
          const angle2 = (e.to / state.crossings) * 2 * Math.PI
          const x1 = 160 + 80 * Math.cos(angle1)
          const y1 = 120 + 80 * Math.sin(angle1)
          const x2 = 160 + 80 * Math.cos(angle2)
          const y2 = 120 + 80 * Math.sin(angle2)
          return <line key={"e" + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        })}
        {/* Draw nodes */}
        {state.coloring.map((c, i) => {
          const angle = (i / state.crossings) * 2 * Math.PI
          const x = 160 + 80 * Math.cos(angle)
          const y = 120 + 80 * Math.sin(angle)
          return (
            <g key={"n" + i} onClick={() => handleNode(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={selected === i ? 16 : 14}
                fill={c >= 0 ? COLORS[c] : "rgba(255,255,255,0.1)"}
                stroke={selected === i ? "white" : "rgba(255,255,255,0.4)"}
                strokeWidth={selected === i ? 3 : 2}
              />
            </g>
          )
        })}
      </svg>
      {selected !== null && (
        <div className="kc-palette">
          {COLORS.slice(0, state.numColors).map((c, i) => (
            <button key={i} className="kc-swatch" style={{ background: c }} onClick={() => handleColor(i)} disabled={!interactive} />
          ))}
        </div>
      )}
      {isSolved(state) && (
        <div className="kc-result won"><div className="kc-result-title">Properly coloured!</div><button onClick={ctx.restart}>Play again</button></div>
      )}
    </div>
  )
}
