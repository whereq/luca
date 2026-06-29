// Fruit Salad - game renderer.

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { GameEngine, type GameRenderContext } from "@luca-game/engine"
import {
  type FruitSaladState, type Fruit, FRUITS,
  newGame, setGuess, isSolved, isLoss,
} from "./fruitSalad"
import type { FruitSaladAction, FruitSaladStats } from "./fruitSaladDefinition"
import { fruitSaladDefinition } from "./fruitSaladDefinition"
import "./fruit_salad.css"

const ONBOARD_KEY = "luca:onboarded:fruit_salad"

const FRUIT_EMOJI: Record<Fruit, string> = {
  apple: "\u{1F34E}",
  banana: "\u{1F34C}",
  cherry: "\u{1F352}",
  date: "\u{1F330}",
  elderberry: "\u{1FAD0}",
}

function renderFruitSalad(
  state: FruitSaladState,
  ctx: GameRenderContext<FruitSaladState, FruitSaladAction, FruitSaladStats>,
) {
  return <FruitSaladBoard state={state} ctx={ctx} />
}

const fsFullDef = { ...fruitSaladDefinition, render: renderFruitSalad }

export default function FruitSalad() {
  return <GameEngine definition={fsFullDef} className="fruit-salad" />
}

function FruitSaladBoard({
  state, ctx,
}: {
  state: FruitSaladState
  ctx: GameRenderContext<FruitSaladState, FruitSaladAction, FruitSaladStats>
}) {
  const { t } = useTranslation()
  const [showOnboard, setShowOnboard] = useState(() => {
    if (typeof window === "undefined") return false
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1" }
    catch { return true }
  })
  const [selectedBowl, setSelectedBowl] = useState<number | null>(null)
  const [selectedFruit, setSelectedFruit] = useState<number | null>(null)

  useEffect(() => {
    if (state.moves > 0 && showOnboard) {
      setShowOnboard(false)
      try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
    }
  }, [state.moves, showOnboard])

  useEffect(() => {
    if (state.moves === 0) {
      setSelectedBowl(null)
      setSelectedFruit(null)
    }
  }, [state.moves])

  const interactive = !isSolved(state) && !isLoss(state)
  const numBowls = state.bowls.length
  const numFruits = state.bowls[0]?.length ?? FRUITS.length
  const knownTotals = state.bowls.map(row => row.reduce((a, b) => a + b, 0))

  const handleBowlClick = (b: number) => {
    if (!interactive) return
    setSelectedBowl(b)
  }

  const handleFruitClick = (f: number) => {
    if (!interactive) return
    setSelectedFruit(f)
  }

  const handleSetCount = (count: number) => {
    if (selectedBowl === null || selectedFruit === null) return
    ctx.dispatch({ type: "SET", payload: { bowl: selectedBowl, fruit: selectedFruit, count } })
  }

  const correctGuess = (bowlIdx: number, fruitIdx: number) =>
    state.guess[bowlIdx][fruitIdx] === state.bowls[bowlIdx][fruitIdx]

  return (
    <div className="fs-wrap">
      {showOnboard && (
        <div className="fs-onboard" onClick={() => {
          setShowOnboard(false)
          try { window.localStorage.setItem(ONBOARD_KEY, "1") } catch {}
        }}>
          <div className="fs-onboard-inner">
            <strong>{t("games.fruit_salad.name", "Fruit Salad")}</strong>
            <p>{t("games.fruit_salad.onboard", "Each bowl has a total count of fruit and a known count of one specific fruit. Figure out the rest by setting the count for each fruit-bowl pair.")}</p>
            <button>{t("common.got_it", "Got it")}</button>
          </div>
        </div>
      )}

      <div className="fs-grid">
        <div className="fs-corner" />
        {Array.from({ length: numFruits }, (_, f) => (
          <button
            key={f}
            className={"fs-fruit-header" + (selectedFruit === f ? " selected" : "")}
            onClick={() => handleFruitClick(f)}
            disabled={!interactive}
            title={FRUITS[f]}
          >
            <span className="fs-emoji">{FRUIT_EMOJI[FRUITS[f]]}</span>
          </button>
        ))}
        <div className="fs-corner fs-total-h">Total</div>
        {Array.from({ length: numBowls }, (_, b) => {
          const isSelected = selectedBowl === b
          return (
            <div key={b} className="fs-bowl">
              <button
                className={"fs-bowl-label" + (isSelected ? " selected" : "")}
                onClick={() => handleBowlClick(b)}
                disabled={!interactive}
              >
                Bowl {b + 1}
              </button>
              {Array.from({ length: numFruits }, (_, f) => {
                const v = state.guess[b][f]
                const isTarget = selectedBowl === b && selectedFruit === f
                const isCorrect = v > 0 && correctGuess(b, f)
                return (
                  <button
                    key={f}
                    className={
                      "fs-cell"
                      + (isTarget ? " target" : "")
                      + (isCorrect ? " correct" : "")
                    }
                    onClick={() => { setSelectedBowl(b); setSelectedFruit(f) }}
                    disabled={!interactive}
                  >
                    {v > 0 ? v : ""}
                  </button>
                )
              })}
              <div className="fs-bowl-sum">{state.guess[b].reduce((a, b2) => a + b2, 0)} / {knownTotals[b]}</div>
            </div>
          )
        })}
      </div>

      {selectedBowl !== null && selectedFruit !== null && (
        <div className="fs-palette">
          <div className="fs-palette-label">
            How many {FRUIT_EMOJI[FRUITS[selectedFruit]]} in bowl {selectedBowl + 1}?
          </div>
          <div className="fs-palette-buttons">
            {Array.from({ length: knownTotals[selectedBowl] + 1 }, (_, i) => i).map(n => (
              <button
                key={n}
                className={"fs-pal-btn" + (state.guess[selectedBowl][selectedFruit] === n ? " selected" : "")}
                onClick={() => handleSetCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSolved(state) && (
        <div className="fs-result won">
          <div className="fs-result-title">You got it!</div>
          <div className="fs-result-msg">All counts match.</div>
          <button onClick={ctx.restart}>Play again</button>
        </div>
      )}
    </div>
  )
}
